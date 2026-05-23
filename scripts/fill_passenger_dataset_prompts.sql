-- Upgrade all 9 passenger profiles to FATHER_BASE-level dataset prompts:
-- full promptBase + ~20 lab-angle prompts (identity lock on neutral wall) +
-- ~25 environmental variety prompts (in-vignette scenes) + character-tailored
-- strong negative + triggerToken + targetImages=30 + useIpAdapter=FALSE
-- (LoRA now drives identity, not IP-Adapter, since workflow was switched).

BEGIN;

-- ============================================================================
-- PAX_MIL — Military passenger (30yo man)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '30',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_MIL_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_MIL_BASE, 30 year old Eastern European man, short brown buzzcut, hollow cheeks, sharp jawline, brown eyes with thousand-yard stare, weathered male skin texture with natural pores and faint stubble shadow, plain dark olive green military shirt without insignia or readable text, no rank patches, calm restrained expression, documentary photo, photorealistic, 35mm full-frame$pb$,
  "promptAngles"  = $pa$extreme close-up face front, eye level, neutral pale grey backdrop, sharp focus on eyes, 100mm portrait
close-up portrait three-quarter left, neutral pale grey backdrop, soft documentary light, 85mm
close-up portrait three-quarter right, neutral pale grey backdrop, soft documentary light, 85mm
close-up strict left profile, jawline clear, neutral pale grey backdrop, 100mm
close-up strict right profile, jawline clear, neutral pale grey backdrop, 100mm
medium close-up chest-up front, hands at sides, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, jaw set, neutral pale grey backdrop, 50mm
medium close-up chest-up three-quarter right, neutral pale grey backdrop, 50mm
medium shot waist-up front, hands at sides, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, arms loosely at sides, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter right, neutral pale grey backdrop, 35mm
medium shot waist-up strict left profile, neutral pale grey backdrop, 50mm
medium shot waist-up strict right profile, neutral pale grey backdrop, 50mm
medium shot from behind, buzzcut and shirt collar visible, neutral pale grey backdrop, 50mm
full body front, soldier posture, hands at sides, neutral pale grey backdrop, 35mm
full body three-quarter left, weight on one leg, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile, neutral pale grey backdrop, 35mm
full body strict back view, neutral pale grey backdrop, 35mm
low-angle full body front, looking off frame, neutral pale grey backdrop, 24mm
high-angle close-up portrait, eyes downcast, neutral pale grey backdrop, 85mm
extreme close-up of clenched fist with faint old scar on knuckles, neutral pale grey backdrop, 100mm macro$pa$,
  "promptVariety" = $pv$Medium close-up sitting alone in first-class SV train compartment by indigo night window, amber reading lamp on face, looking out, jaw set, dark olive military shirt.
Extreme close-up of weathered hands folding and unfolding a small worn black-and-white photograph at compartment tabletop, reading lamp pool of warm light.
Close-up eyes only profile against compartment window at night, reflections of passing rare farm lights crossing iris, no blinking.
Strict side close-up profile, steam rising from a vintage metal tea glass holder past his cheek, warm amber interior light.
Medium shot taking a single slow sip of tea from glass holder, eyes still on window, late evening train interior.
Medium shot low angle of him still in same posture two hours later, untouched tea on small folding table.
Extreme close-up of his clenched fist on thigh, knuckles white, faint old scar across the back of hand, amber interior light.
Medium shot carefully sliding worn photograph back into shirt pocket, deliberate gentle motion, amber compartment light.
Wide shot of him sitting alone in narrow SV compartment, military duffel bag stored above, calm presence taking the whole space.
Medium close-up three-quarter back, head turned slightly to glance at off-frame corridor, amber train lamps in background.
Full body strict side standing in train vestibule at night looking out through narrow window, breath visible in cool air.
Medium shot sitting at compartment seat, hands clasped between knees, head slightly bowed, contemplative.
Close-up high angle of him asleep against compartment wall, lips slightly parted, finally resting.
Medium shot in train corridor at night, walking away from camera toward his compartment, amber lamps lighting his back.
Strict side profile waist-up, faint moisture catch on lower eyelash, late night train window indigo behind.
Extreme close-up of dog-tags hanging from neck on a thin chain (no readable text on tags), 100mm macro.
Medium close-up at compartment door, hand on the latch about to slide it closed, looking back over shoulder.
Full body high-angle of him sitting on lower berth, looking down at folded hands, plain dark military shirt and pants.
Medium shot drinking coffee from a paper cup in train corridor at dawn, cold blue pre-dawn light.
Three-quarter left medium, sitting at compartment table, simple field rations on a small plate untouched.
Close-up of him noticing something out of frame, micro-alertness in face, instinctive jaw tightening.
Medium shot of him handing his ticket back to off-frame conductor, brief eye contact, restrained nod.
Full body low-angle of him in SV compartment standing to stretch, ceiling of train compartment visible, late night.
Strict back full body, looking out at night fields through compartment window, hands resting on the window sill.
Medium shot lying on lower berth on his back, eyes open in darkness, amber line of corridor light through compartment door gap.$pv$,
  "negative"      = $nb$different identity, woman, female features, child face, very young man, beard, mustache, long hair, makeup, lipstick, jewelry, earrings, necklace visible over shirt, glamour styling, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, signature, text on uniform, readable military insignia, rank patches, flag patches, real-world military symbols, weapon, blood, wound, helmet, modern brand logos, deformed hands, extra fingers, two heads$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_MIL';

-- ============================================================================
-- PAX_MOM — Mother with infant (25yo woman)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '25',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_MOM_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_MOM_BASE, 25 year old Eastern European woman, long dark brown wavy hair loose past shoulders, no makeup, slight purple under-eye shadows from sleepless nights, gentle exhausted face with soft mouth, natural skin pores, plain cream knit cardigan over a simple white tee, sleeping infant (face mostly hidden against shoulder, natural baby proportions, no expression visible) cradled in her arms, motherhood softness, documentary photo, photorealistic, 35mm$pb$,
  "promptAngles"  = $pa$extreme close-up face front, holding sleeping infant on shoulder, neutral pale grey backdrop, soft window light, 100mm
close-up portrait three-quarter left, infant face hidden against shoulder, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, infant cradled, neutral pale grey backdrop, 85mm
close-up strict left profile, head turned to look at infant, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, infant against shoulder, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, head bowed to infant, neutral pale grey backdrop, 50mm
medium close-up chest-up three-quarter right, gentle smile, neutral pale grey backdrop, 50mm
medium shot waist-up front, cradling infant, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, swaying motion suggested, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter right, neutral pale grey backdrop, 35mm
medium shot strict left profile, cradling infant, neutral pale grey backdrop, 50mm
medium shot from behind, infant face just visible past her shoulder, neutral pale grey backdrop, 50mm
full body front, standing softly, cradling infant, neutral pale grey backdrop, 35mm
full body three-quarter left, weight on one leg, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict back view, infant carrier or shawl shape visible, neutral pale grey backdrop, 35mm
high-angle close-up of her hand cupping infant head, neutral pale grey backdrop, 100mm macro
extreme close-up of tiny infant hand gripping her index finger, neutral pale grey backdrop, 100mm macro
low-angle medium shot front, gentle proud look, infant in arms, neutral pale grey backdrop, 35mm$pa$,
  "promptVariety" = $pv$Wide high angle of her on lower plackart berth at deep night, trying to soothe restless infant, single reading lamp, other sleeping passenger silhouettes around.
Medium close-up high angle of her rocking infant against shoulder on the berth, exhausted soft smile, hair coming loose, warm reading lamp on her face.
Extreme close-up of tiny infant hand gripping her index finger, both warm-lit, indigo train window blur behind, 100mm macro.
Wide shot of her stepping barefoot into amber train corridor still rocking infant, careful not to wake sleepers behind her.
Back lateral view of her walking train corridor at half-pace from behind, swaying infant, amber lamps glowing past her.
Medium shot of her leaning forehead against vestibule window, infant cradled, eyes closed for a beat of rest.
Medium high of her quietly accepting a small folding stool from off-frame conductor in train vestibule.
Medium close-up of her giving a small grateful nod to off-frame helper, slowly sitting still rocking infant.
Close-up high angle of sleeping infant face against her shoulder, peaceful, tiny breath visible.
Medium shot sitting on the folding stool in train vestibule, infant cradled, head bowed in exhaustion.
POV through her face angle at vestibule window, reflection ghosting on passing dark fields.
Wide low angle of her standing in vestibule doorway watching pre-dawn landscape pass, infant cradled.
Medium shot at the small berth-side table, warming a bottle by holding it under her cardigan, gentle patient.
Medium close-up of her brushing hair from her face with one hand, the other still cradling infant.
Three-quarter back full body, walking back down corridor toward her berth, lamps of carriage lighting her path.
Medium shot of her laying infant carefully onto the berth, leaning over with great care, blanket folded ready.
Close-up high angle of her watching the now-sleeping infant on the berth, tender weariness.
Medium shot of her sitting on the berth edge afterwards, hands hanging between her knees, finally herself for a moment.
Extreme close-up of her hand smoothing the infant blanket, ring on her finger visible.
Wide shot of her sharing the lower berth with sleeping infant, blanket pulled up, both finally asleep at dawn.
Medium close-up at compartment window in morning light, infant in arms looking out, both calmer.
Full body strict side, standing in train corridor first thing in the morning, infant cradled, waiting for restroom.
Medium close-up of her quietly thanking the conductor at the door, soft warm voice, infant asleep.
Wide shot at small rural station platform at morning, infant in arms, suitcase beside her, waiting.
Medium close-up three-quarter, smiling tiredly at her own infant beginning to stir at morning light.$pv$,
  "negative"      = $nb$different identity, man, beard, masculine features, child face, elderly woman, makeup, lipstick, mascara, heavy eye shadow, glamour styling, jewelry on hands except a simple wedding band, large earrings, dangling earrings, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text, modern brand logos, weapon, blood, wound, revealing clothing, tight outfit, high heels, short skirt, bare shoulders, off-shoulder, child sexualization, infant with visible distress face, deformed hands, extra fingers, two heads$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_MOM';

-- ============================================================================
-- PAX_BRIDE — Solo bride (24yo woman)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '24',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_BRIDE_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_BRIDE_BASE, 24 year old Eastern European woman, light brown wavy hair in a messy low ponytail with stray strands, no makeup, slight redness around eyes from recent crying, faint visible freckles, plain grey hoodie pulled over a plain white tee, dark grey jogger sweatpants, holding a large white plastic garment bag with a wedding dress visible through translucent plastic (lace and tulle visible), bare ring finger with faint indent where ring used to be, melancholy restrained expression, documentary photo, photorealistic, 35mm$pb$,
  "promptAngles"  = $pa$extreme close-up face front, neutral pale grey backdrop, red-rimmed eyes, natural skin, no makeup, 100mm
close-up portrait three-quarter left, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, neutral pale grey backdrop, 85mm
close-up strict left profile, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, holding garment bag at side, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, looking down, neutral pale grey backdrop, 50mm
medium shot waist-up front, garment bag in one hand visible, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, garment bag held away from body, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter right, neutral pale grey backdrop, 35mm
medium shot strict side profile, neutral pale grey backdrop, 50mm
medium shot from behind, ponytail and hoodie back visible, neutral pale grey backdrop, 50mm
full body front, garment bag in one hand visible at side, neutral pale grey backdrop, 35mm
full body three-quarter left, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile, neutral pale grey backdrop, 35mm
full body strict back view, neutral pale grey backdrop, 35mm
high-angle medium shot looking down, neutral pale grey backdrop, 35mm
low-angle medium shot looking off frame, neutral pale grey backdrop, 35mm
extreme close-up of bare ring finger with faint indent, neutral pale grey backdrop, 100mm macro
extreme close-up of garment bag with wedding dress visible through plastic, 100mm macro$pa$,
  "promptVariety" = $pv$Wide shot in first-class SV train compartment at night, wedding dress in clear garment bag hanging on hook, her sitting beneath it on the berth hugging knees.
Extreme close-up of wedding dress lace and tulle pressed against translucent garment bag plastic, amber reading lamp lighting it from one side, 100mm.
Medium close-up of her looking at phone screen going dark, no message visible, red-rimmed eyes in amber light.
Extreme close-up of her left hand resting on knee, conspicuously bare ring finger with faint indent where ring used to be.
Close-up profile single tear sliding down cheek without her wiping it, looking at nothing, dim amber light.
Wide shot of her sitting curled in SV compartment with dress hanging behind her on hook, indigo window darkness.
Medium shot of her at platform during dusk boarding, holding large white garment bag with wedding dress, suitcase at feet.
Close-up of her face turning away toward indigo window, not opening door for off-frame knock, breath shaky.
POV through SV window from her angle, near-total darkness outside except one distant lamp blinking past.
Close-up eyes finally closing while still sitting upright under hanging dress, exhaustion winning.
Extreme close-up shadow of wedding dress on compartment wall gently swaying with train motion, amber light, soft poetic.
Medium shot of her wrapped in a blanket on the berth at deep night, dress still hanging visible in frame.
Close-up of her opening a small leather pouch on her lap, revealing the wedding ring inside, looking at it.
Extreme close-up of the wedding ring lying in her open palm, amber lamp catching the gold.
Medium close-up of her finally smiling faintly at a thought, then catching herself.
Wide shot of her standing at vestibule window at dawn, holding garment bag behind her, looking out at pink landscape.
Medium shot of her stepping into corridor at dawn, garment bag carried more carefully now.
Close-up of her face in morning fog light, calmer, eyes still red but with new resolve.
Three-quarter left full body, sitting on lower berth in morning, garment bag carefully unzipped beside her.
Extreme close-up of her hand touching the white lace of the wedding dress with one fingertip.
Medium close-up of her at compartment window in morning light, calm sad face, slight smile beginning.
Wide shot of her stepping out of SV compartment into corridor with garment bag, ready to disembark.
Medium shot at train doorway with garment bag, looking out at small rural platform.
Full body strict back view stepping down from carriage, garment bag held high to avoid puddles.
Medium close-up profile at platform after disembarking, garment bag at her side, looking ahead, decision visible.$pv$,
  "negative"      = $nb$different identity, man, beard, masculine features, child face, elderly woman, glamour wedding photography, heavy bridal makeup, lipstick, mascara, false eyelashes, sequins, tiara, veil on her head, full wedding dress worn on body, formal hair styling, jewelry on hands, ring on ring finger, dangling earrings, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text, modern brand logos, weapon, blood, revealing clothing, deformed hands, extra fingers, two heads$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_BRIDE';

-- ============================================================================
-- PAX_BIZ — Businessman (45yo)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '45',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_BIZ_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_BIZ_BASE, 45 year old Eastern European man, salt-and-pepper hair receding from temples, glasses pushed up on top of head, rumpled white dress shirt with sleeves rolled to forearms, loosened dark grey tie, simple gold wedding ring on left hand, mild defeated expression, natural skin pores with faint stubble, slight under-eye bags, documentary photo, photorealistic, 35mm$pb$,
  "promptAngles"  = $pa$extreme close-up face front, glasses on head, neutral pale grey backdrop, 100mm
close-up portrait three-quarter left, glasses on head, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, glasses pushed onto nose, neutral pale grey backdrop, 85mm
close-up strict left profile, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, tie loosened, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, hands at sides, neutral pale grey backdrop, 50mm
medium close-up chest-up three-quarter right, slight wry smile, neutral pale grey backdrop, 50mm
medium shot waist-up front, hands in pants pockets, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, arms loosely crossed, neutral pale grey backdrop, 35mm
medium shot waist-up strict left profile, neutral pale grey backdrop, 50mm
medium shot from behind, balding back of head and shirt collar visible, neutral pale grey backdrop, 50mm
full body front, slightly stooped office posture, neutral pale grey backdrop, 35mm
full body three-quarter left, weight on one leg, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile, neutral pale grey backdrop, 35mm
full body strict back view, neutral pale grey backdrop, 35mm
low-angle medium shot looking up off-frame, neutral pale grey backdrop, 35mm
high-angle close-up looking down, neutral pale grey backdrop, 85mm
extreme close-up of his hand with gold wedding ring resting on laptop lid, neutral pale grey backdrop, 100mm macro$pa$,
  "promptVariety" = $pv$Medium shot hunched over open laptop in standard compartment, glasses on nose, frowning at screen, untouched tea glass beside him.
Extreme close-up of laptop screen showing abstract no-connection icon (X over wifi bars, no readable text), faint reflection of his face.
Medium close-up low angle of him leaning head back against compartment seat looking up at ceiling lamp, slow exhale of defeat.
Medium shot slowly closing laptop lid with palm, glasses now on table, looking at his own hand.
Extreme close-up of his hand on closed laptop, gold wedding ring slightly worn, no other jewelry.
Medium shot carefully picking up paperback book left on seat across from him, seat occupant sleeping turned to wall.
Medium close-up opening book to random page, glasses back on nose, expression softening into curiosity.
Wide shot of him in standard four-berth compartment alone, laptop closed, book open, finally calm.
Extreme close-up of his fingers turning a page of the paperback book, dim reading lamp light.
Medium shot at compartment table at pre-dawn, laptop closed beside him, book still open, finally truly relaxing.
Medium close-up profile looking out compartment window at pale pre-dawn sky, faint smile, book on lap.
Wide shot at train vestibule open door at dawn, leaning on door frame, looking at landscape, glasses on head.
Full body strict back view standing at vestibule taking in cold pre-dawn air, no rush.
Medium close-up of him laughing softly at something in the book, head back, real laugh.
Medium shot pouring tea into glass holder at compartment table, careful steady hand.
Close-up of him sipping tea, eyes closed for a beat, simple pleasure.
Three-quarter left medium of him sitting at compartment edge brushing his hair down with a hand.
Extreme close-up of his suit jacket folded carefully on the upper berth, gold ring visible on resting hand.
Medium shot of him at compartment door looking out into corridor with mild curiosity.
Full body low angle in corridor walking back to compartment with two glasses of tea, finally taking care of someone.
Medium close-up of him giving the second glass of tea to a still-sleeping fellow passenger across from him, gentle gesture.
Wide shot of him reading at compartment window in morning daylight, glasses on, calm.
Medium shot at small rural platform during morning, laptop bag now closed properly, book under his arm.
Three-quarter right medium of him on platform looking up at the sky, tie completely off now, shirt buttoned wrong.
Medium close-up of him finally calling someone on phone (no visible screen) at platform, soft voice "I am coming home".$pv$,
  "negative"      = $nb$different identity, woman, female features, child face, very young man, full beard, long hair, makeup, lipstick, earrings, large jewelry, glamour styling, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text on clothing, modern brand logos on laptop or phone, readable logos on shirt, weapon, blood, athletic body, muscular build, deformed hands, extra fingers, two heads$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_BIZ';

-- ============================================================================
-- PAX_VET — Veteran grandfather (80yo)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '80',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_VET_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_VET_BASE, 80 year old Eastern European man, bald head with thin white hair on sides only, deep facial wrinkles especially around eyes, kind clear pale blue eyes, slight cataract reflection, dark wool blazer with three rows of generic colored medal ribbons on left chest no readable insignia, simple white shirt underneath, plain dark tie, calloused old hands with prominent veins, holding a simple wooden walking cane with worn handle, dignified weathered face, documentary photo, photorealistic, 35mm$pb$,
  "promptAngles"  = $pa$extreme close-up face front, deep wrinkles, neutral pale grey backdrop, 100mm
close-up portrait three-quarter left, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, neutral pale grey backdrop, 85mm
close-up strict left profile, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, medal ribbons clearly visible, cane in hand, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, hand on cane head, neutral pale grey backdrop, 50mm
medium close-up chest-up three-quarter right, faint dignified smile, neutral pale grey backdrop, 50mm
medium shot waist-up front, both hands resting on cane in front, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, cane visible, neutral pale grey backdrop, 35mm
medium shot strict left profile, cane visible, neutral pale grey backdrop, 50mm
medium shot from behind, bald head and shoulders with white side hair, neutral pale grey backdrop, 50mm
full body front, standing straight with cane planted, neutral pale grey backdrop, 35mm
full body three-quarter left, weight on cane, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile, neutral pale grey backdrop, 35mm
full body strict back view, blazer hem and cane visible, neutral pale grey backdrop, 35mm
low-angle full body, cane planted firmly, neutral pale grey backdrop, 24mm
sitting on a simple bench, both hands resting on cane head in front, neutral pale grey backdrop, 35mm
extreme close-up of generic medal ribbons on his blazer, three rows no readable insignia, slight wear, neutral pale grey backdrop, 100mm macro
extreme close-up of calloused hands resting on wooden cane head, prominent veins and old skin texture, neutral pale grey backdrop, 100mm macro$pa$,
  "promptVariety" = $pv$Wide shot in standard train compartment, sitting with newspaper folded on knees no readable text, cane against compartment wall, calm daylight.
Medium shot low angle profile against compartment window, three rows of generic medal ribbons catching cold daylight, dignity in stillness.
Extreme close-up of medal ribbons on his blazer, generic three-row arrangement, no readable text or insignia, slight wear.
Medium close-up gently unwrapping a small homemade pie from cloth bundle on compartment table, careful old fingers.
Extreme close-up high angle of simple homemade pie cradled in his old hand, no decoration, cold daylight, 100mm macro.
Medium close-up low angle nodding thanks, breaking small piece of pie, gesturing it toward off-frame conductor.
Medium shot watching her enjoy the pie, soft contentment in his face, no words needed.
Medium shot carefully placing a small black-and-white photograph on compartment table, content not visible.
Extreme close-up high angle of photograph from above, content deliberately abstracted (blurred figures), only worn yellowed edges sharp.
Wide shot of him in compartment with the photo and the pie remnants on table, late afternoon golden light.
Medium close-up of him telling a quiet story to off-frame listener, eyes elsewhere remembering.
Close-up of his hand pointing at one part of the abstract photograph as he talks.
Medium shot of him quietly pouring tea from a small thermos for himself, careful steady hand.
Strict side profile waist-up watching the strobing birch trees pass the window.
Full body sitting on lower berth side, blazer open showing medal ribbons, head slightly bowed.
Medium close-up of him at compartment window, breath visible, calmly humming to himself.
Three-quarter back full body, standing at vestibule open window taking in cold air, cane in one hand.
Medium shot in train corridor walking slowly with cane, late afternoon shadows striping the floor.
Extreme close-up of his cane tip on the corridor floor, steady, planted, with each step.
Wide shot at small rural train station platform during morning, cane planted, looking down the tracks calmly.
Medium close-up at platform with a fresh bouquet of simple field flowers in one hand, picked from a station fence.
Medium shot at compartment door with cane, holding it open for an unseen passenger, kindness.
Three-quarter left medium of him asleep against compartment headrest, mouth slightly open, soft snore implied, medals slightly tilted.
Close-up of him chuckling softly at something in the newspaper, eyes crinkling.
Medium shot at the conductor's nod from his compartment doorway, hand raised in dignified salute.$pv$,
  "negative"      = $nb$different identity, woman, female features, child face, young man, middle aged man, no beard, glamour, makeup, jewelry on hands except modest wedding band, large earrings, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text, readable medal text, real-world military insignia, swastika, runes, hate symbols, weapon in frame, blood, wound, bandages, hospital equipment, modern brand logos, helmet, deformed hands, extra fingers, two heads$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_VET';

-- ============================================================================
-- PAX_HE — Couple man (33yo)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '33',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_HE_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_HE_BASE, 33 year old Eastern European man, short dark brown hair, neatly trimmed dark beard close to skin, set strong jaw, brown eyes with controlled tension, plain navy crew neck wool sweater, simple gold wedding ring on left hand, restrained expression, faint frown lines, natural skin pores, documentary photo, photorealistic, 35mm$pb$,
  "promptAngles"  = $pa$extreme close-up face front, neutral pale grey backdrop, 100mm
close-up portrait three-quarter left, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, neutral pale grey backdrop, 85mm
close-up strict left profile, jaw set, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, hands at sides, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, neutral pale grey backdrop, 50mm
medium close-up chest-up three-quarter right, neutral pale grey backdrop, 50mm
medium shot waist-up front, hands in pants pockets, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, arms loosely at sides, neutral pale grey backdrop, 35mm
medium shot strict left profile, neutral pale grey backdrop, 50mm
medium shot from behind, dark hair and sweater back visible, neutral pale grey backdrop, 50mm
full body front, neutral pale grey backdrop, 35mm
full body three-quarter left, weight on one leg, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile, neutral pale grey backdrop, 35mm
full body strict back view, neutral pale grey backdrop, 35mm
low-angle medium front, looking off-frame, neutral pale grey backdrop, 35mm
high-angle close-up portrait looking down, neutral pale grey backdrop, 85mm
extreme close-up of his left hand with gold wedding ring resting on a closed book, neutral pale grey backdrop, 100mm macro$pa$,
  "promptVariety" = $pv$Medium close-up strict side profile sitting in train compartment, jaw set looking out the compartment window, only him in frame.
Medium shot holding an open plain hardcover book on his lap, eyes not moving across the page pretending to read, cold compartment daylight.
Medium shot slowly closing the hardcover book with one palm and placing it on the seat between him and an unseen partner, gesture of offering peace.
Wide shot of him alone in a four-berth compartment, looking out the window, lonely, cold daylight.
Extreme close-up of his hand slowly covering an unseen woman hand on a book cover, gold ring against bare finger, gentle.
Medium close-up of him at compartment window with strobing birch trees behind, slow blink, jaw softening.
Close-up of his lips slightly parted as if about to speak but not yet, looking down at lap.
Three-quarter back medium of him standing at vestibule open door at cold daylight, looking out at fields.
Medium shot of him carrying two suitcases through train corridor, walking behind unseen partner (only him in frame).
Wide shot at small rural train station platform in autumn dusk, only him visible at frame edge of platform.
Medium close-up of him sleeping uncomfortably against compartment wall, head tilted.
Medium shot of him pouring a glass of water from a thermos for an unseen partner, careful steady hands.
Close-up of his eyes slowly opening as the train brakes suddenly, alert but calm.
Medium close-up in dark emerald compartment shadow at night, hand reaching for an unseen woman hand in foreground, only him in frame.
Wide shot of him sitting on lower berth of compartment at dawn, finally truly resting, cold pink light through window.
Medium close-up profile at compartment window at dawn, calmer, jaw finally relaxed.
Three-quarter left full body, standing at vestibule taking in pink dawn air alone.
Medium shot of him at compartment table writing something on a small piece of paper, soft morning light.
Extreme close-up of his hand placing a folded piece of paper on the empty seat where his partner usually sat.
Medium shot of him quietly tidying the compartment for both of them, putting away book, cleaning table.
Close-up of him noticing his gold ring, twisting it once thoughtfully on his finger.
Wide shot at platform morning fog, suitcase at his feet, looking around for partner.
Medium close-up three-quarter, finally smiling faintly at someone off-frame approaching.
Full body strict back view walking down platform alone toward small rural exit gate.
Medium shot at train doorway, helping an unseen partner step down, hand visible extended.$pv$,
  "negative"      = $nb$different identity, woman, female features, child face, elderly man, full beard, long hair, makeup, lipstick, jewelry on hands except gold wedding ring, large earrings, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text on clothing, modern brand logos, weapon, blood, wound, deformed hands, extra fingers, two heads, two women in frame, second male character in frame$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_HE';

-- ============================================================================
-- PAX_SHE — Couple woman (32yo)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '32',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_SHE_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_SHE_BASE, 32 year old Eastern European woman, auburn red-brown hair in a low ponytail with stray strands, no makeup, slightly red eyes, faint freckles across nose bridge, oversized loose grey wool turtleneck sweater hiding her hands inside the sleeves, conspicuously bare left ring finger with faint indent where ring used to be, restrained pained expression, natural skin pores, documentary photo, photorealistic, 35mm$pb$,
  "promptAngles"  = $pa$extreme close-up face front, red-rimmed eyes, neutral pale grey backdrop, 100mm
close-up portrait three-quarter left, hair partly covering cheek, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, neutral pale grey backdrop, 85mm
close-up strict left profile, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, hands hidden in long sweater sleeves, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, head down, neutral pale grey backdrop, 50mm
medium close-up chest-up three-quarter right, neutral pale grey backdrop, 50mm
medium shot waist-up front, hands in sweater sleeves crossed in front, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, hands hidden, neutral pale grey backdrop, 35mm
medium shot strict left profile, neutral pale grey backdrop, 50mm
medium shot from behind, ponytail and oversized sweater visible, neutral pale grey backdrop, 50mm
full body front, sweater oversized down past hips, neutral pale grey backdrop, 35mm
full body three-quarter left, weight on one leg, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile, neutral pale grey backdrop, 35mm
full body strict back view, neutral pale grey backdrop, 35mm
high-angle close-up looking down at her own hands, neutral pale grey backdrop, 85mm
low-angle medium shot looking slightly up off-frame, neutral pale grey backdrop, 35mm
extreme close-up of bare left ring finger with faint indent where ring used to be, neutral pale grey backdrop, 100mm macro$pa$,
  "promptVariety" = $pv$Medium close-up strict left profile in train compartment, eyes downcast, hands hidden in long sweater sleeves, cold compartment daylight.
Medium close-up pouring tea from a vintage thermos into a glass with slight tremble in her hand, face partially visible looking down.
Close-up face only with auburn hair in low ponytail, eyes in slow long blink, wet lashes, no makeup, cold compartment daylight.
Medium close-up reaching out a hand with fingertips resting on a closed plain hardcover book on the seat between her and an unseen partner.
Close-up first slow exhale of released tension, eyes still downcast but face softening, lips slightly parted.
Wide symmetrical compartment shot of her sitting alone on one side of the four-berth compartment, gap of empty seat beside her, cold daylight.
Medium shot of her looking out compartment window at strobing birch trees, sad calm.
Extreme close-up of her hand wrapped tight around a cooling teacup, slight tremble visible.
Close-up of her hand placing the wedding ring on a compartment table, pulling fingers back slowly.
Wide shot of her curled up under blanket on lower berth in dim train compartment at night.
Medium close-up of her at compartment window at night, indigo darkness outside, exhausted.
Three-quarter back full body, standing at vestibule open door at cold daylight alone, looking out.
Close-up of her hand reaching out toward an unseen man hand off-frame, accepting touch.
Medium close-up of her finally meeting an unseen partner gaze, micro-smile starting at corners of mouth.
Wide shot at small rural train station platform in autumn dusk, only her in frame, partner not visible.
Medium shot of her tying her hair back into a fresh ponytail in a compartment mirror reflection.
Close-up of her in pink dawn light at compartment window, slow recovery in her face.
Medium close-up of her at compartment table eating slowly from a small plate, regaining appetite.
Three-quarter left full body sitting on lower berth at dawn, sweater pulled over her knees.
Wide shot at platform morning fog, suitcase beside her, looking around for partner.
Medium close-up of her smiling weakly at someone off-frame approaching with a coffee cup.
Medium shot at train doorway, accepting an unseen helping hand to step down.
Extreme close-up of her hand finally being held by an unseen male hand on a station bench.
Full body three-quarter left, sitting on bench with unseen partner (only her in frame), shoulders almost touching empty space.
Medium close-up of her face in morning light, calmer, eyes still red but ready.$pv$,
  "negative"      = $nb$different identity, man, beard, masculine features, child face, elderly woman, glamour styling, heavy makeup, lipstick, mascara, false eyelashes, big jewelry, large earrings, ring on ring finger, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text on clothing, modern brand logos, weapon, blood, revealing clothing, tight outfit, bare shoulders, off-shoulder, deformed hands, extra fingers, two heads, second woman in frame$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_SHE';

-- ============================================================================
-- PAX_MUS — Musician (22yo)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '22',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_MUS_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_MUS_BASE, 22 year old Eastern European man, messy medium-length dark curly hair, faint scattered stubble, kind brown eyes with absent thoughtful look, gentle absent smile, faded blue denim jacket worn open over a plain white t-shirt, simple acoustic guitar with worn natural wood finish often slung on a strap or across knees, no jewelry, lean youthful build, natural skin pores, documentary photo, photorealistic, 35mm$pb$,
  "promptAngles"  = $pa$extreme close-up face front, eyes half-closed, neutral pale grey backdrop, 100mm
close-up portrait three-quarter left, soft smile, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, neutral pale grey backdrop, 85mm
close-up strict left profile, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, guitar strap across chest, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, holding guitar by neck, neutral pale grey backdrop, 50mm
medium close-up chest-up three-quarter right, neutral pale grey backdrop, 50mm
medium shot waist-up sitting on floor with guitar across knees, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, fingers on guitar neck, neutral pale grey backdrop, 35mm
medium shot strict left profile holding guitar, neutral pale grey backdrop, 50mm
medium shot from behind, curly hair and denim jacket back visible, guitar across knees, neutral pale grey backdrop, 50mm
full body front sitting cross-legged with guitar, neutral pale grey backdrop, 35mm
full body three-quarter left standing with guitar slung on back, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile standing, neutral pale grey backdrop, 35mm
full body strict back view standing with guitar on strap on his back, neutral pale grey backdrop, 35mm
low-angle medium shot looking up with absent smile, neutral pale grey backdrop, 35mm
high-angle medium of him sitting on floor with guitar from above, neutral pale grey backdrop, 35mm
extreme close-up of his fingers fingerpicking on guitar strings, natural wood finish, no readable text on guitar, 100mm macro$pa$,
  "promptVariety" = $pv$Wide shot of him sitting on floor of train vestibule with acoustic guitar across knees, late afternoon golden light from open vestibule window.
Medium close-up low angle of him fingerpicking guitar string slowly, eyes half-closed in playing trance.
Extreme close-up of guitar strings under fingertips, golden warm light catching steel, pluck visible, 100mm macro.
Medium shot in vestibule, doorway open behind with golden field rushing past, hair lifted by warm wind.
Medium shot of him silhouette against bright open vestibule door with golden field behind, cold backlight transitioning to warm.
Close-up of his face with gentle absent smile while playing, looking out at landscape.
POV from open vestibule door, golden field rushing past, power line poles flicking by, his hand on guitar at frame edge.
Extreme close-up of final note ringing on held string, vibration dying out, finger lifting.
Medium shot of him sitting cross-legged on lower berth in plackart car, gently tuning guitar pegs.
Wide shot of plackart car at evening, him sitting at corner of berth softly playing for a small group of nearby passengers.
Medium close-up of his hand strumming chord casually, eyes elsewhere.
Three-quarter back full body of him standing at train vestibule playing, hair lifted by wind.
Close-up of him laughing softly at his own missed note, recovering with another chord.
Medium shot of him sleeping curled around his guitar protectively on the berth.
Wide shot of him at small rural station platform in evening, guitar case at his feet, looking up at the sky.
Medium close-up of him sharing a thermos with another passenger in the vestibule, guitar leaning beside him.
Full body strict back view standing at train carriage door at dawn, guitar slung on back, looking at pink sky.
Medium shot in train corridor walking with guitar case, faint smile.
Close-up of his fingers placing capo on guitar neck, careful precision.
Extreme close-up of the worn wood texture of the guitar body, scuff marks and small scratches, 100mm macro.
Medium close-up of him at compartment window sketching something in a small notebook (no readable text), guitar resting beside.
Three-quarter left full body of him standing at vestibule playing for himself at deep night, dim amber light.
Wide shot of him in plackart at deep night with only one reading lamp on him, guitar across knees, eyes closed playing.
Medium shot at platform morning fog, guitar case in one hand, looking at the train one last time.
Close-up at platform of him meeting someone off-frame with a warm smile, guitar over shoulder.$pv$,
  "negative"      = $nb$different identity, woman, female features, child face, middle aged man, elderly man, beard full, bald, glamour, makeup, lipstick, jewelry on hands, earrings, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text, readable brand logos on jacket or guitar, electric guitar, drum kit, modern brand logos, weapon, blood, revealing clothing, deformed hands, extra fingers on guitar, missing fingers, two heads$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_MUS';

-- ============================================================================
-- PAX_GIRL — Child girl with owl (7yo)
-- ============================================================================
UPDATE character_profiles AS cp
SET
  "ageLabel"      = '7',
  "targetImages"  = 30,
  "triggerToken"  = 'PAX_GIRL_BASE',
  "useIpAdapter"  = FALSE,
  "promptBase"    = $pb$portrait photo of PAX_GIRL_BASE, 7 year old Eastern European girl with natural child proportions (smaller head-to-body ratio, child body, child face, NOT adult-proportioned), brown shoulder length straight hair often slightly messy, large solemn dark brown eyes, faint round cheeks of a child, small button nose, no makeup, modest clothing only, light blue cotton cardigan buttoned over a plain white tee, dark blue trousers, simple white sneakers, holding a worn pale grey plush owl toy with one missing button eye (loose thread visible), the other owl button eye is dark plastic, child shy serious expression, natural skin texture, documentary photo, photorealistic, 35mm, child photograph appropriate, fully clothed, modest$pb$,
  "promptAngles"  = $pa$extreme close-up child face front, solemn dark eyes, natural child skin, neutral pale grey backdrop, 100mm
close-up portrait three-quarter left, owl held to chest, neutral pale grey backdrop, 85mm
close-up portrait three-quarter right, neutral pale grey backdrop, 85mm
close-up strict left profile, neutral pale grey backdrop, 100mm
close-up strict right profile, neutral pale grey backdrop, 100mm
medium close-up chest-up front, owl held up at chest level, neutral pale grey backdrop, 85mm
medium close-up chest-up three-quarter left, neutral pale grey backdrop, 50mm
medium shot waist-up front, owl in arms, neutral pale grey backdrop, 35mm
medium shot waist-up three-quarter left, owl in one hand, neutral pale grey backdrop, 35mm
medium shot strict left profile, holding owl, neutral pale grey backdrop, 50mm
medium shot from behind, brown hair and cardigan back visible, neutral pale grey backdrop, 50mm
full body front, natural child proportions, hands clasped in front holding owl, neutral pale grey backdrop, 35mm
full body three-quarter left, owl held at side, neutral pale grey backdrop, 35mm
full body three-quarter right, neutral pale grey backdrop, 35mm
full body strict left profile, neutral pale grey backdrop, 35mm
full body strict back view, neutral pale grey backdrop, 35mm
high-angle full body looking up at camera, owl in arms, neutral pale grey backdrop, 35mm
sitting cross-legged on floor, owl in lap, neutral pale grey backdrop, 35mm
sitting on a small bench, feet not quite reaching the floor (child proportions), neutral pale grey backdrop, 35mm
extreme close-up of the plush owl with one button eye missing showing loose thread, the other button eye intact, 100mm macro
extreme close-up of her small hand holding the owl, child fingers, no jewelry, neutral pale grey backdrop, 100mm macro$pa$,
  "promptVariety" = $pv$High angle close-up of her standing alone on small rural station platform at autumn dusk, plush owl held tight, solemn eyes looking up, no adult visible nearby.
Extreme close-up of brass ticket punch piercing a small child-sized ticket, conductor gloved hand steady, child small hand at frame edge offering it.
Wide shot of her sitting alone in a standard train compartment by the window, owl beside her on the seat, suitcase on the rack.
Medium shot of her looking out compartment window at passing fields, owl held in her lap, sleepy.
Close-up of her at compartment window, breath fogging the glass slightly, owl pressed to her chest.
Medium close-up of her drawing something with crayons in a small notebook (no readable text), owl beside her watching.
Medium shot of her sitting cross-legged on the berth holding plush owl up at eye level, whispering to it.
Extreme close-up slow push-in on worn plush owl in child hands, one button eye missing showing thread, late golden light, photorealistic textile detail.
Medium high angle of her sleeping curled up on the berth, plush owl tucked under her arm, blanket half off.
Medium close-up high angle of her flushed cheeks, hair damp on forehead, sleeping fitfully with fever, owl beside her.
Extreme close-up of the back of an off-frame gloved hand against her forehead checking temperature, dim emerald shadow.
OTS over off-frame conductor shoulder lifting her feverish into arms, her face visible eyes closed, owl tucked under her arm.
Extreme close-up high angle of worn plush owl lying on compartment floor, fabric fold sad, dark emerald shadow.
Medium close-up of her being carried by an off-frame conductor through dim train corridor, her face partly covered by a blanket.
Medium close-up of her being carefully transferred to off-frame medic in pink dawn light, still wrapped in blanket, clutching owl, eyes closed.
Extreme close-up of plush owl bouncing gently in her hand as she is being carried, dawn pink soft on worn fabric.
Wide shot of her in pink dawn light at platform with rural ambulance behind, only owl and small figure visible.
Medium shot of her later sitting in small rural hospital ward chair, plush owl in lap, IV in arm, calmer, recovered.
Close-up at hospital window looking out at field with snow, owl on the window sill beside her.
Wide shot of her at small rural train station platform at dawn looking back at a now-empty train track, owl in arms.
Medium close-up of her smiling shyly for the first time in the film, owl held close, pink fog light.
Three-quarter left full body of her walking toward an approaching adult figure on the rural road, owl trailing in hand.
Medium shot of her playing quietly with the plush owl on a small bench in train compartment in morning light, owl missing eye visible.
Close-up high angle of her gently sewing a new button onto the owl's missing eye with grown-up help (only her hands visible).
Extreme close-up of the owl with its new button eye finally restored, both eyes intact, pink morning light.$pv$,
  "negative"      = $nb$different identity, adult woman, adult body proportions, teenager, baby, toddler, makeup, lipstick, eye shadow, mascara, jewelry, earrings, dangling earrings, glamour, fashion, sexualized child, revealing clothing, swimsuit, bare belly, midriff, short skirt, bare shoulders, off-shoulder, adult-shaped child, model pose, beauty pageant, mature face, cartoon, anime, cgi, 3d render, plastic skin, oversmooth, watermark, text, modern brand logos on clothing, blood, wound, injection visible, hospital equipment dominant, deformed hands, extra fingers, two heads, multiple children in frame$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id AND c."projectId" = p.id
  AND p.slug = 'last_shift' AND cp."profileCode" = 'PAX_GIRL';

COMMIT;
