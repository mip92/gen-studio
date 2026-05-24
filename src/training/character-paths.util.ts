import * as path from 'path';

const APP_ROOT     = process.env.APP_ROOT     ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_MODELS = process.env.COMFY_MODELS ?? 'E:\\ComfyUI\\models';

/**
 * Phase 2 path helpers — resolve on-disk locations for a character profile
 * regardless of whether the character is project-bound or library-only.
 *
 *   Project-bound (character.project set):
 *     reference  → data/<slug>/reference/<profileCode>/
 *     dataset    → data/<slug>/datasets/<profileCode>/
 *     LoRA out   → models/loras/gen-studio/<slug>/
 *
 *   Library (character.project === null):
 *     reference  → data/_characters/<characterCode>/<profileCode>/reference/
 *     dataset    → data/_characters/<characterCode>/<profileCode>/datasets/
 *     LoRA out   → models/loras/gen-studio/_characters/<characterCode>/
 *
 * All callers must include `character: { include: { project: true } }` on the
 * profile query so we can branch on the project relation.
 */
export type ProfileWithCharacter = {
  profileCode: string;
  character: { code: string; project: { slug: string } | null };
};

export function isLibraryProfile(profile: ProfileWithCharacter): boolean {
  return profile.character.project === null;
}

export function datasetRootFor(profile: ProfileWithCharacter): string {
  if (profile.character.project) {
    return path.join(APP_ROOT, 'data', profile.character.project.slug, 'datasets', profile.profileCode);
  }
  return path.join(APP_ROOT, 'data', '_characters', profile.character.code, profile.profileCode, 'datasets');
}

export function loraOutputDirFor(profile: ProfileWithCharacter): string {
  if (profile.character.project) {
    return path.join(COMFY_MODELS, 'loras', 'gen-studio', profile.character.project.slug);
  }
  return path.join(COMFY_MODELS, 'loras', 'gen-studio', '_characters', profile.character.code);
}
