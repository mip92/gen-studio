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

  /** Enqueue a render: creates a `pending` SceneRenderJob; pipeline-tick will dispatch it.
   *
   * Re-render semantics: any previously-rendered candidates for this shot are
   * wiped before the new job is queued — both the files on disk and the
   * `Shot.renderedImages` JSON list, and any `chosenRender` selection. This
   * matches the "regenerate replaces" expectation: users who click render
   * twice in a row don't end up with stale outputs piling next to the new
   * batch. In-flight renders (pending/running scene jobs) are NOT touched —
   * pollRunning will still append their outputs when they finish.
   */
  async enqueueRender(input: RenderShotInput) {
    const shot = await this.prisma.shot.findUnique({
      where:   { id: input.shotId },
      include: { project: true },
    });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);

    await this.wipePreviousRenders(shot);

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

  /**
   * Bulk-enqueue every shot in a project that has NOT been rendered yet and is
   * NOT already queued. ADDITIVE ONLY — never wipes, deletes, or re-queues
   * anything. Skips shots that already have renders (awaiting approval), are
   * approved (chosenRender set), or already have a pending/running job.
   */
  async enqueuePendingForProject(projectOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where:  { OR: [{ id: projectOrSlug }, { slug: projectOrSlug }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectOrSlug} not found`);

    const eligible = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT s.id
      FROM shots s
      JOIN scenes sc ON sc.id = s."sceneId"
      WHERE s."projectId" = ${project.id}
        AND s."chosenRender" IS NULL
        AND (s."renderedImages" IS NULL OR s."renderedImages"::text IN ('[]', 'null'))
        AND NOT EXISTS (
          SELECT 1 FROM scene_render_jobs j
          WHERE j."shotId" = s.id AND j.status IN ('pending', 'running')
        )
      ORDER BY sc."sortOrder", s."shotCode"
    `;
    if (eligible.length === 0) return { enqueued: 0 };
    await this.prisma.sceneRenderJob.createMany({
      data: eligible.map((e) => ({ shotId: e.id, status: 'pending', params: {} as any })),
    });
    return { enqueued: eligible.length };
  }

  /** Delete previously-rendered files + clear renderedImages/chosenRender for a shot.
   *  Best-effort on files (missing/permission errors are logged, not raised). */
  private async wipePreviousRenders(shot: { id: string; shotCode: string; renderedImages: unknown; project: { slug: string } | null }) {
    const list = (shot.renderedImages as Array<{ filename: string }> | null) ?? [];
    if (list.length === 0) {
      // Nothing recorded — also clear chosenRender defensively in case of drift.
      await this.prisma.shot.update({
        where: { id: shot.id },
        data:  { chosenRender: null },
      });
      return;
    }

    const slug = shot.project?.slug;
    if (slug) {
      const dir = path.join(APP_ROOT, 'data', slug, 'shots', shot.shotCode);
      for (const r of list) {
        const full = path.join(dir, r.filename);
        if (existsSync(full)) {
          try { unlinkSync(full); }
          catch (e: any) { this.logger.warn(`wipePreviousRenders: failed to delete ${full}: ${e?.message}`); }
        }
      }
    }
    await this.prisma.shot.update({
      where: { id: shot.id },
      data:  {
        renderedImages:       [] as any,
        chosenRender:         null,
        // Also clear in-flight tracking — the new job will set this fresh.
        activeRenderPromptId: null,
      },
    });
    this.logger.log(`wipePreviousRenders: shot ${shot.shotCode} cleared ${list.length} previous render(s)`);
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
        // Scene carries the canonical act-level lightingMood / palette / time-of-day
        // defaults used as fallback when the shot's promptFields don't override them.
        scene:        true,
        participants: {
          include: {
            character: { include: { profiles: true } },
            profile:   true,
          },
        },
      },
    });
    if (!shot) throw new NotFoundException(`Shot ${input.shotId} not found`);

    // Location lookup via $queryRaw — bypasses the need for a Prisma client
    // regeneration when the locations table was added mid-session. Prepends
    // location.description to the positive so a single edit in the location
    // row updates every shot tagged with it.
    const locationRows = await this.prisma.$queryRaw<Array<{ description: string }>>`
      SELECT l.description
      FROM shots sh
      LEFT JOIN locations l ON sh."locationId" = l.id
      WHERE sh.id = ${input.shotId}
    `;
    const locationDescription = locationRows[0]?.description ?? null;

    // ── 2. Resolve participant → CharacterProfile ────────────────────────────
    // Photoreal path (Project.visualStyle = 'photoreal_cinematic'): requires
    // trained LoRA per participant — throws if missing.
    // Cartoon path (e.g. 'graphic_novel_cell_shaded' for bio_plus): identity
    // lock is via IP-Adapter at 0.4 weight on a single anchor reference image,
    // no LoRA training required. profile.loraPath stays NULL; profile.useIpAdapter
    // is TRUE; reference image lives at data/<slug>/reference/<profileCode>_anchor.png.
    const visualStyle: string = (shot.project as any).visualStyle ?? 'photoreal_cinematic';
    const isCartoon = visualStyle !== 'photoreal_cinematic';

    const participants: SceneParticipant[] = [];
    for (const sp of shot.participants) {
      if (!sp.character) continue;            // unbound participant slot

      if (isCartoon) {
        // Cartoon path — no LoRA required, identity via IP-Adapter anchor + text.
        const profile = sp.profile ?? sp.character.profiles[0];
        if (!profile || !profile.triggerToken) {
          throw new BadRequestException(
            `Character "${sp.character.code}" has no profile or trigger token. Cartoon projects still need a CharacterProfile row for promptBase + triggerToken.`,
          );
        }
        participants.push({
          triggerToken:    profile.triggerToken!,
          displayName:     sp.character.displayName ?? sp.character.code,
          loraPath:        '',                              // sentinel — strategy ignores when style=cartoon
          characterPrompt: profile.promptBase ?? '',
          loraStrength:    input.loraStrength,
        });
        continue;
      }

      // Photoreal path — must have trained LoRA.
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

    // ── 3. Pick strategy by visual style + participant count ─────────────────
    const strategy = this.scenes.pickByStyleAndParticipantCount(visualStyle, participants.length);
    const template = this.scenes.loadTemplate(strategy, shot.project.slug);

    // ── 4. Build params ──────────────────────────────────────────────────────
    const pf = (shot.promptFields ?? {}) as Record<string, unknown>;
    // If the user wrote `pf.positive` themselves it's canonical — don't touch.
    // Otherwise concat the structured fields and prepend a framing directive
    // translated from `pf.camera.framing`. The directive carries explicit
    // composition language (rule of thirds, shot size, environment visibility)
    // so SDXL doesn't default to face-fills-frame.
    // Lighting fallback: per-shot override beats the act-level canonical value
    // (`Scene.lightingMood`). One edit in `Scene.lightingMood` shifts every
    // shot in that act that hasn't explicitly overridden it.
    const shotLighting   = pf.lightingMood as string | undefined;
    const sceneLighting  = shot.scene?.lightingMood ?? null;
    const effectiveLight = (shotLighting && shotLighting.trim().length > 0)
      ? shotLighting
      : sceneLighting;

    const userPositive = pf.positive as string | undefined;
    let positive: string;
    if (userPositive && userPositive.trim().length > 0) {
      positive = userPositive;
    } else {
      // Composition mode — used when the shot has no baked positive yet (new
      // shots or freshly cleared). Pull the act-level lighting as the lighting
      // fragment so a new shot doesn't have to repeat tokens already written
      // once at the scene level.
      const camera = pf.camera as { framing?: string } | undefined;
      const framingDirective = framingPromptFor(camera?.framing);
      const parts: string[] = [];
      if (framingDirective) parts.push(framingDirective);
      for (const f of [pf.narrativeBeat, pf.frameDescription, pf.positiveEnvironment, pf.positiveCharacterLocks, effectiveLight]) {
        if (typeof f === 'string' && f.trim().length > 0) parts.push(f);
      }
      positive = parts.join(', ');
    }

    // Location injection: APPEND the Location.description to the end of the
    // positive. Order matters for CLIP-G conditioning — tokens nearest the
    // start get the strongest weight, so character/face/action tokens stay
    // first and the location prose comes last. Single source of truth for
    // the train_kupe / corridor / vestibule prose; editing the Location row
    // updates every shot tagged with it. Idempotent.
    if (locationDescription && locationDescription.trim().length > 0) {
      const desc = locationDescription.trim();
      if (!positive.endsWith(desc)) {
        positive = positive.trim().length > 0 ? `${positive}, ${desc}` : desc;
      }
    }

    // Strip any weight syntax from the final positive — project rule: no
    // per-token emphasis anywhere (positive OR negative). Logs each strip so
    // we can trace whoever introduced the weight (user text, location prose,
    // bug, etc.). Safety net only — DB content is also clean by convention.
    positive = stripPromptWeights(positive, (tok, w) => {
      this.logger.warn(`[${shot.shotCode}] stripped positive weight "(${tok}:${w})" — weights banned in prompts`);
    });

    // Negative fallback: per-shot override beats project-wide default. Same
    // logic — one edit in `Project.defaultNegative` updates every shot that
    // hasn't overridden it.
    const shotNegative    = pf.negative as string | undefined;
    const projectDefault  = (shot.project as any)?.defaultNegative as string | undefined;
    const rawNegative     = (shotNegative && shotNegative.trim().length > 0)
      ? shotNegative
      : projectDefault;
    const negative = sanitizeNegative(rawNegative, this.logger, shot.shotCode);

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

    // ── 4b. Per-project style-LoRA override (cartoon only) ───────────────────
    // The graphic-novel workflows bake the comic style-LoRA at node "2"
    // (a LoraLoader, identical node id across the single/dual/environment
    // templates). When `project.settings.styleLora` is set we swap `lora_name`
    // (and optional strengths) at render time, so a project can pick a
    // different comic LoRA without editing the JSON template.
    //
    // Guarded on isCartoon: in the PHOTOREAL workflows node "2" is the CHARACTER
    // LoRA, so we must never touch it there. Absent/null settings → the JSON
    // default LoRA is used unchanged (keeps gaz / bio_plus working as before).
    if (isCartoon) {
      const styleLora = normalizeStyleLora((shot.project as any).settings);
      const node2 = (workflow as any)['2']?.inputs;
      if (styleLora && node2) {
        node2.lora_name = styleLora.name;
        if (styleLora.strengthModel !== undefined) node2.strength_model = styleLora.strengthModel;
        if (styleLora.strengthClip  !== undefined) node2.strength_clip  = styleLora.strengthClip;
        this.logger.log(`[${shot.shotCode}] style LoRA override → ${styleLora.name}`);
      }
    }

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
 * Read `project.settings.styleLora` into a normalized override or null.
 * Accepts either a bare ComfyUI lora_name string (e.g. "style\\X.safetensors")
 * or an object { name, strengthModel?, strengthClip? }. Returns null when
 * absent/blank so the caller falls back to the JSON-baked default LoRA.
 */
export function normalizeStyleLora(
  settings: unknown,
): { name: string; strengthModel?: number; strengthClip?: number } | null {
  const s = (settings as { styleLora?: unknown } | null | undefined)?.styleLora;
  if (!s) return null;
  if (typeof s === 'string') {
    return s.trim().length > 0 ? { name: s.trim() } : null;
  }
  if (typeof s === 'object') {
    const o = s as { name?: unknown; strengthModel?: unknown; strengthClip?: unknown };
    if (typeof o.name === 'string' && o.name.trim().length > 0) {
      return {
        name:          o.name.trim(),
        strengthModel: typeof o.strengthModel === 'number' ? o.strengthModel : undefined,
        strengthClip:  typeof o.strengthClip  === 'number' ? o.strengthClip  : undefined,
      };
    }
  }
  return null;
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

// ─── Negative prompt sanitizer ──────────────────────────────────────────────
//
// Past incident: a user/UI saved a 30-token negative full of weighted phrases
// like `(red towel:2.0), (towel:1.8), (motion blur), (out of focus), (smudged)`
// to every shot. Result: SDXL output had plastic skin, HDR oversaturation,
// hyper-sharp grain — a "grubo" look. Even "capped" weights (1.3) caused
// drift on positive-prompt LoRA conditioning. Project rule (2026-05-24):
// zero `(token:N)` syntax anywhere — flat prompts only. The sanitizer below
// strips weights from negatives and removes known-toxic sharpening tokens
// before the negative reaches the strategy / KSampler.
// Tokens that, on the negative side, paradoxically push toward over-sharpening
// and plastic skin in SDXL. Keep this list narrow — only add tokens with
// confirmed visible damage.
const TOXIC_NEGATIVE_TOKENS = [
  'motion blur', 'camera shake', 'out of focus subject', 'out of focus',
  'hazy', 'smudged', 'double exposure', 'ghosting', 'plastic skin',
];

function sanitizeNegative(
  raw: string | undefined,
  logger: Logger,
  shotCode: string,
): string | undefined {
  if (!raw || !raw.trim()) return raw;
  let cleaned = raw;
  const warnings: string[] = [];

  // 1. Strip ALL weight syntax — no (token:N) anywhere. Project rule: prompts
  // stay plain, no per-token emphasis. Past incident: weights >= 1.5 cause
  // plastic-skin/hyper-sharp damage in SDXL even when "capped". User-facing
  // ban introduced 2026-05-24 after suspected face-drift on shots with rich
  // location descriptions. The simpler invariant — zero weights — is easier
  // to enforce and audit than per-engine weight tolerance.
  cleaned = stripPromptWeights(cleaned, (tok, w) => {
    warnings.push(`stripped weight "(${tok}:${w})" — weights banned in prompts`);
  });

  // 2. Strip toxic over-sharpening tokens (whole-word, comma-separated chunks).
  const chunks = cleaned.split(/,\s*/);
  const kept   = chunks.filter((chunk) => {
    const bare = chunk.replace(/^\(/, '').replace(/(:[0-9.]+)?\)$/, '').trim().toLowerCase();
    const toxic = TOXIC_NEGATIVE_TOKENS.some((t) => bare === t);
    if (toxic) warnings.push(`removed toxic over-sharp token "${bare}"`);
    return !toxic;
  });
  cleaned = kept.join(', ');

  if (warnings.length > 0) {
    logger.warn(`[${shotCode}] negative sanitized: ${warnings.join('; ')}`);
  }
  return cleaned;
}

/** Strip any `(token:weight)` syntax from a prompt. Project rule: prompts
 *  stay flat, no per-token emphasis (positive OR negative). The two patterns
 *  we handle: `(red towel:1.8)` → `red towel`, and the rare double-paren
 *  shortcut `((token))` → `token`. Called from positive + negative paths. */
export function stripPromptWeights(
  raw: string,
  onStrip?: (token: string, weight: string) => void,
): string {
  // Drop the `:weight` part inside parens; keep the bare token.
  let cleaned = raw.replace(/\(([^():]+):([0-9]+(?:\.[0-9]+)?)\)/g, (_, token, w) => {
    onStrip?.(String(token).trim(), String(w));
    return String(token).trim();
  });
  // Collapse `((token))` / `(token)` to bare token — these are emphasis shortcuts.
  cleaned = cleaned.replace(/\(+\s*([^()]+?)\s*\)+/g, (_, token) => String(token).trim());
  return cleaned;
}
