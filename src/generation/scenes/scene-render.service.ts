import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, renameSync, copyFileSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ComfyService, QueuePromptResult } from '../../comfy/comfy.service';
import { SceneFactory } from './scene.factory';
import { SceneJobParams, SceneParticipant } from './scene-job.types';

const APP_ROOT        = process.env.APP_ROOT        ?? path.resolve(__dirname, '..', '..', '..', '..');
const COMFY_OUTPUT    = process.env.COMFY_OUTPUT    ?? 'E:\\ComfyUI\\output';
const COMFY_LORA_ROOT = process.env.COMFY_LORA_ROOT ?? 'E:\\ComfyUI\\models\\loras';
const KOHYA_PYTHON    = process.env.KOHYA_PYTHON    ?? 'E:\\kohya_ss\\venv\\Scripts\\python.exe';
const UPSCALE_SCRIPT  = path.join(APP_ROOT, 'scripts', 'upscale_to_fhd.py');

export interface RenderShotInput {
  shotId:          string;
  /** Override scene description from shot.promptFields if provided. */
  scenePrompt?:    string;
  negativeExtra?:  string;
  width?:          number;
  height?:         number;
  seed?:           number;
  steps?:          number;
  cfg?:            number;
  /** How many images to generate at once (batch_size on EmptyLatentImage). */
  batchSize?:      number;
  loraStrength?:   number;
  /** If true, return the assembled workflow without queuing it. */
  dryRun?:         boolean;
}

export interface RenderResult {
  shotId:        string;
  shotCode:      string;
  strategyId:    string;
  participants:  Array<{ profileCode: string; displayName: string; loraPath: string }>;
  job?:          QueuePromptResult;
  workflow?:     Record<string, unknown>;
}

@Injectable()
export class SceneRenderService {
  private readonly logger = new Logger(SceneRenderService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly comfy:   ComfyService,
    private readonly scenes:  SceneFactory,
  ) {}

  // ── Queue-aware API (used by PipelineQueueService) ──────────────────────────

  /** Enqueue a render: creates a `pending` SceneRenderJob; pipeline-tick will dispatch it. */
  async enqueueRender(input: RenderShotInput) {
    const shot = await this.prisma.shot.findUnique({ where: { id: input.shotId } });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);

    // Strip non-serialisable fields (shotId is on the row itself; dryRun doesn't queue).
    const { shotId, dryRun: _dryRun, ...params } = input;
    return this.prisma.sceneRenderJob.create({
      data: {
        shotId,
        status: 'pending',
        params: params as any,
      },
    });
  }

  async findNextPending() {
    return this.prisma.sceneRenderJob.findFirst({
      where:   { status: 'pending' },
      orderBy: { queuedAt: 'asc' },
    });
  }

  /** Dispatch one pending job: build workflow, submit to ComfyUI, mark running. */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await this.prisma.sceneRenderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Scene render job ${jobId} not found`);
    try {
      const params = (job.params ?? {}) as Record<string, unknown>;
      const result = await this.renderShot({
        shotId: job.shotId,
        ...params,
        dryRun: false,
      });
      if (!result.job) throw new Error('Renderer did not return a ComfyUI prompt_id');
      await this.prisma.sceneRenderJob.update({
        where: { id: jobId },
        data:  {
          status:        'running',
          startedAt:     new Date(),
          comfyPromptId: result.job.promptId,
        },
      });
    } catch (e: any) {
      this.logger.error(`Scene dispatch ${jobId} failed: ${e.message}`);
      await this.prisma.sceneRenderJob.update({
        where: { id: jobId },
        data:  { status: 'failed', errorMessage: e.message, completedAt: new Date() },
      });
    }
  }

  /**
   * Poll ComfyUI for completion of any running scene job; on success, append
   * each output filename to the shot's `renderedImages` array and mark the job
   * `completed`. On failure, mark `failed`.
   */
  async pollRunning(): Promise<void> {
    const running = await this.prisma.sceneRenderJob.findMany({ where: { status: 'running' } });
    for (const j of running) {
      if (!j.comfyPromptId) continue;
      const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
      if (!h?.status?.completed) continue;

      const success = h.status.status_str === 'success';
      const filenames: string[] = success
        ? Object.values(h.outputs ?? {}).flatMap((o: any) => (o.images ?? []).map((i: any) => i.filename as string))
        : [];

      if (success && filenames.length > 0) {
        // Move ComfyUI's outputs into our project tree (data/<slug>/shots/<code>/)
        // so the file layout matches the dataset model — `data/` is the source
        // of truth, COMFY_OUTPUT is just staging. moveOutputsToShotDir may
        // renumber filenames on collision, so we record the post-move names.
        const finalFilenames = await this.moveOutputsToShotDir(j.shotId, filenames);
        await this.appendShotRenders(j.shotId, finalFilenames, j.comfyPromptId);
      }
      await this.prisma.sceneRenderJob.update({
        where: { id: j.id },
        data:  {
          status:       success ? 'completed' : 'failed',
          completedAt:  new Date(),
          errorMessage: success ? null : 'ComfyUI reported non-success status',
        },
      });
      // Clear in-flight marker on the shot once we've recorded results.
      await this.prisma.shot.update({
        where: { id: j.shotId },
        data:  { activeRenderPromptId: null },
      });
    }
  }

  /**
   * Move freshly-generated ComfyUI outputs from COMFY_OUTPUT into the shot's
   * own folder (data/<slug>/shots/<shotCode>/), upscaling each to fit Full HD
   * (1920×1080) along the way via Lanczos resample. Best-effort: if upscaling
   * fails for any reason, the file falls back to a plain move so the render is
   * never lost.
   *
   * Returns the post-move filenames (basename only). When a destination name
   * already exists — ComfyUI's per-prefix counter resets to 00001 every time
   * its output dir is wiped or it restarts, so re-rendering the same shot
   * routinely produces colliding names — the new file is renumbered into the
   * next free slot rather than dropped, mirroring dataset.prepare().
   */
  private async moveOutputsToShotDir(shotId: string, filenames: string[]): Promise<string[]> {
    const shot = await this.prisma.shot.findUnique({
      where: { id: shotId },
      include: { project: true },
    });
    if (!shot) return [];
    const destDir = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode);
    mkdirSync(destDir, { recursive: true });

    // Highest existing NNNNN for this shot's prefix — collisions count up from
    // here so re-runs append rather than overwrite.
    const prefix   = `scene_${shot.shotCode}`;
    const numberRe = new RegExp(`^${escapeRegex(prefix)}_(\\d+)_(\\.[^.]+)$`, 'i');
    let nextN = 0;
    for (const entry of readdirSync(destDir)) {
      const m = entry.match(numberRe);
      if (m) nextN = Math.max(nextN, parseInt(m[1], 10));
    }

    // Build [src, dest] pairs (with renumbered dest on collision) plus a parallel
    // list of final basenames for appendShotRenders.
    const pairs: Array<[string, string]> = [];
    const finalNames: string[] = [];
    for (const filename of filenames) {
      const src = path.join(COMFY_OUTPUT, filename);
      if (!existsSync(src)) continue;
      let destBase = filename;
      let dest = path.join(destDir, destBase);
      while (existsSync(dest)) {
        nextN++;
        const ext = path.extname(filename);
        destBase = `${prefix}_${String(nextN).padStart(5, '0')}_${ext}`;
        dest = path.join(destDir, destBase);
      }
      pairs.push([src, dest]);
      finalNames.push(destBase);
    }
    if (pairs.length === 0) return finalNames;

    // Upscale src → dest in one Python process (Pillow Lanczos to fit FHD).
    const upscaled = await this.runUpscale(pairs);

    // For any file the upscaler skipped/failed on, fall back to a plain move so
    // we still capture the render (just at native bucket size).
    for (const [src, dest] of pairs) {
      if (existsSync(dest)) { safeUnlink(src); continue; }
      if (!existsSync(src)) continue;
      try {
        renameSync(src, dest);
      } catch (e: any) {
        if (e?.code === 'EXDEV') {
          copyFileSync(src, dest);
          safeUnlink(src);
        } else {
          this.logger.warn(`moveOutputsToShotDir fallback: ${path.basename(src)} → ${e?.message ?? e}`);
        }
      }
    }

    // Source cleanup: remove any src whose dest now exists.
    for (const [src, dest] of pairs) {
      if (existsSync(dest) && existsSync(src)) safeUnlink(src);
    }
    if (upscaled > 0) this.logger.log(`Upscaled ${upscaled}/${pairs.length} render(s) to FHD for shot ${shot.shotCode}`);
    return finalNames;
  }

  /**
   * Run scripts/upscale_to_fhd.py with src→dest pairs. Resolves to the count of
   * successfully upscaled files. Returns 0 on any subprocess error — caller
   * falls back to a plain move.
   */
  private runUpscale(pairs: Array<[string, string]>): Promise<number> {
    return new Promise((resolve) => {
      if (!existsSync(KOHYA_PYTHON) || !existsSync(UPSCALE_SCRIPT)) {
        this.logger.warn('runUpscale: python or script missing — skipping');
        return resolve(0);
      }
      const flat: string[] = [UPSCALE_SCRIPT];
      for (const [s, d] of pairs) { flat.push(s); flat.push(d); }
      const proc = spawn(KOHYA_PYTHON, flat, { stdio: ['ignore', 'pipe', 'pipe'] });
      let okCount = 0;
      proc.stdout.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString().split(/\r?\n/)) {
          if (/^(SCALE|COPY)\s/.test(line)) okCount++;
        }
      });
      proc.stderr.on('data', (chunk: Buffer) => this.logger.warn(`upscale: ${chunk.toString().trimEnd()}`));
      proc.on('error', (e) => { this.logger.warn(`upscale spawn: ${e.message}`); resolve(0); });
      proc.on('exit', () => resolve(okCount));
    });
  }

  /**
   * Resolve the absolute path of a rendered image. Looks first in the shot's
   * own folder (post-move), then in COMFY_OUTPUT (legacy or in-flight). Returns
   * null if not found anywhere.
   */
  async resolveRenderPath(shotId: string, filename: string): Promise<string | null> {
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return null;
    const shot = await this.prisma.shot.findUnique({
      where: { id: shotId },
      include: { project: true },
    });
    if (!shot) return null;
    const inShot = path.join(APP_ROOT, 'data', shot.project.slug, 'shots', shot.shotCode, filename);
    if (existsSync(inShot)) return inShot;
    const inOutput = path.join(COMFY_OUTPUT, filename);
    if (existsSync(inOutput)) return inOutput;
    return null;
  }

  /** Append filenames to shot.renderedImages JSON array, deduping by filename. */
  private async appendShotRenders(shotId: string, filenames: string[], promptId: string): Promise<void> {
    const shot = await this.prisma.shot.findUnique({ where: { id: shotId } });
    if (!shot) return;
    const existing = (shot.renderedImages as Array<{ filename: string }> | null) ?? [];
    const have = new Set(existing.map((r) => r.filename));
    const additions = filenames
      .filter((f) => !have.has(f))
      .map((f) => ({ filename: f, promptId, createdAt: new Date().toISOString() }));
    if (additions.length === 0) return;
    await this.prisma.shot.update({
      where: { id: shotId },
      data:  { renderedImages: [...existing, ...additions] as any },
    });
  }

  // ── Direct render (called by queue worker after engine arbitration) ─────────

  async renderShot(input: RenderShotInput): Promise<RenderResult> {
    // ── 1. Load shot + participants + their character profiles ───────────────
    const shot = await this.prisma.shot.findUnique({
      where:   { id: input.shotId },
      include: {
        project:      true,
        participants: {
          include: {
            character: { include: { profiles: true } },
            profile:   true,
          },
        },
      },
    });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);

    // ── 2. Resolve participant → trained CharacterProfile ────────────────────
    // If the participant explicitly picks a profile (age variant), use it.
    // Otherwise fall back to the first profile of the character that has a LoRA.
    const participants: SceneParticipant[] = [];
    for (const sp of shot.participants) {
      if (!sp.character) continue;            // unbound participant slot

      const profile = sp.profile && sp.profile.loraPath && sp.profile.triggerToken
        ? sp.profile
        : sp.character.profiles.find((p) => p.loraPath && p.triggerToken);

      if (!profile) {
        const explicit = sp.profile ? ` (chose ${sp.profile.profileCode}: ${sp.profile.loraPath ? 'LoRA missing trigger' : 'no LoRA trained yet'})` : '';
        throw new BadRequestException(
          `Character "${sp.character.code}" (${sp.character.displayName ?? '?'}) has no trained LoRA${explicit}. ` +
          `Train one via POST /training/profiles/:profileId/start before rendering scenes.`,
        );
      }
      participants.push({
        triggerToken:    profile.triggerToken!,
        displayName:     sp.character.displayName ?? sp.character.code,
        loraPath:        toComfyLoraName(profile.loraPath!),
        characterPrompt: profile.promptBase ?? '',
        loraStrength:    input.loraStrength,
      });
    }

    // 0 participants is fine — uses environment strategy (no LoRA).

    // ── 3. Pick strategy by participant count ────────────────────────────────
    const strategy = this.scenes.pickByParticipantCount(participants.length);
    const template = this.scenes.loadTemplate(strategy, shot.project.slug);

    // ── 4. Build params ──────────────────────────────────────────────────────
    const pf = (shot.promptFields ?? {}) as Record<string, unknown>;
    // If the user wrote `pf.positive` themselves it's canonical — don't touch.
    // Otherwise concat the structured fields and prepend a framing directive
    // translated from `pf.camera.framing`. The directive carries explicit
    // composition language (rule of thirds, shot size, environment visibility)
    // so SDXL doesn't default to face-fills-frame.
    const userPositive = pf.positive as string | undefined;
    let positive: string;
    if (userPositive && userPositive.trim().length > 0) {
      positive = userPositive;
    } else {
      const camera = pf.camera as { framing?: string } | undefined;
      const framingDirective = framingPromptFor(camera?.framing);
      const parts: string[] = [];
      if (framingDirective) parts.push(framingDirective);
      for (const f of [pf.narrativeBeat, pf.frameDescription, pf.positiveEnvironment, pf.positiveCharacterLocks, pf.lightingMood]) {
        if (typeof f === 'string' && f.trim().length > 0) parts.push(f);
      }
      positive = parts.join(', ');
    }
    const negative = pf.negative as string | undefined;

    const params: SceneJobParams = {
      participants,
      scenePrompt:    input.scenePrompt   ?? positive ?? '',
      negativeExtra:  input.negativeExtra ?? negative ?? undefined,
      // SDXL native landscape bucket — 1 megapixel, ~16:9, clean output.
      width:          input.width  ?? 1344,
      height:         input.height ?? 768,
      seed:           input.seed   ?? Math.floor(Math.random() * 2 ** 32),
      steps:          input.steps,
      cfg:            input.cfg,
      batchSize:      input.batchSize ?? 5,
      filenamePrefix: `scene_${shot.shotCode}`,
    };

    const workflow = strategy.buildPrompt(template, params);

    // ── 5. Dry-run or queue ──────────────────────────────────────────────────
    const baseResult = {
      shotId:       shot.id,
      shotCode:     shot.shotCode,
      strategyId:   strategy.id,
      participants: participants.map((p) => ({
        profileCode: p.triggerToken,
        displayName: p.displayName,
        loraPath:    p.loraPath,
      })),
    };

    if (input.dryRun) {
      return { ...baseResult, workflow };
    }

    const job = await this.comfy.queuePrompt(workflow);

    // Track the in-flight prompt on the shot so /scenes can show "rendering" badges.
    await this.prisma.shot.update({
      where: { id: shot.id },
      data:  { activeRenderPromptId: job.promptId },
    });

    return { ...baseResult, job };
  }
}

function safeUnlink(p: string): void {
  try { unlinkSync(p); } catch { /* best-effort */ }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Translate `shot.promptFields.camera.framing` into explicit composition
 * language SDXL responds to. Keys match what the UI lets the user pick.
 * Unknown / missing values get a sensible "balanced framing" default rather
 * than nothing, so face-fills-frame is never the implicit default.
 */
function framingPromptFor(framing: string | undefined | null): string {
  switch ((framing ?? '').toLowerCase()) {
    case 'extreme_wide':
    case 'establishing':
      return 'extreme wide establishing shot, subject occupies one-tenth of the frame, environment dominates, rule of thirds composition';
    case 'wide':
      return 'wide shot, full body visible, subject framed at left third, environment fully visible behind, rule of thirds composition';
    case 'medium_or_wide':
    case 'medium-wide':
      return 'medium-wide shot, subject from waist up, environment fully visible behind, subject offset to one third following rule of thirds';
    case 'medium':
      return 'medium shot, subject from chest up, environment partially visible behind, balanced rule of thirds composition';
    case 'medium_close':
    case 'medium-close':
      return 'medium close-up, subject head and shoulders, soft environment behind subject, rule of thirds composition';
    case 'close-up':
    case 'closeup':
      return 'close-up shot, subject head and shoulders, shallow depth of field, environment softly blurred behind';
    case 'tight_close_up':
    case 'tight-close-up':
      return 'tight close-up, head fills the upper-third of frame, shallow depth of field';
    case 'extreme_close_up':
    case 'extreme-close-up':
      return 'extreme close-up macro detail, single feature dominates the frame';
    case 'pov':
    case 'first_person':
      return 'first-person POV from subject perspective, no subject visible, looking forward at the scene, immersive environment-only composition';
    case 'over_shoulder':
    case 'over-shoulder':
      return 'over-the-shoulder shot, back of subject in immediate foreground out of focus, environment in focus beyond';
    case 'low_angle':
      return 'low-angle shot, camera below eye level looking up, subject from chest up, sky or ceiling above';
    case 'high_angle':
      return 'high-angle shot, camera above looking down, subject from above with floor / ground visible, rule of thirds composition';
    case 'aerial':
    case 'birds_eye':
      return 'aerial top-down shot, environment dominates, subject very small, rule of thirds composition';
    case '':
    case undefined as any:
    case null as any:
      // No explicit framing — use a balanced default that AVOIDS face-fills-frame.
      return 'medium-wide shot, subject from waist up at the right third, environment fully visible behind, rule of thirds composition';
    default:
      return 'medium-wide shot, environment visible, rule of thirds composition';
  }
}

/**
 * ComfyUI LoraLoader expects paths relative to `models/loras/` with native
 * separators, not absolute paths. We store the absolute path in the DB for
 * portability and convert at render time.
 */
function toComfyLoraName(absolutePath: string): string {
  const rel = path.relative(COMFY_LORA_ROOT, absolutePath);
  return rel.split(/[/\\]/).join(path.sep);
}
