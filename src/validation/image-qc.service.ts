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
/** The pose worker runs on the GLOBAL python — the same interpreter ComfyUI
 *  uses — because that's the env with torch+cu128, opencv, onnxruntime-gpu and
 *  insightface all present (see scripts/image_qc_pose_batch.py). */
const POSE_PYTHON = process.env.IMAGE_QC_POSE_PYTHON ?? process.env.COMFY_PYTHON ?? 'python';
const POSE_SCRIPT = path.join(APP_ROOT, 'scripts', 'image_qc_pose_batch.py');
/** DWPose weights — downloaded once into controlnet_aux's ckpts dir (~350 MB
 *  each pair). Torchscript pair preferred: it runs on our torch+cu128 GPU,
 *  while the onnx pair falls back to CPU (global onnxruntime has no CUDA
 *  provider). The worker picks its backend by file extension. */
const AUX_CKPTS  = path.join(COMFY_DIR, 'custom_nodes', 'comfyui_controlnet_aux', 'ckpts');
const TS_DIR     = path.join(AUX_CKPTS, 'hr16', 'DWPose-TorchScript-BatchSize5');
const pickModel  = (ts: string, onnx: string) => (existsSync(ts) ? ts : onnx);
const DET_MODEL  = process.env.IMAGE_QC_DET_MODEL ?? pickModel(
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

// ── Qwen fact-checklist (layer 2, prop shots only) ───────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
/** Swappable via env the day a stronger local VLM lands (e.g. Qwen 3.8-VL). */
const VLM_MODEL  = process.env.IMAGE_QC_VLM_MODEL
  ?? process.env.OLLAMA_VALIDATION_MODEL ?? 'qwen3-vl:8b';
const KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE ?? '5m';
const VLM_TIMEOUT_MS = Number(process.env.IMAGE_QC_VLM_TIMEOUT_MS ?? 180_000);
const VISION_MAX_DIM = Number(process.env.VISION_MAX_DIM ?? 768);
const KOHYA_PYTHON = process.env.KOHYA_PYTHON ?? 'E:\\kohya_ss\\venv\\Scripts\\python.exe';
const VISION_RESIZE_SCRIPT = path.join(APP_ROOT, 'scripts', 'vision_resize.py');

/** See VO_QC_CANCELLED in vo-validation.service.ts — same contract. */
const IMAGE_QC_CANCELLED = 'IMAGE_QC_CANCELLED';

/** Deterministic flags → verdict status. Everything else is informational. */
const FAIL_FLAGS = new Set(['dwarf_proportions', 'two_heads_one_body']);
const WARN_FLAGS = new Set(['extra_person', 'missing_person', 'fused_bodies', 'orphan_face', 'oversized_head']);

/** ageLabel/label markers that mean a child may legitimately be in frame —
 *  proportion checks are then skipped for the whole image (conservative). */
const CHILD_RE = /(реб[её]н|дет(?:и|ск)|младен|мальчик|девочк|школьн|подрост)/i;
const AGE_RE   = /(\d{1,2})\s*(?:лет|год)/i;

interface PoseLine {
  id: string; ok: boolean; error?: string; done?: boolean;
  peopleFound?: number; backgroundFaces?: number;
  flags?: string[]; metrics?: unknown;
}

/** One candidate file selected for QC, with everything needed to judge it. */
interface Target {
  shotId:         string;
  shotCode:       string;
  filename:       string;
  imagePath:      string | null;   // null → file missing on disk
  peopleExpected: number;
  childExpected:  boolean;
  prop:           { code: string; name: string; description: string } | null;
}

/**
 * Image QC («Кадры QC») — deterministic-first validation of rendered shot
 * candidates; the successor of the retired LLM-judge ImageValidationService.
 * Same architecture as VO QC: ONE queue job per project run, a python batch
 * worker streaming NDJSON verdicts (DWPose skeletons + scrfd faces), then a
 * targeted Qwen fact-checklist for shots with a key prop. Verdicts are
 * upserted per line — a killed run keeps everything already scored. The QC
 * never picks a frame: it flags, the human chooses.
 */
@Injectable()
export class ImageQcService {
  private readonly logger = new Logger(ImageQcService.name);

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

  /** Button enablement: every shot has at least one rendered candidate —
   *  запуск «как в аудио», один раз на весь проект после рендера. */
  async readiness(idOrSlug: string): Promise<{
    ready: boolean; totalShots: number; withRenders: number; totalImages: number;
    dueImages: number; missingShotCodes: string[]; activeRunId: string | null;
    hasCompletedRun: boolean; modelsInstalled: boolean;
  }> {
    const project = await this.project(idOrSlug);
    const shots = await this.prisma.shot.findMany({
      where:   { projectId: project.id },
      select:  { id: true, shotCode: true, renderedImages: true },
      orderBy: { shotCode: 'asc' },
    });
    const poolOf = (s: { renderedImages: unknown }) =>
      (((s.renderedImages as Array<{ filename?: string }> | null) ?? [])
        .map((r) => r.filename).filter(Boolean)) as string[];
    const withRenders = shots.filter((s) => poolOf(s).length > 0);
    const missing = shots.filter((s) => poolOf(s).length === 0).map((s) => s.shotCode);
    const totalImages = shots.reduce((n, s) => n + poolOf(s).length, 0);

    const verdicts = await this.db.imageQcVerdict.findMany({
      where:  { shot: { projectId: project.id } },
      select: { shotId: true, filename: true },
    });
    const seen = new Set(verdicts.map((v: any) => `${v.shotId}\u0000${v.filename}`));
    let due = 0;
    for (const s of shots) for (const f of poolOf(s)) if (!seen.has(`${s.id}\u0000${f}`)) due++;

    const active = await this.db.imageQcRun.findFirst({
      where:  { projectId: project.id, status: { in: ['pending', 'running'] } },
      select: { id: true },
    });
    const completedRuns = await this.db.imageQcRun.count({
      where: { projectId: project.id, status: 'completed' },
    });
    return {
      ready:            missing.length === 0 && totalImages > 0,
      totalShots:       shots.length,
      withRenders:      withRenders.length,
      totalImages,
      dueImages:        due,
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
      throw new BadRequestException(
        'Веса DWPose не установлены (yolox_l.onnx / dw-ll_ucoco_384.onnx) — см. IMAGE_QC_DET_MODEL/IMAGE_QC_POSE_MODEL',
      );
    }
    if (!r.ready) {
      throw new BadRequestException(
        `Сначала отрендерите все кадры: без кандидатов — ${r.missingShotCodes.length} шот(ов)` +
        (r.missingShotCodes.length ? ` (${r.missingShotCodes.slice(0, 8).join(', ')}…)` : ''),
      );
    }
    if (r.activeRunId) return { queued: false as const, reason: 'run already pending/running', runId: r.activeRunId };

    const mode = r.hasCompletedRun ? 'incremental' : 'full';
    const due = await this.selectTargets(project.id, mode, null);
    if (due.length === 0) return { queued: false as const, reason: 'nothing to validate — все кандидаты уже проверены' };

    const run = await this.db.imageQcRun.create({
      data: { projectId: project.id, status: 'pending', mode, totalImages: due.length },
    });
    await this.ledger.enqueue('image_qc', run.id, { paramsSnapshot: { mode, totalImages: due.length } });
    this.logger.log(`Image QC run ${run.id} queued for ${project.slug} (${mode}, ${due.length} image(s))`);
    return { queued: true as const, runId: run.id, mode, totalImages: due.length };
  }

  /** Spot re-check of one shot: every candidate re-scored, verdicts overwritten. */
  async enqueueSpot(shotId: string) {
    const shot = await this.prisma.shot.findUnique({
      where: { id: shotId }, select: { id: true, projectId: true, renderedImages: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${shotId} not found`);
    const pool = ((shot.renderedImages as Array<{ filename?: string }> | null) ?? [])
      .map((rr) => rr.filename).filter(Boolean);
    if (pool.length === 0) throw new BadRequestException('у шота нет отрендеренных кандидатов');
    const inflight = await this.db.imageQcRun.findFirst({
      where:  { projectId: shot.projectId, status: { in: ['pending', 'running'] } },
      select: { id: true },
    });
    if (inflight) return { queued: false as const, reason: 'run already pending/running', runId: inflight.id };
    const run = await this.db.imageQcRun.create({
      data: {
        projectId: shot.projectId, status: 'pending', mode: 'spot',
        shotIdsOverride: [shotId], totalImages: pool.length,
      },
    });
    await this.ledger.enqueue('image_qc', run.id, { paramsSnapshot: { mode: 'spot', shotId } });
    return { queued: true as const, runId: run.id, mode: 'spot' as const, totalImages: pool.length };
  }

  // ── Target selection ────────────────────────────────────────────────────────

  /**
   * Which candidate files this run must score.
   *   full / incremental — every candidate without a verdict (a rendered PNG is
   *                        immutable, so an existing verdict never goes stale)
   *   spot               — every candidate of shotIdsOverride, overwritten
   * Also self-heals: verdicts whose file left the pool (deleted by hand outside
   * removeRender) are dropped so the report never shows ghosts.
   */
  private async selectTargets(projectId: string, mode: string, shotIdsOverride: string[] | null): Promise<Target[]> {
    const shots = await this.prisma.shot.findMany({
      where: {
        projectId,
        ...(mode === 'spot' && shotIdsOverride ? { id: { in: shotIdsOverride } } : {}),
      },
      include: {
        project:      { select: { slug: true } },
        participants: { include: {
          character: { select: { displayName: true } },
          profile:   { select: { ageLabel: true } },
        } },
      },
      orderBy: { shotCode: 'asc' },
    });

    const props = await this.db.prop.findMany({ where: { projectId } }).catch(() => []);
    const propById = new Map((props as any[]).map((p) => [p.id, p]));

    const verdicts = await this.db.imageQcVerdict.findMany({
      where:  { shot: { projectId } },
      select: { id: true, shotId: true, filename: true },
    });
    const verdictKey = new Set(verdicts.map((v: any) => `${v.shotId}\u0000${v.filename}`));

    const targets: Target[] = [];
    const livePoolKey = new Set<string>();
    for (const s of shots as any[]) {
      const pool = (((s.renderedImages as Array<{ filename?: string }> | null) ?? [])
        .map((r) => r.filename).filter(Boolean)) as string[];
      const dir = path.join(APP_ROOT, 'data', s.project.slug, 'shots', s.shotCode);
      const childExpected = (s.participants ?? []).some((p: any) => {
        const hay = `${p.profile?.ageLabel ?? ''} ${p.label ?? ''} ${p.character?.displayName ?? ''}`;
        const age = AGE_RE.exec(hay);
        return CHILD_RE.test(hay) || (age !== null && Number(age[1]) <= 14);
      });
      const prop = s.propId ? (propById.get(s.propId) ?? null) : null;
      for (const filename of pool) {
        livePoolKey.add(`${s.id}\u0000${filename}`);
        if (mode !== 'spot' && verdictKey.has(`${s.id}\u0000${filename}`)) continue;
        const full = path.join(dir, filename);
        targets.push({
          shotId:         s.id,
          shotCode:       s.shotCode,
          filename,
          imagePath:      existsSync(full) ? full : null,
          peopleExpected: (s.participants ?? []).length,
          childExpected,
          prop: prop ? { code: prop.code, name: prop.name, description: prop.description } : null,
        });
      }
    }

    // Ghost cleanup — only on project-wide runs (spot sees a subset of shots).
    if (mode !== 'spot') {
      const ghosts = (verdicts as any[]).filter((v) => !livePoolKey.has(`${v.shotId}\u0000${v.filename}`));
      if (ghosts.length > 0) {
        await this.db.imageQcVerdict.deleteMany({ where: { id: { in: ghosts.map((g) => g.id) } } });
        this.logger.log(`Image QC: dropped ${ghosts.length} ghost verdict(s) whose files left the pool`);
      }
    }
    return targets;
  }

  // ── Run (dispatched by PipelineQueueService; ComfyUI is already stopped) ────

  async run(runId: string): Promise<void> {
    const run = await this.db.imageQcRun.findUnique({ where: { id: runId } });
    if (!run) return;
    const tmpDir = path.join(os.tmpdir(), 'gen-studio-image-qc', runId);
    try {
      const targets = await this.selectTargets(
        run.projectId, run.mode, (run.shotIdsOverride as string[] | null) ?? null,
      );
      await this.db.imageQcRun.update({
        where: { id: runId },
        data:  { startedAt: new Date(), totalImages: targets.length, lastProgressAt: new Date() },
      });

      const missing = targets.filter((t) => !t.imagePath);
      for (const t of missing) {
        await this.upsertVerdict(runId, t, {
          status: 'error', errorMessage: 'файл отсутствует на диске',
          issues: ['файл отсутствует на диске'],
        });
      }
      const live = targets.filter((t) => t.imagePath);
      if (live.length === 0) {
        await this.complete(runId, targets, missing.length);
        return;
      }

      mkdirSync(tmpDir, { recursive: true });

      // ── Stage 1: deterministic pose/face batch ─────────────────────────────
      const byId = new Map(live.map((t) => [`${t.shotId}\u0000${t.filename}`, t]));
      const manifest = path.join(tmpDir, 'pose.json');
      writeFileSync(manifest, JSON.stringify({
        detModel:         DET_MODEL,
        poseModel:        POSE_MODEL,
        insightfaceRoot:  INSIGHTFACE_ROOT,
        controlnetAuxSrc: CONTROLNET_AUX_SRC,
        jobs: live.map((t) => ({
          id:             `${t.shotId}\u0000${t.filename}`,
          image:          t.imagePath,
          peopleExpected: t.peopleExpected,
          childExpected:  t.childExpected,
        })),
      }), 'utf-8');

      const poseVerdicts = new Map<string, { status: string; flags: string[] }>();
      let processed = 0;
      const timeout = Number(process.env.IMAGE_QC_POSE_TIMEOUT_MS ?? 0)
                   || 10 * 60_000 + live.length * 3_000;

      await this.streamWorker(POSE_PYTHON, ['-X', 'utf8', POSE_SCRIPT, '--manifest', manifest],
        timeout, runId, async (line) => {
          const msg = line as PoseLine;
          if (msg.done || !msg.id) return;
          const t = byId.get(msg.id);
          if (!t) return;
          const v = this.scorePose(t, msg);
          poseVerdicts.set(msg.id, { status: v.status, flags: msg.flags ?? [] });
          await this.upsertVerdict(runId, t, v);
          processed++;
          await this.db.imageQcRun.update({
            where: { id: runId },
            data:  { processedImages: processed, lastProgressAt: new Date() },
          }).catch(() => {});
        });

      // ── Stage 2: Qwen fact-checklist — only prop shots, only non-fail files ─
      const factTargets = live.filter((t) => {
        if (!t.prop) return false;
        const pv = poseVerdicts.get(`${t.shotId}\u0000${t.filename}`);
        // fail is already headed to the worklist; error can't be judged.
        return pv !== undefined && pv.status !== 'error' && pv.status !== 'fail';
      });
      if (factTargets.length > 0) {
        await this.factStage(runId, factTargets, tmpDir).catch((e) => {
          if (e?.message === IMAGE_QC_CANCELLED) throw e;
          // Advisory layer: its wholesale failure downgrades depth, not validity.
          this.logger.warn(`Image QC ${runId}: fact stage failed (${e?.message ?? e}) — pose verdicts kept`);
        });
      }

      await this.complete(runId, targets, missing.length);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      const row = await this.db.imageQcRun.findUnique({
        where: { id: runId }, select: { status: true },
      }).catch(() => null);
      if (msg === IMAGE_QC_CANCELLED || row?.status === 'cancelled') {
        this.logger.log(`Image QC run ${runId} cancelled — verdicts already written are kept`);
      } else {
        this.logger.error(`Image QC run ${runId} failed: ${msg}`);
        await this.db.imageQcRun.update({
          where: { id: runId },
          data:  { status: 'failed', errorMessage: msg.slice(0, 500), completedAt: new Date() },
        }).catch(() => {});
        await this.ledger.close('image_qc', runId, { status: 'failed', errorMessage: msg.slice(0, 500) });
      }
    } finally {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }

  private async complete(runId: string, targets: Target[], skippedMissingFile: number): Promise<void> {
    const summary = { pass: 0, warn: 0, fail: 0, error: 0, skippedMissingFile };
    const rows: Array<{ status: string }> = await this.db.imageQcVerdict.findMany({
      where: {
        OR: targets.map((t) => ({ shotId: t.shotId, filename: t.filename })),
      },
      select: { status: true },
    });
    for (const v of rows) {
      if (v.status === 'pass') summary.pass++;
      else if (v.status === 'warn') summary.warn++;
      else if (v.status === 'fail') summary.fail++;
      else if (v.status === 'error') summary.error++;
    }
    const res = await this.db.imageQcRun.updateMany({
      where: { id: runId, status: { notIn: ['cancelled', 'failed'] } },
      data:  {
        status: 'completed', summary: summary as any,
        processedImages: targets.length, completedAt: new Date(),
      },
    });
    if (res.count === 0) {
      this.logger.log(`Image QC ${runId}: already terminal — completion skipped`);
      return;
    }
    await this.ledger.close('image_qc', runId, { status: 'completed' });
    this.logger.log(`Image QC ${runId} done: ${JSON.stringify(summary)}`);
  }

  // ── Stage-1 scoring: worker flags → status + Russian issues ────────────────

  private scorePose(t: Target, msg: PoseLine): VerdictData {
    if (!msg.ok) {
      return {
        status: 'error', errorMessage: msg.error ?? 'pose worker failed',
        issues: [`скелетная проверка не удалась: ${msg.error ?? '?'}`],
      };
    }
    const flags = msg.flags ?? [];
    const issues: string[] = [];
    const found = msg.peopleFound ?? 0;
    const persons = ((msg.metrics as any)?.persons ?? []) as Array<{ headHeightRatio?: number | null }>;
    const ratios = persons.map((p) => p.headHeightRatio).filter((r): r is number => typeof r === 'number');

    for (const f of flags) {
      switch (f) {
        case 'dwarf_proportions':
          issues.push(`карликовые пропорции взрослой фигуры${ratios.length ? ` (рост ≈ ${Math.min(...ratios)} голов)` : ''}`);
          break;
        case 'two_heads_one_body': issues.push('два лица на одном теле'); break;
        case 'extra_person':   issues.push(`людей в кадре больше заявленного (${found} > ${t.peopleExpected})`); break;
        case 'missing_person': issues.push(`людей в кадре меньше заявленного (${found} < ${t.peopleExpected})`); break;
        case 'fused_bodies':   issues.push('слипшиеся/наложенные фигуры'); break;
        case 'orphan_face':    issues.push('крупное лицо без тела (зеркало/портрет/лишний человек?)'); break;
        case 'oversized_head': issues.push('непропорционально крупная голова'); break;
        case 'no_full_body':   issues.push('полный рост не виден — пропорции не оценивались'); break;
        case 'faces_unavailable': issues.push('детектор лиц недоступен — проверка «двух голов» пропущена'); break;
      }
    }

    let status: VerdictData['status'] = 'pass';
    if (flags.some((f) => WARN_FLAGS.has(f))) status = 'warn';
    if (flags.some((f) => FAIL_FLAGS.has(f))) status = 'fail';

    return {
      status,
      peopleExpected:  t.peopleExpected,
      peopleFound:     found,
      backgroundFaces: msg.backgroundFaces ?? 0,
      poseFlags:       flags,
      poseMetrics:     msg.metrics ?? null,
      issues,
    };
  }

  // ── Stage 2: Qwen fact-checklist (prop shots) ──────────────────────────────

  /**
   * Open factual questions, not a "does it match?" score: the model must first
   * SAY what it sees and what that object is part of; the boolean comes after
   * the facts and is judged against them (лонжерон vs балка подъёмника lives
   * exactly in "is_part_of"). Only prop shots pay for this layer.
   */
  private async factStage(runId: string, targets: Target[], tmpDir: string): Promise<void> {
    const smallDir = path.join(tmpDir, 'fact');
    mkdirSync(smallDir, { recursive: true });
    const pairs = targets.map((t, i) => ({ t, small: path.join(smallDir, `${i}_${t.filename}`) }));
    await this.resize(pairs.map((p) => [p.t.imagePath!, p.small] as [string, string]));

    let sinceCheck = 0;
    for (const { t, small } of pairs) {
      // Cancellation check between (slow) VLM calls.
      if (++sinceCheck >= 3) {
        sinceCheck = 0;
        const row = await this.db.imageQcRun.findUnique({
          where: { id: runId }, select: { status: true },
        }).catch(() => null);
        if (row && (row.status === 'cancelled' || row.status === 'failed')) {
          throw new Error(IMAGE_QC_CANCELLED);
        }
      }
      const imgPath = existsSync(small) ? small : t.imagePath!;
      const answers = await this.askFacts(t.prop!, imgPath).catch((e) => {
        this.logger.warn(`fact check ${t.shotCode}/${t.filename} failed: ${e?.message ?? e}`);
        return null;
      });

      const factFlags: string[] = [];
      const issues: string[] = [];
      let escalate: 'fail' | 'warn' | null = null;
      if (!answers) {
        factFlags.push('prop_uncertain');
        issues.push('факт-проверка предмета не удалась');
        escalate = 'warn';
      } else if (answers.matchesExpected === false) {
        factFlags.push('prop_mismatch');
        issues.push(
          `предмет не совпадает: видно «${answers.objectSeen ?? '?'}»` +
          (answers.isPartOf ? ` (часть: ${answers.isPartOf})` : '') +
          `, ожидался «${t.prop!.name}»`,
        );
        escalate = 'fail';
      }

      await this.mergeFactVerdict(runId, t, factFlags, answers, issues, escalate);
      await this.db.imageQcRun.update({
        where: { id: runId }, data: { lastProgressAt: new Date() },
      }).catch(() => {});
    }
  }

  private async askFacts(
    prop: { name: string; description: string },
    imgPath: string,
  ): Promise<FactAnswers | null> {
    const instruction =
      'You are fact-checking ONE AI-generated frame. The frame was supposed to prominently feature this KEY OBJECT: ' +
      `"${prop.name}" — ${prop.description}. ` +
      'First describe what you ACTUALLY see, then judge. Return JSON with exactly these fields: ' +
      '"object_seen" (short phrase — the single most prominent object of that kind you actually see in the frame), ' +
      '"is_part_of" (what larger thing that object is physically part of or attached to — e.g. "the car\'s underbody", "a garage lift", "a wall"), ' +
      '"location_in_frame" (where it sits — e.g. "under the car", "above the car", "foreground left"), ' +
      '"matches_expected" (true ONLY if the object you see IS the expected object AND it is part of the right larger thing), ' +
      '"reason" (one short sentence).';
    const b64 = readFileSync(imgPath).toString('base64');
    let lastErr = '';
    // Same call shape as the retired scoreOne — format:'json' + one retry on the
    // occasional empty reply (a proven-reliable qwen3-vl configuration).
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
            messages:   [{ role: 'user', content: instruction, images: [b64] }],
          }),
          signal: AbortSignal.timeout(VLM_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as { message?: { content?: string } };
        const content = (data.message?.content ?? '').trim();
        if (!content) throw new Error('empty content from model');
        const parsed = JSON.parse(content);
        return {
          objectSeen:      typeof parsed.object_seen === 'string' ? parsed.object_seen : null,
          isPartOf:        typeof parsed.is_part_of === 'string' ? parsed.is_part_of : null,
          locationInFrame: typeof parsed.location_in_frame === 'string' ? parsed.location_in_frame : null,
          matchesExpected: parsed.matches_expected === true,
          reason:          typeof parsed.reason === 'string' ? parsed.reason : null,
        };
      } catch (e: any) {
        lastErr = String(e?.message ?? e);
        this.logger.warn(`askFacts attempt ${attempt} failed: ${lastErr}`);
      }
    }
    throw new Error(lastErr || 'fact check failed');
  }

  /** Merge stage-2 findings onto the stage-1 verdict (never downgrades). */
  private async mergeFactVerdict(
    runId: string, t: Target, factFlags: string[], answers: FactAnswers | null,
    newIssues: string[], escalate: 'fail' | 'warn' | null,
  ): Promise<void> {
    const existing = await this.db.imageQcVerdict.findUnique({
      where: { shotId_filename: { shotId: t.shotId, filename: t.filename } },
    });
    if (!existing) return;
    let status: string = existing.status;
    if (escalate === 'fail') status = 'fail';
    else if (escalate === 'warn' && status === 'pass') status = 'warn';
    await this.db.imageQcVerdict.update({
      where: { id: existing.id },
      data:  {
        runId,
        status,
        factFlags:   factFlags.length ? (factFlags as any) : null,
        factAnswers: (answers as any) ?? null,
        issues:      ([...(existing.issues ?? []), ...newIssues] as any),
      },
    });
  }

  // ── Shared plumbing ─────────────────────────────────────────────────────────

  /** Same NDJSON streaming discipline as VoValidationService.streamWorker. */
  private streamWorker(
    bin: string, argv: string[], timeoutMs: number, runId: string,
    onLine: (parsed: any) => Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (bin !== 'python' && !existsSync(bin)) return reject(new Error(`python bin missing: ${bin}`));
      const scriptPath = argv.find((a) => a.endsWith('.py'));
      if (scriptPath && !existsSync(scriptPath)) return reject(new Error(`worker script missing: ${scriptPath}`));

      this.logger.log(`Image QC worker: ${bin} ${argv.join(' ')}`);
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
          catch (e: any) { this.logger.warn(`Image QC line handling failed: ${e?.message ?? e}`); }
          if (++linesSinceCheck >= 10) {
            linesSinceCheck = 0;
            const row = await this.db.imageQcRun.findUnique({
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
          if (cancelled)  return reject(new Error(IMAGE_QC_CANCELLED));
          if (timedOut)   return reject(new Error(`worker timed out after ${Math.round(timeoutMs / 60_000)} min`));
          if (code !== 0) return reject(new Error(`worker exited ${code}: ${stderrTail.trim().slice(-400)}`));
          resolve();
        });
      });
    });
  }

  /** Spawn vision_resize.py once for all [src,dest] pairs (same contract as the
   *  retired validator: best-effort, caller falls back to full-res). */
  private resize(pairs: Array<[string, string]>): Promise<void> {
    return new Promise((resolve) => {
      if (pairs.length === 0) return resolve();
      if (!existsSync(KOHYA_PYTHON) || !existsSync(VISION_RESIZE_SCRIPT)) {
        this.logger.warn('resize: python or vision_resize.py missing — fact stage on full-res');
        return resolve();
      }
      const argv = [VISION_RESIZE_SCRIPT, String(VISION_MAX_DIM)];
      for (const [s, d] of pairs) { argv.push(s, d); }
      const proc = spawn(KOHYA_PYTHON, argv, { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      proc.stderr.on('data', (c: Buffer) => { err += c.toString(); });
      proc.on('close', (code) => {
        if (code !== 0 && err.trim()) this.logger.warn(`vision_resize rc=${code}: ${err.trim().slice(0, 300)}`);
        resolve();
      });
      proc.on('error', (e) => { this.logger.warn(`vision_resize spawn error: ${e.message}`); resolve(); });
    });
  }

  private async upsertVerdict(runId: string, t: Target, d: VerdictData): Promise<void> {
    const data = {
      runId,
      status:          d.status,
      peopleExpected:  d.peopleExpected ?? null,
      peopleFound:     d.peopleFound ?? null,
      backgroundFaces: d.backgroundFaces ?? null,
      poseFlags:       (d.poseFlags ?? null) as any,
      poseMetrics:     (d.poseMetrics ?? null) as any,
      factFlags:       null as any,
      factAnswers:     null as any,
      issues:          (d.issues ?? null) as any,
      errorMessage:    d.errorMessage ?? null,
    };
    await this.db.imageQcVerdict.upsert({
      where:  { shotId_filename: { shotId: t.shotId, filename: t.filename } },
      create: { shotId: t.shotId, filename: t.filename, ...data },
      update: data,
    });
  }

  // Verdict invalidation on candidate delete lives in ShotsService.removeRender
  // (direct imageQcVerdict.deleteMany — ShotsModule doesn't import this module).

  // ── Read API ────────────────────────────────────────────────────────────────

  async listRuns(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    return this.db.imageQcRun.findMany({
      where: { projectId: project.id }, orderBy: { queuedAt: 'desc' }, take: 20,
    });
  }

  async latestRun(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    return this.db.imageQcRun.findFirst({
      where: { projectId: project.id }, orderBy: { queuedAt: 'desc' },
    });
  }

  /** The worklist: every non-pass verdict, worst first — смотреть только это. */
  async report(idOrSlug: string) {
    const project = await this.project(idOrSlug);
    const verdicts = await this.db.imageQcVerdict.findMany({
      where: {
        status: { not: 'pass' },
        shot:   { projectId: project.id },
      },
      include: {
        shot: { select: {
          id: true, shotCode: true, chosenRender: true,
          scene: { select: { sceneKey: true } },
        } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const rank: Record<string, number> = { error: 0, fail: 1, warn: 2 };
    return (verdicts as any[])
      .map((v) => ({
        shotId:          v.shotId,
        shotCode:        v.shot?.shotCode ?? null,
        sceneKey:        v.shot?.scene?.sceneKey ?? null,
        filename:        v.filename,
        isChosen:        v.shot?.chosenRender === v.filename,
        status:          v.status,
        issues:          v.issues ?? [],
        poseFlags:       v.poseFlags ?? [],
        factFlags:       v.factFlags ?? [],
        factAnswers:     v.factAnswers ?? null,
        peopleExpected:  v.peopleExpected,
        peopleFound:     v.peopleFound,
        backgroundFaces: v.backgroundFaces,
      }))
      .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
        || (a.shotCode ?? '').localeCompare(b.shotCode ?? '')
        || a.filename.localeCompare(b.filename));
  }

  /** Verdicts for ONE shot — badges on the candidate cards in ShotDetail. */
  async shotVerdicts(shotId: string) {
    return this.db.imageQcVerdict.findMany({
      where:   { shotId },
      orderBy: { filename: 'asc' },
    });
  }
}

interface FactAnswers {
  objectSeen:      string | null;
  isPartOf:        string | null;
  locationInFrame: string | null;
  matchesExpected: boolean;
  reason:          string | null;
}

interface VerdictData {
  status: 'pass' | 'warn' | 'fail' | 'error';
  peopleExpected?:  number;
  peopleFound?:     number;
  backgroundFaces?: number;
  poseFlags?:       string[];
  poseMetrics?:     unknown;
  issues?:          string[];
  errorMessage?:    string;
}
