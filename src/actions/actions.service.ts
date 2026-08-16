import { Injectable } from '@nestjs/common';
import { existsSync, readdirSync } from 'fs';
import * as path from 'path';
import { anchorExistsForProfile, anchorSlugCandidates } from '../characters/anchor-fs.util';
import { PrismaService } from '../prisma/prisma.service';
import { isVoiceCloneEngine } from '../tts/tts.service';
import { voGateBlocksApprove } from '../validation/vo-validation-gate';

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');
const REF_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

/**
 * Reference upload happens to disk (not the reference_assets table). Check
 * both legacy and library FS layouts to decide whether gate 1 has been done.
 *   Project-bound: data/<slug>/reference/<profileCode>/reference.<ext>
 *   Library:       data/_characters/<charCode>/<profileCode>/reference/reference.<ext>
 */
function hasReferenceOnDisk(
  project: { slug: string },
  character: { code: string; projectId: string | null },
  profile: { profileCode: string },
): boolean {
  const dirs = [
    path.join(APP_ROOT, 'data', project.slug, 'reference', profile.profileCode),
    path.join(APP_ROOT, 'data', '_characters', character.code, profile.profileCode, 'reference'),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    try {
      for (const f of readdirSync(dir)) {
        if (path.parse(f).name === 'reference' && REF_EXTS.has(path.extname(f).toLowerCase())) {
          return true;
        }
      }
    } catch { /* ignore */ }
  }
  return false;
}

/* The anchor probe (`anchorSlugCandidates` / `anchorExistsForProfile`) moved to
 * ../characters/anchor-fs.util on 2026-08-10 — the project dashboard needs the
 * same answer for its «Якоря готовы» counter, and two copies could disagree
 * about the same profile. The old copy here also defaulted APP_ROOT to
 * `E:\ComfyUI\gen-studio`, a path that has not been live for a long time; the
 * shared helper derives it the same way as the rest of this file. */

/**
 * Actions page — "what is waiting for the user to act on right now?"
 *
 * 8 gates across the pipeline, evaluated in linear order so each character /
 * shot appears at most once with its current bottleneck. The frontend renders
 * the list; the user clicks "Open" (always) and/or "Run" (gates 2 / 3 / 8).
 *
 *  Per character profile:
 *    1. upload_dataset_images — profile has 0 reference images
 *    2. start_dataset         — has ≥1 ref but no dataset job (or all failed)
 *    3. start_training        — has completed dataset but no LoRA yet
 *
 *  Per shot:
 *    4. render_scene   — no chosenRender, LoRA-ready or not needed
 *    5. approve_render — has rendered images but chosenRender is null
 *    6. create_video   — chosenRender set, no chosenVideoId
 *    7. approve_video  — has completed VideoRender(s) but no chosenVideoId
 *    8. upscale_video  — chosenVideoId set, upscaleStatus is null|failed
 *
 *  Profiles with useIpAdapter=true skip gates 1–3 entirely (no LoRA needed).
 *  Shots whose required LoRA is not ready don't surface gate 4 — the bottleneck
 *  shows up under the character's gates 1/2/3 instead.
 */

export type Gate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type GateKey =
  | 'upload_dataset_images'
  | 'start_dataset'
  | 'start_training'
  | 'generate_anchor'
  | 'approve_anchor'
  | 'generate_prop_anchor'
  | 'approve_prop_anchor'
  | 'render_scene'
  | 'approve_render'
  // Both live at gate 6 alongside create_video: an end frame is an INPUT to the
  // clip, not a stage after it. (Gate numbers are stages, not keys — 9 and 10
  // already carry two keys each.)
  | 'render_end_frame'
  | 'approve_end_frame'
  | 'create_video'
  | 'approve_video'
  | 'upscale_video'
  | 'interpolate_video'
  | 'render_tts'
  | 'approve_tts'
  | 'render_bgm'
  | 'approve_bgm';

export interface ActionItem {
  gate:    Gate;
  gateKey: GateKey;
  project: { id: string; slug: string; name: string };
  // Character-scoped (gates 1–3)
  character?: { id: string; code: string; displayName: string | null };
  profile?:   { id: string; code: string };
  // Prop-scoped (generate_prop_anchor) — objects are their own entity, not a
  // CharacterProfile, so they need their own slot here.
  prop?:      { id: string; code: string; name: string };
  // Shot- or scene-scoped (gates 4–8, 9 shot-tts)
  scene?:     { id: string; sceneKey: string; title: string | null };
  shot?:      { id: string; code: string };
  // Segment-scoped (gate 10 BGM approval)
  segment?:   {
    id:          string;
    sortOrder:   number;
    durationSec: number;
    prompt:      string | null;
    block:       { id: string; slug: string; title: string | null };
  };
  // For UI:
  link:   string;
  action?: {
    method: 'POST' | 'PATCH';
    path:   string;
    /** Free-form body for the action POST/PATCH. Omitted = empty body. */
    body?:  Record<string, unknown>;
  };
}

// Non-terminal statuses across the various job tables that mean "in flight"
// — used to decide whether a gate is already being acted on. Mirrors the lists
// in PipelineController so gate behavior matches queue semantics.
const DATASET_INFLIGHT_OR_DONE = ['pending', 'blocked', 'running', 'completed'] as const;
const TRAINING_INFLIGHT_OR_DONE = ['pending', 'preparing', 'captioning', 'training', 'completed'] as const;
const SCENE_INFLIGHT = ['pending', 'running'] as const;
const VIDEO_INFLIGHT = ['pending', 'running'] as const;
const UPSCALE_INFLIGHT_OR_DONE = ['pending', 'running', 'completed'] as const;

@Injectable()
export class ActionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listActions(projectSlug?: string): Promise<ActionItem[]> {
    // Fetch projects (one or all). Each project carries its own character set
    // (via Character.projectId OR ProjectCharacter join) and its own shots.
    const projects = await this.prisma.project.findMany({
      where:   projectSlug ? { slug: projectSlug } : undefined,
      orderBy: { name: 'asc' },
    });

    const items: ActionItem[] = [];
    for (const project of projects) {
      // A project with a published YouTube link is DONE — the deliverable
      // already shipped. Skip every pipeline gate (render/upscale/FPS/TTS/BGM)
      // so /actions doesn't nag about steps on a finished video.
      if ((project as { youtubeUrl?: string | null }).youtubeUrl) continue;
      await this.collectCharacterGates(project, items);
      await this.collectPropGates(project, items);
      await this.collectShotGates(project, items);
      // TTS + BGM gates are independent of the visual pipeline — a shot can
      // legitimately need both `approve_render` and `approve_tts` at the same
      // time. We collect them in a separate pass so they coexist with the
      // single-gate-per-shot logic above instead of being swallowed by its
      // `continue` chain.
      await this.collectTtsGates(project, items);
      await this.collectBgmGates(project, items);
    }
    return items;
  }

  // ── Gates 1–3 (per character profile) ────────────────────────────────────

  private async collectCharacterGates(
    project: { id: string; slug: string; name: string },
    out: ActionItem[],
  ): Promise<void> {
    // Cartoon projects (visualStyle != 'photoreal_cinematic') don't need
    // dataset / training. Their identity stack is IP-Adapter on a single
    // anchor PNG, so gates 1-3 are replaced by a single gate: generate_anchor.
    const projectFull = await this.prisma.project.findUnique({
      where: { id: project.id },
      select: { id: true, slug: true, name: true, visualStyle: true },
    });
    const visualStyle: string = (projectFull as any)?.visualStyle ?? 'photoreal_cinematic';
    const isCartoonProject = visualStyle !== 'photoreal_cinematic';

    // Both legacy (Character.projectId) and library (ProjectCharacter join)
    // attachments contribute. Distinct characters per project.
    const characters = await this.prisma.character.findMany({
      where: {
        OR: [
          { projectId: project.id },
          { projectLinks: { some: { projectId: project.id } } },
        ],
      },
      include: {
        profiles: { orderBy: { profileCode: 'asc' } },
        // Cameo characters carry their anchor under their HOME project's slug,
        // not this project's — pull every attached slug so the anchor probe
        // below can look there too (mirrors AnchorRenderService.getAnchorPath).
        project:      { select: { slug: true } },
        projectLinks: { select: { project: { select: { slug: true } } } },
      },
      orderBy: { code: 'asc' },
    });

    for (const character of characters) {
      for (const profile of character.profiles) {
        // ── Cartoon path: one gate "generate_anchor" if anchor PNG missing. ──
        if (isCartoonProject) {
          const anchorSlugs = anchorSlugCandidates(project.slug, character);
          if (anchorExistsForProfile(anchorSlugs, profile.profileCode)) {
            // The anchor is on disk but nobody signed off on it — the validator
            // installs its own pick the moment a render lands, so this is the
            // first time a human is asked. Shots with this character do not
            // render until it is answered.
            if (!profile.anchorApprovedAt) {
              out.push(this.charItem(1, 'approve_anchor', project, character, profile, {
                link: `/characters/${profile.id}/reference`,
                action: { method: 'POST', path: `/profiles/${profile.id}/anchor/approve`, body: {} },
              }));
            }
            continue;
          }
          {
            // Don't queue a duplicate generate_anchor gate if a render job is
            // already pending/running for this profile.
            const inflight = await (this.prisma as any).anchorRenderJob.count({
              where: { profileId: profile.id, status: { in: ['pending', 'running'] } },
            });
            if (inflight === 0) {
              out.push(this.charItem(1, 'generate_anchor', project, character, profile, {
                link: `/characters/${profile.id}/reference`,
                action: { method: 'POST', path: `/profiles/${profile.id}/generate-anchor`, body: {} },
              }));
            }
          }
          continue;  // skip photoreal gates entirely for cartoon profiles
        }

        // ── Photoreal path: original gates 1-3. ──
        // useIpAdapter profiles never need LoRA training, so gates 1–3 are
        // irrelevant for them. Same for profiles whose LoRA is already trained —
        // they've already passed every dataset/training gate by definition.
        if (profile.useIpAdapter) continue;
        if (profile.loraPath)     continue;

        // Reference is uploaded to disk (not reference_assets) — check both
        // legacy data/<slug>/reference/<profileCode>/ and library
        // data/_characters/<charCode>/<profileCode>/reference/ paths. Also
        // count the legacy reference_assets table for projects that used it.
        const refCountDb = await this.prisma.referenceAsset.count({
          where: {
            OR: [
              { characterId: character.id, profileCode: profile.profileCode },
              { projectId:   project.id,    profileCode: profile.profileCode },
            ],
          },
        });
        const refOnDisk = hasReferenceOnDisk(project, character, profile);

        // Gate 1 — upload images
        if (refCountDb === 0 && !refOnDisk) {
          out.push(this.charItem(1, 'upload_dataset_images', project, character, profile, {
            link: `/characters/${profile.id}/reference`,
          }));
          continue;
        }

        // Gate 2 — start dataset. Only if there is no non-failed/cancelled job.
        const datasetExists = await this.prisma.datasetJob.count({
          where: { profileId: profile.id, status: { in: [...DATASET_INFLIGHT_OR_DONE] } },
        });
        if (datasetExists === 0) {
          out.push(this.charItem(2, 'start_dataset', project, character, profile, {
            link: `/characters/${profile.id}/dataset`,
            action: { method: 'POST', path: `/dataset-queue/profiles/${profile.id}/enqueue`, body: {} },
          }));
          continue;
        }

        // Gate 3 — start training. Only if completed dataset exists AND no LoRA AND no in-flight training.
        if (profile.loraPath) continue; // already trained
        const completedDataset = await this.prisma.datasetJob.count({
          where: { profileId: profile.id, status: 'completed' },
        });
        if (completedDataset === 0) continue;

        const trainingExists = await this.prisma.trainingJob.count({
          where: { profileId: profile.id, status: { in: [...TRAINING_INFLIGHT_OR_DONE] } },
        });
        if (trainingExists > 0) continue;

        out.push(this.charItem(3, 'start_training', project, character, profile, {
          link: `/characters/${profile.id}/training`,
          action: { method: 'POST', path: `/training/profiles/${profile.id}/start`, body: {} },
        }));
      }
    }
  }

  // ── Gates 4–8 (per shot) ─────────────────────────────────────────────────

  private async collectShotGates(
    project: { id: string; slug: string; name: string },
    out: ActionItem[],
  ): Promise<void> {
    const shots = await this.prisma.shot.findMany({
      where: { projectId: project.id },
      include: {
        scene:        { select: { id: true, sceneKey: true, title: true, sortOrder: true } },
        participants: { include: { profile: { select: {
          id: true, profileCode: true, loraPath: true, useIpAdapter: true,
          promptBase: true, triggerToken: true, anchorApprovedAt: true,
          // Anchor may live under a cameo's home project — carry every slug.
          character: { select: {
            project:      { select: { slug: true } },
            projectLinks: { select: { project: { select: { slug: true } } } },
          } },
        } } } },
        renderJobs:   { select: { id: true, status: true, completedAt: true } },
        videoRenders: {
          select: {
            id: true, status: true, outputFilename: true,
            upscaleStatus: true, interpStatus: true,
          },
          // Stable order so gate 7 can point at the NEWEST completed take.
          orderBy: { queuedAt: 'asc' },
        },
        // In-flight image-validation → the LLM is still reviewing this shot's
        // candidates; we suppress its render/approve gates until it finishes.
        validationJobs: { select: { status: true } },
      },
      orderBy: [{ scene: { sortOrder: 'asc' } }, { shotCode: 'asc' } ],
    });

    // Cartoon shots need the character's anchor PNG before a scene render is
    // useful — without it the IP-Adapter has no face to lock and the render
    // hallucinates identity. So gate 4 (render_scene) is withheld until the
    // anchor exists; the bottleneck then surfaces under the character's
    // generate_anchor gate instead. Photoreal projects ignore this (LoRA-gated).
    const projForStyle = await this.prisma.project.findUnique({
      where: { id: project.id }, select: { visualStyle: true },
    });
    const isCartoonProject = ((projForStyle?.visualStyle ?? 'photoreal_cinematic') !== 'photoreal_cinematic');

    // Shots whose story OBJECT has no approved anchor. A prop-hero shot renders
    // the object as its subject, and an unapproved (or absent) object anchor
    // means the renderer invents it — the exact drift props exist to prevent.
    // Same treatment as an unapproved character anchor: withhold gate 4, and
    // let the bottleneck show under the prop's own gate instead.
    // Raw SQL: Shot.propId is a bare scalar in the schema, with no Prisma
    // relation to filter through.
    const propBlocked = new Set(
      (await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT s.id
          FROM shots s
          JOIN props p ON p.id = s."propId"
         WHERE s."projectId" = ${project.id}
           AND p."anchorApprovedAt" IS NULL
      `).map((r) => r.id),
    );

    // Shots on the two-frame (flf2v) flow that still owe an end frame, and how
    // far along each is. Raw SQL for two reasons: the flow is an inheritance
    // chain across three tables (shot → act → project) that Prisma cannot
    // express in one include, and these columns can predate the generated
    // client on a backend that has not re-run `prisma generate`.
    //
    // Shots with an EMPTY endFramePrompt are deliberately absent: on those the
    // flow degrades to one-frame rendering by design (user 2026-08-15), so
    // gating them would stall a clip that is allowed to be made.
    const endFrameState = new Map<string, { hasCandidates: boolean; approved: boolean }>();
    for (const row of await this.prisma.$queryRaw<Array<{
      id: string; hasCandidates: boolean; approved: boolean;
    }>>`
      SELECT sh.id,
             COALESCE(jsonb_array_length(sh."endFrameRenders"), 0) > 0 AS "hasCandidates",
             sh."endFrameApprovedAt" IS NOT NULL                      AS "approved"
        FROM shots sh
        JOIN scenes   sc ON sc.id = sh."sceneId"
        JOIN projects p  ON p.id  = sh."projectId"
       WHERE sh."projectId" = ${project.id}
         AND sh."renderMode" <> 'static'
         AND COALESCE(sh."videoFlow", sc."defaultVideoFlow", p."defaultVideoFlow") = 'flf2v'
         AND COALESCE(NULLIF(btrim(sh."endFramePrompt"), ''), NULL) IS NOT NULL
    `) {
      endFrameState.set(row.id, { hasCandidates: row.hasCandidates, approved: row.approved });
    }
    // An end-frame job already queued or running — the same suppression every
    // other gate applies, so a refresh mid-render does not offer the work twice.
    const endFrameInFlight = new Set(
      (await this.prisma.$queryRaw<Array<{ shotId: string }>>`
        SELECT DISTINCT j."shotId"
          FROM end_frame_jobs j
          JOIN shots s ON s.id = j."shotId"
         WHERE s."projectId" = ${project.id}
           AND j.status IN ('pending', 'running')
      `).map((r) => r.shotId),
    );

    for (const shot of shots) {
      const scene = shot.scene
        ? { id: shot.scene.id, sceneKey: shot.scene.sceneKey, title: shot.scene.title }
        : undefined;

      // Gate 4 — render scene. No chosenRender, no in-flight render, LoRA-ready (or not needed).
      if (!shot.chosenRender) {
        // Suppress render/approve gates while the vision model is still reviewing
        // this shot's candidates — it will auto-pick the best or clear + suggest a
        // new prompt. No point asking the user to act mid-review.
        const validationInFlight = ((shot as any).validationJobs ?? []).some(
          (v: any) => v.status === 'pending' || v.status === 'running',
        );
        if (validationInFlight) continue;

        const renderInFlight = shot.renderJobs.some((j) => (SCENE_INFLIGHT as readonly string[]).includes(j.status));
        const hasCompletedRender = shot.renderJobs.some((j) => j.status === 'completed');
        const hasRenderedImages = Array.isArray(shot.renderedImages) && shot.renderedImages.length > 0;

        // Gate 5 takes priority over 4 when there are already renders to pick from.
        if ((hasCompletedRender || hasRenderedImages) && !renderInFlight) {
          out.push(this.shotItem(5, 'approve_render', project, shot, scene, {
            link: `/projects/${project.id}/shots/${shot.id}/render`,
          }));
          continue;
        }

        if (!renderInFlight && !propBlocked.has(shot.id)
            && this.identityReady(shot.participants, isCartoonProject)
            && this.anchorsReadyForShot(shot.participants, project.slug, isCartoonProject)) {
          out.push(this.shotItem(4, 'render_scene', project, shot, scene, {
            link: `/projects/${project.id}/shots/${shot.id}/render`,
          }));
        }
        continue; // either rendered/skipped — nothing else applies until chosenRender is set
      }

      // From here: chosenRender is set.
      // Static shots ship the still PNG only — no Wan video, no upscale. Skip
      // ALL video gates (create/approve/upscale) so neither the /actions page
      // nor the Telegram bot (both read this same gate list) ever offer video
      // generation for a shot the user marked renderMode='static'. The chosen
      // render PNG is the finished deliverable for these shots.
      if (shot.renderMode === 'static') continue;

      // Gate 6 — end frame, for shots on the two-frame flow. Comes BEFORE
      // create_video because the end frame is one of the clip's two inputs:
      // offering the clip first would spend the GPU on a one-frame render of a
      // shot that was configured for two.
      const endFrame = endFrameState.get(shot.id);
      if (endFrame && !shot.chosenVideoId && !endFrameInFlight.has(shot.id)) {
        if (!endFrame.hasCandidates) {
          out.push(this.shotItem(6, 'render_end_frame', project, shot, scene, {
            link:   `/projects/${project.id}/shots/${shot.id}/end-frame`,
            action: { method: 'POST', path: `/generation/shots/${shot.id}/end-frames` },
          }));
          continue;
        }
        if (!endFrame.approved) {
          out.push(this.shotItem(6, 'approve_end_frame', project, shot, scene, {
            link: `/projects/${project.id}/shots/${shot.id}/end-frame`,
          }));
          continue;
        }
      }

      // Gate 6 — create video. No chosenVideoId, no in-flight video render.
      if (!shot.chosenVideoId) {
        const completedVideos = shot.videoRenders.filter(
          (v) => v.status === 'completed' && v.outputFilename,
        );
        const videoInFlight = shot.videoRenders.some(
          (v) => (VIDEO_INFLIGHT as readonly string[]).includes(v.status),
        );

        // Gate 7 takes priority over 6 when there are videos waiting for approval.
        if (completedVideos.length > 0 && !videoInFlight) {
          // Deep-link straight to the newest completed take's detail page —
          // landing on the shot's full video list made the user hunt for the
          // clip that actually needs the verdict (user 2026-08-07).
          const newest = completedVideos[completedVideos.length - 1];
          out.push(this.shotItem(7, 'approve_video', project, shot, scene, {
            link: `/projects/${project.id}/shots/${shot.id}/videos/${newest.id}`,
          }));
          continue;
        }

        if (!videoInFlight) {
          out.push(this.shotItem(6, 'create_video', project, shot, scene, {
            link: `/projects/${project.id}/shots/${shot.id}/videos`,
          }));
        }
        continue;
      }

      // Gate 8 — upscale video. chosenVideoId set, upscale not yet running/completed.
      const chosen = shot.videoRenders.find((v) => v.id === shot.chosenVideoId);
      if (!chosen) continue; // stale id, nothing to upscale
      if (!chosen.upscaleStatus || !(UPSCALE_INFLIGHT_OR_DONE as readonly string[]).includes(chosen.upscaleStatus)) {
        out.push(this.shotItem(8, 'upscale_video', project, shot, scene, {
          link: `/projects/${project.id}/shots/${shot.id}/videos`,
          action: { method: 'POST', path: `/generation/videos/${chosen.id}/upscale`, body: {} },
        }));
        continue;
      }
      // Upscale still pending/running → wait; the FHD clip isn't ready to interpolate.
      if (chosen.upscaleStatus !== 'completed') continue;

      // Gate 8b — interpolate video (MANDATORY). Upscale done, but the FPS
      // interpolation hasn't run yet (or failed). Surface it so the user can't
      // forget the step the CapCut export now requires.
      const interpInFlightOrDone = (['pending', 'running', 'completed'] as const) as readonly string[];
      if (chosen.interpStatus && interpInFlightOrDone.includes(chosen.interpStatus)) continue;
      out.push(this.shotItem(8, 'interpolate_video', project, shot, scene, {
        link: `/projects/${project.id}/shots/${shot.id}/videos`,
        action: { method: 'POST', path: `/generation/videos/${chosen.id}/interpolate`, body: {} },
      }));
    }
  }

  /** Identity readiness per participant, mirroring the dashboard's rule
   *  (projects-dashboard.controller):
   *    photoreal — a trained LoRA (loraPath);
   *    cartoon/anchor pipelines (qwen/flux/sdxl_comic) — promptBase +
   *      triggerToken; per-character LoRA does not exist there at all, and the
   *      old LoRA-only check silently hid the render gate for every such shot
   *      (station A2_SH13/A8_SH12 were invisible on /actions, user 2026-08-07).
   *  IP-Adapter profiles are anchor-gated in anchorsReadyForShot instead.
   *  Participants with profileId=null are text-only and don't gate rendering. */
  private identityReady(
    participants: Array<{ profile: {
      id: string; loraPath: string | null; useIpAdapter: boolean;
      promptBase: string | null; triggerToken: string | null;
    } | null }>,
    isCartoon: boolean,
  ): boolean {
    for (const p of participants) {
      if (!p.profile) continue; // text-only participant
      if (p.profile.useIpAdapter) continue;
      if (isCartoon) {
        if (!p.profile.promptBase || !p.profile.triggerToken) return false;
      } else if (!p.profile.loraPath) return false;
    }
    return true;
  }

  /** Cartoon-only gate: every participant profile (IP-Adapter identity) must
   *  have its `<profileCode>_anchor.png` on disk AND APPROVED before a scene
   *  render is offered — otherwise the render either has no face to lock, or
   *  locks onto a portrait nobody ever reviewed and stamps it across the film.
   *  Photoreal projects return true (they're LoRA-gated by isLoraReady). */
  private anchorsReadyForShot(
    participants: Array<{ profile: {
      profileCode: string;
      useIpAdapter: boolean;
      anchorApprovedAt?: Date | null;
      character?: {
        project?:      { slug: string } | null;
        projectLinks?: Array<{ project: { slug: string } }>;
      };
    } | null }>,
    slug: string,
    isCartoon: boolean,
  ): boolean {
    if (!isCartoon) return true;
    for (const p of participants) {
      if (!p.profile) continue;              // text-only participant
      if (!p.profile.useIpAdapter) continue; // non-IP profile — not anchor-gated here
      const slugs = anchorSlugCandidates(slug, p.profile.character ?? {});
      if (!anchorExistsForProfile(slugs, p.profile.profileCode)) return false;
      if (!p.profile.anchorApprovedAt) return false;
    }
    return true;
  }

  // ── Gate 1 (per prop) — generate_prop_anchor ─────────────────────────────
  //
  // A prop with no anchor PNG is text-only: at shot time it is described in
  // words and the renderer invents it afresh every frame, which is exactly the
  // drift object anchors exist to stop. This gate is the props counterpart of
  // `generate_anchor`, and it lives in the same phase-1 setup zone — an object
  // wanted on screen should get its anchor before the shots referencing it are
  // rendered, not after.
  //
  // Suppressed while a prop_anchor_jobs row is pending/running, same rule as
  // the character gate, so a queued render doesn't keep nagging.

  private async collectPropGates(
    project: { id: string; slug: string; name: string },
    out: ActionItem[],
  ): Promise<void> {
    const props = await this.prisma.prop.findMany({
      where:   { projectId: project.id },
      select:  { id: true, code: true, name: true, anchorPath: true, anchorApprovedAt: true },
      orderBy: { code: 'asc' },
    });
    if (props.length === 0) return;

    const inflight = new Set(
      (await this.prisma.propAnchorJob.findMany({
        where:  { propId: { in: props.map((p) => p.id) }, status: { in: ['pending', 'running'] } },
        select: { propId: true },
      })).map((j) => j.propId),
    );

    for (const prop of props) {
      if (inflight.has(prop.id)) continue;   // a render is already on its way

      // Installed but unreviewed. PropAnchorService installs the FIRST rendered
      // candidate on its own, so this is the only point at which anyone is
      // asked whether that picture is the object. Shots pointing at this prop
      // stay unrenderable until it is answered.
      if (prop.anchorPath && !prop.anchorApprovedAt) {
        out.push({
          gate:    1,
          gateKey: 'approve_prop_anchor',
          project: { id: project.id, slug: project.slug, name: project.name },
          prop:    { id: prop.id, code: prop.code, name: prop.name },
          link:    `/projects/${project.id}/props`,
          action:  { method: 'POST', path: `/props/${prop.id}/anchor/approve`, body: {} },
        });
        continue;
      }

      if (!prop.anchorPath) {
        out.push({
          gate:    1,
          gateKey: 'generate_prop_anchor',
          project: { id: project.id, slug: project.slug, name: project.name },
          prop:    { id: prop.id, code: prop.code, name: prop.name },
          link:    `/projects/${project.id}/props`,
          action:  { method: 'POST', path: `/props/${prop.id}/generate-anchor`, body: {} },
        });
      }
    }
  }

  // ── builders ─────────────────────────────────────────────────────────────

  private charItem(
    gate: Gate,
    gateKey: GateKey,
    project: { id: string; slug: string; name: string },
    character: { id: string; code: string; displayName: string | null },
    profile: { id: string; profileCode: string },
    extras: Pick<ActionItem, 'link' | 'action'>,
  ): ActionItem {
    return {
      gate, gateKey,
      project:   { id: project.id, slug: project.slug, name: project.name },
      character: { id: character.id, code: character.code, displayName: character.displayName },
      profile:   { id: profile.id, code: profile.profileCode },
      ...extras,
    };
  }

  private shotItem(
    gate: Gate,
    gateKey: GateKey,
    project: { id: string; slug: string; name: string },
    shot: { id: string; shotCode: string },
    scene: ActionItem['scene'],
    extras: Pick<ActionItem, 'link' | 'action'>,
  ): ActionItem {
    return {
      gate, gateKey,
      project: { id: project.id, slug: project.slug, name: project.name },
      scene,
      shot: { id: shot.id, code: shot.shotCode },
      ...extras,
    };
  }

  // ── Gate 9 — approve_tts (per shot AND per scene) ───────────────────────
  //
  // Surfaces shots/scenes that have a non-empty narrationText and at least one
  // completed TTSJob but no approvedTTSJobId. **Suppressed while any TTSJob
  // for the same owner is still pending/running** — wait for the in-flight
  // take to finish before asking the user to approve a stale one. Independent
  // of the visual gates — a shot can need both `approve_render` and
  // `approve_tts` simultaneously.

  private async collectTtsGates(
    project: {
      id: string; slug: string; name: string;
      ttsEngine?: string | null; ttsVoiceRefPath?: string | null;
    },
    out: ActionItem[],
  ): Promise<void> {
    // Voice-clone engines (xtts2 | f5 | qwen3) can't synthesize anything without a
    // project voice reference — the renderer throws BadRequest until one is
    // uploaded (see TtsService.resolveEmotionParams). So a render_tts gate for
    // such a project isn't an action the user can take, it's a blocked
    // precondition: surfacing it just floods /actions with rows that would all
    // fail. Suppress render_tts entirely in that case. silero needs no
    // reference, so it's never gated here. Note: approve_tts is unaffected — a
    // completed take can only exist once a reference already did.
    const engine = project.ttsEngine ?? 'silero';
    const isVoiceClone = isVoiceCloneEngine(engine);
    const canRenderVoice = !isVoiceClone || !!project.ttsVoiceRefPath;

    // render_tts — shot has narration text (>= 1 char) but NO voiceover yet:
    // no approved take AND no completed/in-flight TTS job. Surfaces shots that
    // were never queued (or whose takes were all deleted) so a shot with text
    // can never silently lack audio. Suppressed the moment a take is
    // completed/pending/running — it then flows to approve_tts or is in hand.
    if (canRenderVoice) {
      const needVoice = await this.prisma.shot.findMany({
        where: {
          projectId:        project.id,
          approvedTTSJobId: null,
          narrationText:    { not: null },
          ttsJobs: { none: { status: { in: ['completed', 'pending', 'running'] } } },
        },
        select: {
          id:       true,
          shotCode: true,
          narrationText: true,
          scene:    { select: { id: true, sceneKey: true, title: true } },
        },
        orderBy: [{ scene: { sortOrder: 'asc' } }, { shotCode: 'asc' }],
      });
      for (const shot of needVoice) {
        // Guard against empty / whitespace-only narration — "min one character".
        if (!shot.narrationText || shot.narrationText.trim().length < 1) continue;
        out.push(this.shotItem(
          9, 'render_tts', project, shot,
          shot.scene
            ? { id: shot.scene.id, sceneKey: shot.scene.sceneKey, title: shot.scene.title }
            : undefined,
          { link: `/projects/${project.id}/shots/${shot.id}/narration` },
        ));
      }
    }

    // VO-QC approve-gate (opt-in per project): while the gate blocks approval,
    // don't dangle approve_tts rows that would all 400 — the user's next action
    // is "run VO validation", not "approve". render_tts above is unaffected.
    if (await voGateBlocksApprove(this.prisma, project.id)) return;

    // Per-shot TTS approval.
    const shots = await this.prisma.shot.findMany({
      where: {
        projectId:        project.id,
        approvedTTSJobId: null,
        narrationText:    { not: null },
        ttsJobs: {
          some: { status: 'completed' },
          none: { status: { in: ['pending', 'running'] } },
        },
      },
      select: {
        id:       true,
        shotCode: true,
        scene:    { select: { id: true, sceneKey: true, title: true } },
      },
      orderBy: [{ scene: { sortOrder: 'asc' } }, { shotCode: 'asc' }],
    });
    for (const shot of shots) {
      out.push(this.shotItem(
        9, 'approve_tts', project, shot,
        shot.scene
          ? { id: shot.scene.id, sceneKey: shot.scene.sceneKey, title: shot.scene.title }
          : undefined,
        { link: `/projects/${project.id}/shots/${shot.id}/narration` },
      ));
    }

    // Per-scene TTS approval (legacy whole-scene voiceover). Same logic.
    const scenes = await this.prisma.scene.findMany({
      where: {
        projectId:        project.id,
        approvedTTSJobId: null,
        narrationText:    { not: null },
        ttsJobs: {
          some: { status: 'completed' },
          none: { status: { in: ['pending', 'running'] } },
        },
      },
      select: { id: true, sceneKey: true, title: true },
      orderBy: { sortOrder: 'asc' },
    });
    for (const scene of scenes) {
      // Scene-level approve_tts lives on the scene, not on any shot. We reuse
      // shotItem's shape but leave `shot` undefined and put the scene in.
      out.push({
        gate: 9,
        gateKey: 'approve_tts',
        project: { id: project.id, slug: project.slug, name: project.name },
        scene:   { id: scene.id, sceneKey: scene.sceneKey, title: scene.title },
        link:    `/projects/${project.id}/scenes#${scene.sceneKey}`,
      });
    }
  }

  // ── Gate 10 — render_bgm + approve_bgm (per MusicSegment) ───────────────
  //
  // render_bgm  — a tile that has never been rendered (no jobs at all).
  // approve_bgm — a tile with at least one completed AudioRenderJob but no
  //               approvedJobId. Per-project iteration via the block table.
  //
  // Until 2026-08-10 only the approval half existed, so a project whose music
  // had never been started showed NOTHING here and looked finished — the one
  // stage /actions could not tell you to begin (user, car_flipper).

  private async collectBgmGates(
    project: { id: string; slug: string; name: string },
    out: ActionItem[],
  ): Promise<void> {
    // Tiles nobody has rendered yet. Spares are deliberate extras and are not
    // owed, so they don't nag from here — render them from the BGM page.
    //
    // «Не рендерилась» — это НЕТ живого и НЕТ удачного джоба, а не «нет джобов
    // совсем»: плитка, у которой все попытки упали (failed/cancelled), раньше не
    // попадала ни сюда (джобы есть), ни в approve_bgm (нечего утверждать) — и
    // молча висела в долгах овервью, ничего не предлагая (2026-08-12).
    const unrendered = await this.prisma.musicSegment.findMany({
      where: {
        block:         { projectId: project.id },
        approvedJobId: null,
        spare:         false,
        jobs:          { none: { status: { in: ['pending', 'running', 'completed'] } } },
      } as any,
      select: {
        id:          true,
        sortOrder:   true,
        durationSec: true,
        prompt:      true,
        block:       { select: { id: true, slug: true, title: true, sortOrder: true } },
      },
      orderBy: [{ block: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
    for (const seg of unrendered) {
      out.push({
        gate: 10,
        gateKey: 'render_bgm',
        project: { id: project.id, slug: project.slug, name: project.name },
        segment: {
          id:          seg.id,
          sortOrder:   seg.sortOrder,
          durationSec: seg.durationSec,
          prompt:      seg.prompt,
          block:       { id: seg.block.id, slug: seg.block.slug, title: seg.block.title },
        },
        link:   `/projects/${project.id}/bgm`,
        action: { method: 'POST', path: `/bgm/segments/${seg.id}/render`, body: {} },
      });
    }

    // Same in-flight suppression as approve_tts — don't ask the user to pick a
    // take while ACE-Step is still rendering another one for the same segment.
    const segments = await this.prisma.musicSegment.findMany({
      where: {
        block:         { projectId: project.id },
        approvedJobId: null,
        jobs: {
          some: { status: 'completed' },
          none: { status: { in: ['pending', 'running'] } },
        },
      },
      select: {
        id:          true,
        sortOrder:   true,
        durationSec: true,
        prompt:      true,
        block:       { select: { id: true, slug: true, title: true, sortOrder: true } },
      },
      orderBy: [{ block: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
    for (const seg of segments) {
      out.push({
        gate: 10,
        gateKey: 'approve_bgm',
        project: { id: project.id, slug: project.slug, name: project.name },
        segment: {
          id:          seg.id,
          sortOrder:   seg.sortOrder,
          durationSec: seg.durationSec,
          prompt:      seg.prompt,
          block:       { id: seg.block.id, slug: seg.block.slug, title: seg.block.title },
        },
        link: `/projects/${project.id}/bgm`,
      });
    }
  }
}
