import { Injectable } from '@nestjs/common';
import { existsSync, readdirSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

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

export type Gate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type GateKey =
  | 'upload_dataset_images'
  | 'start_dataset'
  | 'start_training'
  | 'render_scene'
  | 'approve_render'
  | 'create_video'
  | 'approve_video'
  | 'upscale_video';

export interface ActionItem {
  gate:    Gate;
  gateKey: GateKey;
  project: { id: string; slug: string; name: string };
  // Character-scoped (gates 1–3)
  character?: { id: string; code: string; displayName: string | null };
  profile?:   { id: string; code: string };
  // Shot-scoped (gates 4–8)
  scene?:     { id: string; sceneKey: string; title: string | null };
  shot?:      { id: string; code: string };
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
      await this.collectCharacterGates(project, items);
      await this.collectShotGates(project, items);
    }
    return items;
  }

  // ── Gates 1–3 (per character profile) ────────────────────────────────────

  private async collectCharacterGates(
    project: { id: string; slug: string; name: string },
    out: ActionItem[],
  ): Promise<void> {
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
      },
      orderBy: { code: 'asc' },
    });

    for (const character of characters) {
      for (const profile of character.profiles) {
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
        participants: { include: { profile: { select: { id: true, loraPath: true, useIpAdapter: true } } } },
        renderJobs:   { select: { id: true, status: true, completedAt: true } },
        videoRenders: {
          select: {
            id: true, status: true, outputFilename: true,
            upscaleStatus: true,
          },
        },
      },
      orderBy: [{ scene: { sortOrder: 'asc' } }, { shotCode: 'asc' } ],
    });

    for (const shot of shots) {
      const scene = shot.scene
        ? { id: shot.scene.id, sceneKey: shot.scene.sceneKey, title: shot.scene.title }
        : undefined;

      // Gate 4 — render scene. No chosenRender, no in-flight render, LoRA-ready (or not needed).
      if (!shot.chosenRender) {
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

        if (!renderInFlight && this.isLoraReady(shot.participants)) {
          out.push(this.shotItem(4, 'render_scene', project, shot, scene, {
            link: `/projects/${project.id}/shots/${shot.id}/render`,
          }));
        }
        continue; // either rendered/skipped — nothing else applies until chosenRender is set
      }

      // From here: chosenRender is set.
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
          out.push(this.shotItem(7, 'approve_video', project, shot, scene, {
            link: `/projects/${project.id}/shots/${shot.id}/videos`,
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
      if (chosen.upscaleStatus && (UPSCALE_INFLIGHT_OR_DONE as readonly string[]).includes(chosen.upscaleStatus)) continue;

      out.push(this.shotItem(8, 'upscale_video', project, shot, scene, {
        link: `/projects/${project.id}/shots/${shot.id}/videos`,
        action: { method: 'POST', path: `/generation/videos/${chosen.id}/upscale`, body: {} },
      }));
    }
  }

  /** All shot participants that point at a profile must have a usable LoRA
   *  (or use IP-Adapter). Participants with profileId=null are text-only and
   *  don't gate rendering. */
  private isLoraReady(
    participants: Array<{ profile: { id: string; loraPath: string | null; useIpAdapter: boolean } | null }>,
  ): boolean {
    for (const p of participants) {
      if (!p.profile) continue; // text-only participant
      if (p.profile.useIpAdapter) continue;
      if (!p.profile.loraPath) return false;
    }
    return true;
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
}
