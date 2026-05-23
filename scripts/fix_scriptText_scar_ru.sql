-- One-off cleanup of the leftover Russian word "шрам" in projects.scriptText
-- that the earlier unscar() function missed (it only matched English variants).
-- API exception: no PATCH endpoint exists for Project.scriptText.

UPDATE projects
SET "scriptText" = replace(
  "scriptText",
  'тонкий шрам над левой бровью',
  'маленькая родинка у левой нижней челюсти'
)
WHERE slug = 'last_shift';
