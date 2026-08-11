/**
 * Leading-bleed ("понь" / "ща") detection profiles — the shared vocabulary
 * between Voiceover.artifactProfile, the trim endpoints and the Python worker
 * (scripts/trim_lead_artifact.py, PROFILES).
 *
 * Lives in its own file so both the TTS module (which runs the trimmer) and the
 * voiceovers module (which stores the setting) can import it without either
 * module depending on the other.
 *
 * Assigning a profile OPTS A VOICE IN to trimming, and the default is out.
 * F5 prepends a burst for some voices only — measured 2026-08-03 across 14
 * sampled renders per voice/engine, «Кошатница» bled 14/14 and «агента Смита»
 * 13/14, while all eleven other voices came back 0/14. On a voice that does not
 * bleed the detector is a liability rather than a no-op: its signature ("a quiet
 * blob, then a gap") also fits a quiet leading preposition, and it would cut the
 * word off. So a voice gets trimmed only when someone states that it needs it.
 */
export const ARTIFACT_PROFILES = [
  {
    key:   'pon',
    label: '«понь» — громкий всплеск (Кошатница)',
    hint:  'Всплеск −14…−28 дБ, хорошо отделён тишиной. Ловится порогами '
         + 'silencedetect. Проверен на 474 озвучках.',
  },
  {
    key:   'sha',
    label: '«ща» — тихий всплеск (агента Смита)',
    hint:  'Всплеск −33…−49 дБ, лежит на пороге −40 дБ, поэтому ищется по '
         + 'огибающей: артефакт тише последующей речи. Проверен на 269 озвучках.',
  },
] as const;

export type ArtifactProfileKey = (typeof ARTIFACT_PROFILES)[number]['key'];

export const ARTIFACT_PROFILE_KEYS: readonly string[] = ARTIFACT_PROFILES.map((p) => p.key);

/** Null/'' (no profile) is valid — it means "this voice does not bleed". */
export function isArtifactProfile(value: unknown): value is ArtifactProfileKey {
  return typeof value === 'string' && ARTIFACT_PROFILE_KEYS.includes(value);
}
