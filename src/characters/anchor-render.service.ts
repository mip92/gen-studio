import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueLedgerService } from '../pipeline/queue-ledger.service';
import { ComfyService } from '../comfy/comfy.service';
import { normalizeStyleLora, normalizeAnchorStyleLora, normalizeQwenReferenceLatents } from '../generation/scenes/scene-render.service';
import { QwenSceneGraphBuilder } from '../generation/scenes/qwen/qwen-scene-graph.builder';
import {
  composeQwenInstruction,
  REALCOMIC_T2I_STYLE,
  KEEP_REFERENCE_STYLE,
  QWEN_WORD_BUDGET,
  capClauses,
  stripIdentityBoilerplate,
} from '../generation/scenes/qwen/qwen-prompt';
import { AnchorValidationService, anchorCandidateDir } from '../validation/anchor-validation.service';
import { buildChain, wouldCycle } from './profile-chain';
import { describeWorkflowLookup, resolveWorkflowPath } from '../comfy/workflow-path';

const APP_ROOT     = process.env.APP_ROOT     ?? 'E:\\ComfyUI\\gen-studio';
const COMFY_OUTPUT = process.env.COMFY_OUTPUT ?? 'E:\\ComfyUI\\output';
const COMFY_INPUT  = process.env.COMFY_INPUT  ?? 'E:\\ComfyUI\\input';

/** How many anchor candidates to render per job so the vision model has a pool
 *  to pick the best clean, on-model, non-anime portrait from (best-of-N). */
const ANCHOR_CANDIDATES = Math.max(1, Number(process.env.ANCHOR_CANDIDATES ?? 4));

/**
 * Anchor portrait rendering for cartoon-style projects (graphic_novel_cell_shaded etc.).
 *
 * Cartoon characters don't have trained LoRAs — identity is locked via IP-Adapter
 * on a single reference image (the "anchor"). This service generates that anchor
 * through the gen-studio queue (NOT a synchronous HTTP block on ComfyUI):
 *
 *   enqueue() inserts an anchor_render_jobs row → PipelineQueueService.tick()
 *   picks it up → dispatchPending() submits to ComfyUI → pollRunning() copies
 *   the output PNG into data/<slug>/reference/<profileCode>_anchor.png.
 *
 * Mirrors the dataset_jobs / scene_render_jobs pattern. Per
 * `feedback_all_gpu_jobs_through_queue` — never spawn GPU work directly in an
 * HTTP handler.
 *
 * Workflow file (shared master, one copy for every project):
 *   data/_templates/comfy/gen_anchor_portrait_graphic_novel_api.json
 *
 * Identity assets land at:
 *   data/<projectSlug>/reference/<profileCode>_anchor.png
 */

export const STYLE_PREFIX =
  'cinematic graphic novel illustration, illustrated comic book panel, ' +
  'cell-shaded coloring, hard black ink outline with variable line weight, ' +
  'flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, ' +
  'no photorealism, no 3D render, no plastic skin';

// Flux comic projects (graphic_novel_flux) need the SAME anti-anime steering the
// scene strategy uses, or Flux turns a young/bright portrait into anime even
// with the comic LoRA at full strength. The load-bearing tokens are
// "muted desaturated cinematic palette" + "semi-realistic ADULT proportions" +
// "western/american comic" — proven to hold western-comic on the flux1-dev base.
export const FLUX_COMIC_STYLE =
  'printed western graphic novel panel, american comic book illustration, ' +
  'bold confident heavy black ink outlines with clean variable line weight, ' +
  'flat cell-shaded color blocks with cross-hatching in the shadows, ' +
  'muted desaturated cinematic color palette, grounded semi-realistic adult proportions, ' +
  'mature naturalistic face, gritty inked comic art, ' +
  'no anime, no manga, no chibi, no big shiny eyes, no photorealism, no 3D render';

/**
 * ─── THE POSE OF EVERY CHARACTER ANCHOR. ONE DEFINITION. ───────────────────
 *
 * This constant is the ONLY place the anchor's body is described, for every
 * pipeline and every project, and it CANNOT be overridden — not by
 * `settings.anchorComposition`, not per style. `resolveAnchorComposition()`
 * always emits it.
 *
 * Why it is a constant and not part of the composition strings below: until
 * 2026-08-13 the pose lived in three code constants AND in a full copy of the
 * string inside `settings.anchorComposition` on eleven projects — twelve places
 * that had already drifted apart. None of them mentioned the arms, so the model
 * invented a pose, and asked for a "character portrait" it reliably invents a
 * DISTINCTIVE one: arms folded, hands in pockets, a hand at the collar. With the
 * anchor also feeding the pixel channel, that invented gesture is what every
 * shot of the film inherits — which is how a whole film came back with one man
 * standing the same way in every scene (user 2026-08-13).
 *
 * Arms hanging relaxed is the least semantically loaded body a donor can carry:
 * build and wardrobe still read, and there is no gesture left for a scene to
 * copy. It REDUCES the bleed, it does not remove it — the donor still fixes
 * framing, so shot positives still need their own stance clause
 * (Skill: gen-studio-qwen2511 §2b).
 *
 * If the pose ever needs to change, it changes HERE, once.
 */
export const ANCHOR_POSE =
  'one person alone, three-quarters to camera, ' +
  'arms hanging relaxed at the sides, shoulders level';

// ─── SETTING: framing distance + backdrop + light. NOT the pose. ────────────
// These describe where the person stands and how they are lit. Everything about
// the BODY belongs to ANCHOR_POSE above. `settings.anchorComposition` overrides
// a project's SETTING only, which is why a per-project value can no longer
// silently carry a stale pose.

const PORTRAIT_SETTING =
  'head-and-shoulders framing, ' +
  'neutral pale grey backdrop, soft north-window light, anchor reference portrait';

// realcomic_qwen: Qwen's VL encoder reads natural language, and the anchor
// must show enough of the body for scene renders to copy the outfit/build —
// not just head-and-shoulders.
const QWEN_PORTRAIT_SETTING =
  'waist-up framing, ' +
  'neutral pale grey backdrop, soft window light, clean character reference sheet look';

// Scene-donor setting — the default whenever the project consumes its anchors as
// PIXELS (settings.qwenReferenceLatents = true): the studio-sheet settings above
// are the worst possible donor for the reference_latents channel, because their
// flat grey backdrop pastes into every shot. Keeps waist-up (the outfit must stay
// visible); drops the flat backdrop and every "reference sheet" cue.
const SCENE_DONOR_SETTING =
  'waist-up framing, ' +
  'standing in a softly blurred muted interior with natural depth, ' +
  'gentle directional daylight, soft natural shadows';

const QWEN_ANCHOR_NEGATIVE =
  'photograph, photorealistic, 3D render, plastic skin, anime, manga, chibi, ' +
  'deformed hands, extra fingers, two heads, multiple people, watermark, text overlay, blurry, low quality';

export const ANCHOR_NEGATIVE =
  'photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, ' +
  'hyperrealistic, real human face, raytraced, deformed hands, extra fingers, ' +
  'two heads, watermark, text overlay, blurry, low quality, anime, manga, ' +
  'chibi, kawaii, oversaturated color, glamour photography, fashion shoot, ' +
  'full body, multiple people, group photo, profile only, back view';

/**
 * Words that describe the BODY. `settings.anchorComposition` is a SETTING
 * override — framing distance, backdrop, light — and must never carry any of
 * these: the pose has exactly one definition (ANCHOR_POSE) and a second copy in
 * a project's settings is how the twelve-way drift of 2026-08-13 happened.
 * A stored value that names one is not silently obeyed and not silently
 * stripped either — it is logged, loudly, every time that project renders an
 * anchor, so the divergence is visible instead of inherited.
 */
const POSE_WORDS_RE =
  /\b(arms?|shoulders?|hands?|three[- ]quarters?|facing the camera|portrait facing|standing straight|posture|crossed|folded)\b/i;

/**
 * Framing terms that merely CONTAIN a body word. `head-and-shoulders framing`
 * is a crop, not a pose, and flagging it would make the warning above fire on
 * four legitimate projects — a warning that cries wolf is a warning nobody
 * reads, which is how the arms rule sat unenforced for five days. Removed
 * before the pose test, never from the prompt itself.
 */
const FRAMING_PHRASES_RE = /\bhead[- ]and[- ]shoulders\b/gi;

/**
 * Read `project.settings.anchorComposition` — a per-project override of the
 * anchor's SETTING (framing distance + backdrop + light). It does NOT and
 * cannot override the pose; see ANCHOR_POSE.
 *
 * The pipeline defaults describe a studio character sheet on a flat grey
 * backdrop; that is the right donor while anchors feed scenes through semantic
 * channels only, but a project whose scenes consume the anchor as PIXELS
 * (settings.qwenReferenceLatents = true) wants a scene-friendlier donor — the
 * sheet's flat backdrop bleeds into every shot via reference_latents. Returns
 * null when unset so the caller falls back to the pipeline default.
 */
export function normalizeAnchorComposition(settings: unknown): string | null {
  const v = (settings as { anchorComposition?: unknown } | null | undefined)?.anchorComposition;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

/**
 * The composition clause for a project's anchors = the ONE pose + the setting.
 *
 * The pose is always ANCHOR_POSE. The setting is: explicit
 * settings.anchorComposition, else the scene-donor setting for projects that
 * consume anchors as pixels (settings.qwenReferenceLatents = true), else the
 * pipeline's studio default.
 */
function resolveAnchorComposition(
  settings: unknown,
  pipelineDefault: string,
  logger?: Logger,
  projectSlug?: string,
): string {
  const override = normalizeAnchorComposition(settings);
  if (override && POSE_WORDS_RE.test(override.replace(FRAMING_PHRASES_RE, ''))) {
    logger?.warn(
      `[${projectSlug ?? 'project'}] settings.anchorComposition describes the BODY ` +
      `("${override.slice(0, 80)}…"). The pose has one definition (ANCHOR_POSE) and this ` +
      `second copy will fight it — edit the setting down to framing/backdrop/light.`,
    );
  }
  const setting = override
    ?? (normalizeQwenReferenceLatents(settings) === true ? SCENE_DONOR_SETTING : pipelineDefault);
  return `${ANCHOR_POSE}, ${setting}`;
}

export type AnchorPipeline = 'qwen' | 'flux_comic' | 'sdxl_comic';
const ANCHOR_PIPELINES: readonly string[] = ['qwen', 'flux_comic', 'sdxl_comic'];

/**
 * Read `project.settings.anchorPipeline` — which graph draws the character
 * anchor portraits, independent of the style that renders the SCENES. Returns
 * null when unset/unrecognised so the caller falls back to the style default.
 */
export function normalizeAnchorPipeline(settings: unknown): AnchorPipeline | null {
  const v = (settings as { anchorPipeline?: unknown } | null | undefined)?.anchorPipeline;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return ANCHOR_PIPELINES.includes(s) ? (s as AnchorPipeline) : null;
}

@Injectable()
export class AnchorRenderService {
  private readonly logger = new Logger(AnchorRenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly comfy:  ComfyService,
    private readonly anchorValidation: AnchorValidationService,
    private readonly ledger: QueueLedgerService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // ENQUEUE — called by HTTP handler. Returns immediately.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a pending anchor-render job for this profile. Returns the new job
   * row immediately. PipelineQueueService will pick it up on next tick (5s
   * poll interval) and dispatch via dispatchPending().
   *
   * Idempotent-ish: if there's already a non-final job for this profile,
   * returns that existing row instead of queuing a duplicate.
   */
  async enqueue(profileId: string): Promise<any> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    if (!profile.promptBase || profile.promptBase.trim().length === 0) {
      throw new BadRequestException(
        `Profile ${profile.profileCode} has empty promptBase — fill it before generating anchor`,
      );
    }
    if (!profile.character.projectLinks[0]) {
      throw new BadRequestException(
        `Character ${profile.character.code} is not attached to any project. Attach it first.`,
      );
    }

    // Derived profile: the base anchor must be APPROVED (installed) before the
    // derived render makes sense — it is the donor image. The normal flow needs
    // no manual enqueue at all: approving the base queues this automatically
    // (enqueueDerivedChildren).
    const baseProfileId = await this.getBaseProfileId(profileId);
    if (baseProfileId) {
      const base = await this.prisma.characterProfile.findUnique({ where: { id: baseProfileId } });
      // Approval, not presence — see approveAnchor(). Before 2026-08-11 this
      // read the file off disk and called that "approved", which it never was.
      if (!base?.anchorApprovedAt || !(await this.getAnchorPath(baseProfileId))) {
        throw new BadRequestException(
          `Profile ${profile.profileCode} derives from ${base?.profileCode ?? baseProfileId}, `
          + 'which has no approved anchor yet — approve the base anchor first '
          + '(the derived render then queues automatically).',
        );
      }
    }

    // If a pending or running job already exists, return it (don't duplicate).
    const existing = await (this.prisma as any).anchorRenderJob.findFirst({
      where:   { profileId, status: { in: ['pending', 'running'] } },
      orderBy: { queuedAt: 'desc' },
    });
    if (existing) {
      this.logger.log(`Anchor enqueue for ${profile.profileCode}: returning existing ${existing.status} job ${existing.id}`);
      return existing;
    }

    const job = await (this.prisma as any).anchorRenderJob.create({
      data: { profileId, status: 'pending' },
    });
    await this.ledger.enqueue('anchor', job.id);
    this.logger.log(`Anchor enqueue: profile=${profile.profileCode} jobId=${job.id}`);
    return job;
  }

  list(profileId?: string) {
    return (this.prisma as any).anchorRenderJob.findMany({
      where:   profileId ? { profileId } : undefined,
      orderBy: { queuedAt: 'desc' },
      take:    50,
    });
  }

  async getJob(jobId: string) {
    const job = await (this.prisma as any).anchorRenderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Anchor job ${jobId} not found`);
    return job;
  }

  async cancel(jobId: string) {
    const job = await (this.prisma as any).anchorRenderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Anchor job ${jobId} not found`);
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') return job;
    await this.ledger.close('anchor', jobId, { status: 'cancelled', errorMessage: 'cancelled by user' });
    return (this.prisma as any).anchorRenderJob.update({
      where: { id: jobId },
      data:  { status: 'cancelled', completedAt: new Date(), errorMessage: 'cancelled by user' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC HOUSEKEEPING — called by PipelineQueueService.tick() (polling only;
  // dispatch order comes from the queue ledger)
  // ─────────────────────────────────────────────────────────────────────────


  /** Dispatch a pending job to ComfyUI. Sets status=running and comfyPromptId. */
  async dispatchPending(jobId: string): Promise<void> {
    const job = await (this.prisma as any).anchorRenderJob.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'pending') return;

    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: job.profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) {
      await this.failJob(jobId, `Profile ${job.profileId} no longer exists`);
      return;
    }
    const project = profile.character.projectLinks[0]?.project;
    if (!project) {
      await this.failJob(jobId, `Character ${profile.character.code} no longer attached to any project`);
      return;
    }

    const visualStyle = (project as any).visualStyle ?? 'photoreal_cinematic';
    // Anchor pipeline defaults to the one implied by the visual style, but a
    // project may pin a different one via settings.anchorPipeline. The live use
    // case: realcomic_qwen films whose SCENES render on Qwen-Image-Edit-2511
    // while their character ANCHORS render on Flux — Flux draws a cleaner,
    // more European, better-composed reference portrait, and Qwen only ever
    // needs it as an identity reference (it restyles to RealComic itself).
    const anchorPipeline = normalizeAnchorPipeline((project as any).settings)
      ?? (visualStyle === 'realcomic_qwen' ? 'qwen'
        : visualStyle === 'graphic_novel_flux' ? 'flux_comic'
        : 'sdxl_comic');

    // A profile with a base link renders as an EDIT of the base profile's
    // anchor (same person, different age/state) — its own branch, on the Qwen
    // edit graph regardless of anchorPipeline.
    const baseProfileId = await this.getBaseProfileId(profile.id);
    if (baseProfileId) {
      await this.dispatchDerived(jobId, profile, project, baseProfileId);
      return;
    }
    // Anchor workflow per pipeline. The SDXL and Flux comic graphs share the
    // node layout the patches below target (2=LoraLoader, 3/4=text, 5=latent,
    // 6=KSampler, 8=SaveImage); the Qwen graph does not (separate branch).
    const workflowFilename = anchorPipeline === 'qwen'
      ? 'gen_anchor_portrait_realcomic_qwen_api.json'
      : anchorPipeline === 'flux_comic'
        ? 'gen_anchor_portrait_flux_comic_api.json'
        : 'gen_anchor_portrait_graphic_novel_api.json';
    const workflowPath = resolveWorkflowPath(project.slug, workflowFilename);
    if (!workflowPath) {
      await this.failJob(
        jobId,
        `Anchor workflow not found at ${describeWorkflowLookup(project.slug, workflowFilename)}. `
        + `Configure a LoRA loader for visualStyle=${visualStyle}.`,
      );
      return;
    }

    let wf = JSON.parse(readFileSync(workflowPath, 'utf-8')) as Record<string, any>;

    if (anchorPipeline === 'qwen') {
      // Qwen graph: different node layout AND the text input on
      // TextEncodeQwenImageEditPlus is named `prompt`, not `text` — the generic
      // patch block below would silently write a stray `.text` key and leave
      // the real prompt as "PLACEHOLDER" (garbage anchor, no error). Delegate
      // to the shared Qwen builder instead.
      const styleLora = normalizeStyleLora((project as any).settings);
      const composition = resolveAnchorComposition((project as any).settings, QWEN_PORTRAIT_SETTING, this.logger, (project as any).slug);
      const instruction = composeQwenInstruction({
        participants:   [],
        scenePrompt:    [composition, profile.promptBase].join(', '),
        styleDirective: REALCOMIC_T2I_STYLE,
        withReferences: false,
      });
      wf = new QwenSceneGraphBuilder().build(wf as any, {
        instruction,
        negative:       (profile.negative && profile.negative.trim().length > 0) ? profile.negative : QWEN_ANCHOR_NEGATIVE,
        width:          832,
        height:         1216,
        batchSize:      ANCHOR_CANDIDATES,
        seed:           Math.floor(Math.random() * 2 ** 31),
        scheduler:      'sgm_uniform',
        filenamePrefix: `anchor_${profile.profileCode}`,
        anchors:        [],
        styleLora: {
          name:           styleLora?.name ?? 'style\\RealComic_2509_base.safetensors',
          strengthModel:  styleLora?.strengthModel ?? 1.0,
        },
      }) as Record<string, any>;
      await this.submitAndMarkRunning(jobId, profile.profileCode, wf);
      return;
    }

    // One style LoRA per PROJECT, across the whole pipeline. The anchor workflow
    // bakes Graphic_Novel in its LoraLoader (node 2); if the project picked a
    // different comic LoRA via settings.styleLora (the same override scene-render
    // applies), swap it here too — otherwise the character anchors would be drawn
    // with one comic LoRA while the scenes use another (two LoRAs in one project).
    //
    // EXCEPT when the anchor pipeline was pinned away from the project's own
    // style: settings.styleLora then belongs to the SCENE base (e.g. a Qwen
    // LoRA) and must not be loaded into a Flux LoraLoader. Such projects
    // declare settings.anchorStyleLora for the anchor graph instead.
    const pipelineMatchesStyle =
      (visualStyle === 'graphic_novel_flux'  && anchorPipeline === 'flux_comic') ||
      (visualStyle !== 'graphic_novel_flux'  && visualStyle !== 'realcomic_qwen' && anchorPipeline === 'sdxl_comic');
    const styleLora = normalizeAnchorStyleLora((project as any).settings)
      ?? (pipelineMatchesStyle ? normalizeStyleLora((project as any).settings) : null);
    const node2 = wf['2']?.inputs;
    if (styleLora && node2) {
      node2.lora_name = styleLora.name;
      // Default the comic LoRA to full strength. The Flux comic anchor template
      // ships the LoRA DISABLED (strength 0 → neutral, never realism); a project
      // setting its styleLora is what turns it on. Without this default the
      // anchor renders on the bare Flux base + "cell-shaded" text → ANIME.
      node2.strength_model = styleLora.strengthModel ?? 1.0;
      node2.strength_clip  = styleLora.strengthClip  ?? 1.0;
      this.logger.log(`Anchor ${profile.profileCode}: style LoRA override → ${styleLora.name}`);
    }

    // The Flux graph needs the western/realistic anti-anime prefix; the SDXL
    // comic prefix ("cell-shaded …") sends Flux portraits to anime.
    const stylePrefix = anchorPipeline === 'flux_comic' ? FLUX_COMIC_STYLE : STYLE_PREFIX;
    const composition = resolveAnchorComposition((project as any).settings, PORTRAIT_SETTING, this.logger, (project as any).slug);
    const positive = [stylePrefix, composition, profile.promptBase].join(', ');
    const negative = (profile.negative && profile.negative.trim().length > 0)
      ? profile.negative
      : ANCHOR_NEGATIVE;
    if (wf['3']?.inputs) wf['3'].inputs.text = positive;
    if (wf['4']?.inputs) wf['4'].inputs.text = negative;
    if (wf['6']?.inputs) wf['6'].inputs.seed = Math.floor(Math.random() * 2 ** 31);
    if (wf['8']?.inputs) wf['8'].inputs.filename_prefix = `anchor_${profile.profileCode}`;
    // Best-of-N: render a batch of candidates (node 5 EmptyLatentImage) so the
    // vision validator can pick the best clean, on-model, non-anime portrait.
    if (wf['5']?.inputs) wf['5'].inputs.batch_size = ANCHOR_CANDIDATES;

    await this.submitAndMarkRunning(jobId, profile.profileCode, wf);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED profiles — anchor inheritance (the same person, aged / changed).
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Derived-profile anchor: a Qwen-Image-Edit-2511 EDIT of the base profile's
   * installed anchor — "the same person, matching this profile's promptBase" —
   * so an age/state variant keeps the face instead of reinventing it from
   * text. Runs on the Qwen anchor graph REGARDLESS of the project's
   * anchorPipeline: editing an existing picture is exactly what 2511 is for,
   * and the donor itself carries the project's art style (referenceLatents ON,
   * no style LoRA — the dual-character-overlay recipe).
   *
   * No queue automation here by design (user 2026-08-03): the derived render
   * is enqueued at the moment the user APPROVES the base anchor (candidate
   * select / upload — see enqueueDerivedChildren), so by the time this
   * dispatches the base anchor is already on disk.
   */
  private async dispatchDerived(jobId: string, profile: any, project: any, baseProfileId: string): Promise<void> {
    const baseProfile = await this.prisma.characterProfile.findUnique({ where: { id: baseProfileId } });
    if (!baseProfile) {
      await this.failJob(jobId, `Base profile ${baseProfileId} no longer exists — clear the base link and re-render`);
      return;
    }
    const baseAnchor = await this.getAnchorPath(baseProfileId);
    if (!baseAnchor || !baseProfile.anchorApprovedAt) {
      await this.failJob(
        jobId,
        `Base profile ${baseProfile.profileCode} has no approved anchor — approve it first; `
        + 'the derived render is queued automatically on approve',
      );
      return;
    }

    const workflowFilename = 'gen_anchor_portrait_realcomic_qwen_api.json';
    const workflowPath = resolveWorkflowPath(project.slug, workflowFilename);
    if (!workflowPath) {
      await this.failJob(
        jobId,
        `Qwen anchor workflow not found at ${describeWorkflowLookup(project.slug, workflowFilename)}`,
      );
      return;
    }

    // Stage the donor into ComfyUI's input dir (LoadImage reads relative names).
    const staged = `anchor_base_${profile.profileCode}.png`;
    mkdirSync(COMFY_INPUT, { recursive: true });
    copyFileSync(baseAnchor, path.join(COMFY_INPUT, staged));

    const name = ((profile.character?.displayName ?? '') as string).trim() || profile.profileCode;
    const identity = capClauses(stripIdentityBoilerplate(profile.promptBase ?? ''), QWEN_WORD_BUDGET.identity);
    const composition = resolveAnchorComposition((project as any).settings, QWEN_PORTRAIT_SETTING, this.logger, (project as any).slug);
    // Qwen skill rules: describe the RESULT (the target identity IS the change —
    // older, bruised, richer), no negations, short. The keep-clause pins what
    // must survive the edit: facial identity — deliberately NOT age or clothes.
    const instruction = [
      `Picture 1 is ${name}.`,
      identity ? `${name} is ${identity}.` : '',
      'The same person as in the reference picture, with the same facial identity, bone structure and eye colour.',
      `${composition}.`,
      `${KEEP_REFERENCE_STYLE}.`,
    ].filter((s) => s.length > 0).join(' ');

    const wfTemplate = JSON.parse(readFileSync(workflowPath, 'utf-8')) as Record<string, any>;
    const wf = new QwenSceneGraphBuilder().build(wfTemplate as any, {
      instruction,
      negative:       (profile.negative && profile.negative.trim().length > 0) ? profile.negative : QWEN_ANCHOR_NEGATIVE,
      width:          832,
      height:         1216,
      batchSize:      ANCHOR_CANDIDATES,
      seed:           Math.floor(Math.random() * 2 ** 31),
      steps:          8,           // more room to redraw the age than Lightning's default 4
      filenamePrefix: `anchor_${profile.profileCode}`,
      anchors:        [staged],
      referenceLatents: true,      // portrait→portrait: max identity, no donor-vs-scene conflict
      // no styleLora — the donor carries the project's art style (overlay recipe)
    }) as Record<string, any>;
    await this.submitAndMarkRunning(jobId, profile.profileCode, wf);
  }

  /** `character_profiles.baseProfileId` — adopted into schema.prisma by the
   *  20260810210000_profile_base_link migration, so no more raw SQL. */
  private async getBaseProfileId(profileId: string): Promise<string | null> {
    const row = await this.prisma.characterProfile.findUnique({
      where:  { id: profileId },
      select: { baseProfileId: true },
    });
    return row?.baseProfileId ?? null;
  }

  /**
   * The approve-time trigger (user 2026-08-03: «запускать в момент апрува
   * предка»): when the user installs an anchor for a profile — by picking a
   * candidate or uploading a file — queue the anchor render for every profile
   * that DERIVES from it and has no anchor of its own yet. Chains propagate
   * one approve at a time: approving X_YOUNG queues X_MID; approving X_MID
   * queues X_OLD. Children that already have an anchor are never touched
   * (re-approving a base must not invalidate approved descendants).
   * Best-effort: a child failure must never fail the approve itself.
   */
  private async enqueueDerivedChildren(profileId: string): Promise<void> {
    const children = await this.prisma.characterProfile.findMany({
      where:  { baseProfileId: profileId },
      select: { id: true, profileCode: true },
    });
    for (const child of children) {
      try {
        if (await this.getAnchorPath(child.id) !== null) continue;
        await this.enqueue(child.id);
        this.logger.log(`Base anchor approved → queued derived anchor for ${child.profileCode}`);
      } catch (e: any) {
        this.logger.warn(`Auto-enqueue of derived anchor ${child.profileCode} failed: ${e?.message ?? e}`);
      }
    }
  }

  /** Base-link info + selectable sibling profiles for the UI dropdown.
   *  `baseAnchorReady` is what the render gate keys on: a derived profile cannot
   *  be rendered before its donor exists, so the UI disables the button with a
   *  reason instead of letting enqueue() throw on click. */
  async getBaseProfileInfo(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { profiles: true } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    const baseProfileId = profile.baseProfileId;
    const siblings = profile.character.profiles.filter((p) => p.id !== profileId);
    const options = await Promise.all(siblings.map(async (p) => ({
      id:           p.id,
      profileCode:  p.profileCode,
      ageLabel:     p.ageLabel ?? null,
      anchorExists: (await this.getAnchorPath(p.id)) !== null,
    })));
    const base = baseProfileId ? profile.character.profiles.find((p) => p.id === baseProfileId) ?? null : null;
    return {
      profileId,
      profileCode: profile.profileCode,
      baseProfileId,
      baseProfileCode: base?.profileCode ?? null,
      baseAnchorReady: baseProfileId ? (await this.getAnchorPath(baseProfileId)) !== null : true,
      options,
    };
  }

  /**
   * The whole inheritance chain of a profile's character, in story-time order —
   * what the «Состояния персонажа» block on the character page renders.
   *
   * Keyed by PROFILE id (not character id) because that is what the character
   * routes carry (`/characters/<profileId>/description`). Reports, per state:
   * age + where the age came from, the base link, whether the anchor is on disk,
   * how many shots point at it, and whether an anchor render is allowed right
   * now — the same gate `enqueue()` enforces.
   */
  async getProfileChain(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: true },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    return this.chainForCharacter(profile.characterId, profileId);
  }

  /** Same payload as getProfileChain, addressed by character. */
  async chainForCharacter(characterId: string, currentProfileId: string | null = null) {
    const character = await this.prisma.character.findUnique({
      where:   { id: characterId },
      include: {
        profiles: { include: { _count: { select: { shotParticipants: true } } } },
      },
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const plan   = buildChain(character.profiles.map((p) => ({
      id: p.id, profileCode: p.profileCode, ageLabel: p.ageLabel, baseProfileId: p.baseProfileId,
    })));
    const byId   = new Map(character.profiles.map((p) => [p.id, p]));
    const anchor = new Map<string, boolean>();
    for (const p of character.profiles) anchor.set(p.id, (await this.getAnchorPath(p.id)) !== null);
    // Donor readiness is APPROVAL, not mere presence: a derived render is a Qwen
    // edit OF the base portrait, so building a whole age chain on an image the
    // user never endorsed just propagates the mistake downwards.
    const approved = new Map<string, boolean>(
      character.profiles.map((p) => [p.id, p.anchorApprovedAt !== null]),
    );

    // Always ordered by story time (ageLabel), never by the stored links: a
    // hand-made chain that runs against the ages must LOOK wrong here — each row
    // prints its own «← от X», so an arrow pointing back up the list is the
    // signal that something needs fixing.
    const states = plan.links.map((l) => {
      const p    = byId.get(l.profile.id)!;
      const base = p.baseProfileId ? byId.get(p.baseProfileId) ?? null : null;
      const baseReady = p.baseProfileId ? (approved.get(p.baseProfileId) ?? false) : true;
      return {
        profileId:       p.id,
        profileCode:     p.profileCode,
        ageLabel:        p.ageLabel ?? null,
        age:             l.age,
        ageSource:       l.source,
        baseProfileId:   p.baseProfileId,
        baseProfileCode: base?.profileCode ?? null,
        anchorExists:    anchor.get(p.id) ?? false,
        /** Anchor on disk AND signed off by the user. Shots render only on these. */
        anchorApproved:  approved.get(p.id) ?? false,
        shotCount:       p._count.shotParticipants,
        loraReady:       !!p.loraPath,
        /** Proposed link if the chain were rebuilt from ageLabel now. */
        suggestedBaseProfileId:   l.baseProfileId,
        suggestedBaseProfileCode: l.baseProfileId ? byId.get(l.baseProfileId)?.profileCode ?? null : null,
        /** Anchor render allowed right now? The donor must be installed first. */
        canRenderAnchor: baseReady,
        blockedReason:   baseReady ? null
          : `сначала утвердите якорь ${base?.profileCode ?? 'базового профиля'}`,
      };
    });

    return {
      characterId,
      characterCode: character.code,
      displayName:   character.displayName,
      currentProfileId,
      /** True when every non-root state already derives from the previous one. */
      chainLinked: states.length < 2 ? true : states.every((s, i) => (i === 0
        ? s.baseProfileId === null
        : s.baseProfileId === states[i - 1].profileId)),
      states,
      warnings: plan.warnings,
    };
  }

  /**
   * Link a character's profiles into an age-ordered inheritance chain
   * (`X_KID → X_YOUNG → X_MID → X_OLD`) — the step that was missing from
   * project seeding and left all 376 profiles unlinked.
   *
   * `dryRun` returns the plan without writing. `overwrite: false` (default)
   * only fills links that are still null, so a hand-tuned chain is never
   * clobbered; `true` rewrites the whole chain from ageLabel.
   *
   * Links ONLY — nothing is rendered or invalidated here. Existing anchors stay
   * exactly as they are; a derived render happens later, when the user approves
   * a base anchor for a descendant that has none.
   */
  async linkChainForCharacter(
    characterId: string,
    opts: { dryRun?: boolean; overwrite?: boolean } = {},
  ) {
    const dryRun    = opts.dryRun    ?? false;
    const overwrite = opts.overwrite ?? false;

    const character = await this.prisma.character.findUnique({
      where:   { id: characterId },
      include: { profiles: true },
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const plan  = buildChain(character.profiles.map((p) => ({
      id: p.id, profileCode: p.profileCode, ageLabel: p.ageLabel, baseProfileId: p.baseProfileId,
    })));
    const byId  = new Map(character.profiles.map((p) => [p.id, p]));
    const codeOf = (id: string | null) => (id ? byId.get(id)?.profileCode ?? id : '—');

    const warnings = [...plan.warnings];
    // The graph as it would stand after each accepted change, so a partial
    // relink cannot close a loop (see wouldCycle — `A → B → A` would make every
    // approve queue the other state forever).
    const resulting = new Map(character.profiles.map((p) => [p.id, p.baseProfileId]));

    const changes: Array<{
      profileId: string; profileCode: string; from: string; to: string; baseProfileId: string | null;
    }> = [];
    for (const l of plan.links) {
      if (!l.changed) continue;
      // Without overwrite, an existing link is the user's decision — leave it.
      if (!overwrite && l.profile.baseProfileId !== null) continue;
      resulting.set(l.profile.id, l.baseProfileId);
      if (wouldCycle(l.profile.id, resulting)) {
        resulting.set(l.profile.id, l.profile.baseProfileId);
        warnings.push(
          `${l.profile.profileCode}: связь «← ${codeOf(l.baseProfileId)}» пропущена — замкнула бы цикл `
          + 'с уже проставленной вручную связью; поправьте руками',
        );
        continue;
      }
      changes.push({
        profileId:     l.profile.id,
        profileCode:   l.profile.profileCode,
        from:          codeOf(l.profile.baseProfileId),
        to:            codeOf(l.baseProfileId),
        baseProfileId: l.baseProfileId,
      });
    }

    if (!dryRun) {
      for (const c of changes) {
        await this.prisma.characterProfile.update({
          where: { id: c.profileId },
          data:  { baseProfileId: c.baseProfileId },
        });
      }
      if (changes.length > 0) {
        this.logger.log(
          `Chain linked for ${character.code}: `
          + changes.map((c) => `${c.profileCode} ← ${c.to}`).join(', '),
        );
      }
    }

    return {
      characterId,
      characterCode: character.code,
      dryRun,
      overwrite,
      /** Story-time order the chain was built in, for the report. */
      order:    plan.links.map((l) => `${l.profile.profileCode}${l.age !== null ? ` [${l.age}]` : ''}`),
      changes,
      warnings,
    };
  }

  /**
   * Backfill: run linkChainForCharacter over every character that has more than
   * one profile. Defaults to a dry run — 70 characters is exactly the scale
   * where you want to read the plan (and its warnings) before writing.
   */
  async linkAllChains(opts: { dryRun?: boolean; overwrite?: boolean } = {}) {
    const dryRun    = opts.dryRun    ?? true;
    const overwrite = opts.overwrite ?? false;

    const characters = await this.prisma.character.findMany({
      where:   { profiles: { some: {} } },
      include: { profiles: { select: { id: true } }, project: { select: { slug: true } } },
      orderBy: { code: 'asc' },
    });
    const multi = characters.filter((c) => c.profiles.length > 1);

    const results = [];
    for (const c of multi) {
      const r = await this.linkChainForCharacter(c.id, { dryRun, overwrite });
      if (r.changes.length === 0 && r.warnings.length === 0) continue;
      results.push({ projectSlug: c.project?.slug ?? null, ...r });
    }
    const linkedCount = results.reduce((n, r) => n + r.changes.length, 0);
    this.logger.log(
      `Chain backfill${dryRun ? ' (dry run)' : ''}: ${linkedCount} link(s) across `
      + `${results.length} of ${multi.length} multi-profile characters`,
    );
    return {
      dryRun,
      overwrite,
      charactersScanned:  multi.length,
      charactersAffected: results.length,
      linksTotal:         linkedCount,
      results,
    };
  }

  /** Set/clear the base-profile link. Same character only, no self, no cycles. */
  async setBaseProfile(profileId: string, baseProfileId: string | null) {
    const profile = await this.prisma.characterProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    if (baseProfileId !== null) {
      if (baseProfileId === profileId) throw new BadRequestException('A profile cannot derive from itself');
      const base = await this.prisma.characterProfile.findUnique({ where: { id: baseProfileId } });
      if (!base) throw new NotFoundException(`Base profile ${baseProfileId} not found`);
      if (base.characterId !== profile.characterId) {
        throw new BadRequestException('Base profile must belong to the same character (same person, different state)');
      }
      // No cycles: walking up from the proposed base must never reach us.
      let cursor: string | null = baseProfileId;
      for (let hops = 0; cursor && hops < 20; hops++) {
        if (cursor === profileId) throw new BadRequestException('Cycle: that profile already derives from this one');
        cursor = await this.getBaseProfileId(cursor);
      }
    }
    await this.prisma.characterProfile.update({
      where: { id: profileId },
      data:  { baseProfileId },
    });
    this.logger.log(`Base profile for ${profile.profileCode}: ${baseProfileId ?? 'cleared'}`);
    return this.getBaseProfileInfo(profileId);
  }

  /** Submit the assembled anchor workflow to ComfyUI and mark the job running.
   *  Fails the job (does not throw) when ComfyUI is unreachable. */
  private async submitAndMarkRunning(jobId: string, profileCode: string, wf: Record<string, any>): Promise<void> {
    let promptId: string;
    try {
      ({ promptId } = await this.comfy.queuePrompt(wf));
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const hint = (msg.includes('fetch failed') || msg.includes('ECONNREFUSED'))
        ? 'ComfyUI is not reachable on http://127.0.0.1:8188 — start it and retry. '
        : '';
      await this.failJob(jobId, hint + msg);
      return;
    }

    await (this.prisma as any).anchorRenderJob.update({
      where: { id: jobId },
      data:  { status: 'running', comfyPromptId: promptId, startedAt: new Date() },
    });
    await this.ledger.attachPrompt('anchor', jobId, promptId);
    this.logger.log(`Anchor dispatch: jobId=${jobId} profile=${profileCode} → promptId=${promptId}`);
  }

  /** Poll ComfyUI for any running anchor jobs; mark done/failed and copy file. */
  async pollRunning(): Promise<void> {
    const running = await (this.prisma as any).anchorRenderJob.findMany({ where: { status: 'running' } });
    for (const j of running) {
      if (!j.comfyPromptId) continue;
      const h = await this.comfy.getHistory(j.comfyPromptId).catch(() => null);
      if (!h || !h.status?.completed) continue;

      if (h.status.status_str !== 'success') {
        await this.failJob(j.id, `ComfyUI status: ${h.status.status_str}`);
        continue;
      }

      // Copy ALL candidate portraits into the per-profile candidates dir; the
      // anchor-validation job then scores them, rejects anime, and installs the
      // best clean on-model portrait as <profileCode>_anchor.png.
      try {
        const outputs = h.outputs as Record<string, { images?: Array<{ filename: string }> }>;
        const imgs    = (outputs?.['8']?.images ?? []).filter((im) => im?.filename);
        if (imgs.length === 0) {
          await this.failJob(j.id, 'ComfyUI marked success but produced no images');
          continue;
        }
        const profile = await this.prisma.characterProfile.findUnique({
          where:   { id: j.profileId },
          include: { character: { include: { projectLinks: { include: { project: true } } } } },
        });
        const project = profile?.character.projectLinks[0]?.project;
        if (!profile || !project) {
          await this.failJob(j.id, 'Profile or attached project disappeared mid-render');
          continue;
        }
        // ACCUMULATE candidates — a re-render adds to the pool, never wipes it
        // (user 2026-08-03: «догенеривать, а не перезатирать существующие»).
        // ComfyUI filename counters can restart if its output dir was cleaned,
        // so a colliding name gets a timestamp prefix instead of overwriting.
        const candDir = anchorCandidateDir(project.slug, profile.profileCode);
        mkdirSync(candDir, { recursive: true });
        const candidates: string[] = [];
        for (const im of imgs) {
          const src = path.join(COMFY_OUTPUT, im.filename);
          if (!existsSync(src)) continue;
          const destName = existsSync(path.join(candDir, im.filename))
            ? `${Date.now()}_${im.filename}`
            : im.filename;
          copyFileSync(src, path.join(candDir, destName));
          candidates.push(destName);
        }
        if (candidates.length === 0) {
          await this.failJob(j.id, `ComfyUI outputs not found under ${COMFY_OUTPUT}`);
          continue;
        }
        await (this.prisma as any).anchorRenderJob.update({
          where: { id: j.id },
          data:  { status: 'completed', outputPath: candDir, completedAt: new Date() },
        });
        await this.ledger.close('anchor', j.id, { status: 'completed', outputFilename: candDir });
        // Queue neural validation (runs later in the single-slot pipeline, ComfyUI
        // off). Best-effort: a failure here must NOT fail the render — the
        // candidates are on disk and can be re-validated manually.
        try {
          await this.anchorValidation.enqueue(profile.id, candidates, profile.promptBase ?? null);
        } catch (e: any) {
          this.logger.warn(`anchor validation enqueue failed for ${profile.profileCode}: ${e?.message ?? e}`);
        }
        this.logger.log(`Anchor render completed: jobId=${j.id} profile=${profile.profileCode} → ${candidates.length} candidate(s), queued validation`);
      } catch (e: any) {
        await this.failJob(j.id, e?.message ?? String(e));
      }
    }
  }

  private async failJob(jobId: string, msg: string) {
    await (this.prisma as any).anchorRenderJob.update({
      where: { id: jobId },
      data:  { status: 'failed', errorMessage: msg, completedAt: new Date() },
    });
    await this.ledger.close('anchor', jobId, { status: 'failed', errorMessage: msg });
    this.logger.warn(`Anchor failed: jobId=${jobId} — ${msg}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPLOAD path (non-queue) — file already exists on user's disk.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Delete the anchor PNG for this profile across ALL attached projects (the
   * same PNG can be re-used across multiple cartoon projects, so we wipe each
   * potential copy). Returns the list of deleted file paths. No-op if nothing
   * exists on disk.
   */
  async deleteAnchor(profileId: string): Promise<string[]> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    const deleted: string[] = [];
    for (const link of profile.character.projectLinks) {
      const p = path.join(APP_ROOT, 'data', link.project.slug, 'reference', `${profile.profileCode}_anchor.png`);
      if (existsSync(p)) {
        try {
          unlinkSync(p);
          deleted.push(p);
        } catch (e: any) {
          this.logger.warn(`Failed to delete anchor ${p}: ${e?.message ?? e}`);
        }
      }
    }
    // The approval described the file that just went away. Whatever gets
    // installed next starts unapproved, exactly like a first-time render.
    await this.clearApproval(profileId);
    if (deleted.length > 0) {
      this.logger.log(`Deleted anchor PNGs for ${profile.profileCode}: ${deleted.join(', ')}`);
    }
    return deleted;
  }

  async uploadAnchor(profileId: string, buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Empty file buffer');
    }
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    const project = profile.character.projectLinks[0]?.project;
    if (!project) {
      throw new BadRequestException(`Character ${profile.character.code} is not attached to any project. Attach it first.`);
    }
    const destDir  = path.join(APP_ROOT, 'data', project.slug, 'reference');
    const destPath = path.join(destDir, `${profile.profileCode}_anchor.png`);
    mkdirSync(destDir, { recursive: true });
    writeFileSync(destPath, buffer);
    this.logger.log(`Uploaded anchor for ${profile.profileCode} → ${destPath} (${buffer.length} bytes)`);
    // An upload is an approve too — the user hand-picked this exact file.
    await this.approveAnchor(profileId);
    return destPath;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CANDIDATE gallery + manual anchor selection.
  //
  // Anchor render produces ANCHOR_CANDIDATES portraits per job (best-of-N);
  // the vision validator installs its pick automatically, but the final say is
  // the user's: the UI lists every candidate with its verdict and lets the
  // user install ANY of them as the anchor. "Which one is currently the
  // anchor" is computed by content hash (the installed anchor.png is a byte
  // copy of one candidate), so no schema change is needed and manual uploads
  // (which match no candidate) simply show no selection highlight.
  // ─────────────────────────────────────────────────────────────────────────

  private async profileWithProject(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);
    const project = profile.character.projectLinks[0]?.project;
    if (!project) {
      throw new BadRequestException(`Character ${profile.character.code} is not attached to any project. Attach it first.`);
    }
    return { profile, project };
  }

  private md5(file: string): string {
    return createHash('md5').update(readFileSync(file)).digest('hex');
  }

  /**
   * Candidate portraits on disk + the latest validation verdicts, merged per
   * filename. `selected` marks the candidate whose bytes are the currently
   * installed anchor.png; `chosenByAI` marks the validator's own pick.
   */
  async listCandidates(profileId: string) {
    const { profile, project } = await this.profileWithProject(profileId);
    const candDir = anchorCandidateDir(project.slug, profile.profileCode);
    const files = existsSync(candDir)
      ? readdirSync(candDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()
      : [];

    const valJobs = await (this.prisma as any).anchorValidationJob.findMany({
      where:   { profileId },
      orderBy: { queuedAt: 'desc' },
      take:    20,
    });
    const lastCompleted = valJobs.find((v: any) => v.status === 'completed') ?? null;
    const valActive     = valJobs.some((v: any) => v.status === 'pending' || v.status === 'running');
    // Candidates accumulate across renders and each validation pass scores only
    // its own batch — so verdicts must merge across ALL completed passes
    // (newest verdict wins per filename), or older batches would show unscored.
    const verdicts = new Map<string, any>();
    for (const j of valJobs) {
      if (j.status !== 'completed') continue;
      for (const v of (Array.isArray(j.result) ? j.result : [])) {
        if (v?.filename && !verdicts.has(v.filename)) verdicts.set(v.filename, v);
      }
    }

    const anchorPath = await this.getAnchorPath(profileId);
    const anchorHash = anchorPath ? this.md5(anchorPath) : null;

    const candidates = files.map((f) => {
      const full = path.join(candDir, f);
      const st   = statSync(full);
      return {
        filename:   f,
        size:       st.size,
        mtime:      st.mtimeMs,
        verdict:    verdicts.get(f) ?? null,
        chosenByAI: lastCompleted?.chosenFilename === f,
        selected:   anchorHash !== null && this.md5(full) === anchorHash,
      };
    });

    return {
      profileId,
      profileCode:      profile.profileCode,
      anchorExists:     anchorPath !== null,
      /** true when the installed anchor matches none of the candidates (manual upload / older render) */
      anchorIsExternal: anchorPath !== null && candidates.every((c) => !c.selected),
      validationActive: valActive,
      validation: lastCompleted ? {
        jobId:           lastCompleted.id,
        completedAt:     lastCompleted.completedAt,
        chosenFilename:  lastCompleted.chosenFilename ?? null,
        suggestedPrompt: lastCompleted.suggestedPrompt ?? null,
      } : null,
      candidates,
    };
  }

  /** Absolute path of one candidate file, with traversal protection. */
  async getCandidatePath(profileId: string, filename: string): Promise<string> {
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new BadRequestException('bad filename');
    }
    const { profile, project } = await this.profileWithProject(profileId);
    const full = path.join(anchorCandidateDir(project.slug, profile.profileCode), filename);
    if (!existsSync(full)) throw new NotFoundException(`Candidate ${filename} not found for ${profile.profileCode}`);
    return full;
  }

  /**
   * Manually install one candidate as the profile's anchor.png — the user's
   * override of (or agreement with) the validator's pick.
   */
  async selectCandidate(profileId: string, filename: string): Promise<{ anchorPath: string }> {
    const src = await this.getCandidatePath(profileId, filename);
    const { profile, project } = await this.profileWithProject(profileId);
    const destDir  = path.join(APP_ROOT, 'data', project.slug, 'reference');
    const destPath = path.join(destDir, `${profile.profileCode}_anchor.png`);
    mkdirSync(destDir, { recursive: true });
    copyFileSync(src, destPath);
    this.logger.log(`Anchor manually selected for ${profile.profileCode}: ${filename} → ${destPath}`);
    // Picking a candidate IS the approve — the user looked at the gallery and
    // chose this portrait.
    await this.approveAnchor(profileId);
    return { anchorPath: destPath };
  }

  /**
   * Mark the currently-installed anchor as approved by the user.
   *
   * This is the state that did not exist before 2026-08-11: the validator (and,
   * for props, plain "first file wins") installs an anchor automatically the
   * moment a render finishes, so the presence of an anchor.png never meant a
   * human had seen it. Scene rendering now refuses to run on an unapproved
   * anchor, and /actions surfaces `approve_anchor` until this is called.
   *
   * Approving is also what unblocks the inheritance chain — a derived profile's
   * render is a Qwen edit of its base's anchor, so the base must be one the user
   * actually endorsed before descendants are built on top of it.
   */
  async approveAnchor(profileId: string): Promise<{ approvedAt: Date }> {
    const anchor = await this.getAnchorPath(profileId);
    if (!anchor) {
      throw new BadRequestException(
        'No anchor portrait installed for this profile — generate or upload one before approving.',
      );
    }
    const approvedAt = new Date();
    await this.prisma.characterProfile.update({
      where: { id: profileId },
      data:  { anchorApprovedAt: approvedAt },
    });
    await this.enqueueDerivedChildren(profileId);
    return { approvedAt };
  }

  /** Withdraw approval — used when a new render replaces the installed image,
   *  and when the anchor is deleted outright. Approval always refers to the
   *  exact portrait on disk, so a replacement must never inherit it. */
  private async clearApproval(profileId: string): Promise<void> {
    await this.prisma.characterProfile.update({
      where: { id: profileId },
      data:  { anchorApprovedAt: null },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUERY helpers used by controllers + style-readiness endpoint.
  // ─────────────────────────────────────────────────────────────────────────

  /** Anchor PNG path on disk, or null if no anchor generated yet. */
  async getAnchorPath(profileId: string): Promise<string | null> {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) return null;
    for (const link of profile.character.projectLinks) {
      const p = path.join(APP_ROOT, 'data', link.project.slug, 'reference', `${profile.profileCode}_anchor.png`);
      if (existsSync(p)) return p;
    }
    return null;
  }

  async getStyleReadiness(profileId: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where:   { id: profileId },
      include: { character: { include: { projectLinks: { include: { project: true } } } } },
    });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const styles = await this.prisma.$queryRaw<Array<{
      id: string; displayName: string; identityStack: string; loraPipeline: string;
    }>>`SELECT id, "displayName", "identityStack", "loraPipeline" FROM visual_styles ORDER BY "createdAt" ASC`;

    const anchorPath = await this.getAnchorPath(profileId);
    const hasLora    = !!profile.loraPath && profile.loraPath.trim().length > 0;

    const readiness: Record<string, {
      ready: boolean; identityStack: string; loraPipeline: string;
      assets: Record<string, string | null>;
    }> = {};
    for (const s of styles) {
      const isLoraStack   = s.identityStack === 'lora_face_lock';
      const isAnchorStack = s.identityStack === 'ip_adapter_only' || s.identityStack === 'ip_adapter_plus_style_lora';
      // For anchor stacks "ready" means APPROVED, not merely present: an
      // unapproved anchor is refused by the render service, so calling it ready
      // would promise something the pipeline then rejects.
      const ready         = isLoraStack ? hasLora
        : isAnchorStack ? (anchorPath !== null && profile.anchorApprovedAt !== null)
        : false;
      readiness[s.id] = {
        ready,
        identityStack: s.identityStack,
        loraPipeline:  s.loraPipeline,
        assets: {
          loraPath:   isLoraStack   ? (profile.loraPath ?? null) : null,
          anchorPath: isAnchorStack ? anchorPath               : null,
        },
      };
    }

    return {
      profileId:     profile.id,
      profileCode:   profile.profileCode,
      characterCode: profile.character.code,
      /** When the user signed off on the installed anchor; null = waiting. */
      anchorApprovedAt: profile.anchorApprovedAt,
      attachedProjects: profile.character.projectLinks.map((l) => ({
        slug:        l.project.slug,
        visualStyle: (l.project as any).visualStyle ?? 'photoreal_cinematic',
      })),
      styles: readiness,
    };
  }
}
