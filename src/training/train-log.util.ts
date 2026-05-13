import { existsSync, openSync, readSync, closeSync, statSync } from 'fs';

/**
 * One sample parsed from a kohya `steps: ` tqdm line.
 *
 * Example line:
 *   steps:  79%|███▉      | 1185/1500 [29:18<07:47,  1.48s/it, avr_loss=0.125]
 *
 * Fields:
 *   step        — completed steps (1185)
 *   totalSteps  — total steps      (1500)
 *   percent     — 0..1
 *   avgLoss     — kohya's running avg
 *   elapsedSec  — seconds since training started (parsed from the [MM:SS<…] block)
 *   etaSec      — seconds remaining (parsed from […<MM:SS,…]) or null when "?"
 *   secPerIt    — seconds per iteration (1.48 in the example)
 */
export interface TrainStepSample {
  step:       number;
  totalSteps: number;
  percent:    number;
  avgLoss:    number;
  elapsedSec: number;
  etaSec:     number | null;
  secPerIt:   number;
}

/**
 * Capture every kohya step line in the buffer. Single regex with /g; both
 * "live" (last sample) and "history" callers reuse this so the parsing rule is
 * identical and any kohya format tweak only needs to be fixed in one place.
 */
const STEP_RE = /steps:\s+(\d+)%\|[^|]*\|\s*(\d+)\/(\d+)\s+\[([\d:]+)<([\d:?]+),\s*([\d.]+)(s|m)\/it[^\]]*?avr_loss=([\d.]+)/g;

function parseTimeToSec(t: string): number | null {
  if (!t || t.includes('?')) return null;
  const parts = t.split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  // tqdm prints HH:MM:SS or MM:SS depending on duration.
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

/** Parse all step samples from a buffer (works for full log or tail). */
export function parseStepSamples(buf: string): TrainStepSample[] {
  const out: TrainStepSample[] = [];
  STEP_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = STEP_RE.exec(buf)) !== null) {
    const [, , stepStr, totalStr, elapsedStr, etaStr, rateStr, rateUnit, lossStr] = m;
    const step       = Number(stepStr);
    const totalSteps = Number(totalStr);
    const elapsedSec = parseTimeToSec(elapsedStr) ?? 0;
    const etaSec     = parseTimeToSec(etaStr);
    const rate       = Number(rateStr);
    const secPerIt   = rateUnit === 'm' ? rate * 60 : rate;
    out.push({
      step,
      totalSteps,
      percent: step / totalSteps,
      avgLoss: Number(lossStr),
      elapsedSec,
      etaSec,
      secPerIt,
    });
  }
  return out;
}

/** Read at most `maxBytes` from end of file. Whole file if smaller. */
export function tailFile(filePath: string, maxBytes: number): string {
  if (!existsSync(filePath)) return '';
  try {
    const size = statSync(filePath).size;
    const start = Math.max(0, size - maxBytes);
    const fd = openSync(filePath, 'r');
    const buf = Buffer.alloc(size - start);
    readSync(fd, buf, 0, buf.length, start);
    closeSync(fd);
    return buf.toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Read up to `maxBytes` from the start. Used for full-history parsing — kohya
 * step lines accumulate as the run progresses, so we want oldest-first.
 *
 * Cap is defensive: a 1500-step run produces ~3000 lines (~300 KB), well under
 * the 5 MB default. Logs that grow larger than that are likely runaway anyway.
 */
export function readUpTo(filePath: string, maxBytes: number): string {
  if (!existsSync(filePath)) return '';
  try {
    const size = statSync(filePath).size;
    const fd = openSync(filePath, 'r');
    const len = Math.min(size, maxBytes);
    const buf = Buffer.alloc(len);
    readSync(fd, buf, 0, len, 0);
    closeSync(fd);
    return buf.toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Decimate a sample series down to ~`maxPoints` evenly-spaced points so the
 * frontend chart stays snappy on long runs. Always keeps first and last.
 */
export function decimate<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  const out: T[] = [];
  for (let i = 0; i < maxPoints - 1; i++) out.push(arr[Math.floor(i * step)]);
  out.push(arr[arr.length - 1]);
  return out;
}
