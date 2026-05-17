import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { existsSync, statSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetService } from '../training/dataset.service';

@ApiTags('Projects')
@Controller('projects/:idOrSlug')
export class ProjectsDashboardController {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly dataset: DatasetService,
  ) {}

  /**
   * Aggregated state for the project dashboard frontend.
   * Returns every profile with: dataset image count, lora readiness,
   * latest dataset/training job statuses. One call powers the whole grid.
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Aggregated profile readiness for the project dashboard' })
  async dashboard(@Param('idOrSlug') idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        characters: {
          include: {
            profiles: {
              include: {
                datasetJobs:  { orderBy: { queuedAt:  'desc' }, take: 1 },
                trainingJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

    const profiles = project.characters.flatMap((c) =>
      c.profiles.map((p) => {
        const images       = this.dataset.listImages(p.profileCode);
        const lastDsJob    = p.datasetJobs[0]    ?? null;
        const lastTrainJob = p.trainingJobs[0]   ?? null;
        const loraReady    = !!p.loraPath && existsSync(p.loraPath);

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
      }),
    );

    return {
      project: { id: project.id, slug: project.slug, name: project.name },
      profiles,
    };
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
              },
            },
          },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

    return {
      project: { id: project.id, slug: project.slug, name: project.name },
      scenes: project.scenes.map((s) => ({
        id:              s.id,
        sceneKey:        s.sceneKey,
        title:           s.title,
        sortOrder:       s.sortOrder,
        narrationText:   s.narrationText   ?? null,
        scriptStartLine: s.scriptStartLine ?? null,
        scriptEndLine:   s.scriptEndLine   ?? null,
        shots: s.shots.map((sh) => {
          const pf = (sh.promptFields ?? {}) as {
            narrativeBeat?: string;
            location?:      { label?: string };
          };
          const renders = (sh.renderedImages as Array<{ filename: string }> | null) ?? [];

          // Resolve which profile (LoRA) is going to be used per-participant.
          const participants = sh.participants.map((p) => {
            // Explicit profile (chosen by user) → use it.
            // Else fallback to the character's first profile with a trained LoRA.
            const explicit = p.profile;
            const fallback = p.character?.profiles?.find((pp) => pp.loraPath && pp.triggerToken) ?? null;
            const used     = explicit ?? fallback;
            return {
              id:           p.id,
              label:        p.label,
              characterId:  p.characterId,
              characterCode:        p.character?.code        ?? null,
              characterDisplayName: p.character?.displayName ?? null,
              profileId:            used?.id          ?? null,
              profileCode:          used?.profileCode ?? null,
              profileAgeLabel:      used?.ageLabel    ?? null,
              loraReady:            !!(used?.loraPath && used?.triggerToken),
              chosenExplicitly:     !!explicit,
            };
          });

          const job = (sh as any).renderJobs?.[0] ?? null;
          const cameraFraming = (pf as any).camera?.framing ?? null;

          // Video state — mirrors chosenRender semantics for the animation pass.
          const videos = ((sh as any).videoRenders ?? []) as Array<{
            id: string; status: string; outputFilename: string | null;
            upscaleStatus: string | null; upscaledFilename: string | null;
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

          return {
            cameraFraming,
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
                }
              : null,
            pipelineVideo: inflightVideo
              ? { id: inflightVideo.id, status: inflightVideo.status, queuedAt: inflightVideo.queuedAt }
              : null,
            pipelineUpscale: inflightUpscale
              ? { id: inflightUpscale.id, status: inflightUpscale.upscaleStatus as string }
              : null,
          };
        }),
      })),
    };
  }
}
