import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';

const APP_ROOT  = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_DIR = process.env.COMFY_DIR ?? 'W:/Programs/ComfyUI';
const POSE_PYTHON = process.env.IMAGE_QC_POSE_PYTHON ?? process.env.COMFY_PYTHON ?? 'python';
const QC_SCRIPT   = path.join(APP_ROOT, 'scripts', 'video_qc_batch.py');
const AUX_CKPTS   = path.join(COMFY_DIR, 'custom_nodes', 'comfyui_controlnet_aux', 'ckpts');

/** Prefer the torchscript weights (torch+cu128 → GPU) and fall back to the
 *  onnx pair (CPU here — the global onnxruntime has no CUDA provider). The
 *  worker picks its backend by file extension, so this is the whole switch. */
function pickModel(tsPath: string, onnxPath: string): string {
  return existsSync(tsPath) ? tsPath : onnxPath;
}
const TS_DIR = path.join(AUX_CKPTS, 'hr16', 'DWPose-TorchScript-BatchSize5');
const DET_MODEL = process.env.IMAGE_QC_DET_MODEL ?? pickModel(
  path.join(TS_DIR, 'yolox_l.torchscript.pt'),
  path.join(AUX_CKPTS, 'yzd-v', 'DWPose', 'yolox_l.onnx'),
);
const POSE_MODEL = process.env.IMAGE_QC_POSE_MODEL ?? pickModel(
  path.join(TS_DIR, 'dw-ll_ucoco_384_bs5.torchscript.pt'),
  path.join(AUX_CKPTS, 'yzd-v', 'DWPose', 'dw-ll_ucoco_384.onnx'),
);
const CONTROLNET_AUX_SRC = process.env.IMAGE_QC_AUX_SRC
  ?? path.join(COMFY_DIR, 'custom_nodes', 'comfyui_controlnet_aux', 'src');
const INSIGHTFACE_ROOT = process.env.IMAGE_QC_INSIGHTFACE_ROOT
  ?? path.join(COMFY_DIR, 'models', 'insightface');

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const VLM_MODEL  = process.env.IMAGE_QC_VLM_MODEL
  ?? process.env.OLLAMA_VALIDATION_MODEL ?? 'qwen3-vl:8b';
const KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE ?? '5m';
const VLM_TIMEOUT_MS = Number(process.env.IMAGE_QC_VLM_TIMEOUT_MS ?? 180_000);

const VIDEO_QC_CANCELLED = 'VIDEO_QC_CANCELLED';

const FAIL_FLAGS = new Set(['static_clip', 'skin_hue_drift', 'anatomy_melt', 'two_heads_one_body', 'anime_intruder']);
const WARN_FLAGS = new Set(['cut_spike', 'identity_drift', 'new_subject_mid_clip', 'fused_bodies', 'style_drift', 'vlm_uncertain']);

interface ScanLine {
  id: string; ok: boolean; error?: string; done?: boolean;
  flags?: string[]; metrics?: any;
  suspicious?: Array<{ timeSec: number; reason: string; frame: string | null }>;
}

interface Target {
  videoRenderId: string;
  shotId:        string;
  shotCode:      string;
  filename:      string;          // outputFilename (base clip)
  videoPath:     string | null;   // null → file missing on disk
  sourcePath:    string | null;   // i2v start frame PNG
}

/**
 * Video QC («Видео QC») — validation of completed i2v BASE clips, one queue
 * job per project run (same architecture as ImageQcService / VoValidation).
 * Layer A: deterministic scanner (scripts/video_qc_batch.py — motion energy,
 * skin-hue drift vs the source still, DWPose anatomy on the closing frame,
 * new-subject detection, cut spikes, identity drift). Layer B: anchored
 * Qwen-VL classification of the suspicious frames layer A extracted
 * (аниме-пришелец). Advisory only — never touches chosenVideoId; verdicts are
 * 1:1 to VideoRender rows and die with them (FK cascade).
 */
@Injectable()
export class VideoQcService {
  private readonly logger = new Logger(VideoQcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: QueueLedgerService,
  ) {}

  private get db(): any { return this.prisma as any; }

  private async project(idOrSlug: string) {
    const p = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!p) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return p;
  }

  // ── Readiness ───────────────────────────────────────────────────────────────

  /** Кнопка доступна, когда у КАЖДОГО animated-шота есть completed клип —
   *  проверка идёт в конце этапа генерации видео, один раз на проект. */
  async readiness(idOrSlug: string): Promise<{
    ready: boolean; totalAnimated: number; withVideo: number; totalClips: number;
    dueClips: number; missingShotCodes: string[]; activeRunId: string | null;
    hasCompletedRun: boolean; modelsInstalled: boolean;
  }> {
    const project = await this.project(idOrSlug);
    const shots = await this.prisma.shot.findMany({
      where:   { projectId: project.id, renderMode: 'animated' },
      select:  {
        shotCode: true,
        videoRenders: { select: { id: true, status: true, outputFilename: true } },
      },
      orderBy: { shotCode: 'asc' },
    });
    const hasClip = (s: any) => s.videoRenders.some(
      (v: any) => v.status === 'completed' && v.outputFilename);
    const missing = shots.filter((s) => !hasClip(s)).map((s) => s.shotCode);

    const clips = await this.db.videoRender.count({
      where: { status: 'completed', outputFilename: { not: null }, shot: { projectId: project.id } },
    });
    const due = await this.db.videoRender.count({
      where: {
        status: 'completed', outputFilename: { not: null },
        shot: { projectId: project.id }, qcVerdict: null,
      },
    });
    const active = await this.db.videoQcRun.findFirst({
      where:  { projectId: project.id, status: { in: ['pending', 'running'] } },
      select: { id: true },
    });
    const completedRuns = await this.db.videoQcRun.count({
      where: { projectId: project.id, status: 'completed' },
    });
    return {
      ready:            missing.length === 0 && clips > 0,
      totalAnimated:    shots.length,
      withVideo:        shots.length - missing.length,
      totalClips:       clips,
      dueClips:         due,
      missingShotCodes: missing.slice(0, 50),
      activeRunId:      active?.id ?? null,
      hasCompletedRun:  completedRuns > 0,
      modelsInstalled:  existsSync(DET_MODEL) && existsSync(POSE_MODEL),
    };
  }

  // ── Enqueue ─────────────────────────────────────────────────────────────────

  async enqueue(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    const r = await this.readiness(project.id);
    if (!r.modelsInstalled) {
      throw new BadRequestException('Веса DWPose не установлены — см. IMAGE_QC_DET_MODEL/IMAGE_QC_POSE_MODEL');
    }
    if (!r.ready) {
      throw new BadRequestException(
        `Сначала отрендерите видео всем animated-шотам: без клипа — ${r.missingShotCodes.length} шот(ов)` +
        (r.missingShotCodes.length ? ` (${r.missingShotCodes.slice(0, 8).join(', ')}…)` : ''),
      );
    }
    if (r.activeRunId) return { queued: false as const, reason: 'run already pending/running', runId: r.activeRunId };

    const mode = r.hasCompletedRun ? 'incremental' : 'full';
    if (r.dueClips === 0) return { queued: false as const, reason: 'nothing to validate — все клипы уже проверены' };

    const run = await this.db.videoQcRun.create({
      data: { projectId: project.id, status: 'pending', mode, totalClips: r.dueClips },
    });
    await this.ledger.enqueue('video_qc', run.id, { paramsSnapshot: { mode, totalClips: r.dueClips } });
    this.logger.log(`Video QC run ${run.id} queued for ${project.slug} (${mode}, ${r.dueClips} clip(s))`);
    return { queued: true as const, runId: run.id, mode, totalClips: r.dueClips };
  }

  /** Spot re-check of one shot: every completed clip re-scored, verdicts overwritten. */
  async enqueueSpot(shotId: string) {
    const shot = await this.prisma.shot.findUnique({
      where: { id: shotId }, select: { id: true, projectId: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    const clips = await this.db.videoRender.count({
      where: { shotId, status: 'completed', outputFilename: { not: null } },
    });
    if (clips === 0) throw new BadRequestException('у шота нет готовых клипов');
    const inflight = await this.db.videoQcRun.findFirst({
      where:  { projectId: shot.projectId, status: { in: ['pending', 'running'] } },
      select: { id: true },
    });
    if (inflight) return { queued: false as const, reason: 'run already pending/running', runId: inflight.id };
    const run = await this.db.videoQcRun.create({
      data: {
        projectId: shot.projectId, status: 'pending', mode: 'spot',
        shotIdsOverride: [shotId], totalClips: clips,
      },
    });
    await this.ledger.enqueue('video_qc', run.id, { paramsSnapshot: { mode: 'spot', shotId } });
    return { queued: true as const, runId: run.id, mode: 'spot' as const, totalClips: clips };
  }

  // ── Target selection ────────────────────────────────────────────────────────

  private async selectTargets(projectId: string, mode: string, shotIdsOverride: string[] | null): Promise<Target[]> {
    const rows = await this.db.videoRender.findMany({
      where: {
        status: 'completed',
        outputFilename: { not: null },
        shot: {
          projectId,
          ...(mode === 'spot' && shotIdsOverride ? { id: { in: shotIdsOverride } } : {}),
        },
        ...(mode !== 'spot' ? { qcVerdict: null } : {}),
      },
      include: {
        shot: { select: { id: true, shotCode: true, project: { select: { slug: true } } } },
      },
      orderBy: { queuedAt: 'asc' },
    });
    return (rows as any[]).map((v) => {
      const dir = path.join(APP_ROOT, 'data', v.shot.project.slug, 'shots', v.shot.shotCode);
      const videoPath  = path.join(dir, 'videos', v.outputFilename);
      const sourcePath = path.join(dir, v.sourceImageFilename);
      return {
        videoRenderId: v.id,
        shotId:        v.shot.id,
        shotCode:      v.shot.shotCode,
        filename:      v.outputFilename,
        videoPath:     existsSync(videoPath) ? videoPath : null,
        sourcePath:    existsSync(sourcePath) ? sourcePath : null,
      };
    });
  }

  // ── Run (dispatched by PipelineQueueService; ComfyUI already stopped) ───────

  async run(runId: string): Promise<void> {
    const run = await this.db.videoQcRun.findUnique({ where: { id: runId } });
    if (!run) return;
    const tmpDir = path.join(os.tmpdir(), 'gen-studio-video-qc', runId);
    try {
      const targets = await this.selectTargets(
        run.projectId, run.mode, (run.shotIdsOverride as string[] | null) ?? null,
      );
      await this.db.videoQcRun.update({
        where: { id: runId },
        data:  { startedAt: new Date(), totalClips: targets.length, lastProgressAt: new Date() },
      });

      const missing = targets.filter((t) => !t.videoPath || !t.sourcePath);
      for (const t of missing) {
        await this.upsertVerdict(runId, t, {
          status: 'error',
          errorMessage: !t.videoPath ? 'клип отсутствует на диске' : 'исходный кадр отсутствует на диске',
          issues: [!t.videoPath ? 'клип отсутствует на диске' : 'исходный кадр (i2v source) отсутствует на диске'],
        });
      }
      const live = targets.filter((t) => t.videoPath && t.sourcePath);
      if (live.length === 0) {
        await this.complete(runId, targets, missing.length);
        return;
      }

      mkdirSync(tmpDir, { recursive: true });
      const framesDir = path.join(tmpDir, 'frames');
      mkdirSync(framesDir, { recursive: true });

      // ── Layer A: deterministic scanner ───────────────────────────────────
      const byId = new Map(live.map((t) => [t.videoRenderId, t]));
      const manifest = path.join(tmpDir, 'scan.json');
      writeFileSync(manifest, JSON.stringify({
        detModel:         DET_MODEL,
        poseModel:        POSE_MODEL,
        insightfaceRoot:  INSIGHTFACE_ROOT,
        controlnetAuxSrc: CONTROLNET_AUX_SRC,
        framesDir,
        jobs: live.map((t) => ({ id: t.videoRenderId, video: t.videoPath, source: t.sourcePath })),
      }), 'utf-8');

      const suspiciousByClip = new Map<string, Array<{ timeSec: number; reason: string; frame: string | null }>>();
      const statusByClip = new Map<string, string>();
      let processed = 0;
      const timeout = Number(process.env.VIDEO_QC_SCAN_TIMEOUT_MS ?? 0)
                   || 10 * 60_000 + live.length * 8_000;

      await this.streamWorker(POSE_PYTHON, ['-X', 'utf8', QC_SCRIPT, '--manifest', manifest],
        timeout, runId, async (line) => {
          const msg = line as ScanLine;
          if (msg.done || !msg.id) return;
          const t = byId.get(msg.id);
          if (!t) return;
          const v = this.scoreScan(msg);
          statusByClip.set(msg.id, v.status);
          if (msg.ok && (msg.suspicious ?? []).some((s) => s.frame)) {
            suspiciousByClip.set(msg.id, msg.suspicious!);
          }
          await this.upsertVerdict(runId, t, v);
          processed++;
          await this.db.videoQcRun.update({
            where: { id: runId },
            data:  { processedClips: processed, lastProgressAt: new Date() },
          }).catch(() => {});
        });

      // ── Layer B: anchored VLM classification of suspicious frames ────────
      if (suspiciousByClip.size > 0) {
        await this.vlmStage(runId, suspiciousByClip, byId).catch((e) => {
          if (e?.message === VIDEO_QC_CANCELLED) throw e;
          this.logger.warn(`Video QC ${runId}: VLM stage failed (${e?.message ?? e}) — scan verdicts kept`);
        });
      }

      await this.complete(runId, targets, missing.length);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      const row = await this.db.videoQcRun.findUnique({
        where: { id: runId }, select: { status: true },
      }).catch(() => null);
      if (msg === VIDEO_QC_CANCELLED || row?.status === 'cancelled') {
        this.logger.log(`Video QC run ${runId} cancelled — verdicts already written are kept`);
      } else {
        this.logger.error(`Video QC run ${runId} failed: ${msg}`);
        await this.db.videoQcRun.update({
          where: { id: runId },
          data:  { status: 'failed', errorMessage: msg.slice(0, 500), completedAt: new Date() },
        }).catch(() => {});
        await this.ledger.close('video_qc', runId, { status: 'failed', errorMessage: msg.slice(0, 500) });
      }
    } finally {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }

  private async complete(runId: string, targets: Target[], skippedMissingFile: number): Promise<void> {
    const summary = { pass: 0, warn: 0, fail: 0, error: 0, skippedMissingFile };
    if (targets.length > 0) {
      const rows: Array<{ status: string }> = await this.db.videoQcVerdict.findMany({
        where: { videoRenderId: { in: targets.map((t) => t.videoRenderId) } },
        select: { status: true },
      });
      for (const v of rows) {
        if (v.status === 'pass') summary.pass++;
        else if (v.status === 'warn') summary.warn++;
        else if (v.status === 'fail') summary.fail++;
        else if (v.status === 'error') summary.error++;
      }
    }
    const res = await this.db.videoQcRun.updateMany({
      where: { id: runId, status: { notIn: ['cancelled', 'failed'] } },
      data:  {
        status: 'completed', summary: summary as any,
        processedClips: targets.length, completedAt: new Date(),
      },
    });
    if (res.count === 0) {
      this.logger.log(`Video QC ${runId}: already terminal — completion skipped`);
      return;
    }
    await this.ledger.close('video_qc', runId, { status: 'completed' });
    this.logger.log(`Video QC ${runId} done: ${JSON.stringify(summary)}`);
  }

  // ── Layer-A scoring: scan flags → status + Russian issues ──────────────────

  private scoreScan(msg: ScanLine): VerdictData {
    if (!msg.ok) {
      return {
        status: 'error', errorMessage: msg.error ?? 'scan worker failed',
        issues: [`сканирование клипа не удалось: ${msg.error ?? '?'}`],
      };
    }
    const flags = msg.flags ?? [];
    const m = msg.metrics ?? {};
    const issues: string[] = [];
    for (const f of flags) {
      switch (f) {
        case 'static_clip':          issues.push(`клип статичен — движения нет (energy ${m.motionEnergy ?? '?'})`); break;
        case 'skin_hue_drift':       issues.push(`кожа лица уплыла по цвету к концу клипа (Δhue ${m.hueDriftDeg ?? '?'}°, синева ${m.blueFraction ?? '?'})`); break;
        case 'anatomy_melt':         issues.push('анатомия расплылась к концу клипа (карликовые пропорции)'); break;
        case 'two_heads_one_body':   issues.push('два лица на одном теле в конце клипа'); break;
        case 'fused_bodies':         issues.push('слипшиеся фигуры в конце клипа'); break;
        case 'new_subject_mid_clip': issues.push('в клипе появился субъект, которого нет на исходном кадре'); break;
        case 'cut_spike':            issues.push(`резкий скачок кадра (${m.cutSpikeAt ?? '?'}с) — вспышка/склейка`); break;
        case 'identity_drift':       issues.push(`первый кадр далёк от исходной картинки (dist ${m.identityDist ?? '?'})`); break;
        case 'faces_unavailable':    issues.push('детектор лиц недоступен — цвет кожи и «две головы» не проверены'); break;
      }
    }
    let status: VerdictData['status'] = 'pass';
    if (flags.some((f) => WARN_FLAGS.has(f))) status = 'warn';
    if (flags.some((f) => FAIL_FLAGS.has(f))) status = 'fail';
    return {
      status,
      flags,
      metrics:    msg.metrics ?? null,
      suspicious: (msg.suspicious ?? []).map(({ timeSec, reason }) => ({ timeSec, reason })),
      issues,
    };
  }

  // ── Layer B: anchored VLM (аниме-пришелец) ─────────────────────────────────

  private async vlmStage(
    runId: string,
    suspiciousByClip: Map<string, Array<{ timeSec: number; reason: string; frame: string | null }>>,
    byId: Map<string, Target>,
  ): Promise<void> {
    let sinceCheck = 0;
    for (const [videoRenderId, moments] of suspiciousByClip) {
      if (++sinceCheck >= 3) {
        sinceCheck = 0;
        const row = await this.db.videoQcRun.findUnique({
          where: { id: runId }, select: { status: true },
        }).catch(() => null);
        if (row && (row.status === 'cancelled' || row.status === 'failed')) {
          throw new Error(VIDEO_QC_CANCELLED);
        }
      }
      const t = byId.get(videoRenderId);
      if (!t?.sourcePath) continue;

      const answers: any[] = [];
      let escalate: 'fail' | 'warn' | null = null;
      for (const mom of moments) {
        if (!mom.frame || !existsSync(mom.frame)) continue;
        const a = await this.askIntruder(t.sourcePath, mom.frame).catch((e) => {
          this.logger.warn(`VLM check ${t.shotCode}@${mom.timeSec}s failed: ${e?.message ?? e}`);
          return null;
        });
        if (!a) { answers.push({ timeSec: mom.timeSec, error: 'vlm failed' }); escalate ??= 'warn'; continue; }
        answers.push({
          timeSec: mom.timeSec, reason: mom.reason,
          newElements: a.newElements, animeIntruder: a.animeIntruder,
          styleDrift: a.styleDrift, vlmReason: a.reason,
        });
        if (a.animeIntruder) escalate = 'fail';
        else if (a.styleDrift && escalate !== 'fail') escalate = 'warn';
      }
      if (answers.length === 0) continue;

      const existing = await this.db.videoQcVerdict.findUnique({
        where: { videoRenderId },
      });
      if (!existing) continue;
      const newFlags = new Set<string>((existing.flags as string[] | null) ?? []);
      const newIssues: string[] = [...((existing.issues as string[] | null) ?? [])];
      let status: string = existing.status;
      if (escalate === 'fail') {
        const anime = answers.find((a) => a.animeIntruder);
        newFlags.add('anime_intruder');
        newIssues.push(`аниме/мультяшный пришелец в кадре${anime?.newElements ? `: ${anime.newElements}` : ''}`);
        status = 'fail';
      } else if (escalate === 'warn') {
        if (answers.some((a) => a.styleDrift)) { newFlags.add('style_drift'); newIssues.push('стиль кадра дрейфует от исходного'); }
        if (answers.some((a) => a.error))      { newFlags.add('vlm_uncertain'); newIssues.push('VLM-классификация момента не удалась'); }
        if (status === 'pass') status = 'warn';
      }
      await this.db.videoQcVerdict.update({
        where: { id: existing.id },
        data:  {
          runId, status,
          flags:      Array.from(newFlags) as any,
          vlmAnswers: answers as any,
          issues:     newIssues as any,
        },
      });
    }
  }

  /** Anchored comparison: source still + suspicious frame in ONE call. Facts
   *  first, judgement after — the same discipline as the prop fact-check. */
  private async askIntruder(sourcePath: string, framePath: string): Promise<{
    newElements: string | null; animeIntruder: boolean; styleDrift: boolean; reason: string | null;
  } | null> {
    const instruction =
      'Image 1 is the SOURCE still an AI video was generated from. Image 2 is a suspicious frame from that video. ' +
      'Compare them factually. Return JSON with exactly these fields: ' +
      '"new_elements" (short phrase — what appears in image 2 that is NOT in image 1; "" if nothing meaningful), ' +
      '"anime_intruder" (true ONLY if a NEW person/creature appeared and it is drawn in a clearly different anime/manga/chibi/cartoon style than the rest of the scene), ' +
      '"style_drift" (true if image 2 as a whole has drifted into a different art style than image 1), ' +
      '"reason" (one short sentence).';
    const imgs = [
      readFileSync(sourcePath).toString('base64'),
      readFileSync(framePath).toString('base64'),
    ];
    let lastErr = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            model:      VLM_MODEL,
            stream:     false,
            format:     'json',
            keep_alive: KEEP_ALIVE,
            messages:   [{ role: 'user', content: instruction, images: imgs }],
          }),
          signal: AbortSignal.timeout(VLM_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as { message?: { content?: string } };
        const content = (data.message?.content ?? '').trim();
        if (!content) throw new Error('empty content from model');
        const parsed = JSON.parse(content);
        return {
          newElements:   typeof parsed.new_elements === 'string' && parsed.new_elements.trim() ? parsed.new_elements.trim() : null,
          animeIntruder: parsed.anime_intruder === true,
          styleDrift:    parsed.style_drift === true,
          reason:        typeof parsed.reason === 'string' ? parsed.reason : null,
        };
      } catch (e: any) {
        lastErr = String(e?.message ?? e);
        this.logger.warn(`askIntruder attempt ${attempt} failed: ${lastErr}`);
      }
    }
    throw new Error(lastErr || 'vlm check failed');
  }

  // ── Shared plumbing (same discipline as ImageQcService.streamWorker) ────────

  private streamWorker(
    bin: string, argv: string[], timeoutMs: number, runId: string,
    onLine: (parsed: any) => Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (bin !== 'python' && !existsSync(bin)) return reject(new Error(`python bin missing: ${bin}`));
      const scriptPath = argv.find((a) => a.endsWith('.py'));
      if (scriptPath && !existsSync(scriptPath)) return reject(new Error(`worker script missing: ${scriptPath}`));

      this.logger.log(`Video QC worker: ${bin} ${argv.join(' ')}`);
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
      let chain: Promise<void> = Promise.resolve();
      rl.on('line', (raw) => {
        const s = raw.trim();
        if (!s.startsWith('{')) return;
        chain = chain.then(async () => {
          try { await onLine(JSON.parse(s)); }
          catch (e: any) { this.logger.warn(`Video QC line handling failed: ${e?.message ?? e}`); }
          if (++linesSinceCheck >= 5) {
            linesSinceCheck = 0;
            const row = await this.db.videoQcRun.findUnique({
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
          if (cancelled)  return reject(new Error(VIDEO_QC_CANCELLED));
          if (timedOut)   return reject(new Error(`worker timed out after ${Math.round(timeoutMs / 60_000)} min`));
          if (code !== 0) return reject(new Error(`worker exited ${code}: ${stderrTail.trim().slice(-400)}`));
          resolve();
        });
      });
    });
  }

  private async upsertVerdict(runId: string, t: Target, d: VerdictData): Promise<void> {
    const data = {
      runId,
      status:       d.status,
      flags:        (d.flags ?? null) as any,
      metrics:      (d.metrics ?? null) as any,
      suspicious:   (d.suspicious ?? null) as any,
      vlmAnswers:   null as any,
      issues:       (d.issues ?? null) as any,
      errorMessage: d.errorMessage ?? null,
    };
    await this.db.videoQcVerdict.upsert({
      where:  { videoRenderId: t.videoRenderId },
      create: { videoRenderId: t.videoRenderId, ...data },
      update: data,
    });
  }

  // ── Read API ────────────────────────────────────────────────────────────────

  async listRuns(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    return this.db.videoQcRun.findMany({
      where: { projectId: project.id }, orderBy: { queuedAt: 'desc' }, take: 20,
    });
  }

  async latestRun(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    return this.db.videoQcRun.findFirst({
      where: { projectId: project.id }, orderBy: { queuedAt: 'desc' },
    });
  }

  /** The worklist: every non-pass verdict, worst first. */
  async report(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    const verdicts = await this.db.videoQcVerdict.findMany({
      where: {
        status: { not: 'pass' },
        videoRender: { shot: { projectId: project.id } },
      },
      include: {
        videoRender: { select: {
          id: true, outputFilename: true, motionPrompt: true,
          shot: { select: { id: true, shotCode: true, chosenVideoId: true, scene: { select: { sceneKey: true } } } },
        } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const rank: Record<string, number> = { error: 0, fail: 1, warn: 2 };
    return (verdicts as any[])
      .map((v) => ({
        videoRenderId: v.videoRenderId,
        shotId:        v.videoRender?.shot?.id ?? null,
        shotCode:      v.videoRender?.shot?.shotCode ?? null,
        sceneKey:      v.videoRender?.shot?.scene?.sceneKey ?? null,
        filename:      v.videoRender?.outputFilename ?? null,
        isChosen:      v.videoRender?.shot?.chosenVideoId === v.videoRenderId,
        status:        v.status,
        flags:         v.flags ?? [],
        issues:        v.issues ?? [],
        metrics:       v.metrics ?? null,
        suspicious:    v.suspicious ?? [],
        vlmAnswers:    v.vlmAnswers ?? null,
      }))
      .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
        || (a.shotCode ?? '').localeCompare(b.shotCode ?? ''));
  }

  /** Verdicts for one shot's clips — badges on the takes in the videos tab. */
  async shotVerdicts(shotId: string) {
    return this.db.videoQcVerdict.findMany({
      where:   { videoRender: { shotId } },
      select:  {
        videoRenderId: true, status: true, flags: true, issues: true, updatedAt: true,
      },
    });
  }
}

interface VerdictData {
  status: 'pass' | 'warn' | 'fail' | 'error';
  flags?:      string[];
  metrics?:    unknown;
  suspicious?: Array<{ timeSec: number; reason: string }>;
  issues?:     string[];
  errorMessage?: string;
}
