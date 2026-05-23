-- Sync Project.scriptText with the current 204-shot reality:
--   - update total shot count (was 200)
--   - mention the 4 new establishing shots added for viewer orientation
-- No PATCH endpoint for scriptText — documented SQL exception per
-- feedback_use_api_not_direct_db.

BEGIN;

UPDATE projects SET "scriptText" = replace(
  replace(
    "scriptText",
    'YouTube long form, advertiser-safe. ~17 минут (200 шотов × 5 секунд).',
    'YouTube long form, advertiser-safe. ~17 мин 20 сек (204 шота × 5 секунд, включая 4 establishing-шота для ориентации зрителя в актах A2, A4, A5, A6).'
  ),
  '### A2 — Settling (Rising A) — 22 шота
Первая ночь. Виньетка военного. Молчаливая дань уважения между ним и
проводницей: оба знают, что значит молчать.',
  '### A2 — Settling (Rising A) — 23 шота
Первая ночь. Открывается EWS-дроном поезда в ночной равнине (orientation
SH00), потом WS коридор → виньетка военного. Молчаливая дань уважения
между ним и проводницей: оба знают, что значит молчать.'
)
WHERE slug = 'last_shift';

UPDATE projects SET "scriptText" = replace(
  "scriptText",
  '### A4 — Pre-dawn (Rising C) — 18 шотов
Бизнесмен бьётся об отсутствие сети. Сдаётся, берёт книгу попутчика, начинает
читать. Comic relief после двух виньеток горя. Рассвет на железнодорожном мосту.',
  '### A4 — Pre-dawn (Rising C) — 19 шотов
Открывается EWS pre-dawn поезд → WS купе бизнесмена со спящим попутчиком
(orientation SH01A) → MS бизнесмен. Бьётся об отсутствие сети. Сдаётся,
берёт книгу попутчика, начинает читать. Comic relief после двух виньеток
горя. Рассвет на железнодорожном мосту.'
)
WHERE slug = 'last_shift';

UPDATE projects SET "scriptText" = replace(
  "scriptText",
  '### A5 — Daylight (Rising D) — 30 шотов
Виньетки деда-фронтовика и пары после ссоры. Дед делится домашним пирогом —
проводница впервые за смену искренне улыбается. Пара мирится через прикосновение
на закрытой книге.',
  '### A5 — Daylight (Rising D) — 31 шот
Открывается EWS-дроном поезда по берёзовой роще в утреннем свете
(orientation SH00) → WS коридор → виньетки деда-фронтовика и пары после
ссоры. Дед делится домашним пирогом — проводница впервые за смену
искренне улыбается. Пара мирится через прикосновение на закрытой книге.'
)
WHERE slug = 'last_shift';

UPDATE projects SET "scriptText" = replace(
  "scriptText",
  '### A6 — Midpoint Twist — 18 шотов
Виньетка музыканта в тамбуре (iconic frame). После — проводница замечает у
девочки ту же плюшевую сову, что была у её дочери. Reveal: кольцо на цепочке
под кителем. Сюжетный поворот.',
  '### A6 — Midpoint Twist — 19 шотов
Открывается EWS-дроном поезда в золотом часу через бесконечное поле,
крошечная фигура в приоткрытой двери тамбура (orientation SH00) → виньетка
музыканта (iconic frame). После — проводница замечает у девочки ту же
плюшевую сову, что была у её дочери. Reveal: кольцо на цепочке под
кителем. Сюжетный поворот.'
)
WHERE slug = 'last_shift';

COMMIT;
