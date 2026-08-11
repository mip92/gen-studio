/**
 * Text normalization for VO validation: turns both the frozen TTSJob.text and
 * the whisper transcript into comparable token arrays.
 *
 * Pipeline: lowercase → ё→е fold → punctuation strip (intra-word hyphens kept)
 * → whitespace split → Russian cardinal-number folding («двадцать пять» → "25").
 *
 * The numeral lexicon is deliberately narrow (cardinals + common case endings).
 * Anything unrecognized passes through as a plain word — and the diff layer
 * treats ANY mismatch where either side contains a digit as a number mismatch
 * (warn, never fail), so a missed declension can't produce a false FAIL.
 */

/** ё → е both ways is the house convention (see check_ru_words.py). */
export function foldYo(s: string): string {
  return s.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
}

/** True when the token carries digits — number mismatches never FAIL a job. */
export function hasDigits(token: string): boolean {
  return /\d/.test(token);
}

// ── Russian cardinal lexicon (declension-tolerant) ───────────────────────────

function forms(value: number, ...words: string[]): Array<[string, number]> {
  return words.map((w) => [w, value] as [string, number]);
}

/** word-form (ё already folded to е, lowercase) → numeric value. */
const NUM_WORD: ReadonlyMap<string, number> = new Map<string, number>([
  ...forms(0, 'ноль', 'нуль', 'нуля', 'нулю', 'нулем', 'ноля', 'нолю', 'нолем'),
  ...forms(1, 'один', 'одна', 'одно', 'одного', 'одной', 'одному', 'одним', 'одном', 'одну'),
  ...forms(2, 'два', 'две', 'двух', 'двум', 'двумя'),
  ...forms(3, 'три', 'трех', 'трем', 'тремя'),
  ...forms(4, 'четыре', 'четырех', 'четырем', 'четырьмя'),
  ...forms(5, 'пять', 'пяти', 'пятью'),
  ...forms(6, 'шесть', 'шести', 'шестью'),
  ...forms(7, 'семь', 'семи', 'семью'),
  ...forms(8, 'восемь', 'восьми', 'восемью', 'восьмью'),
  ...forms(9, 'девять', 'девяти', 'девятью'),
  ...forms(10, 'десять', 'десяти', 'десятью'),
  ...forms(11, 'одиннадцать', 'одиннадцати', 'одиннадцатью'),
  ...forms(12, 'двенадцать', 'двенадцати', 'двенадцатью'),
  ...forms(13, 'тринадцать', 'тринадцати', 'тринадцатью'),
  ...forms(14, 'четырнадцать', 'четырнадцати', 'четырнадцатью'),
  ...forms(15, 'пятнадцать', 'пятнадцати', 'пятнадцатью'),
  ...forms(16, 'шестнадцать', 'шестнадцати', 'шестнадцатью'),
  ...forms(17, 'семнадцать', 'семнадцати', 'семнадцатью'),
  ...forms(18, 'восемнадцать', 'восемнадцати', 'восемнадцатью'),
  ...forms(19, 'девятнадцать', 'девятнадцати', 'девятнадцатью'),
  ...forms(20, 'двадцать', 'двадцати', 'двадцатью'),
  ...forms(30, 'тридцать', 'тридцати', 'тридцатью'),
  ...forms(40, 'сорок', 'сорока'),
  ...forms(50, 'пятьдесят', 'пятидесяти', 'пятьюдесятью'),
  ...forms(60, 'шестьдесят', 'шестидесяти', 'шестьюдесятью'),
  ...forms(70, 'семьдесят', 'семидесяти', 'семьюдесятью'),
  ...forms(80, 'восемьдесят', 'восьмидесяти', 'восемьюдесятью', 'восьмьюдесятью'),
  ...forms(90, 'девяносто', 'девяноста'),
  ...forms(100, 'сто', 'ста'),
  ...forms(200, 'двести', 'двухсот', 'двумстам', 'двумястами', 'двухстах'),
  ...forms(300, 'триста', 'трехсот', 'тремстам', 'тремястами', 'трехстах'),
  ...forms(400, 'четыреста', 'четырехсот', 'четыремстам', 'четырьмястами', 'четырехстах'),
  ...forms(500, 'пятьсот', 'пятисот', 'пятистам', 'пятьюстами', 'пятистах'),
  ...forms(600, 'шестьсот', 'шестисот', 'шестистам', 'шестьюстами', 'шестистах'),
  ...forms(700, 'семьсот', 'семисот', 'семистам', 'семьюстами', 'семистах'),
  ...forms(800, 'восемьсот', 'восьмисот', 'восьмистам', 'восемьюстами', 'восьмистах'),
  ...forms(900, 'девятьсот', 'девятисот', 'девятистам', 'девятьюстами', 'девятистах'),
]);

/** Multiplier word → factor. A group before it multiplies («две тысячи» = 2000). */
const NUM_MULT: ReadonlyMap<string, number> = new Map<string, number>([
  ...forms(1_000, 'тысяча', 'тысячи', 'тысяч', 'тысячу', 'тысячей', 'тысячам', 'тысячах'),
  ...forms(1_000_000, 'миллион', 'миллиона', 'миллионов', 'миллиону', 'миллионом', 'миллионе', 'миллионам', 'миллионах'),
  ...forms(1_000_000_000, 'миллиард', 'миллиарда', 'миллиардов', 'миллиарду', 'миллиардом', 'миллиарде'),
]);

/**
 * Fold runs of cardinal number-words into a single canonical digit token.
 * Non-number tokens pass through untouched. Digit tokens are canonicalized
 * («2026-го» → «2026», «1,5» → «1.5»).
 */
export function foldNumbers(tokens: string[]): string[] {
  const out: string[] = [];
  let group = 0;      // value accumulated since the last multiplier
  let total = 0;      // value accumulated across multipliers
  let inNumber = false;

  const flush = () => {
    if (!inNumber) return;
    out.push(String(total + group));
    group = 0; total = 0; inNumber = false;
  };

  for (const t of tokens) {
    // Canonicalize digit-bearing tokens: keep the leading numeric part.
    const digitMatch = /^(\d+(?:[.,]\d+)?)/.exec(t);
    if (digitMatch) {
      flush();
      out.push(digitMatch[1].replace(',', '.'));
      continue;
    }
    const v = NUM_WORD.get(t);
    if (v !== undefined) {
      inNumber = true;
      group += v;
      continue;
    }
    const m = NUM_MULT.get(t);
    if (m !== undefined) {
      // A bare multiplier means 1× («тысяча человек»).
      total += (inNumber && group > 0 ? group : 1) * m;
      group = 0;
      inNumber = true;
      continue;
    }
    flush();
    out.push(t);
  }
  flush();
  return out;
}

/**
 * Full normalization: string → comparable token array.
 * Keeps letters, digits and intra-word hyphens; drops everything else.
 */
export function normalizeRuTokens(text: string): string[] {
  const cleaned = foldYo(text.toLowerCase())
    // Replace every char that is not a letter/digit/hyphen with a space.
    .replace(/[^\p{L}\p{N}-]+/gu, ' ')
    // A hyphen not surrounded by word chars is punctuation (dash) — drop it.
    .replace(/(^|\s)-+|-+(\s|$)/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return foldNumbers(tokens);
}
