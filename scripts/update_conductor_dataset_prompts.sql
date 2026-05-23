-- Upgrade CONDUCTOR_BASE dataset prompts to the same level as night_courier
-- FATHER_BASE / HERO_TEEN_15: identity-lock angles on neutral background +
-- environmental variety prompts for scene exposure during LoRA training.

UPDATE character_profiles AS cp
SET
  "ageLabel"      = '38-42',
  "targetImages"  = 40,
  "triggerToken"  = 'CONDUCTOR_BASE',
  "promptBase"    = $pb$portrait photo of CONDUCTOR_BASE, female train conductor 38 to 42 years old, dark blonde hair in low neat bun under navy peaked cap, grey-green tired eyes, thin scar above left eyebrow, natural skin pores, no makeup, dark navy double-breasted uniform jacket with single shoulder stripe and brass buttons, white shirt collar, navy trousers, grey fingerless wool gloves, realistic photo, documentary style, photorealistic, 35mm full-frame$pb$,
  "promptAngles"  = $pa$extreme close-up face front, eye level, neutral white wall background, natural skin pores, no expression, 100mm portrait lens
close-up portrait three-quarter left, neutral white wall background, soft documentary light, 85mm
close-up portrait three-quarter right, neutral white wall background, soft documentary light, 85mm
close-up strict left profile, jawline clear, neutral white wall background, 100mm
close-up strict right profile, jawline clear, neutral white wall background, 100mm
close-up slight dutch tilt three-quarter, neutral white wall background, 85mm
medium close-up chest-up front, hands at jacket lapel, neutral white wall background, 85mm
medium close-up chest-up three-quarter left, hands clasped in front, neutral white wall background, 50mm
medium close-up chest-up three-quarter right, faint tired smile, neutral white wall background, 50mm
medium shot waist-up front, hands at sides, neutral white wall background, 35mm
medium shot waist-up three-quarter left, arms loosely crossed over jacket, neutral white wall background, 35mm
medium shot waist-up three-quarter right, one hand resting on jacket pocket, neutral white wall background, 35mm
medium shot waist-up strict left profile, calm posture, neutral white wall background, 50mm
medium shot waist-up strict right profile, calm posture, neutral white wall background, 50mm
medium shot from behind, head turned slightly over right shoulder, low bun and cap visible, neutral white wall background, 50mm
medium shot from behind, head turned slightly over left shoulder, neutral white wall background, 50mm
full body front, standing straight hands at sides, full uniform visible, neutral white wall background, 35mm
full body three-quarter left, weight on one leg, hand resting in jacket pocket, neutral white wall background, 35mm
full body three-quarter right, head slightly turned looking off frame, neutral white wall background, 35mm
full body strict left profile, neutral white wall background, 35mm
full body strict right profile, neutral white wall background, 35mm
full body strict back view, cap and bun and shoulder stripe clearly visible, neutral white wall background, 35mm
full body three-quarter back, head turned over shoulder, neutral white wall background, 35mm
low-angle full body front, looking off frame ahead, neutral white wall background, 24mm
low-angle medium shot front, looking down toward lens, dignified posture, neutral white wall background, 35mm
high-angle full body, head slightly bowed, neutral white wall background, 35mm
high-angle close-up portrait, eyes closed for a beat of rest, neutral white wall background, 85mm
sitting on a simple bench three-quarter left, hands on knees, head turned to camera, neutral white wall background, 35mm
sitting on a simple bench strict side, looking ahead off-frame, neutral white wall background, 50mm
extreme close-up of gloved hands holding a brass ticket punch, neutral white wall background, 100mm macro
extreme close-up of gloved hand holding a vintage metal tea glass holder, neutral white wall background, 100mm macro
extreme close-up of vintage analog watch on her wrist, neutral white wall background, 100mm macro
extreme close-up of fingers adjusting cap brim, neutral white wall background, 100mm macro$pa$,
  "promptVariety" = $pv$Full body three-quarter back walking down train corridor at night, warm tungsten amber lamps in perspective behind, hand brushing each compartment door, dark navy uniform, photorealistic documentary.
Full body strict left profile walking down train corridor in cold morning light, windows showing fields strobing past, calm composed posture.
Medium shot front standing in train corridor under flickering lamp, dark emerald compartment curtain shadows, slight worry behind professional composure.
Medium close-up three-quarter left walking corridor at dusk, hand brushing wall, soft tungsten amber light from above.
Strict back full body in train vestibule looking out open window, cold wind moving stray hairs, breath visible in cool air.
Medium shot front in vestibule standing beside red emergency brake handle, single sickly yellow emergency light overhead, jaw tight.
Extreme close-up of gloved hand resting near the red brake handle, intact wire seal visible, dim emergency light.
Full body three-quarter back in train vestibule doorway facing brightening dawn outside, pink dawn sky.
Sitting alone in narrow conductor crew compartment, holding a small folded white envelope in her lap, head bowed, warm reading lamp.
Medium shot front in crew compartment, slowly removing peaked cap, dark blonde hair coming loose from low bun, exhausted.
Medium close-up profile in crew compartment by window at twilight, hand at chest where a thin chain hangs hidden under shirt.
Extreme close-up of hand pulling a thin gold chain over her head, a simple worn wedding band threaded on it, 100mm macro.
Full body standing on autumn dusk train platform checking ticket in gloved hand, sodium lamp glow, cool breath visible.
Medium shot front at carriage door punching a ticket with brass ticket punch, evening sodium platform light.
Full body three-quarter left walking along empty train platform at dawn, low fog rolling across rails, calm posture.
Medium close-up front holding a tea glass in vintage metal holder at a compartment threshold, amber corridor light.
Over-the-shoulder shot looking into a compartment doorway, watching a passenger silhouette inside, amber light spilling out.
Medium shot three-quarter right leaning lightly on a wood-paneled wall in the train corridor, faint tired smile.
Full body sitting on a folded compartment seat in the dim train corridor, head bowed, gloved hands clasped.
Strict side close-up profile against amber corridor lamp glow, dignity in stillness.
Three-quarter back medium in vestibule looking at night fields rushing past through open doorway, soft moonlight.
Medium shot strict right profile by a train window in cold daylight, birch trees strobing past in background, faint smile.
Close-up three-quarter right portrait, micro-expression of recognition crossing her face, hand involuntarily rising to chest near hidden chain, late warm afternoon light.
Close-up front portrait at moment of decision, jaw set, eyes resolved, dim emerald train interior shadow, harsh side light.
Medium shot front carrying a wrapped child in her arms through dim corridor, blanket trailing, watchful protective eyes.
Full body three-quarter back stepping down train carriage steps into pink morning fog, white shirt only no jacket no cap, hair down loose.
Full body strict back walking away into a snow-covered field at dawn, white shirt only, figure softening into pink fog.
Medium shot front in plain white shirt and trousers, dark blonde hair down loose, calm without uniform, soft morning fog light, first peace.
Three-quarter left full body in crew compartment folding navy uniform jacket and cap neatly on a seat, gentle deliberate motion.
Strict side close-up in crew compartment placing a folded white envelope on top of the folded uniform jacket, deliberate.
Medium close-up three-quarter back in train corridor, head turned to glance at a compartment as she passes.
Full body strict side in train corridor low light, holding a small folding stool to place for a passenger in vestibule, gentle expression.
Three-quarter left medium shot leaning against vestibule frame, eyes closed for a beat listening, faint smile, golden afternoon light from open window.
Sitting on a low step inside a train carriage interior, head bowed slightly, gloved hands resting on knees.
Medium close-up front looking down at a child-sized punched ticket in her hand, soft recognition in her face.
Three-quarter left full body in train corridor catching a still moment, both hands in jacket pockets, fatigue visible.
Close-up slight dutch tilt in dim dark emerald train corridor, internal pressure resolving into resolve in her eyes.
Full body low-angle in train corridor looking ahead and up, decisive posture, no longer subordinate.
Extreme close-up of her gloved hand tightening on a vestibule handrail, knuckles whitening, 100mm.
Three-quarter back chest-up at open doorway of stopped train, watching an ambulance approach across snow, dawn pink sky.
Strict side medium in pink morning fog on deserted train platform, looking back once toward the train, soft acknowledgment.
Full body strict back walking away into a featureless misty field at dawn, no destination visible, ethereal soft pink light.$pv$,
  "negative"      = $nb$different identity, older woman 60 plus, very young woman 20s, child face, man, beard, masculine features, glamour photography, heavy makeup, lipstick, mascara, eye shadow, jewelry on hands, large earrings, dangling earrings, necklace visible over shirt, cartoon, anime, cgi, 3d render, plastic skin, oversmooth skin, watermark, text, signature, low quality, blur, motion blur, modern brand logos, real-world train logos, readable text on uniform, station name signs with readable text, weapon, blood, wound, revealing clothing, tight outfit, high heels, short skirt, dress, bare shoulders, bare arms, off-shoulder, deformed hands, extra fingers, missing fingers, duplicate face, two heads, helmet, motorcycle, bicycle$nb$
FROM characters AS c, projects AS p
WHERE cp."characterId" = c.id
  AND c."projectId"   = p.id
  AND p.slug          = 'last_shift'
  AND cp."profileCode" = 'CONDUCTOR_BASE';
