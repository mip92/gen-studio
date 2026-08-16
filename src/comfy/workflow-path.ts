import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

/** gen-studio app root. Compiled layout is dist/src/comfy/ → three levels up. */
const APP_ROOT = process.env.APP_ROOT ?? path.resolve(__dirname, '..', '..', '..');

/** Slug of the shared master workflow directory: data/_templates/comfy/. */
export const TEMPLATES_SLUG = '_templates';

/**
 * Every ComfyUI graph lives ONCE, in data/_templates/comfy/.
 *
 * A project may still shadow a graph with data/<slug>/comfy/<filename> — that
 * per-project copy wins when present, which is how a one-off experiment gets
 * pinned to a single film without touching the master. Nothing shadows anything
 * today: the 394 byte-identical per-project copies that used to live there were
 * removed 2026-08-13 (zero of them had ever been edited). Patching a graph is
 * now a one-file edit instead of a 42-file Python fan-out.
 *
 * Returns null when the graph exists in neither location.
 */
export function resolveWorkflowPath(projectSlug: string, filename: string): string | null {
  const perProject = path.join(APP_ROOT, 'data', projectSlug, 'comfy', filename);
  if (existsSync(perProject)) return perProject;
  const shared = path.join(APP_ROOT, 'data', TEMPLATES_SLUG, 'comfy', filename);
  return existsSync(shared) ? shared : null;
}

/** "…/<slug>/comfy/x.json (and no shared template at …)" — for error messages. */
export function describeWorkflowLookup(projectSlug: string, filename: string): string {
  const perProject = path.join(APP_ROOT, 'data', projectSlug, 'comfy', filename);
  const shared = path.join(APP_ROOT, 'data', TEMPLATES_SLUG, 'comfy', filename);
  return `${perProject} (and no shared template at ${shared})`;
}

/** Parsed graph, or null when the file exists in neither location. */
export function readWorkflowJson<T = Record<string, any>>(
  projectSlug: string,
  filename: string,
): T | null {
  const filePath = resolveWorkflowPath(projectSlug, filename);
  return filePath ? (JSON.parse(readFileSync(filePath, 'utf-8')) as T) : null;
}
