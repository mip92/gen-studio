-- bio_plus — resolve {TOKEN} placeholders in shots.promptFields.
-- Run AFTER seed_bio_plus.sql + all shot files have populated 200 rows.
-- Replaces global tokens ({STYLE}, {NEG}, {PALETTE_*}) and character age-variant tokens
-- with full identity blocks. After this script, promptFields.positivePrompt is paste-ready
-- for SDXL/Flux without further substitution.
--
-- Idempotent: re-running replaces already-resolved text further (e.g. if you fix a typo
-- and want to re-seed, just re-run seed_bio_plus.sql first which DELETEs CASCADE, then
-- re-run shot files, then re-run this resolver).

BEGIN;

UPDATE shots SET "promptFields" = (
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("promptFields"::text,
  -- ============ GLOBAL TOKENS ============
  '{STYLE}', 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, warm lamp light highlights against deep blue night shadows, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'),
  '{NEG}', 'photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, runway, harsh dramatic shadows, side-lit drama'),

  -- ============ PALETTE TOKENS (9) ============
  '{PALETTE_COLD_OPEN}', 'cool grey-blue stairwell daylight, neon yellow corridor bulb accents, deep indigo shadows in corners'),
  '{PALETTE_A1}', 'warm sodium pharmacy yellow, summer dust haze, brown tobacco-leaf shadows, golden afternoon sunlight'),
  '{PALETTE_A2}', 'corporate cool teal plus brass-gold accents, cold office fluorescent fill, white-blue highlights'),
  '{PALETTE_A3}', 'corporate white plus cold conference-room blue, warm hotel-lamp accents for night shots'),
  '{PALETTE_A4}', 'electric pink Minsk neon plus chrome cold whites plus bourbon amber for low-key bar shots, sodium dust yellow for the final pharmacy shot'),
  '{PALETTE_A5}', 'cool grey overcast cafe daylight transitioning to deep amber kitchen-lamp night with black windows'),
  '{PALETTE_A6}', 'cool grey stairwell plus sodium yellow notary office plus cold silver street, transition palette'),
  '{PALETTE_A7}', 'cold winter silver plus flickering retail fluorescent white plus grey-blue overcast street'),
  '{PALETTE_CODA}', 'silvery night blue through dormitory window plus distant warm yellow pharmacy sign on horizon'),

  -- ============ HEROINE_ELENA age variants (7) ============
  '{HEROINE_ELENA_AGE_28}', 'a young Belarusian woman age 28, mousy ash-brown hair shoulder length parted in centre, pale grey-blue eyes set wide apart, thin pale lips, small dark mole on left jawline below ear, narrow nose with slight bump, simple pale cotton summer sundress, thin silver chain bearing small Orthodox cross hidden under sundress neckline, faint sunburn on nose bridge, no makeup no jewelry beyond cross, small build, weary patient new-mother expression'),
  '{HEROINE_ELENA_AGE_38}', 'a Belarusian woman age 38, mousy ash-brown hair shoulder length parted in centre tied back loosely, pale grey-blue eyes with first hint of crow''s feet, thin pale lips, small dark mole on left jawline, brown autumn knee-length coat over thin white blouse, thin silver chain with mother''s Orthodox cross hidden under blouse, no makeup, weary patient expression, slight downward set at corners of mouth'),
  '{HEROINE_ELENA_AGE_39}', 'a Belarusian woman age 39, mousy ash-brown hair shoulder length tied back tight, pale grey-blue eyes with crow''s feet, dark navy double-breasted business blazer over crisp white blouse, silver Orthodox cross still hidden under blouse, thin pale lips, small dark mole on left jawline, weary patient face with corporate polish overlay'),
  '{HEROINE_ELENA_AGE_41}', 'a Belarusian woman age 41, ash-brown hair shoulder length pinned back, pale grey-blue eyes with faint dark circles, same dark navy blazer with Silver Partner badge on left lapel, white blouse, silver cross hidden under blouse, thin pale lips slightly tighter than before, small dark mole on left jawline'),
  '{HEROINE_ELENA_AGE_42}', 'a Belarusian woman age 42, ash-brown hair loose and unwashed, pale grey-blue eyes with visible fatigue, brown coat sodden with rain in outdoor shots, navy blazer in indoor shots, no makeup, silver cross hidden under blouse, thin pale lips set thin, small dark mole on left jawline, weary face'),
  '{HEROINE_ELENA_AGE_44}', 'a Belarusian woman age 44, mousy ash-brown shoulder-length hair with first grey at temples, pale grey-blue eyes, dark navy blazer with Gold Partner badge on lapel worn-looking, thin white blouse, silver Orthodox cross still hidden under blouse, deeper crow''s feet, small dark mole on left jawline, weary patient expression'),
  '{HEROINE_ELENA_AGE_46}', 'a Belarusian woman age 46, ash-brown shoulder-length hair with grey strands at temples, pale grey-blue eyes with deeper crow''s feet and nasolabial lines, blue polyester cleaner''s smock or plain home blouse, silver Orthodox cross of her mother now worn OVER the blouse on visible chain, small dark mole on left jawline, no makeup, weary patient expression'),

  -- ============ SPONSOR_SVETA variants (6) ============
  '{SPONSOR_SVETA_AGE_42}', 'a Belarusian woman age 42, shoulder-length light-brown hair professionally styled and slightly back-combed, warm hazel eyes with practised friendly crinkles, full burgundy lipstick precisely applied within natural lip line, crisp white tailored business blazer over white silk shell blouse, single gold-toned lapel badge reading Серебряный директор БиоПлюс centred on left lapel, small gold stud earrings, French manicure'),
  '{SPONSOR_SVETA_AGE_43}', 'a Belarusian woman age 43, light-brown hair styled tighter than before, burgundy lipstick fresh, white blazer with gold БиоПлюс director badge crisp on lapel, faint tiredness around eyes from travel, French manicure'),
  '{SPONSOR_SVETA_AGE_45}', 'a Belarusian woman age 45, light-brown hair styled high and back-combed, burgundy lipstick precise, crisp white tailored blazer with gold Серебряный директор БиоПлюс badge on left lapel, small gold stud earrings, French manicure'),
  '{SPONSOR_SVETA_AGE_46_ROBE}', 'a Belarusian woman age 46 caught at home at 2am, light-brown hair flat and loose unstyled, NO makeup, dark circles under exhausted eyes, beige terrycloth bathrobe with no badge, faint blue nightlight cast on her face, vulnerable mode never seen in public'),
  '{SPONSOR_SVETA_AGE_48}', 'a Belarusian woman age 48, light-brown hair styled, fresh burgundy lipstick, crisp white tailored business blazer with gold Серебряный директор БиоПлюс badge on left lapel, small gold stud earrings, French manicure, corporate polish restored'),
  '{SPONSOR_SVETA_AGE_50_ARRESTED}', 'a Belarusian woman age 50 being led under arrest, white blazer now SOILED with grey street grime on left shoulder, light-brown hair disheveled, NO makeup, faint dark circles under exhausted eyes, visible handcuffs at wrists in front of body, gold badge ABSENT from lapel, broadcast-image quality with slight chromatic aberration'),

  -- ============ LEADER_VIKTOR variants (3) ============
  '{LEADER_VIKTOR_AGE_55}', 'a Belarusian man age 55, broad-shouldered and tall 188cm, thick salt-and-pepper hair styled with pomade, deeply tanned face, square jaw with grey stubble, narrow brown eyes under heavy brows, dark navy double-breasted suit with faint pinstripe over powder-blue shirt no tie, gold pinky ring with square cubic-zirconia stone on right hand, gold-rimmed Seiko 5 replica watch on left wrist'),
  '{LEADER_VIKTOR_AGE_56}', 'a Belarusian man age 56, broad-shouldered and tall, salt-and-pepper hair, deeply tanned face with square jaw and grey stubble, narrow brown eyes, same dark navy double-breasted suit slightly tighter at chest than before, gold pinky ring with cubic-zirconia stone right hand, gold-rimmed Seiko 5 replica left wrist'),
  '{LEADER_VIKTOR_AGE_58}', 'a Belarusian man age 58, broad-shouldered and tall, salt-and-pepper hair, deeply tanned face square jaw grey stubble narrow brown eyes, same dark navy suit with BIO+ Diamond lapel pin, gold pinky ring with cubic-zirconia stone right hand, gold-rimmed Seiko 5 replica left wrist, faint sweat at hairline under stage lights'),

  -- ============ FRIEND_LARISA variants (3) ============
  '{FRIEND_LARISA_AGE_38}', 'a Belarusian woman age 38, dark-brown hair pulled back into low ponytail with no fly-away strands, oval face with sharp cheekbones, thin oval brushed-silver glasses frames, calm hazel eyes, no makeup, thin pale lips, beige autumn wool coat over fitted black turtleneck sweater, small build, no jewelry, librarian-academic aesthetic'),
  '{FRIEND_LARISA_AGE_42}', 'a Belarusian woman age 42, dark-brown hair pulled back in low ponytail, brushed-silver oval glasses, calm hazel eyes with faint vertical line between brows, grey wool cardigan over fitted black turtleneck, no makeup, thin pale lips, no jewelry'),
  '{FRIEND_LARISA_AGE_46}', 'a Belarusian woman age 46, dark-brown hair pulled back in low ponytail, brushed-silver oval glasses slightly fogged from cold, calm hazel eyes with deeper lines, black down winter jacket over fitted black turtleneck, no makeup, thin pale lips, no jewelry'),

  -- ============ MOM_GALINA variants (2) ============
  '{MOM_GALINA_AGE_60}', 'a Belarusian woman age 60, grey-streaked hair pinned back severely, deep-set tired grey-blue eyes with prominent crow''s feet, thin pale lips set firmly, narrow lined face with small mole on left jawline (visual rhyme with her daughter), long grey pharmacist''s lab coat over beige knit cardigan, thin reading glasses on steel-link chain hanging around her neck against lab coat, no makeup, modest stud earrings'),
  '{MOM_GALINA_AGE_73}', 'a Belarusian woman age 73, thinner grey hair pinned back, deep-set tired grey-blue eyes with deep crow''s feet, thin pale lips set firmly, deeper lines in face, small mole on left jawline, long grey pharmacist''s lab coat over beige knit cardigan, thin reading glasses on steel-link chain around neck, slower posture, no makeup'),

  -- ============ NEIGHBOR_TAMARA (1, A1 only) ============
  '{NEIGHBOR_TAMARA_AGE_55}', 'a Belarusian woman age 55, salt-and-pepper hair pinned up loosely with grey roots at temples and burgundy-dyed lengths, soft round face with kind worried eyes, burgundy lipstick painted slightly outside natural lip line, gold-tone clip earrings, bright floral summer dress in faded blues and pinks, canvas shoulder bag with leather handles'),

  -- ============ DAUGHTER_OLDER variants (6) ============
  '{DAUGHTER_OLDER_AGE_04}', 'a Belarusian girl age 4 toddler proportions, ash-brown hair short to chin, pale grey-blue eyes matching her mother, simple cotton sundress in pale yellow, small build, modest natural pose holding side of baby pram'),
  '{DAUGHTER_OLDER_AGE_11}', 'a Belarusian girl age 11 child proportions, ash-brown hair shoulder length, pale grey-blue eyes, iridescent dragonfly hair clip with enamel blue-green wings pinned just above right ear, neat school uniform white blouse navy pleated skirt navy cardigan white knee-socks, small build, serious quiet observant expression'),
  '{DAUGHTER_OLDER_AGE_13}', 'a Belarusian girl age 13 still child proportions slightly taller, ash-brown hair shoulder length, pale grey-blue eyes, iridescent dragonfly hair clip pinned above right ear, school sweater over white blouse navy skirt, small build, serious quiet expression with faint disapproval'),
  '{DAUGHTER_OLDER_AGE_14}', 'a Belarusian girl age 14 child proportions, ash-brown hair shoulder length, pale grey-blue eyes, casual home hoodie, dragonfly clip not in hair (kept on shelf), small build, serious quiet expression'),
  '{DAUGHTER_OLDER_AGE_16}', 'a Belarusian girl age 16 — ONLY back-of-head and ascending body visible, ash-brown hair shoulder length, grey school backpack on shoulders, dark school winter coat, FACE NEVER VISIBLE in this age variant'),
  '{DAUGHTER_OLDER_AGE_18}', 'a young Belarusian woman age 18, ash-brown hair tied back loose, pale grey-blue eyes, polo shirt with small Krakow university logo on chest, modest natural pose, serious quiet observant expression, viewed through phone screen with slight digital blur'),

  -- ============ DAUGHTER_YOUNGER variants (6) ============
  '{DAUGHTER_YOUNGER_AGE_00}', 'a newborn Belarusian baby age four months sleeping in white baby pram, soft cotton blanket, only top of head visible, NO face details'),
  '{DAUGHTER_YOUNGER_AGE_08}', 'a Belarusian girl age 8 child proportions, ash-brown hair short with small fringe across forehead, pale grey-blue eyes matching mother and sister, light scatter of small freckles across nose bridge and cheekbones, casual home clothes, plush rabbit with one missing ear at her elbow or beside her'),
  '{DAUGHTER_YOUNGER_AGE_10}', 'a Belarusian girl age 10 child proportions, ash-brown hair short with small fringe, pale grey-blue eyes, light freckles on nose bridge, casual home clothes, plush rabbit with one missing ear in background'),
  '{DAUGHTER_YOUNGER_AGE_11}', 'a Belarusian girl age 11 child proportions, ash-brown hair short with small fringe, pale grey-blue eyes, light freckles on nose bridge, pyjamas at home, plush rabbit with one missing ear on pillow'),
  '{DAUGHTER_YOUNGER_AGE_13}', 'a Belarusian girl age 13 still child proportions, ash-brown hair short with small fringe across forehead, pale grey-blue eyes, light freckles across nose bridge and cheekbones, dark winter coat over school uniform, grey school backpack, small build, serious quiet expression, freckles as identity anchor'),
  '{DAUGHTER_YOUNGER_AGE_15}', 'a Belarusian girl age 15, ash-brown hair short with small fringe, pale grey-blue eyes, light freckles still visible on nose bridge, plain dark hoodie at home, small build, very quiet observant child with serious eyes, plush rabbit ABSENT (discarded)')

)::jsonb
WHERE "projectId" = (SELECT id FROM projects WHERE slug = 'bio_plus');

-- Sanity check: any remaining {TOKEN}s in resolved promptFields?
DO $$
DECLARE
  v_remaining INT;
BEGIN
  SELECT COUNT(*) INTO v_remaining FROM shots sh
  JOIN projects p ON sh."projectId" = p.id
  WHERE p.slug = 'bio_plus'
    AND sh."promptFields"::text ~ '\{[A-Z_0-9]+\}';
  IF v_remaining > 0 THEN
    RAISE NOTICE 'WARNING: % shots still contain unresolved {TOKEN} placeholders. Check token list against shot prompts.', v_remaining;
  ELSE
    RAISE NOTICE 'OK: All {TOKEN} placeholders resolved across all shots.';
  END IF;
END $$;

COMMIT;
