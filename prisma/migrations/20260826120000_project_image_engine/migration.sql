-- Project.imageEngine — какая МОДЕЛЬ рисует кадры проекта.
--
-- Ось, отдельная от visualStyle, по образцу videoEngine у клипов. Колонка
-- NULLABLE и БЕЗ default намеренно: NULL значит «вывести из visualStyle», то
-- есть ровно текущее поведение через SceneFactory. Так новый проект, созданный
-- без явного выбора, ведёт себя как вёл.
ALTER TABLE "projects" ADD COLUMN "imageEngine" TEXT;

-- Существующие строки заполняем выводом из стиля, чтобы колонка сразу говорила
-- правду, а не молчала. Значения совпадают с deriveImageEngineId() в
-- src/generation/images/image-engine.ts — расхождение между ними означало бы,
-- что проект после ручной правки колонки начнёт рисоваться иначе.
UPDATE "projects" SET "imageEngine" = CASE "visualStyle"
  WHEN 'realcomic_qwen'            THEN 'qwen2511'
  WHEN 'graphic_novel_cell_shaded' THEN 'sdxl_comic'
  WHEN 'graphic_novel_flux'        THEN 'flux1_comic'
  ELSE 'sdxl_photoreal'
END;

-- Список допустимых значений держим в БД, а не только в TypeScript: колонку
-- правят и руками, и сидерами, а опечатка в имени движка иначе всплывёт
-- только на рендере.
ALTER TABLE "projects" ADD CONSTRAINT "projects_imageEngine_check"
  CHECK ("imageEngine" IS NULL OR "imageEngine" IN
    ('qwen2511', 'flux2_klein', 'sdxl_photoreal', 'sdxl_comic', 'flux1_comic'));
