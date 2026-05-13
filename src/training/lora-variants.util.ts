import { existsSync, readdirSync, statSync } from 'fs';
import * as path from 'path';

const COMFY_MODELS = process.env.COMFY_MODELS ?? 'E:\\ComfyUI\\models';

export interface LoraVariant {
  filename:  string;
  fullPath:  string;
  /** epoch index parsed from `<name>-NNNNNN.safetensors`, or null for the final. */
  epoch:     number | null;
  sizeBytes: number;
  mtime:     string;
  /** Human-readable label: "final" or "epoch 3". */
  label:     string;
}

/** kohya output dir convention used by TrainingService. */
export function loraOutputDir(projectSlug: string): string {
  return path.join(COMFY_MODELS, 'loras', 'gen-studio', projectSlug);
}

/** kohya output name convention used by TrainingService. */
export function loraOutputName(profileCode: string): string {
  return `${profileCode}_sdxl`;
}

/**
 * Walk outputDir for `<outputName>.safetensors` and `<outputName>-NNNNNN.safetensors`,
 * return them sorted oldest-first (epoch 1, 2, …, final).
 */
export function scanLoraVariants(outputDir: string, outputName: string): LoraVariant[] {
  if (!existsSync(outputDir)) return [];
  const variants: LoraVariant[] = [];
  const escaped = outputName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const finalRe = new RegExp(`^${escaped}\\.safetensors$`);
  const epochRe = new RegExp(`^${escaped}-(\\d+)\\.safetensors$`);
  for (const entry of readdirSync(outputDir)) {
    const full = path.join(outputDir, entry);
    if (!statSync(full).isFile()) continue;
    let epoch: number | null = null;
    let label = '';
    if (finalRe.test(entry)) {
      label = 'final';
    } else {
      const m = entry.match(epochRe);
      if (!m) continue;
      epoch = parseInt(m[1], 10);
      label = `epoch ${epoch}`;
    }
    const st = statSync(full);
    variants.push({
      filename:  entry,
      fullPath:  full,
      epoch,
      sizeBytes: st.size,
      mtime:     new Date(st.mtimeMs).toISOString(),
      label,
    });
  }
  variants.sort((a, b) => {
    if (a.epoch === null) return  1;
    if (b.epoch === null) return -1;
    return a.epoch - b.epoch;
  });
  return variants;
}
