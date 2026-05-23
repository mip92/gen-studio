-- Sync scriptText to 207-shot reality: fixes 4 stale numbers + the SHOTLIST.md reference.

BEGIN;

-- 1. Header line: 200 шотов × 5 секунд → 207 шотов × 5 секунд
UPDATE projects SET "scriptText" = replace(
  "scriptText",
  '~17 минут (200 шотов',
  '~17 мин 15 сек (207 шотов'
) WHERE slug='last_shift';

-- 2. A3 deep night: 25 → 26 (added A3_SH13A transition)
UPDATE projects SET "scriptText" = replace(
  "scriptText",
  '### A3 — Deep Night (Rising B) — 25 шотов',
  '### A3 — Deep Night (Rising B) — 26 шотов'
) WHERE slug='last_shift';

-- 3. A5 daylight: 31 → 32 (added A5_SH16A transition)
UPDATE projects SET "scriptText" = replace(
  "scriptText",
  '### A5 — Daylight (Rising D) — 31 шот',
  '### A5 — Daylight (Rising D) — 32 шота'
) WHERE slug='last_shift';

-- 4. A6 midpoint: 19 → 20 (added A6_SH19 emotional beat)
UPDATE projects SET "scriptText" = replace(
  "scriptText",
  '### A6 — Midpoint Twist — 19 шотов',
  '### A6 — Midpoint Twist — 20 шотов'
) WHERE slug='last_shift';

-- 5. SHOTLIST.md reference line: 200 → 207
UPDATE projects SET "scriptText" = replace(
  "scriptText",
  'все 200 шотов с paste-ready промптами',
  'все 207 шотов с paste-ready промптами'
) WHERE slug='last_shift';

COMMIT;
