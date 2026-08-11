/**
 * Age ordering for anchor-inheritance chains.
 *
 * A character's profiles are STATES of one person in story time
 * (`X_KID → X_YOUNG → X_MID → X_OLD`). Anchor inheritance renders each state as
 * a Qwen edit of the previous one, so the chain order has to be derived
 * mechanically from what the seeder already wrote — `ageLabel` — instead of
 * being hand-linked profile by profile (which is why the feature sat unused
 * from 2026-08-03 to 2026-08-10: nothing ever set the links).
 *
 * `ageLabel` is free text written by hand, in practice one of:
 *   "adult 43" · "kid 8" · "teen 17" · "elderly 62" · "young adult 20" ·
 *   "44" · "42-50" (range) · "costume" (no number at all — 1 row in the DB).
 *
 * Rule: the FIRST integer in `ageLabel` wins (a range contributes its lower
 * bound). Only when there is no digit anywhere do we fall back to the profile
 * code's state suffix. Everything the caller might want to eyeball —
 * code-derived ages, ranges, ties, and orders where the suffix disagrees with
 * the number — comes back as a warning rather than being silently "fixed".
 *
 * Pure module: no Prisma, no filesystem — the ordering is the part worth
 * reasoning about on its own.
 */

/** Nominal age implied by a profile-code suffix, used only when `ageLabel` has
 *  no digits. Values are rough band centres, not claims about a real person. */
const SUFFIX_AGE: Array<[RegExp, number]> = [
  [/(^|_)(BABY|INFANT)$/,               2],
  [/(^|_)(CHILD|KID|BOY|GIRL)$/,        8],
  [/(^|_)(TEEN|SCHOOL)$/,              15],
  [/(^|_)(STU|STUDENT|YOUNGER)$/,      20],
  [/(^|_)(YOUNG|START|BRIDE)$/,        22],
  [/(^|_)(ADULT|GROWN|PRIME)$/,        28],
  [/(^|_)(BASE|MAIN|MID|WORK|PROF|BIZ|RICH|VET|MUS|COSTUME)$/, 40],
  [/(^|_)(LATE|BACK|END)$/,            50],
  [/(^|_)(OLD|OLDER)$/,                60],
  [/(^|_)(ELDER|ELDERLY|GRAN)$/,       75],
];

/** Where a profile's sort age came from — surfaced so a dry-run can flag the
 *  guesses instead of pretending every chain is equally certain. */
export type AgeSource = 'ageLabel' | 'ageLabelRange' | 'code' | 'unknown';

export interface AgeOrder {
  /** Sort key. `null` = could not be determined; those sort last. */
  age:    number | null;
  source: AgeSource;
}

/**
 * Sort age for one profile. `ageLabel` numbers beat code suffixes, because the
 * user's own rule for this feature is «автоматически по ageLabel» and the label
 * is what the scenario author actually reviewed.
 */
export function ageOrder(ageLabel: string | null | undefined, profileCode: string): AgeOrder {
  const label = (ageLabel ?? '').trim();
  const nums  = label.match(/\d+/g);
  if (nums && nums.length > 0) {
    const age = Number(nums[0]);
    // "42-50" / "38-45": the lower bound is the state's entry age, which is what
    // story-time ordering wants.
    return { age, source: nums.length > 1 ? 'ageLabelRange' : 'ageLabel' };
  }
  const code = profileCode.trim().toUpperCase();
  for (const [re, age] of SUFFIX_AGE) {
    if (re.test(code)) return { age, source: 'code' };
  }
  return { age: null, source: 'unknown' };
}

/** Nominal age implied by the code suffix alone, or null when the suffix carries
 *  no state (`LIGA_BASE`-style codes are handled by SUFFIX_AGE; a bare name is
 *  not). Used to detect label-vs-suffix disagreement. */
function suffixAge(profileCode: string): number | null {
  const code = profileCode.trim().toUpperCase();
  for (const [re, age] of SUFFIX_AGE) {
    if (re.test(code)) return age;
  }
  return null;
}

export interface ChainCandidate {
  id:            string;
  profileCode:   string;
  ageLabel:      string | null;
  /** Current link, so `buildChain` can report what would change. */
  baseProfileId: string | null;
}

export interface ChainLink<T extends ChainCandidate = ChainCandidate> {
  profile: T;
  age:     number | null;
  source:  AgeSource;
  /** Who this profile should derive from: the previous state, `null` for the
   *  youngest (which renders independently, text-to-image). */
  baseProfileId: string | null;
  /** True when the proposed link differs from what is stored today. */
  changed: boolean;
}

export interface ChainPlan<T extends ChainCandidate = ChainCandidate> {
  links: Array<ChainLink<T>>;
  /** Human-readable caveats: guessed ages, ranges, ties, suffix disagreement.
   *  Rendered verbatim in the dry-run report — the point is that the user eyeballs
   *  the handful of odd characters instead of all 70. */
  warnings: string[];
}

/**
 * Order a character's profiles by story time and propose the inheritance chain:
 * each state derives from the previous one, the youngest derives from nothing.
 *
 * Ties and unknown ages are broken deterministically (suffix age, then code) so
 * repeated runs never reshuffle a chain.
 */
export function buildChain<T extends ChainCandidate>(profiles: T[]): ChainPlan<T> {
  const scored = profiles.map((profile) => {
    const { age, source } = ageOrder(profile.ageLabel, profile.profileCode);
    return { profile, age, source };
  });

  const sorted = [...scored].sort((a, b) => {
    if (a.age === null && b.age === null) return a.profile.profileCode.localeCompare(b.profile.profileCode);
    if (a.age === null) return 1;   // unknowns last
    if (b.age === null) return -1;
    if (a.age !== b.age) return a.age - b.age;
    const sa = suffixAge(a.profile.profileCode) ?? a.age;
    const sb = suffixAge(b.profile.profileCode) ?? b.age;
    if (sa !== sb) return sa - sb;
    return a.profile.profileCode.localeCompare(b.profile.profileCode);
  });

  const warnings: string[] = [];
  const links = sorted.map((entry, i) => {
    const baseProfileId = i === 0 ? null : sorted[i - 1].profile.id;
    return {
      ...entry,
      baseProfileId,
      changed: baseProfileId !== entry.profile.baseProfileId,
    };
  });

  for (const l of links) {
    const code = l.profile.profileCode;
    if (l.source === 'unknown') {
      warnings.push(`${code}: возраст не определён (ageLabel «${l.profile.ageLabel ?? '—'}», суффикс кода не распознан) — поставлен в конец цепочки`);
    } else if (l.source === 'code') {
      warnings.push(`${code}: возраст угадан по коду (≈${l.age}), в ageLabel «${l.profile.ageLabel ?? '—'}» цифр нет`);
    } else if (l.source === 'ageLabelRange') {
      warnings.push(`${code}: ageLabel «${l.profile.ageLabel}» — диапазон, взята нижняя граница ${l.age}`);
    }
  }

  // Label-vs-suffix disagreement, reported only where it actually REORDERS the
  // chain. Comparing each profile's number against its own suffix band flags
  // half the corpus for nothing (`HERO_OLD [34]` is fine in a film about a young
  // man). What matters is a PAIR the number puts in the opposite order from the
  // state names — `LENA_MID [32]` before `LENA_ADULT [44]` — because there one of
  // the two labels is probably wrong.
  const ranked = links.map((l) => ({ code: l.profile.profileCode, age: l.age, rank: suffixAge(l.profile.profileCode) }));
  for (let i = 1; i < ranked.length; i++) {
    const prev = ranked[i - 1];
    const cur  = ranked[i];
    if (prev.rank === null || cur.rank === null) continue;
    if (prev.rank > cur.rank) {
      warnings.push(
        `${prev.code} (${prev.age}) стоит перед ${cur.code} (${cur.age}), но по названиям состояний должно быть наоборот `
        + '— порядок взят по ageLabel, проверьте эти два',
      );
    }
  }
  const ages = links.map((l) => l.age).filter((a): a is number => a !== null);
  const dupes = ages.filter((a, i) => ages.indexOf(a) !== i);
  for (const a of new Set(dupes)) {
    const codes = links.filter((l) => l.age === a).map((l) => l.profile.profileCode).join(', ');
    warnings.push(`одинаковый возраст ${a} у ${codes} — порядок между ними выбран по коду`);
  }

  return { links, warnings };
}

/**
 * Does walking up from `profileId` loop back on itself?
 *
 * Needed because a PARTIAL relink can close a loop that neither link closes on
 * its own: if `A` was hand-linked to derive from `B` and the age order says `B`
 * derives from `A`, writing only `B`'s link yields `A → B → A`, and then every
 * base approve queues the other one forever.
 */
export function wouldCycle(profileId: string, baseOf: Map<string, string | null>): boolean {
  const seen = new Set<string>([profileId]);
  let cursor = baseOf.get(profileId) ?? null;
  for (let hops = 0; cursor && hops < 50; hops++) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = baseOf.get(cursor) ?? null;
  }
  return false;
}
