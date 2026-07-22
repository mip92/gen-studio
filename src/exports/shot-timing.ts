/**
 * Shared source-of-truth for how long a single shot is held on the CapCut
 * timeline. Extracted from {@link ExportsService.buildManifest} so the BGM
 * module computes per-act music length from the EXACT same math the exporter
 * uses — music length then equals timeline length by construction (per user
 * spec: «длину акта считать от озвучки, ровно как в экспорт-скрипте»).
 *
 * Pure functions, no Nest / Prisma deps — safe to import from any module.
 * All durations are microseconds.
 */

/** Breathing pause held after a VO line ends. */
export const TAIL_US = 500_000;
/** Floor so a one-word line isn't a flash (narration timing only). */
export const MIN_SHOT_US = 2_500_000;
/** Static shot that has no narration. */
export const NO_VO_US = 4_000_000;

export interface ShotHoldInput {
  /** 'image' = static still (Ken-Burns held); undefined = animated clip. */
  kind:         'image' | undefined;
  /** Native animated-clip length in µs (undefined for stills / unrendered). */
  sourceUs:     number | undefined;
  /** Approved VO length in µs, or null when the shot has no narration. */
  narrationUs:  number | null;
  /** Project timing mode: VO-driven ('narration') or native-clip ('clip'). */
  exportTiming: 'narration' | 'clip';
}

/**
 * Timeline hold for one shot, mirroring buildManifest lines 415-445 exactly.
 * Only ever *lengthens* an animated clip to fit a longer VO — never trims.
 */
export function shotHoldUs(inp: ShotHoldInput): number {
  const { kind, sourceUs, narrationUs, exportTiming } = inp;
  let durationUs: number;
  if (exportTiming === 'narration') {
    durationUs = narrationUs != null
      ? narrationUs + TAIL_US
      : (kind === 'image' ? NO_VO_US : (sourceUs ?? NO_VO_US));
    durationUs = Math.max(durationUs, MIN_SHOT_US);
  } else {
    durationUs = kind === 'image'
      ? (narrationUs != null ? narrationUs + TAIL_US : NO_VO_US)
      : (sourceUs ?? NO_VO_US);
  }
  // A video clip must never be shorter than its voiceover: stretch to VO + tail.
  if (kind === undefined && narrationUs != null) {
    durationUs = Math.max(durationUs, narrationUs + TAIL_US);
  }
  return durationUs;
}

/**
 * Resolve an approved TTS take's playback length in µs from its job row.
 * Prefers the probed `durationMs`; falls back to a text-length estimate for
 * legacy rows that pre-date the column. Returns null when there's no approved
 * take. Mirrors buildManifest's narration resolution (minus the on-disk check,
 * which the BGM caller doesn't need — TTS readiness is gated before render).
 */
export function narrationUsFromTts(
  approvedId: string | null | undefined,
  ttsJobs: Array<{ id: string; durationMs: number | null; text: string }>,
): number | null {
  if (!approvedId) return null;
  const t = ttsJobs.find((j) => j.id === approvedId);
  if (!t) return null;
  return t.durationMs != null && t.durationMs > 0
    ? t.durationMs * 1000
    : Math.max(800_000, Math.round((t.text.length / 15) * 1_000_000));
}
