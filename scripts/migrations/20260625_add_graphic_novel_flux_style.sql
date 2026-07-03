-- Migration: 20260625_add_graphic_novel_flux_style
-- Registers the 'graphic_novel_flux' visual style — same cell-shaded comic look
-- as 'graphic_novel_cell_shaded' but rendered on a Flux base + Flux comic
-- style-LoRA (node "2"), cfg=1.0 + FluxGuidance. Identity is text-only
-- (promptBase) with an OPTIONAL Flux Redux anchor on single-character shots when
-- the anchor PNG + Redux model files are present on disk.
--
-- Apply by hand (Prisma shadow-database issues on Windows per
-- PROJECT_CREATION_GUIDE Приложение A):
--   psql -h localhost -U gen_studio -d gen_studio -f migrations/20260625_add_graphic_novel_flux_style.sql
--
-- Idempotent: ON CONFLICT DO NOTHING — re-running is safe.

BEGIN;

INSERT INTO visual_styles (
  id, "displayName", "styleBlock", "defaultNegative",
  "identityStack", "loraPipeline",
  "characterIpTemplateKey", "environmentTemplateKey", "datasetTemplateKey", "loraTrainTemplateKey"
) VALUES (
  'graphic_novel_flux',
  'Graphic Novel (Flux)',
  'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin',
  'photograph, photorealistic, 3D render, CGI, plastic skin, hyperrealistic, real human face, deformed hands, extra fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, oversaturated color',
  -- Identity via a single anchor reference (Flux Redux) + comic style-LoRA.
  'ip_adapter_plus_style_lora',
  -- No per-character LoRA training — identity is anchor/text driven.
  'none',
  'scene_single_character_flux_comic',
  'scene_environment_flux_comic',
  NULL,
  NULL
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
