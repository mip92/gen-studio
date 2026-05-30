-- Seed: visual_styles registry.
-- Run AFTER migrations/20260528_add_visual_style.sql.
-- Idempotent: ON CONFLICT updates the row (so style content can be edited and re-seeded).

BEGIN;

-- ============ photoreal_cinematic ============
-- Existing style for last_shift and night_courier. Style-block matches the
-- prior {STYLE} token used in those projects' shot prompts.
INSERT INTO visual_styles (id, "displayName", "styleBlock", "defaultNegative", "identityStack", "loraPipeline", "characterIpTemplateKey", "environmentTemplateKey", "datasetTemplateKey", "loraTrainTemplateKey", "createdAt", "updatedAt")
VALUES (
  'photoreal_cinematic',
  'Photoreal cinematic',
  'photorealistic cinematic, 35mm full-frame, documentary photoreal, anti-glamour, slight film grain, natural light, cinematic composition, no plastic skin, slight depth of field',
  'cartoon, anime, manga, chibi, 3D render, CGI, painterly stylization, oversmooth skin, plastic skin, harsh dramatic shadows, glamour photography, beauty retouching, fashion shoot, makeup, deformed hands, extra fingers, two heads, watermark, text, brand logos',
  'lora_face_lock',
  'character_lora_florence2',
  'char_lora_sdxl',
  'environment_flux',
  'dataset_florence2_creator',
  'lora_train_sdxl',
  NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "styleBlock" = EXCLUDED."styleBlock",
  "defaultNegative" = EXCLUDED."defaultNegative",
  "identityStack" = EXCLUDED."identityStack",
  "loraPipeline" = EXCLUDED."loraPipeline",
  "characterIpTemplateKey" = EXCLUDED."characterIpTemplateKey",
  "environmentTemplateKey" = EXCLUDED."environmentTemplateKey",
  "datasetTemplateKey" = EXCLUDED."datasetTemplateKey",
  "loraTrainTemplateKey" = EXCLUDED."loraTrainTemplateKey",
  "updatedAt" = NOW();

-- ============ graphic_novel_cell_shaded ============
-- New style for bio_plus. No character LoRA training; identity via IP-Adapter
-- at low weight (0.4) plus comic-style LoRA + text-anchor (mole, freckle, badge).
INSERT INTO visual_styles (id, "displayName", "styleBlock", "defaultNegative", "identityStack", "loraPipeline", "characterIpTemplateKey", "environmentTemplateKey", "datasetTemplateKey", "loraTrainTemplateKey", "createdAt", "updatedAt")
VALUES (
  'graphic_novel_cell_shaded',
  'Graphic novel (cell-shaded)',
  'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, warm lamp light highlights against deep blue night shadows, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic',
  'photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, harsh dramatic shadows, side-lit drama',
  'ip_adapter_plus_style_lora',
  'none',
  'char_ip_graphic_novel',
  'environment_graphic_novel',
  NULL,
  NULL,
  NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "styleBlock" = EXCLUDED."styleBlock",
  "defaultNegative" = EXCLUDED."defaultNegative",
  "identityStack" = EXCLUDED."identityStack",
  "loraPipeline" = EXCLUDED."loraPipeline",
  "characterIpTemplateKey" = EXCLUDED."characterIpTemplateKey",
  "environmentTemplateKey" = EXCLUDED."environmentTemplateKey",
  "datasetTemplateKey" = EXCLUDED."datasetTemplateKey",
  "loraTrainTemplateKey" = EXCLUDED."loraTrainTemplateKey",
  "updatedAt" = NOW();

-- ============ Now we can add the FK constraint ============
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_visual_style_fkey;
ALTER TABLE projects
  ADD CONSTRAINT projects_visual_style_fkey
  FOREIGN KEY ("visualStyle") REFERENCES visual_styles(id);

COMMIT;
