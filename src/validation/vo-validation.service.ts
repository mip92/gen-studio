import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { buildGlossary } from '../youtube/youtube-captions.service';
import { normalizeRuTokens } from './ru-text-normalize';
import { classifyDiff, diffWords, WordDiffResult } from './word-diff';

const APP_ROOT   = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const QWEN3_PY   = process.env.TTS_QWEN3_PYTHON ?? process.env.QWEN3_PYTHON
                 ?? path.join(APP_ROOT, '.venv-qwen3', 'Scripts', 'python.exe');
const KOHYA_PY   = process.env.KOHYA_PYTHON ?? process.env.TTS_PYTHON
                 ?? path.join(process.env.KOHYA_DIR ?? 'E:\\kohya_ss', 'venv', 'Scripts', 'python.exe');
const TRANSCRIBE_SCRIPT = path.join(APP_ROOT, 'scripts', 'vo_transcribe_batch.py');
const PROSODY_SCRIPT    = path.join(APP_ROOT, 'scripts', 'vo_prosody_batch.py');
/** faster-whisper model for VO QC — 'medium' matches the caption pipeline
 *  (already downloaded) and minimizes ASR-side false positives. */
const VO_QC_MODEL  = process.env.VO_QC_WHISPER_MODEL ?? process.env.WHISPER_MODEL ?? 'medium';
const VO_QC_DEVICE = process.env.VO_QC_WHISPER_DEVICE ?? process.env.WHISPER_DEVICE ?? 'cuda';
/** Speech-rate sanity bounds (chars of text per second of audio). Deliberately
 *  wide — sentence pauses inflate duration; this only catches gross anomalies. */
const CPS_MIN = Number(process.env.VO_QC_CPS_MIN ?? 6);
const CPS_MAX = Number(process.env.VO_QC_CPS_MAX ?? 25);

/** Sentinel error message: the run row was set to `cancelled` by the queue's
 *  cancel endpoint (which has already closed the ledger entry). run() must NOT
 *  overwrite that terminal state or ledger.close() a second time — doing so
 *  would flip cancelled→failed AND create a phantom duplicate queue_entries
 *  attempt (close() finds no matching live/terminal row for the new status). */
const VO_QC_CANCELLED = 'VO_QC_CANCELLED';

interface TranscribeLine {
  id: string; ok: boolean; transcript?: string;
  words?: Array<[string, number, number, number]>;
  durationSec?: number; error?: string; done?: boolean;
}
interface ProsodyLine {
  id: string; ok: boolean; error?: string; done?: boolean;
  monotone?: boolean; monotonyScore?: number | null;
  longMidSilence?: boolean; longMidSilenceSec?: number;
  clipping?: boolean; leadingGarbage?: boolean; truncatedEnd?: boolean;
  riskyStressWords?: string[];
}

/** A TTSJob selected for validation, with everything needed to score it. */
interface Target {
  jobId:            string;
  wavPath:          string | null;   // null → wav missing on disk
  text:             string;          // frozen TTSJob.text snapshot
  currentText:      string | null;   // owner's CURRENT narrationText (staleness check)
  sentencePauseSec: number;
  durationMs:       number | null;
  approved:         boolean;
}

/**
 * VO validation — audio QC of rendered narration (see VoValidationRun in
 * schema.prisma for the architecture note). ONE queue job per project run;
 * two batch python workers (whisper → prosody), NDJSON-streamed; verdicts are
 * upserted per line so a killed run keeps everything already scored.
 */
@Injectable()
export class VoValidationService {
  private readonly logger = new Logger(VoValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: QueueLedgerService,
  ) {}

  private get db(): any { return this.prisma as any; }

  // ── Project resolution / readiness ─────────────────────────────────────────

  private async project(idOrSlug: string) {
    const p = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!p) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return p;
  }

  /**
   * Button-enablement precondition: every shot with narrationText has at least
   * one COMPLETED TTSJob. (Legacy scene-level narration is validated too, but
   * readiness is judged on shots — the current production unit.)
   */
  async readiness(idOrSlug: string): Promise<{
    ready: boolean; totalWithText: number; withCompleted: number;
    missingShotCodes: string[]; activeRunId: string | null;
    gateEnabled: boolean; hasCompletedRun: boolean;
  }> {
    const project = await this.project(idOrSlug);
    const shots = await this.prisma.shot.findMany({
      where:   { projectId: project.id },
      select:  { shotCode: true, narrationText: true, ttsJobs: { select: { status: true } } },
      orderBy: { shotCode: 'asc' },
    });
    const withText = shots.filter((s) => (s.narrationText ?? '').trim().length > 0);
    const missing  = withText
      .filter((s) => !s.ttsJobs.some((j) => j.status === 'completed'))
      .map((s) => s.shotCode);
    const active = await this.db.voValidationRun.findFirst({
      where:  { projectId: project.id, status: { in: ['pending', 'running'] } },
      select: { id: true },
    });
    const completedRuns = await this.db.voValidationRun.count({
      where: { projectId: project.id, status: 'completed' },
    });
    return {
      ready:            missing.length === 0 && withText.length > 0,
      totalWithText:    withText.length,
      withCompleted:    withText.length - missing.length,
      missingShotCodes: missing.slice(0, 50),
      activeRunId:      active?.id ?? null,
      gateEnabled:      (project as any).voValidationGateEnabled === true,
      hasCompletedRun:  completedRuns > 0,
    };
  }

  async setGateEnabled(idOrSlug: string, enabled: boolean) {
    const project = await this.project(idOrSlug);
    return this.db.project.update({
      where: { id: project.id },
      data:  { voValidationGateEnabled: !!enabled },
      select: { id: true, voValidationGateEnabled: true },
    });
  }

  // ── Enqueue ─────────────────────────────────────────────────────────────────

  /** Opt-in trigger: create a run (mode auto: full on first ever, else
   *  incremental) and file it in the unified queue. */
  async enqueue(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    const r = await this.readiness(project.id);
    if (!r.ready) {
      throw new BadRequestException(
        `Сначала сгенерируйте озвучку для всех шотов: без completed TTS — ${r.missingShotCodes.length} шот(ов)` +
        (r.missingShotCodes.length ? ` (${r.missingShotCodes.slice(0, 8).join(', ')}…)` : ''),
      );
    }
    if (r.activeRunId) return { queued: false as const, reason: 'run already pending/running', runId: r.activeRunId };

    const mode = r.hasCompletedRun ? 'incremental' : 'full';
    // Sanity: an incremental run with zero due jobs is a no-op, not a queue entry.
    const due = await this.selectTargets(project.id, mode, null);
    if (due.length === 0) return { queued: false as const, reason: 'nothing to validate — all takes already have verdicts' };

    const run = await this.db.voValidationRun.create({
      data: { projectId: project.id, status: 'pending', mode, totalJobs: due.length },
    });
    await this.ledger.enqueue('vo_validation', run.id, { paramsSnapshot: { mode, totalJobs: due.length } });
    this.logger.log(`VO validation run ${run.id} queued for ${project.slug} (${mode}, ${due.length} job(s))`);
    return { queued: true as const, runId: run.id, mode, totalJobs: due.length };
  }

  /** Explicit re-check of ONE job — used after trim/revert invalidated the
   *  verdict of an already-approved take (incremental never revisits those). */
  async enqueueSpot(ttsJobId: string) {
    const job = await this.prisma.tTSJob.findUnique({
      where:   { id: ttsJobId },
      include: { shot: { select: { projectId: true } }, scene: { select: { projectId: true } } },
    });
    if (!job) throw new NotFoundException(`TTS job ${ttsJobId} not found`);
    if (job.status !== 'completed') throw new BadRequestException('only completed jobs can be validated');
    const projectId = job.shot?.projectId ?? job.scene?.projectId;
    if (!projectId) throw new BadRequestException(`TTS job ${ttsJobId} has no owner — corrupt row`);
    const run = await this.db.voValidationRun.create({
      data: { projectId, status: 'pending', mode: 'spot', jobIdsOverride: [ttsJobId], totalJobs: 1 },
    });
    await this.ledger.enqueue('vo_validation', run.id, { paramsSnapshot: { mode: 'spot', ttsJobId } });
    return run;
  }

  // ── Target selection ────────────────────────────────────────────────────────

  /**
   * Which completed TTSJobs this run must score.
   *   full        — every completed job without a verdict (first run: that is all of them)
   *   incremental — no verdict AND the owner has no approved take, OR this job
   *                 IS the approved take (covers trim-invalidated approved wavs)
   *   spot        — exactly the ids in jobIdsOverride (existing verdicts overwritten)
   */
  private async selectTargets(projectId: string, mode: string, jobIdsOverride: string[] | null): Promise<Target[]> {
    const jobs = await this.prisma.tTSJob.findMany({
      where: {
        status: 'completed',
        ...(mode === 'spot' && jobIdsOverride ? { id: { in: jobIdsOverride } } : {}),
        OR: [
          { shot:  { projectId } },
          { scene: { projectId } },
        ],
      },
      include: {
        shot:  { select: { shotCode: true, approvedTTSJobId: true, narrationText: true, project: { select: { slug: true } } } },
        scene: { select: { sceneKey: true, approvedTTSJobId: true, narrationText: true, project: { select: { slug: true } } } },
        ...(({ voVerdict: { select: { id: true } } }) as any),
      },
      orderBy: { queuedAt: 'asc' },
    });

    const targets: Target[] = [];
    for (const j of jobs as any[]) {
      if (!j.outputFilename) continue;
      const hasVerdict = !!j.voVerdict;
      const approvedId = j.shot?.approvedTTSJobId ?? j.scene?.approvedTTSJobId ?? null;
      if (mode !== 'spot') {
        if (hasVerdict) continue;
        if (mode === 'incremental' && approvedId !== null && approvedId !== j.id) continue;
      }
      const wavPath = j.shot
        ? path.join(APP_ROOT, 'data', j.shot.project.slug, 'shots', j.shot.shotCode, j.outputFilename)
        : j.scene
          ? path.join(APP_ROOT, 'data', j.scene.project.slug, 'scenes', j.scene.sceneKey, j.outputFilename)
          : null;
      targets.push({
        jobId:            j.id,
        wavPath:          wavPath && existsSync(wavPath) ? wavPath : null,
        text:             j.text,
        currentText:      j.shot?.narrationText ?? j.scene?.narrationText ?? null,
        sentencePauseSec: j.sentencePauseSec ?? 0,
        durationMs:       j.durationMs ?? null,
        approved:         approvedId === j.id,
      });
    }
    return targets;
  }

  // ── Run (dispatched by PipelineQueueService) ────────────────────────────────

  async run(runId: string): Promise<void> {
    const run = await this.db.voValidationRun.findUnique({ where: { id: runId } });
    if (!run) return;
    const tmpDir = path.join(os.tmpdir(), 'gen-studio-vo-qc', runId);
    try {
      const targets = await this.selectTargets(
        run.projectId, run.mode, (run.jobIdsOverride as string[] | null) ?? null,
      );
      await this.db.voValidationRun.update({
        where: { id: runId },
        data:  { startedAt: new Date(), totalJobs: targets.length, lastProgressAt: new Date() },
      });

      const summary = { pass: 0, warn: 0, fail: 0, error: 0, skippedMissingFile: 0 };

      // Missing wavs get an immediate error verdict — visible in the report,
      // deleted automatically if the take is ever re-rendered (new job row).
      const missing = targets.filter((t) => !t.wavPath);
      for (const t of missing) {
        summary.skippedMissingFile++;
        summary.error++;
        await this.upsertVerdict(runId, t, {
          status: 'error', errorMessage: 'wav отсутствует на диске',
          issues: ['wav отсутствует на диске'],
        });
      }
      const live = targets.filter((t) => t.wavPath);
      if (live.length === 0) {
        await this.complete(runId, summary, targets.length);
        return;
      }

      mkdirSync(tmpDir, { recursive: true });

      // ── Stage A: whisper transcription (GPU) ────────────────────────────────
      const aManifest = path.join(tmpDir, 'transcribe.json');
      writeFileSync(aManifest, JSON.stringify({
        jobs: live.map((t) => ({ id: t.jobId, wav: t.wavPath })),
      }), 'utf-8');
      const glossary = buildGlossary(live.map((t) => t.text).join(' '));
      let glossaryFile: string | undefined;
      if (glossary) {
        glossaryFile = path.join(tmpDir, 'glossary.txt');
        writeFileSync(glossaryFile, glossary, 'utf-8');
      }

      const byId = new Map(live.map((t) => [t.jobId, t]));
      const asr = new Map<string, TranscribeLine>();
      let processed = 0;

      const aArgs = ['-X', 'utf8', TRANSCRIBE_SCRIPT, '--manifest', aManifest,
                     '--model', VO_QC_MODEL, '--device', VO_QC_DEVICE, '--language', 'ru'];
      if (glossaryFile) aArgs.push('--initial-prompt-file', glossaryFile);
      const aTimeout = Number(process.env.VO_QC_TRANSCRIBE_TIMEOUT_MS ?? 0)
                    || 10 * 60_000 + live.length * 30_000;

      await this.streamWorker(QWEN3_PY, aArgs, aTimeout, runId, async (line) => {
        const msg = line as TranscribeLine;
        if (msg.done || !msg.id) return;
        const t = byId.get(msg.id);
        if (!t) return;
        asr.set(msg.id, msg);
        await this.upsertVerdict(runId, t, this.scoreWordIntegrity(t, msg));
        processed++;
        await this.db.voValidationRun.update({
          where: { id: runId },
          data:  { processedJobs: processed, lastProgressAt: new Date() },
        }).catch(() => {});
      });

      // ── Stage B: prosody / tech artifacts / stress risk (CPU) ───────────────
      const bManifest = path.join(tmpDir, 'prosody.json');
      writeFileSync(bManifest, JSON.stringify({
        jobs: live.map((t) => ({
          id: t.jobId, wav: t.wavPath, text: t.text, sentencePauseSec: t.sentencePauseSec,
        })),
      }), 'utf-8');
      const bTimeout = Number(process.env.VO_QC_PROSODY_TIMEOUT_MS ?? 0)
                    || 5 * 60_000 + live.length * 10_000;

      await this.streamWorker(KOHYA_PY, ['-X', 'utf8', PROSODY_SCRIPT, '--manifest', bManifest],
        bTimeout, runId, async (line) => {
          const msg = line as ProsodyLine;
          if (msg.done || !msg.id) return;
          const t = byId.get(msg.id);
          if (!t) return;
          await this.upsertVerdict(runId, t, this.scoreFinal(t, asr.get(msg.id) ?? null, msg));
          await this.db.voValidationRun.update({
            where: { id: runId },
            data:  { lastProgressAt: new Date() },
          }).catch(() => {});
        },
      ).catch((e) => {
        // A cancellation must reach the outer catch — swallowing it here would
        // fall through to complete() and mark a cancelled run 'completed'.
        if (e?.message === VO_QC_CANCELLED) throw e;
        // Prosody is the advisory layer: its wholesale failure downgrades the
        // run's depth, not its validity — word-integrity verdicts already stand.
        this.logger.warn(`VO QC ${runId}: prosody stage failed (${e?.message ?? e}) — word-integrity verdicts kept`);
      });

      // Rollup from the verdicts actually written for this run.
      const rows: Array<{ status: string }> = await this.db.voValidationVerdict.findMany({
        where: { ttsJobId: { in: targets.map((t) => t.jobId) } }, select: { status: true },
      });
      for (const v of rows) {
        if (v.status === 'pass') summary.pass++;
        else if (v.status === 'warn') summary.warn++;
        else if (v.status === 'fail') summary.fail++;
      }
      summary.error = rows.filter((v) => v.status === 'error').length;
      await this.complete(runId, summary, targets.length);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      // Cancellation (or any already-terminal row) was recorded by the queue's
      // cancel path, ledger included — defer to it instead of fighting it.
      const row = await this.db.voValidationRun.findUnique({
        where: { id: runId }, select: { status: true },
      }).catch(() => null);
      if (msg === VO_QC_CANCELLED || row?.status === 'cancelled') {
        this.logger.log(`VO validation run ${runId} cancelled — verdicts already written are kept`);
      } else {
        this.logger.error(`VO validation run ${runId} failed: ${msg}`);
        await this.db.voValidationRun.update({
          where: { id: runId },
          data:  { status: 'failed', errorMessage: msg.slice(0, 500), completedAt: new Date() },
        }).catch(() => {});
        await this.ledger.close('vo_validation', runId, { status: 'failed', errorMessage: msg.slice(0, 500) });
      }
    } finally {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }

  private async complete(runId: string, summary: Record<string, number>, total: number): Promise<void> {
    // Guarded update: never resurrect a run the cancel path already terminated
    // (that would also duplicate its ledger history — see VO_QC_CANCELLED).
    const res = await this.db.voValidationRun.updateMany({
      where: { id: runId, status: { notIn: ['cancelled', 'failed'] } },
      data:  {
        status: 'completed', summary: summary as any,
        processedJobs: total, completedAt: new Date(),
      },
    });
    if (res.count === 0) {
      this.logger.log(`VO validation ${runId}: already terminal — completion skipped`);
      return;
    }
    await this.ledger.close('vo_validation', runId, { status: 'completed' });
    this.logger.log(`VO validation ${runId} done: ${JSON.stringify(summary)}`);
  }

  /** Spawn a batch worker and feed each parsed NDJSON stdout line to `onLine`.
   *  Self-contained hard timeout (kills the subprocess) — same discipline as
   *  YoutubeCaptionsService.transcribe(). Aborts early if the run was cancelled. */
  private streamWorker(
    bin: string, argv: string[], timeoutMs: number, runId: string,
    onLine: (parsed: any) => Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!existsSync(bin)) return reject(new Error(`python bin missing: ${bin}`));
      const scriptPath = argv.find((a) => a.endsWith('.py'));
      if (scriptPath && !existsSync(scriptPath)) return reject(new Error(`worker script missing: ${scriptPath}`));

      this.logger.log(`VO QC worker: ${bin} ${argv.join(' ')}`);
      const proc: ChildProcessWithoutNullStreams = spawn(bin, argv, {
        cwd: APP_ROOT, env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });
      let stderrTail = '';
      let timedOut = false;
      let cancelled = false;
      let linesSinceCheck = 0;
      const timer = setTimeout(() => { timedOut = true; proc.kill('SIGKILL'); }, timeoutMs);

      proc.stderr.on('data', (d: Buffer) => {
        stderrTail = (stderrTail + d.toString()).slice(-4000);
      });

      const rl = readline.createInterface({ input: proc.stdout });
      // Serialize line handling: readline keeps emitting while we await the DB.
      let chain: Promise<void> = Promise.resolve();
      rl.on('line', (raw) => {
        const s = raw.trim();
        if (!s.startsWith('{')) return;
        chain = chain.then(async () => {
          try { await onLine(JSON.parse(s)); }
          catch (e: any) { this.logger.warn(`VO QC line handling failed: ${e?.message ?? e}`); }
          // Periodic cancellation check — the queue's cancel path marks the run
          // row cancelled; the subprocess must not keep burning the GPU slot.
          if (++linesSinceCheck >= 10) {
            linesSinceCheck = 0;
            const row = await this.db.voValidationRun.findUnique({
              where: { id: runId }, select: { status: true },
            }).catch(() => null);
            if (row && (row.status === 'cancelled' || row.status === 'failed')) {
              cancelled = true;
              proc.kill('SIGKILL');
            }
          }
        });
      });

      proc.on('error', (e) => { clearTimeout(timer); reject(e); });
      proc.on('close', (code) => {
        clearTimeout(timer);
        void chain.then(() => {
          if (cancelled)     return reject(new Error(VO_QC_CANCELLED));
          if (timedOut)      return reject(new Error(`worker timed out after ${Math.round(timeoutMs / 60_000)} min`));
          if (code !== 0)    return reject(new Error(`worker exited ${code}: ${stderrTail.trim().slice(-400)}`));
          resolve();
        });
      });
    });
  }

  // ── Scoring ─────────────────────────────────────────────────────────────────

  /** Stage-A verdict: word integrity only (prosody fields land in stage B). */
  private scoreWordIntegrity(t: Target, msg: TranscribeLine): VerdictData {
    if (!msg.ok || typeof msg.transcript !== 'string') {
      return {
        status: 'error', errorMessage: msg.error ?? 'ASR failed',
        issues: [`распознавание не удалось: ${msg.error ?? '?'}`],
      };
    }
    const ref  = normalizeRuTokens(t.text);
    const hyp  = normalizeRuTokens(msg.transcript);
    const diff = diffWords(ref, hyp);
    const cls  = classifyDiff(diff);
    return {
      status: cls.level,
      score:  this.score(diff, []),
      transcript: msg.transcript,
      wer: Math.round(diff.wer * 1000) / 1000,
      missingWords: diff.missingWords, extraWords: diff.extraWords,
      repeatedWords: diff.repeatedWords, garbledWords: diff.garbledWords,
      issues: cls.issues,
      textSnapshotStale: this.isStale(t),
      diff,
    };
  }

  /** Stage-B verdict: word integrity + prosody/tech flags + stress risk. */
  private scoreFinal(t: Target, asrMsg: TranscribeLine | null, p: ProsodyLine): VerdictData {
    const base = asrMsg
      ? this.scoreWordIntegrity(t, asrMsg)
      : { status: 'error' as const, errorMessage: 'no ASR result', issues: ['распознавание не выполнено'] };
    if (!p.ok) {
      // Keep the word-integrity verdict; note the prosody failure as an issue.
      return { ...base, issues: [...(base.issues ?? []), `просодия не оценена: ${p.error ?? '?'}`] };
    }

    const prosodyFlags: string[] = [];
    const techFlags:    string[] = [];
    const issues = [...(base.issues ?? [])];

    if (p.monotone)       { prosodyFlags.push('monotone');         issues.push('монотонная подача (низкая вариативность питча)'); }
    if (p.longMidSilence) { prosodyFlags.push('long_mid_silence'); issues.push(`длинная пауза внутри фразы (${p.longMidSilenceSec ?? '?'}с)`); }
    if (p.clipping)       { prosodyFlags.push('clipping');         issues.push('клиппинг (перегруз по амплитуде)'); }
    if (p.leadingGarbage) { techFlags.push('leading_garbage');     issues.push('призвук в начале (кандидат на обрезку «понь»)'); }
    if (p.truncatedEnd)   { techFlags.push('truncated_end');       issues.push('похоже на обрыв в конце'); }

    // Speech-rate sanity from data already at hand (text length vs duration).
    const durSec = (asrMsg?.durationSec ?? (t.durationMs ?? 0) / 1000) || 0;
    if (durSec > 0.5) {
      const cps = t.text.length / durSec;
      if (cps > CPS_MAX)      { prosodyFlags.push('too_fast'); issues.push(`подозрительно быстро (${cps.toFixed(1)} симв/с) — возможен обрыв`); }
      else if (cps < CPS_MIN) { prosodyFlags.push('too_slow'); issues.push(`подозрительно медленно (${cps.toFixed(1)} симв/с)`); }
    }

    // Advisory flags escalate pass → warn, never → fail, and never touch 'error'.
    let status = base.status;
    if (status === 'pass' && (prosodyFlags.length > 0 || techFlags.length > 0)) status = 'warn';

    const riskyStressWords = p.riskyStressWords ?? [];
    const rawScore = base.diff ? this.score(base.diff, [...prosodyFlags, ...techFlags]) : base.score;
    return {
      ...base,
      status,
      // Stress risk is CONTEXT, not a flag: shown on the verdict, excluded from
      // status (user 2026-08-03). But score 100 means «утверждаю не слушая»
      // (the bulk approve-100 button), and машина не различает дорога́/доро́га —
      // so an omograph caps the score at 99 to keep it out of blind auto-approve
      // (user 2026-08-23).
      score: riskyStressWords.length > 0 && rawScore === 100 ? 99 : rawScore,
      prosodyFlags, techFlags,
      riskyStressWords,
      issues,
    };
  }

  private score(diff: WordDiffResult, flags: string[]): number {
    const v = 100 - Math.round(diff.wer * 100) - flags.length * 8;
    return Math.max(0, Math.min(100, v));
  }

  private isStale(t: Target): boolean {
    if (t.currentText === null) return false;
    return normalizeRuTokens(t.text).join(' ') !== normalizeRuTokens(t.currentText).join(' ');
  }

  private async upsertVerdict(runId: string, t: Target, d: VerdictData): Promise<void> {
    const data = {
      runId,
      status: d.status,
      score: d.score ?? null,
      transcript: d.transcript ?? null,
      wer: d.wer ?? null,
      missingWords:  (d.missingWords  ?? null) as any,
      extraWords:    (d.extraWords    ?? null) as any,
      repeatedWords: (d.repeatedWords ?? null) as any,
      garbledWords:  (d.garbledWords  ?? null) as any,
      riskyStressWords: (d.riskyStressWords ?? null) as any,
      prosodyFlags: (d.prosodyFlags ?? null) as any,
      techFlags:    (d.techFlags    ?? null) as any,
      issues:       (d.issues       ?? null) as any,
      textSnapshotStale: d.textSnapshotStale ?? false,
      errorMessage: d.errorMessage ?? null,
    };
    await this.db.voValidationVerdict.upsert({
      where:  { ttsJobId: t.jobId },
      create: { ttsJobId: t.jobId, ...data },
      update: data,
    });
  }

  // ── Read API ────────────────────────────────────────────────────────────────

  async listRuns(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    return this.db.voValidationRun.findMany({
      where: { projectId: project.id }, orderBy: { queuedAt: 'desc' }, take: 20,
    });
  }

  async latestRun(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    return this.db.voValidationRun.findFirst({
      where: { projectId: project.id }, orderBy: { queuedAt: 'desc' },
    });
  }

  /** Flagged-shots report: every non-pass verdict joined with its shot/scene.
   *  This IS the manual-listening worklist («слушаю только то, что не прошло»). */
  async report(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    const verdicts = await this.db.voValidationVerdict.findMany({
      where: {
        status: { not: 'pass' },
        ttsJob: { OR: [{ shot: { projectId: project.id } }, { scene: { projectId: project.id } }] },
      },
      include: {
        ttsJob: {
          select: {
            id: true, text: true, durationMs: true, outputFilename: true,
            shot:  { select: { id: true, shotCode: true, approvedTTSJobId: true, scene: { select: { sceneKey: true } } } },
            scene: { select: { id: true, sceneKey: true, approvedTTSJobId: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const rank: Record<string, number> = { error: 0, fail: 1, warn: 2 };
    return (verdicts as any[])
      .map((v) => ({
        ttsJobId:  v.ttsJobId,
        status:    v.status,
        score:     v.score,
        issues:    v.issues ?? [],
        riskyStressWords: v.riskyStressWords ?? [],
        transcript: v.transcript,
        wer:        v.wer,
        textSnapshotStale: v.textSnapshotStale,
        shotId:    v.ttsJob?.shot?.id ?? null,
        shotCode:  v.ttsJob?.shot?.shotCode ?? null,
        sceneKey:  v.ttsJob?.shot?.scene?.sceneKey ?? v.ttsJob?.scene?.sceneKey ?? null,
        approved:  (v.ttsJob?.shot?.approvedTTSJobId ?? v.ttsJob?.scene?.approvedTTSJobId) === v.ttsJobId,
        text:      v.ttsJob?.text ?? null,
      }))
      .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || (a.shotCode ?? '').localeCompare(b.shotCode ?? ''));
  }
}

/** Partial verdict payload accumulated across the two worker stages. */
interface VerdictData {
  status: 'pass' | 'warn' | 'fail' | 'error';
  score?: number | null;
  transcript?: string;
  wer?: number;
  missingWords?: string[];
  extraWords?: string[];
  repeatedWords?: string[];
  garbledWords?: Array<{ expected: string; heard: string }>;
  riskyStressWords?: string[];
  prosodyFlags?: string[];
  techFlags?: string[];
  issues?: string[];
  textSnapshotStale?: boolean;
  errorMessage?: string;
  /** Internal carry between stages — not persisted. */
  diff?: WordDiffResult;
}
