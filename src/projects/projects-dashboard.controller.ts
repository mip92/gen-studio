import { BadRequestException, Body, Controller, Get, Logger, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { existsSync, statSync } from 'fs';
import * as path from 'path';
import { anchorExistsForProfile, anchorSlugCandidates } from '../characters/anchor-fs.util';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetService } from '../training/dataset.service';
import { probeWavDurationMs } from '../tts/wav-duration';
import { ProjectStatsService } from './project-stats.service';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

class SetScriptBody {
  @IsOptional() @IsString()
  text?: string;
}


@ApiTags('Projects')
@Controller('projects/:idOrSlug')
export class ProjectsDashboardController {
  private readonly logger = new Logger(ProjectsDashboardController.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly dataset: DatasetService,
    private readonly ledgerStats: ProjectStatsService,
  ) {}

  /**
   * Aggregated state for the project dashboard frontend.
   * Returns every profile with: dataset image count, lora readiness,
   * latest dataset/training job statuses. One call powers the whole grid.
   *
   * Also returns `identity` — which identity asset this project's visual style
   * actually uses. Without it the overview showed "LoRA готовы 0 / N" forever
   * for anchor-driven styles (realcomic_qwen, graphic_novel_*), whose profiles
   * have no `loraPath` by design: 39 of 42 films train no per-character LoRA at
   * all (user 2026-08-10 «мы должны отображать только то что используем»).
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Aggregated profile readiness for the project dashboard' })
  async dashboard(@Param('idOrSlug') idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

    const identity = await this.identityFor((project as { visualStyle?: string | null }).visualStyle);

    // Fetch characters attached via EITHER legacy `Character.projectId` OR the
    // Phase 1 `ProjectCharacter` M:N join. Without the OR clause library
    // characters (projectId=null, only attached via projectLinks) silently
    // disappear from the dashboard — that's how PAX_STU was counted as
    // "9/9 LoRAs ready" instead of "9/10".
    const characters = await this.prisma.character.findMany({
      where: {
        OR: [
          { projectId: project.id },
          { projectLinks: { some: { projectId: project.id } } },
        ],
      },
      include: {
        profiles: {
          include: {
            datasetJobs:  { orderBy: { queuedAt:  'desc' }, take: 1 },
            trainingJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        // A cameo character's anchor PNG lives under its HOME project's slug and
        // is reused everywhere, so the probe below must look under every slug the
        // character is attached to — same rule as ActionsService's generate_anchor
        // gate and AnchorRenderService.getAnchorPath.
        project:      { select: { slug: true } },
        projectLinks: { select: { project: { select: { slug: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const profiles = characters.flatMap((c) => {
      const anchorSlugs = anchorSlugCandidates(project.slug, c);
      return c.profiles.map((p) => {
        const images       = this.dataset.listImages(p.profileCode);
        const lastDsJob    = p.datasetJobs[0]    ?? null;
        const lastTrainJob = p.trainingJobs[0]   ?? null;
        const loraReady    = !!p.loraPath && existsSync(p.loraPath);
        const anchorReady  = anchorExistsForProfile(anchorSlugs, p.profileCode);

        let phase: 'idle' | 'queued' | 'generating' | 'has_dataset' | 'training' | 'ready' = 'idle';
        if (loraReady)                                        phase = 'ready';
        else if (lastTrainJob && lastTrainJob.status === 'training')   phase = 'training';
        else if (lastTrainJob && lastTrainJob.status === 'preparing')  phase = 'training';
        else if (lastTrainJob && lastTrainJob.status === 'captioning') phase = 'training';
        else if (lastDsJob && (lastDsJob.status === 'pending' || lastDsJob.status === 'blocked')) phase = 'queued';
        else if (lastDsJob && lastDsJob.status === 'running')          phase = 'generating';
        else if (images.length > 0)                                    phase = 'has_dataset';

        return {
          profileId:     p.id,
          characterId:   c.id,
          characterCode: c.code,
          displayName:   c.displayName,
          profileCode:   p.profileCode,
          ageLabel:      p.ageLabel,
          targetImages:  p.targetImages,
          triggerToken:  p.triggerToken,
          datasetCount:  images.length,
          loraReady,
          anchorReady,
          loraPath:      p.loraPath,
          loraSizeMB:    loraReady ? Math.round(statSync(p.loraPath!).size / 1_000_000) : null,
          phase,
          lastDatasetJob: lastDsJob && {
            id: lastDsJob.id, status: lastDsJob.status,
            dependsOnProfileId: lastDsJob.dependsOnProfileId,
            referenceProfileId: lastDsJob.referenceProfileId,
            error: lastDsJob.errorMessage,
            queuedAt: lastDsJob.queuedAt,
          },
          lastTrainingJob: lastTrainJob && {
            id: lastTrainJob.id, status: lastTrainJob.status,
            error: lastTrainJob.errorMessage,
            startedAt: lastTrainJob.startedAt,
            completedAt: lastTrainJob.completedAt,
          },
        };
      });
    });

    return {
      project: { id: project.id, slug: project.slug, name: project.name },
      identity,
      profiles,
    };
  }

  /**
   * What identity asset the project's visual style actually consumes, read from
   * the `visual_styles` registry (the same source AnchorRenderService's
   * style-readiness endpoint uses — NOT the ad-hoc
   * `visualStyle !== 'photoreal_cinematic'` test scattered elsewhere).
   *
   *   kind: 'lora'   → per-character LoRA is trained and required
   *   kind: 'anchor' → identity comes from an approved anchor portrait
   *
   * Unknown/absent style falls back to 'photoreal_cinematic' semantics, which is
   * what every caller in this codebase assumes for a null visualStyle.
   */
  private async identityFor(visualStyle?: string | null): Promise<{
    visualStyle:   string;
    identityStack: string;
    loraPipeline:  string;
    kind:          'lora' | 'anchor';
  }> {
    const styleId = visualStyle ?? 'photoreal_cinematic';
    const rows = await this.prisma.$queryRaw<Array<{
      id: string; identityStack: string; loraPipeline: string;
    }>>`SELECT id, "identityStack", "loraPipeline" FROM visual_styles WHERE id = ${styleId}`;
    const row = rows[0];
    if (!row) {
      return {
        visualStyle:   styleId,
        identityStack: 'lora_face_lock',
        loraPipeline:  'character_lora_florence2',
        kind:          'lora',
      };
    }
    return {
      visualStyle:   row.id,
      identityStack: row.identityStack,
      loraPipeline:  row.loraPipeline,
      kind:          this.identityKind(row.identityStack),
    };
  }

  /**
   * Which asset pins a character's identity, per `visual_styles.identityStack`.
   *
   * Only the face-lock stack uses a trained per-character LoRA; the IP-Adapter
   * stacks use an approved anchor portrait. Note `loraPipeline:
   * 'style_lora_dataset'` is a STYLE LoRA — not per character — so those styles
   * are anchor-driven here too.
   *
   * An unrecognised stack is listed explicitly rather than falling through to
   * 'anchor': the registry is meant to grow (pixar_3d, soviet_animation… — see
   * docs/VISUAL_STYLE_ARCHITECTURE.md), and a silent default would point the
   * overview's click-through at the wrong /actions gate for a whole film.
   */
  private identityKind(stack: string): 'lora' | 'anchor' {
    if (stack === 'lora_face_lock') return 'lora';
    if (stack === 'ip_adapter_only' || stack === 'ip_adapter_plus_style_lora') return 'anchor';
    // Unknown stack: assume the anchor path, which is what every style added
    // since photoreal_cinematic has used — but say so in the log, because the
    // real fix is to teach this method the new value.
    this.logger.warn(`Unknown visual_styles.identityStack "${stack}" — assuming anchor identity`);
    return 'anchor';
  }

  /**
   * Returns the project's full narration script (Markdown) for the TTS modal's
   * reference panel. Source of truth: Project.scriptText column in the DB.
   * Returns { text } (or { text: null } if not authored yet).
   *
   * Route note: this class is mounted at `@Controller('projects/:idOrSlug')`,
   * so the @Get path must NOT repeat `:idOrSlug` — just `script` resolves to
   * `/projects/:idOrSlug/script`.
   */
  @Get('script')
  @ApiOperation({ summary: 'Read the project narration script from the DB' })
  async script(@Param('idOrSlug') idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where:  { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { scriptText: true, slug: true },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    return { text: project.scriptText ?? null };
  }

  @Patch('script')
  @ApiOperation({
    summary: 'Write the project narration script (Project.scriptText)',
    description: 'Pass `{text: "..."}` to overwrite. Empty string clears the field. '
              + 'Replaces the previous "only SQL works" workaround.',
  })
  async setScript(
    @Param('idOrSlug') idOrSlug: string,
    @Body() body: SetScriptBody,
  ) {
    if (typeof body?.text !== 'string') {
      throw new BadRequestException('Body must be {text: string}.');
    }
    const project = await this.prisma.project.findFirst({
      where:  { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);
    const updated = await this.prisma.project.update({
      where:  { id: project.id },
      data:   { scriptText: body.text.length === 0 ? null : body.text },
      select: { scriptText: true },
    });
    return { text: updated.scriptText ?? null };
  }

  /**
   * Per-project pipeline statistics for the Overview page.
   *
   * Everything comes from the queue ledger, which holds one record per attempt
   * for every job type and survives the deletion of the shot, scene or project
   * the work belonged to: real time spent, split into what reached the final cut
   * and what didn't, the defect rate per stage, and the two remaining-time
   * forecasts.
   *
   * This replaced a set of hand-rolled per-type AVERAGES plus a "deleted images"
   * figure estimated as `completed renders × an assumed batch size of 5`. Both
   * are now measured rather than guessed, so the estimates were removed instead
   * of being shown next to the real numbers.
   */
  @Get('stats')
  @ApiOperation({ summary: 'Time spent, useful vs wasted, and remaining-time forecast' })
  async stats(@Param('idOrSlug') idOrSlug: string) {
    return this.ledgerStats.forProject(idOrSlug);
  }

  /**
   * Lightweight scenes + shots list for the project overview/scenes pages.
   * Returns scene order, beat summaries from shot.promptFields.narrativeBeat,
   * and which characters appear in each shot.
   */
  @Get('scenes')
  @ApiOperation({ summary: 'Scenes + shots with per-participant profile/LoRA status and render previews' })
  async scenes(@Param('idOrSlug') idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where:   { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        scenes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            shots: {
              orderBy: { shotCode: 'asc' },
              include: {
                participants: {
                  include: {
                    character: { include: { profiles: true } },
                    profile:   true,
                  },
                },
                // Most recent NON-terminal scene render job per shot — used by
                // the scenes UI to badge "in queue" / "rendering" using our
                // pipeline state (not raw ComfyUI queue, which loses pending).
                renderJobs: {
                  where:   { status: { in: ['pending', 'running'] } },
                  orderBy: { queuedAt: 'desc' },
                  take:    1,
                },
                // All videos for the shot — used to count, find the chosen one,
                // and badge in-flight video renders / upscales in the scenes UI.
                videoRenders: {
                  orderBy: { queuedAt: 'desc' },
                },
                // Per-shot TTS jobs — used to surface "N ready to approve"
                // counts and the latest in-flight status on the scenes list.
                ttsJobs: {
                  orderBy: { queuedAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

    // Collected lazily — any approved TTS job whose row didn't yet have a
    // durationMs gets probed below; we persist all of them in parallel right
    // before returning so the next /scenes call reads precomputed values.
    const ttsDurationBackfills: Array<{ jobId: string; durationMs: number }> = [];

    // Project.visualStyle drives whether participants need a trained LoRA
    // (photoreal pipeline) or just promptBase+triggerToken (cartoon / anchor
    // pipeline). Exposed in the response so the frontend can label gating
    // states correctly. Default keeps legacy projects on photoreal.
    //
    // Deliberately still the ad-hoc test, not `identityFor()` above: this decides
    // per-participant RENDER readiness (promptBase + triggerToken present), which
    // is a looser question than «is there an approved anchor» that the dashboard
    // counter asks. Switching it would change which shots the acts list shows as
    // renderable across every project — a separate call, not a side effect of the
    // overview fix (2026-08-10).
    const visualStyle: string = (project as { visualStyle?: string }).visualStyle ?? 'photoreal_cinematic';
    const isCartoon = visualStyle !== 'photoreal_cinematic';

    // Comic panel shapes (template-layout mode) — $queryRaw because the column
    // may predate the generated Prisma client (documented repo pattern). One
    // query for the whole project; empty map on legacy projects.
    const shapeRows = await this.prisma.$queryRaw<Array<{ id: string; shape: string | null }>>`
      SELECT id, "comicPanelShape" AS shape FROM shots
      WHERE "projectId" = ${project.id} AND "comicPanelShape" IS NOT NULL
    `;
    const panelShapeByShot = new Map(shapeRows.map((r) => [r.id, r.shape]));

    const response = {
      project: { id: project.id, slug: project.slug, name: project.name, visualStyle },
      scenes: project.scenes.map((s) => ({
        id:              s.id,
        sceneKey:        s.sceneKey,
        title:           s.title,
        sortOrder:       s.sortOrder,
        narrationText:    s.narrationText    ?? null,
        approvedTTSJobId: s.approvedTTSJobId ?? null,
        scriptStartLine:  s.scriptStartLine  ?? null,
        scriptEndLine:    s.scriptEndLine    ?? null,
        // Act-level i2v flow override; null = the act follows the project. The
        // scenes page renders it as a per-act select.
        defaultVideoFlow: (s as any).defaultVideoFlow ?? null,
        shots: s.shots.map((sh) => {
          const pf = (sh.promptFields ?? {}) as {
            narrativeBeat?: string;
            location?:      { label?: string };
          };
          const renders = (sh.renderedImages as Array<{ filename: string }> | null) ?? [];

          // Resolve which profile is going to be used per-participant.
          // Photoreal: needs a trained LoRA (loraPath) + triggerToken.
          // Cartoon: identity comes from promptBase + triggerToken (anchor PNG
          // is optional unless the workflow wires IP-Adapter). The same
          // `loraReady` field name carries the "identity ready" semantic for
          // both styles — frontend gating reads it as "render is allowed".
          const participants = sh.participants.map((p) => {
            // Explicit profile (chosen by user) → use it.
            // Else fallback: cartoon picks any profile with promptBase+triggerToken;
            // photoreal picks the first profile with a trained LoRA.
            const explicit = p.profile;
            const fallback = isCartoon
              ? (p.character?.profiles?.find((pp) => pp.promptBase && pp.triggerToken) ?? null)
              : (p.character?.profiles?.find((pp) => pp.loraPath  && pp.triggerToken) ?? null);
            const used     = explicit ?? fallback;
            const ready = isCartoon
              ? !!(used?.promptBase && used?.triggerToken)
              : !!(used?.loraPath   && used?.triggerToken);
            return {
              id:           p.id,
              label:        p.label,
              characterId:  p.characterId,
              characterCode:        p.character?.code        ?? null,
              characterDisplayName: p.character?.displayName ?? null,
              profileId:            used?.id          ?? null,
              profileCode:          used?.profileCode ?? null,
              profileAgeLabel:      used?.ageLabel    ?? null,
              loraReady:            ready,
              chosenExplicitly:     !!explicit,
            };
          });

          const job = (sh as any).renderJobs?.[0] ?? null;
          const cameraFraming = (pf as any).camera?.framing ?? null;

          // Video state — mirrors chosenRender semantics for the animation pass.
          const videos = ((sh as any).videoRenders ?? []) as Array<{
            id: string; status: string; outputFilename: string | null;
            upscaleStatus: string | null; upscaledFilename: string | null;
            interpStatus: string | null; interpFilename: string | null;
            queuedAt: Date;
          }>;
          const chosenVideo = sh.chosenVideoId
            ? videos.find((v) => v.id === sh.chosenVideoId) ?? null
            : null;
          // Oldest pending|running video render — for "⚙ видео рендерится" badge.
          const inflightVideo = [...videos]
            .reverse()
            .find((v) => v.status === 'pending' || v.status === 'running') ?? null;
          // Pending|running upscale (limited to the chosen video — that's the
          // only one the UI surfaces an upscale button for).
          const inflightUpscale = chosenVideo
            && (chosenVideo.upscaleStatus === 'pending' || chosenVideo.upscaleStatus === 'running')
            ? chosenVideo
            : null;
          // Pending|running FPS interpolation on the chosen video.
          const inflightInterp = chosenVideo
            && (chosenVideo.interpStatus === 'pending' || chosenVideo.interpStatus === 'running')
            ? chosenVideo
            : null;

          return {
            cameraFraming,
            /** Comic panel shape (template-layout plan), null on legacy shots. */
            comicPanelShape:      panelShapeByShot.get(sh.id) ?? null,
            id:                   sh.id,
            shotCode:             sh.shotCode,
            beat:                 pf.narrativeBeat   ?? null,
            location:             pf.location?.label ?? null,
            participants,
            rendersCount:         renders.length,
            chosenRender:         sh.chosenRender ?? null,
            activeRenderPromptId: sh.activeRenderPromptId ?? null,
            /**
             * Status of the most recent pending|running scene job. UI uses this
             * to badge "в очереди" / "рендерится" using our pipeline truth
             * (covers pending which never lands in raw ComfyUI queue).
             */
            pipelineRender: job
              ? { id: job.id as string, status: job.status as string, queuedAt: job.queuedAt as Date }
              : null,
            // ── Video state (mirrors photo flow) ────────────────────────────
            videosCount:   videos.length,
            chosenVideoId: sh.chosenVideoId ?? null,
            chosenVideo: chosenVideo
              ? {
                  id:               chosenVideo.id,
                  outputFilename:   chosenVideo.outputFilename,
                  upscaleStatus:    chosenVideo.upscaleStatus,
                  upscaledFilename: chosenVideo.upscaledFilename,
                  interpStatus:     chosenVideo.interpStatus,
                  interpFilename:   chosenVideo.interpFilename,
                }
              : null,
            pipelineVideo: inflightVideo
              ? { id: inflightVideo.id, status: inflightVideo.status, queuedAt: inflightVideo.queuedAt }
              : null,
            pipelineUpscale: inflightUpscale
              ? { id: inflightUpscale.id, status: inflightUpscale.upscaleStatus as string }
              : null,
            pipelineInterp: inflightInterp
              ? { id: inflightInterp.id, status: inflightInterp.interpStatus as string }
              : null,
            // ── End frame (two-frame / flf2v flow) ──────────────────────────
            // The RESOLVED flow, not the shot's own column: the act list is
            // where you look to see what a shot will actually render as, and
            // the override usually lives a level or two up.
            videoFlow: ((sh as any).videoFlow
              ?? (s as any).defaultVideoFlow
              ?? (project as any).defaultVideoFlow
              ?? 'i2v') as string,
            endFrame: {
              hasPrompt:  (((sh as any).endFramePrompt ?? '').trim().length > 0),
              candidates: Array.isArray((sh as any).endFrameRenders) ? (sh as any).endFrameRenders.length : 0,
              chosen:     ((sh as any).chosenEndFrame ?? null) as string | null,
              approved:   ((sh as any).endFrameApprovedAt ?? null) !== null,
            },
            // ── Per-shot narration (shot-level TTS) ─────────────────────────
            narrationText:    (sh as any).narrationText    ?? null,
            approvedTTSJobId: (sh as any).approvedTTSJobId ?? null,
            ...(() => {
              const jobs = ((sh as any).ttsJobs ?? []) as Array<{
                id: string; status: string; queuedAt: Date;
                outputFilename: string | null; durationMs: number | null;
              }>;
              const approvedId = (sh as any).approvedTTSJobId as string | null;
              // Sort by queuedAt desc — latest first.
              const sorted = [...jobs].sort((a, b) => b.queuedAt.getTime() - a.queuedAt.getTime());
              const latestNonTerminal = sorted.find((j) => j.status === 'pending' || j.status === 'running');
              const completedUnapproved = sorted.filter((j) => j.status === 'completed' && j.id !== approvedId);
              const latestCompletedUnapprovedId = completedUnapproved[0]?.id ?? null;

              // Exact wav length for the approved narration. If the row already
              // has durationMs we use it; otherwise probe the file once now
              // and queue a DB backfill so subsequent loads are O(1).
              let approvedTTSDurationMs: number | null = null;
              const approved = approvedId ? jobs.find((j) => j.id === approvedId) : null;
              if (approved && approved.status === 'completed' && approved.outputFilename) {
                if (approved.durationMs != null) {
                  approvedTTSDurationMs = approved.durationMs;
                } else {
                  const wavPath = path.join(
                    APP_ROOT, 'data', project.slug, 'shots', sh.shotCode, approved.outputFilename,
                  );
                  const ms = probeWavDurationMs(wavPath);
                  if (ms != null) {
                    approvedTTSDurationMs = ms;
                    ttsDurationBackfills.push({ jobId: approved.id, durationMs: ms });
                  }
                }
              }
              return {
                ttsLatestStatus:     latestNonTerminal?.status ?? null,
                ttsCompletedUnapproved: completedUnapproved.length,
                /** id of the most recent completed-but-not-approved TTSJob — the
                 *  candidate the "✓ утвердить" quick button approves. */
                ttsLatestCompletedUnapprovedId: latestCompletedUnapprovedId,
                /** Exact duration of the approved narration wav (probed once,
                 *  persisted to tts_jobs.durationMs). Null when nothing approved
                 *  or the wav can't be probed. */
                approvedTTSDurationMs,
              };
            })(),
          };
        }),
      })),
    };

    if (ttsDurationBackfills.length > 0) {
      // Fire-and-forget would be fine, but awaiting lets the next request see
      // populated rows immediately. The set is tiny (one row per approved-but-
      // unprobed shot in the scene) so the write storm is bounded.
      await Promise.all(
        ttsDurationBackfills.map((b) =>
          this.prisma.tTSJob.update({
            where: { id: b.jobId },
            data:  { durationMs: b.durationMs },
          }),
        ),
      );
    }
    return response;
  }
}
