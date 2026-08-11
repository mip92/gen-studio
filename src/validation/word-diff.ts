/**
 * Word-level alignment (Wagner-Fischer with backtrace) between the expected
 * narration text and the ASR transcript, plus the fail/warn classification
 * tuned for "the validator must not cry wolf":
 *
 *   FAIL — word integrity is actually broken:
 *     • a repeated word (consecutive duplicate in the transcript that the text
 *       does not have) — whisper virtually never invents duplications, so a
 *       detected repeat is a real TTS stutter;
 *     • a run of ≥ VO_QC_MIN_GAP_WORDS consecutive missing/extra NON-NUMBER
 *       words — one isolated word is treated as whisper noise;
 *     • whole-line WER ≥ VO_QC_WER_FAIL — systemic garble/truncation.
 *
 *   WARN — worth a listen, but plausibly an ASR artifact:
 *     • isolated missing/extra/garbled words;
 *     • ANY mismatch touching a number (digit on either side) — number
 *       normalization is the highest false-positive surface, so numbers are
 *       demoted to warn by design (user decision 2026-08-03).
 */
import { hasDigits } from './ru-text-normalize';

export interface GarbledPair { expected: string; heard: string }

export interface WordDiffResult {
  /** (S + D + I) / max(1, reference length) */
  wer: number;
  missingWords:  string[];
  extraWords:    string[];
  /** Consecutive duplicates in the transcript absent from the text. */
  repeatedWords: string[];
  garbledWords:  GarbledPair[];
  /** Longest run of consecutive missing/extra NON-number words. */
  maxNonNumberGap: number;
  /** True when at least one mismatch involves a digit-bearing token. */
  hasNumberMismatch: boolean;
}

type Op = 'match' | 'sub' | 'del' | 'ins';

/** Align normalized token arrays and bucket every edit operation. */
export function diffWords(reference: string[], hypothesis: string[]): WordDiffResult {
  const n = reference.length;
  const m = hypothesis.length;

  // DP cost matrix (n+1 × m+1). Shots are ~5s / ≤~40 words — size is trivial.
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) cost[i][0] = i;
  for (let j = 1; j <= m; j++) cost[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = reference[i - 1] === hypothesis[j - 1];
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + (same ? 0 : 1),
        cost[i - 1][j] + 1,
        cost[i][j - 1] + 1,
      );
    }
  }

  // Backtrace → op list in reading order. Prefer match/sub over del/ins so
  // aligned substitutions surface as garbled pairs, not unrelated del+ins.
  // hypIdx is kept for ins ops: stutter detection compares the inserted token
  // with its POSITIONAL neighbours in the transcript, because the aligner may
  // attribute a duplicated word to either side of the match.
  const ops: Array<{ op: Op; ref?: string; hyp?: string; hypIdx?: number }> = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const same = i > 0 && j > 0 && reference[i - 1] === hypothesis[j - 1];
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + (same ? 0 : 1)) {
      ops.push({ op: same ? 'match' : 'sub', ref: reference[i - 1], hyp: hypothesis[j - 1] });
      i--; j--;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) {
      ops.push({ op: 'del', ref: reference[i - 1] });
      i--;
    } else {
      ops.push({ op: 'ins', hyp: hypothesis[j - 1], hypIdx: j - 1 });
      j--;
    }
  }
  ops.reverse();

  const missing: string[] = [];
  const extra: string[] = [];
  const repeated: string[] = [];
  const garbled: GarbledPair[] = [];
  let edits = 0;
  let gap = 0;
  let maxGap = 0;
  let hasNumberMismatch = false;

  const noteNumber = (...tokens: Array<string | undefined>) => {
    if (tokens.some((t) => t && hasDigits(t))) hasNumberMismatch = true;
  };

  for (const o of ops) {
    if (o.op === 'match') {
      gap = 0;
      continue;
    }
    edits++;
    const numeric = (o.ref && hasDigits(o.ref)) || (o.hyp && hasDigits(o.hyp));
    if (o.op === 'del') {
      missing.push(o.ref!);
      noteNumber(o.ref);
      gap = numeric ? 0 : gap + 1;
    } else if (o.op === 'ins') {
      // A transcript token equal to its positional neighbour in the transcript
      // is a stutter/retry, not a random insertion.
      const k = o.hypIdx!;
      const isDup = !!o.hyp && !hasDigits(o.hyp)
        && (hypothesis[k - 1] === o.hyp || hypothesis[k + 1] === o.hyp);
      if (isDup) {
        repeated.push(o.hyp!);
        gap = 0;
      } else {
        extra.push(o.hyp!);
        noteNumber(o.hyp);
        gap = numeric ? 0 : gap + 1;
      }
    } else {
      garbled.push({ expected: o.ref!, heard: o.hyp! });
      noteNumber(o.ref, o.hyp);
      gap = 0;   // substitutions are aligned words, not a hole in the audio
    }
    if (gap > maxGap) maxGap = gap;
  }

  return {
    wer: edits / Math.max(1, n),
    missingWords: missing,
    extraWords: extra,
    repeatedWords: repeated,
    garbledWords: garbled,
    maxNonNumberGap: maxGap,
    hasNumberMismatch,
  };
}

export interface DiffClassification {
  level: 'pass' | 'warn' | 'fail';
  /** Human-readable Russian issue strings, one per finding. */
  issues: string[];
}

const WER_FAIL      = Number(process.env.VO_QC_WER_FAIL ?? 0.35);
const MIN_GAP_WORDS = Number(process.env.VO_QC_MIN_GAP_WORDS ?? 2);

const quote = (ws: string[], cap = 6) =>
  ws.slice(0, cap).map((w) => `«${w}»`).join(', ') + (ws.length > cap ? ` (+${ws.length - cap})` : '');

/** Classify a diff into pass/warn/fail with ready-to-display issue strings. */
export function classifyDiff(d: WordDiffResult): DiffClassification {
  const issues: string[] = [];
  let level: DiffClassification['level'] = 'pass';
  const bump = (to: 'warn' | 'fail') => {
    if (to === 'fail' || level === 'pass') level = to;
  };

  if (d.repeatedWords.length > 0) {
    issues.push(`повтор слова: ${quote(d.repeatedWords)}`);
    bump('fail');
  }
  if (d.maxNonNumberGap >= MIN_GAP_WORDS) {
    issues.push(`пропуск/вставка ${d.maxNonNumberGap} слов подряд`);
    bump('fail');
  }
  if (d.wer >= WER_FAIL) {
    issues.push(`сильное расхождение с текстом (WER ${(d.wer * 100).toFixed(0)}%)`);
    bump('fail');
  }

  const nonNumMissing = d.missingWords.filter((w) => !hasDigits(w));
  const nonNumExtra   = d.extraWords.filter((w) => !hasDigits(w));
  const nonNumGarbled = d.garbledWords.filter((g) => !hasDigits(g.expected) && !hasDigits(g.heard));

  if (nonNumMissing.length > 0) {
    issues.push(`не услышаны слова: ${quote(nonNumMissing)}`);
    bump('warn');
  }
  if (nonNumExtra.length > 0) {
    issues.push(`лишние слова: ${quote(nonNumExtra)}`);
    bump('warn');
  }
  if (nonNumGarbled.length > 0) {
    issues.push(`искажено: ${nonNumGarbled.slice(0, 4).map((g) => `«${g.expected}»→«${g.heard}»`).join(', ')}`);
    bump('warn');
  }
  if (d.hasNumberMismatch) {
    issues.push('расхождение в числах (возможна погрешность распознавания)');
    bump('warn');
  }
  return { level, issues };
}
