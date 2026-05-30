import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { existsSync, statSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetService } from '../training/dataset.service';
import { probeWavDurationMs } from '../tts/wav-duration';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

class SetScriptBody {
  @IsOptional() @IsString()
  text?: string;
}

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
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

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
      },
      orderBy: { createdAt: 'asc' },
    });

    const profiles = characters.flatMap((c) =>
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
   * Per-project pipeline statistics for the Overview page. Computes average
   * wall-clock time for every job type (scene render, video i2v, video upscale,
   * TTS, BGM, dataset, training), plus the count of completed jobs, the
   * estimated regeneration count (shots with > 1 completed scene render),
   * and the estimated number of generated images that have since been
   * deleted from `Shot.renderedImages`.
   */
  @Get('stats')
  @ApiOperation({ summary: 'Pipeline timing + waste statistics for the Overview page' })
  async stats(@Param('idOrSlug') idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where:  { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true, slug: true, name: true },
    });
    if (!project) throw new NotFoundException(`Project "${idOrSlug}" not found`);

    // Average wall-clock seconds for a job table, filtered to this project's
    // shots/profiles. `started` and `completed` are the column names that
    // bound the timing window; some tables (VideoRender.upscale*) use
    // different columns.
    const avgPair = async <
      T extends Record<string, any>,
    >(rows: T[], started: keyof T, completed: keyof T) => {
      let sumMs = 0; let n = 0;
      for (const r of rows) {
        const s = r[started] as Date | null | undefined;
        const c = r[completed] as Date | null | undefined;
        if (!s || !c) continue;
        const delta = (c as Date).getTime() - (s as Date).getTime();
        if (delta < 0) continue;
        sumMs += delta; n++;
      }
      return { count: n, avgSeconds: n > 0 ? Math.round(sumMs / n / 1000) : null };
    };

    // ── Scene render (SDXL) ──────────────────────────────────────────────
    const sceneRows = await this.prisma.sceneRenderJob.findMany({
      where:  { shot: { projectId: project.id }, status: 'completed' },
      select: { id: true, shotId: true, startedAt: true, completedAt: true },
    });
    const sceneStats = await avgPair(sceneRows, 'startedAt', 'completedAt');

    // Regeneration: shots with more than one completed scene render.
    const perShotCounts = new Map<string, number>();
    for (const r of sceneRows) perShotCounts.set(r.shotId, (perShotCounts.get(r.shotId) ?? 0) + 1);
    const shotsRegenerated = [...perShotCounts.values()].filter((n) => n > 1).length;
    const totalRegenerations = [...perShotCounts.values()].reduce((sum, n) => sum + Math.max(0, n - 1), 0);

    // Deleted images: each completed scene render produces ~5 images (default
    // batchSize). Compare to images currently in renderedImages arrays.
    // Inaccurate when batchSize was customised — best-effort estimate.
    const shots = await this.prisma.shot.findMany({
      where:  { projectId: project.id },
      select: { id: true, renderedImages: true },
    });
    let currentImages = 0;
    for (const s of shots) {
      const arr = (s.renderedImages as Array<unknown> | null) ?? [];
      currentImages += Array.isArray(arr) ? arr.length : 0;
    }
    const generatedEstimate = sceneRows.length * 5;
    const deletedEstimate   = Math.max(0, generatedEstimate - currentImages);

    // ── Video i2v (Wan2.2) ───────────────────────────────────────────────
    const videoRows = await this.prisma.videoRender.findMany({
      where:  { shot: { projectId: project.id }, status: 'completed' },
      select: { startedAt: true, completedAt: true, upscaleStartedAt: true, upscaleCompletedAt: true, upscaleStatus: true },
    });
    const videoStats = await avgPair(videoRows, 'startedAt', 'completedAt');
    const upscaleRows = videoRows.filter((r) => r.upscaleStatus === 'completed');
    const upscaleStats = await avgPair(upscaleRows, 'upscaleStartedAt', 'upscaleCompletedAt');

    // ── TTS ──────────────────────────────────────────────────────────────
    // Owner: either scene or shot, both FK to project chains. Filter by
    // either-or so scene-level and shot-level TTS are both counted.
    const ttsRows = await this.prisma.tTSJob.findMany({
      where: {
        status: 'completed',
        OR: [
          { shot:  { projectId: project.id } },
          { scene: { projectId: project.id } },
        ],
      },
      select: { startedAt: true, completedAt: true },
    });
    const ttsStats = await avgPair(ttsRows, 'startedAt', 'completedAt');

    // ── BGM (ACE-Step via AudioRenderJob) ───────────────────────────────
    const bgmRows = await this.prisma.audioRenderJob.findMany({
      where: {
        status: 'completed',
        segment: { block: { projectId: project.id } },
      },
      select: { startedAt: true, completedAt: true },
    });
    const bgmStats = await avgPair(bgmRows, 'startedAt', 'completedAt');

    // ── Dataset generation ──────────────────────────────────────────────
    // DatasetJob FKs to CharacterProfile → Character. Character belongs to
    // the project via legacy Character.projectId OR ProjectCharacter join.
    const datasetRows = await this.prisma.datasetJob.findMany({
      where: {
        status: 'completed',
        profile: {
          character: {
            OR: [
              { projectId: project.id },
              { projectLinks: { some: { projectId: project.id } } },
            ],
          },
        },
      },
      select: { startedAt: true, completedAt: true },
    });
    const datasetStats = await avgPair(datasetRows, 'startedAt', 'completedAt');

    // ── LoRA training ────────────────────────────────────────────────────
    const trainingRows = await this.prisma.trainingJob.findMany({
      where: {
        status: 'completed',
        profile: {
          character: {
            OR: [
              { projectId: project.id },
              { projectLinks: { some: { projectId: project.id } } },
            ],
          },
        },
      },
      select: { startedAt: true, completedAt: true },
    });
    const trainingStats = await avgPair(trainingRows, 'startedAt', 'completedAt');

    return {
      project,
      sceneRender:   sceneStats,
      videoRender:   videoStats,
      videoUpscale:  upscaleStats,
      tts:           ttsStats,
      bgm:           bgmStats,
      dataset:       datasetStats,
      training:      trainingStats,
      waste: {
        currentImages,
        estimatedGenerated: generatedEstimate,
        estimatedDeleted:   deletedEstimate,
        shotsRegenerated,
        totalRegenerations,
      },
    };
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
    const visualStyle: string = (project as { visualStyle?: string }).visualStyle ?? 'photoreal_cinematic';
    const isCartoon = visualStyle !== 'photoreal_cinematic';

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
