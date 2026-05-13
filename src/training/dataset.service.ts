import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import {
  existsSync, mkdirSync, readdirSync, copyFileSync, renameSync, statSync,
  openSync, readSync, closeSync, unlinkSync,
} from 'fs';
import * as path from 'path';

const APP_ROOT      = process.env.APP_ROOT      ?? path.resolve(__dirname, '..', '..', '..');
const COMFY_OUTPUT  = process.env.COMFY_OUTPUT  ?? 'E:\\ComfyUI\\output';
const KOHYA_DIR     = process.env.KOHYA_DIR     ?? 'E:\\kohya_ss';
// Florence-2 needs transformers<4.50 — use kohya venv (4.44) by default; user-installed
// system Python may be on a newer version. Override via PYTHON_BIN for token-only mode.
const PYTHON_BIN    = process.env.PYTHON_BIN    ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const CAPTION_MODE  = process.env.CAPTION_MODE  ?? 'florence2';   // token-only | florence2
const FLORENCE_TASK = process.env.FLORENCE_TASK ?? 'DETAILED_CAPTION';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export interface PrepareDatasetInput {
  projectSlug:    string;
  profileCode:    string;
  filenamePrefix: string;   // matches what ai_syndicate_v3 saved
  triggerToken:   string;
  numRepeats:     number;
}

export interface PreparedDataset {
  rootDir:        string;   // <root>
  imageDir:       string;   // <root>/img
  subsetDir:      string;   // <root>/img/<numRepeats>_<token>
  imageCount:     number;
}

@Injectable()
export class DatasetService {
  private readonly logger = new Logger(DatasetService.name);

  /**
   * Collect images saved by ai_syndicate_v3 (under COMFY_OUTPUT) and arrange
   * them into the kohya_ss directory layout:
   *   data/<slug>/lora/<profileCode>/img/<numRepeats>_<token>/<copies>
   */
  prepare(input: PrepareDatasetInput): PreparedDataset {
    const rootDir   = path.join(APP_ROOT, 'data', input.projectSlug, 'datasets', input.profileCode);
    const imageDir  = path.join(rootDir, 'img');
    const subsetDir = path.join(imageDir, `${input.numRepeats}_${input.triggerToken}`);
    mkdirSync(subsetDir, { recursive: true });

    const sources = findGeneratedImages(COMFY_OUTPUT, input.filenamePrefix);
    const existingInSubset = countImages(subsetDir);

    // Reject only if there's truly nothing to train on — neither in staging
    // (just-generated) nor in the subset folder (moved by a previous run).
    if (sources.length === 0 && existingInSubset === 0) {
      throw new Error(
        `No images for prefix "${input.filenamePrefix}" — checked ${COMFY_OUTPUT} ` +
        `and ${subsetDir}. Generate the dataset via ai_syndicate_v3 first.`,
      );
    }

    // Find the highest <prefix>_NNNNN_.<ext> number already in the subset so
    // collisions get re-numbered into "next available" instead of dropped.
    // This makes repeat generations ADD photos to the dataset rather than
    // replace — ComfyUI restarts its counter at 00001 every time COMFY_OUTPUT
    // is empty, so without this, the new run's _00001_ would collide with
    // the existing _00001_ and get safeUnlink'd.
    const numberRe = new RegExp(`^${escapeRegex(input.filenamePrefix)}_(\\d+)_(\\.[^.]+)$`, 'i');
    let nextN = 0;
    for (const entry of readdirSync(subsetDir)) {
      const m = entry.match(numberRe);
      if (m) nextN = Math.max(nextN, parseInt(m[1], 10));
    }

    let moved = 0;
    let renamed = 0;
    let skipped = 0;
    for (const src of sources) {
      if (!isUsableImage(src)) {
        safeUnlink(src);
        skipped++;
        continue;
      }
      const dest = path.join(subsetDir, path.basename(src));
      if (existsSync(dest)) {
        // Collision: rename to next available number so the new image is
        // appended to the dataset, not dropped.
        const ext = path.extname(src);
        nextN++;
        const padded = String(nextN).padStart(5, '0');
        const newName = `${input.filenamePrefix}_${padded}_${ext}`;
        moveFile(src, path.join(subsetDir, newName));
        renamed++;
        continue;
      }
      moveFile(src, dest);
      moved++;
    }

    const usable = countImages(subsetDir);
    this.logger.log(
      `Prepared ${usable} images in ${subsetDir} ` +
      `(moved ${moved}, ${renamed} renamed-to-avoid-collision, ${skipped} dropped as too-small/corrupt)`,
    );

    return { rootDir, imageDir, subsetDir, imageCount: usable };
  }

  /**
   * List dataset images on disk for a profile, across BOTH locations:
   *   - COMFY_OUTPUT (staging — fresh generations, before training)
   *   - data/<slug>/datasets/<profileCode>/img/<repeats>_<token>/ (post-prepare)
   * Same filename in both? Dataset wins (it's the canonical post-move location).
   */
  listImages(filenamePrefix: string): Array<{ filename: string; size: number; mtime: number; location: 'staging' | 'dataset' }> {
    const seen = new Map<string, { filename: string; size: number; mtime: number; location: 'staging' | 'dataset' }>();

    if (existsSync(COMFY_OUTPUT)) {
      for (const entry of readdirSync(COMFY_OUTPUT)) {
        if (!entry.startsWith(filenamePrefix)) continue;
        if (!IMAGE_EXTS.has(path.extname(entry).toLowerCase())) continue;
        const full = path.join(COMFY_OUTPUT, entry);
        const st = statSync(full);
        if (!st.isFile()) continue;
        seen.set(entry, { filename: entry, size: st.size, mtime: st.mtimeMs, location: 'staging' });
      }
    }

    for (const subsetPath of findDatasetSubsets(filenamePrefix)) {
      for (const entry of readdirSync(subsetPath)) {
        if (!IMAGE_EXTS.has(path.extname(entry).toLowerCase())) continue;
        const full = path.join(subsetPath, entry);
        const st = statSync(full);
        if (!st.isFile()) continue;
        seen.set(entry, { filename: entry, size: st.size, mtime: st.mtimeMs, location: 'dataset' });
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.filename.localeCompare(b.filename));
  }

  /** Delete a single dataset image (in either staging or dataset folder) by filename (validated). */
  deleteImage(filenamePrefix: string, filename: string): boolean {
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return false;
    if (!filename.startsWith(filenamePrefix))                                            return false;

    const full = this.resolveImagePath(filenamePrefix, filename);
    if (!full) return false;
    unlinkSync(full);
    this.logger.log(`Deleted dataset image: ${full}`);
    return true;
  }

  /**
   * Find the absolute path of an image by name, looking in staging first, then
   * any dataset subset folders. Returns null if not found. Used by the
   * controller's streamImage endpoint.
   */
  resolveImagePath(filenamePrefix: string, filename: string): string | null {
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return null;
    if (!filename.startsWith(filenamePrefix))                                            return null;

    const stagingFull = path.join(COMFY_OUTPUT, filename);
    if (existsSync(stagingFull) && statSync(stagingFull).isFile()) return stagingFull;

    for (const subsetPath of findDatasetSubsets(filenamePrefix)) {
      const datasetFull = path.join(subsetPath, filename);
      if (existsSync(datasetFull) && statSync(datasetFull).isFile()) return datasetFull;
    }
    return null;
  }

  /**
   * Run scripts/caption_florence2.py against the dataset directory.
   * Resolves once the subprocess exits 0; rejects on non-zero exit.
   */
  caption(args: {
    datasetDir:    string;
    triggerToken:  string;
    characterName?: string;
    overwrite?:    boolean;
    progressFile?: string;
    onLog?:        (line: string) => void;
  }): Promise<void> {
    const script = path.join(APP_ROOT, 'scripts', 'caption_florence2.py');
    const argv = [
      script,
      '--dataset-dir', args.datasetDir,
      '--token',       args.triggerToken,
      '--mode',        CAPTION_MODE,
    ];
    if (args.characterName) argv.push('--character-name', args.characterName);
    if (CAPTION_MODE === 'florence2') argv.push('--task', FLORENCE_TASK);
    if (args.overwrite)    argv.push('--overwrite');
    if (args.progressFile) argv.push('--progress-json', args.progressFile);

    this.logger.log(`Captioning: ${PYTHON_BIN} ${argv.join(' ')}`);
    return runPython(PYTHON_BIN, argv, args.onLog);
  }
}

/**
 * Reject corrupt thumbnails (e.g. 1×1 placeholders ComfyUI sometimes drops on
 * failed nodes) — kohya's bucket manager divides by image height and crashes
 * with ZeroDivisionError on undersized images.
 */
function isUsableImage(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.png') return true;   // only PNG headers parsed; jpg/webp pass through
  try {
    const fd = openSync(filePath, 'r');
    const buf = Buffer.alloc(24);
    readSync(fd, buf, 0, 24, 0);
    closeSync(fd);
    if (buf.toString('ascii', 1, 4) !== 'PNG') return false;
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return w >= 64 && h >= 64;
  } catch {
    return false;
  }
}

/**
 * Atomically move src → dest. Uses renameSync on the same volume; falls back
 * to copy + unlink across volumes (EXDEV).
 */
function moveFile(src: string, dest: string): void {
  try {
    renameSync(src, dest);
  } catch (err: any) {
    if (err?.code !== 'EXDEV') throw err;
    copyFileSync(src, dest);
    unlinkSync(src);
  }
}

function safeUnlink(filePath: string): void {
  try { unlinkSync(filePath); } catch { /* best-effort cleanup */ }
}

/**
 * Walk `data/<slug>/datasets/<prefix>/img/*` and return absolute paths of the
 * subset folders (e.g. `…/img/10_fatherbase_lora`). The slug is unknown so we
 * scan all top-level dirs under data/. Returns [] if nothing matches.
 */
function findDatasetSubsets(profileCode: string): string[] {
  const projectsRoot = path.join(APP_ROOT, 'data');
  if (!existsSync(projectsRoot)) return [];
  const subsets: string[] = [];
  for (const slug of readdirSync(projectsRoot)) {
    const imgRoot = path.join(projectsRoot, slug, 'datasets', profileCode, 'img');
    if (!existsSync(imgRoot) || !statSync(imgRoot).isDirectory()) continue;
    for (const entry of readdirSync(imgRoot)) {
      const subset = path.join(imgRoot, entry);
      if (statSync(subset).isDirectory()) subsets.push(subset);
    }
  }
  return subsets;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Count usable images already in a subset folder (post-prepare destination). */
function countImages(subsetDir: string): number {
  if (!existsSync(subsetDir)) return 0;
  let n = 0;
  for (const entry of readdirSync(subsetDir)) {
    if (!IMAGE_EXTS.has(path.extname(entry).toLowerCase())) continue;
    const full = path.join(subsetDir, entry);
    if (statSync(full).isFile() && isUsableImage(full)) n++;
  }
  return n;
}

function findGeneratedImages(outputDir: string, prefix: string): string[] {
  if (!existsSync(outputDir)) return [];
  const matches: string[] = [];
  for (const entry of readdirSync(outputDir)) {
    const full = path.join(outputDir, entry);
    if (!statSync(full).isFile()) continue;
    if (!IMAGE_EXTS.has(path.extname(entry).toLowerCase())) continue;
    if (entry.startsWith(prefix)) matches.push(full);
  }
  return matches;
}

function runPython(bin: string, argv: string[], onLog?: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, argv, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env:   { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    proc.stdout.on('data', (chunk: Buffer) => onLog?.(chunk.toString().trimEnd()));
    proc.stderr.on('data', (chunk: Buffer) => onLog?.(chunk.toString().trimEnd()));
    proc.on('error', reject);
    proc.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Python exited with code ${code}`)),
    );
  });
}
