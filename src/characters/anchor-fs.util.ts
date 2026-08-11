import { existsSync } from 'fs';
import * as path from 'path';

/**
 * Where a character's anchor portrait lives on disk, and whether it is there.
 *
 * Extracted 2026-08-10: ActionsService (the `generate_anchor` gate) and the
 * project dashboard («Якоря готовы N / M») both answer the same question, and a
 * second copy of the probe meant the counter and the gate could disagree about
 * the same profile. One helper, one answer.
 *
 * Not merged with `AnchorRenderService.getAnchorPath`, which is async, keyed by
 * profileId, and walks only `character.projectLinks` — it misses the legacy
 * `Character.projectId` hard-link that the callers here still rely on.
 * Reconciling those is a separate change.
 */

const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

/**
 * Every project-slug whose reference dir could hold this character's anchor PNG.
 *
 * A cameo character is attached to several projects (the ProjectCharacter M:N
 * join and/or the legacy `Character.projectId` binding), but its anchor is
 * rendered once — under its home project's slug — and reused everywhere (see
 * AnchorRenderService.deleteAnchor / getAnchorPath, which also iterate every
 * attached project). So the anchor "exists" for a profile if the PNG is present
 * under ANY attached project's dir, not just the one currently being evaluated.
 * Checking only the current slug is what made /actions nag to re-render an
 * anchor that already existed under the character's home project.
 */
export function anchorSlugCandidates(
  currentSlug: string,
  character: {
    project?:      { slug: string } | null;
    projectLinks?: Array<{ project: { slug: string } }>;
  },
): string[] {
  const slugs = new Set<string>([currentSlug]);
  if (character.project?.slug) slugs.add(character.project.slug);
  for (const l of character.projectLinks ?? []) slugs.add(l.project.slug);
  return [...slugs];
}

/** True if `<profileCode>_anchor.png` exists under any of the candidate slugs. */
export function anchorExistsForProfile(slugs: string[], profileCode: string): boolean {
  for (const slug of slugs) {
    const p = path.join(APP_ROOT, 'data', slug, 'reference', `${profileCode}_anchor.png`);
    // An unreadable dir means "no anchor here", never a crash — this runs inside
    // per-profile loops that must not fail the whole listing.
    try { if (existsSync(p)) return true; } catch { /* treat as absent */ }
  }
  return false;
}
