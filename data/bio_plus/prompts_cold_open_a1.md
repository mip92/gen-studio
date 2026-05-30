# bio_plus — Shot prompts: Cold open + A1 (34 шота)

> Все промпты — **positiveTemplate** с `{TOKEN}` плейсхолдерами. После seed резолвятся через `resolve_placeholders.sql` (см. last_shift как эталон).
> **Стиль:** cinematic graphic-novel cell-shaded, не photoreal.
> **Style/Negative tokens:** см. `character_profiles.md` (раздел Style-блоки).
> **Character tokens:** `{HEROINE_ELENA_AGE_NN}`, `{DAUGHTER_YOUNGER_AGE_NN}`, etc. — см. `character_profiles.md`.
> **Palette tokens:** `{PALETTE_COLD_OPEN}`, `{PALETTE_A1}`, etc.

---

## COLD OPEN — 12 шотов

### C1 — CU eye static — Hand on door handle

**Frame:** Right hand on apartment-17 door handle. Yellow folder corner under elbow. Wedding ring impression on finger.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
extreme close-up of a woman's right hand resting on a worn brushed-steel apartment door handle of door number 17,
under her left elbow tucked tight a bright yellow translucent plastic document folder, corner of the folder visible at frame edge,
on her ring finger a pale impression where a wedding band used to be,
{HEROINE_ELENA_AGE_44} cropped at the forearm, no face visible,
panel-building 5th floor stairwell landing of a Soviet-era apartment block in Mogilev,
neon yellow ceiling bulb above casting hard rim light on the steel handle,
deep blue-grey shadow behind the door,
hard ink outline on every contour, cell-shaded skin tone with subtle cross-hatching at knuckles,
camera at eye level, locked off, 16:9 cinematic composition,
{NEG}
```

**lightingMood:** harsh yellow ceiling bulb top-left, deep blue-grey ambient shadow behind, single hard rim on brushed steel, no soft fill

**Continuity:** yellow folder → C2/C3; ring-mark → identity continuity through A6 (heroine divorced 16 years)

---

### C2 — ECU eye push_in — Yellow folder corner

**Frame:** Yellow plastic folder under arm. Header "ДОГОВОР КУПЛИ-ПРОДАЖИ" visible through translucent plastic.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
extreme close-up of a bright translucent yellow plastic document folder tucked under a woman's left elbow,
through the folder's translucent plastic the cyrillic header ДОГОВОР КУПЛИ-ПРОДАЖИ visible on the top sheet,
{HEROINE_ELENA_AGE_44} arm and torso only, dark navy blazer cuff,
slow push-in framing, focus rack from folder edge to the cyrillic header,
stairwell light fading to deep blue-grey behind,
hard ink outline on folder edge and cyrillic letterforms,
cell-shaded folder yellow with cross-hatching for translucency,
camera ECU eye level pushing in slowly, 16:9,
{NEG}
```

**lightingMood:** spill of yellow neon from above, blue-grey shadow falloff, semi-transparent yellow plastic glows from internal page reflection

**Continuity:** same yellow folder appears in all stairwell shots + A6 notary office

---

### C3 — MS eye static — 5th floor landing

**Frame:** Heroine on 5th floor landing. Silver cross under blouse (hidden, hinted at collar). Yellow folder under arm.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
medium shot of {HEROINE_ELENA_AGE_44} standing on a Soviet panel-building 5th floor stairwell landing in Mogilev,
dark navy blazer over a thin white blouse,
thin silver chain barely visible at the collar of the blouse (cross is hidden underneath),
bright yellow plastic document folder tucked tight under her left arm,
beige tile floor, painted-cream stairwell walls with damp watermarks at the skirting,
single yellow ceiling neon bulb just out of frame above casting top-down light,
deep blue ambient shadow in the corridor depth,
expression weary patient, slight downward set at the mouth corners,
hard ink outline, cell-shaded coloring, 16:9 cinematic composition, camera at eye level locked off,
{NEG}
```

**lightingMood:** top-down yellow neon bulb, deep indigo shadow in corridor recess, cool grey-blue daylight bleeding from stairwell window behind

**Continuity:** silver cross hidden under blouse — reveal in A7+Coda

---

### C4 — CU eye static — Heroine's face, exhale

**Frame:** Heroine's face, long exhale, slight eyelid twitch.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
close-up of {HEROINE_ELENA_AGE_44} on a panel-building stairwell landing,
her face in three-quarter view, eyes slightly closed mid-exhale, lips parted releasing breath,
faint twitch at the left eyelid, weary patient expression,
small dark mole visible on the left jawline below the ear,
mousy ash-brown hair shoulder-length parted in the centre, slight grey at the temples,
yellow neon bulb above casting warm top-down rim light on her hair and shoulder,
cool blue-grey ambient shadow on the in-shadow side of her face,
hard ink outline on jaw, nose bridge, hair strands,
cell-shaded skin in two tones (warm rim + cool shadow), subtle cross-hatching under the eye and along the jaw,
camera CU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm top-down yellow rim + cool blue-grey shadow fill, two-tone cell shading

**Continuity:** mole on left jawline — identity anchor for HEROINE_ELENA

---

### C5 — BACK eye track_lateral — Heroine descending

**Frame:** Back of heroine, step down from 5th floor. Yellow folder edge visible.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
back of {HEROINE_ELENA_AGE_44} descending the stairs of a Soviet panel-building stairwell, mid-step,
dark navy blazer back, ash-brown hair shoulder-length brushing the collar,
right arm holding the painted iron stairwell railing, left arm holding the yellow plastic folder tight against her ribs,
neon yellow stairwell bulb visible above casting top-down light on her shoulders,
cool blue-grey shadows in the lower steps, beige tile floor,
camera tracks laterally at eye level following her descent, slight motion blur on background only,
hard ink outline on her silhouette, cell-shaded back of blazer with fold lines,
16:9 cinematic composition,
{NEG}
```

**lightingMood:** top-down warm bulb above + cool blue-grey shadow in stair descent below, transitional palette

**Continuity:** descent action — flows into C6, C7

---

### C6 — ECU low static — Winter boot on step

**Frame:** Winter boot on concrete step. Crack in the shape of a seven on the concrete.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
extreme close-up from a low angle of a single dark brown leather winter boot stepping down onto a worn concrete stairwell step,
the boot's heel just touching the rough concrete, treads of the sole visible,
a thin crack in the shape of a number seven running across the step under the heel,
dark navy trouser leg above the boot disappearing out of frame,
soft yellow neon spilling onto the step from above casting a warm pool of light,
cool blue shadow under the step's overhang,
hard ink outline on boot edge, crack, and step contour,
cell-shaded leather in two tones (warm highlight + cool shadow),
camera ECU at low angle locked off, 16:9,
{NEG}
```

**lightingMood:** warm pool of yellow on the step, cool blue under-shadow, no soft fill

**Continuity:** winter boots — matches season (March 2024); crack in step → could reuse for A6 stairwell

---

### C7 — MS eye track_lateral — Between floors

**Frame:** Heroine walking between floors. Damp watermarks on walls, faded graffiti "Маша + Игорь".

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
medium shot of {HEROINE_ELENA_AGE_44} walking down the stairs between the 4th and 3rd floors of a Soviet panel-building stairwell,
dark navy blazer, yellow folder tucked under left arm,
painted-cream walls with patches of dark damp watermark, a faded biro graffiti reading МАША + ИГОРЬ in cyrillic on the wall behind her,
single yellow neon bulb above casting top-down rim light, cool blue-grey wash on the far walls,
camera tracks laterally at eye level following her movement,
hard ink outline on her silhouette and on the cyrillic graffiti, cell-shaded coloring,
16:9 cinematic composition,
{NEG}
```

**lightingMood:** yellow top rim + cool blue-grey wall wash; graffiti picks up slight rim light

**Continuity:** descent continues; provincial signifier (Cyrillic graffiti)

---

### C8 — CU eye static — Face in shadow between floors

**Frame:** Heroine's face in half-shadow between landings. Side-rim from neon bulb.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
close-up of {HEROINE_ELENA_AGE_44} mid-step on a panel-building stairwell between the 3rd and 2nd floors,
her face in half-shadow, side-rim light from a yellow neon bulb just off-frame to the left,
the lit side warm sodium yellow, the shadowed side cool blue-grey,
small mole on the left jawline catching the warm rim,
ash-brown hair partially backlit by the bulb above,
weary patient expression, mouth set firm,
hard ink outline on the jaw, nose bridge, hair contour,
cell-shaded skin two-tone with subtle cross-hatching in the shadow half,
camera CU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** chiaroscuro half-warm half-cool, single side-rim from yellow neon, shadowed side blue-grey

**Continuity:** mole anchor visible; expression continues from C4

---

### C9 — POV eye push_in — Looking down stairwell

**Frame:** POV looking down through stairwell, multiple flights visible, 1st floor entrance at bottom.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
POV shot looking straight down a Soviet panel-building stairwell spiral,
multiple flights of stairs descending in receding perspective, railings curving down and away,
at the bottom of the well a glimpse of the ground-floor entrance lit by cool grey daylight from the front door,
yellow neon bulb at each landing creating warm pools of light on the descent,
cool blue-grey shadows in the recesses, vertigo composition,
hard ink outline on every railing edge and step edge, cell-shaded with strong tonal separation,
camera POV pushes in slowly toward the ground floor as if the heroine is leaning over the railing,
16:9 cinematic composition,
{NEG}
```

**lightingMood:** alternating yellow neon pools + cool grey daylight from below, vertigo of warm-cool stack

**Continuity:** sound bridge — door slam below; heroine hears daughter entering

---

### C10 — WS high static — Stairwell from above, daughter ascending

**Frame:** Stairwell from above. Daughter with grey backpack ascending toward camera.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
wide shot from a high angle looking down the stairwell from a landing,
{DAUGHTER_YOUNGER_AGE_13} ascending the stairs from the floor below toward the camera,
she wears a dark school winter coat over a navy uniform, a grey school backpack on her shoulders,
her face tilted slightly up toward where her mother is, freckles visible on the bridge of her nose,
the heroine's silhouette barely visible at the edge of the frame in the foreground (out of focus),
yellow neon stairwell bulb above casting warm top-down light on the daughter's head and shoulders,
cool blue-grey wash on the stairs descending,
hard ink outline on the daughter's silhouette and on the railing,
cell-shaded coloring, 16:9 cinematic high-angle composition,
{NEG}
```

**lightingMood:** warm top-down yellow on daughter, cool blue-grey on descending stairs

**Continuity:** daughter's grey backpack — single appearance prop, distinguishes from the heroine's yellow folder

---

### C11 — ECU eye static — Daughter's eyes on the folder

**Frame:** Daughter's eyes. Her gaze lands on the angle of the yellow folder.

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
extreme close-up of {DAUGHTER_YOUNGER_AGE_13}'s face, eyes wide and locked on something just off-frame,
freckles scattered across the bridge of her nose and cheekbones, pale grey-blue eyes the same shade as her mother's,
short ash-brown hair with a fringe across the forehead, slightly damp from melted snow,
in the bottom-left corner of the frame a sliver of bright yellow plastic folder is just visible (her sight-line falls on it),
yellow neon stairwell bulb out of frame casting warm side-light on her face from the right,
cool blue-grey shadow on the left half of her face,
hard ink outline on her eyes, eyelashes, nose bridge,
cell-shaded skin two-tone, freckles rendered as small ink dots,
camera ECU at eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm side-light from stairwell bulb (right), cool blue-grey shadow on left half of face

**Continuity:** daughter's freckles anchor; her gaze contact with the folder is the catastrophe pivot

---

### C12 — MS eye pull_out — Freeze frame mother-daughter

**Frame:** Daughter facing camera (primary face-lock), heroine's back/three-quarter back in foreground.

**SingleWithBack:** PRIMARY = DAUGHTER_YOUNGER (face), SECONDARY = HEROINE_ELENA (back of head + shoulder only, face NOT in frame)

**positiveTemplate:**
```
{STYLE}, {PALETTE_COLD_OPEN},
medium shot looking past the heroine's right shoulder from behind toward the daughter on the lower step,
in the foreground only the back-of-head silhouette of {HEROINE_ELENA_AGE_44} — ash-brown shoulder-length hair, dark navy blazer shoulder, the yellow folder corner tucked tight under her left arm — face NOT visible,
on the lower step {DAUGHTER_YOUNGER_AGE_13} facing the camera, head tilted slightly up, freckles on the bridge of her nose visible, pale grey-blue eyes locked on her mother's face off-frame,
two concrete steps between them, neither moving,
single yellow neon bulb on the ceiling above flickers visibly,
warm top-down rim on the daughter's hair, cool blue-grey shadow on the heroine's back,
hard ink outline on the daughter's face and the back of the heroine's silhouette,
cell-shaded coloring two-tone,
camera MS eye level slowly pulling out, 16:9 cinematic composition,
{NEG}
```

**lightingMood:** warm top-down rim + cool blue-grey corridor wash; single ceiling bulb flicker (atmospheric flicker tag)

**Continuity:** end of cold open; freeze opens to A1 retrograde

---

## A1 «Истоки» — 22 шота — лето 2008, Могилёв

### A1_SH01 — EWS high static — Mogilev rooftops in summer **(Iconic)**

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme wide shot from a high rooftop angle over the Mashinostroiteley district of Mogilev in summer 2008,
rows of five-storey Khrushchev-era panel apartment blocks in pale grey and pale yellow, flat roofs with TV antennas,
golden tops of birch and poplar trees between buildings, white poplar fluff drifting in the warm air visible as small dots,
sodium-warm afternoon haze across the horizon, distant smokestacks of the Mogilev industrial zone faintly visible,
shadows pulling east at thirty-degree angle (late afternoon),
hard ink outline on every roof edge, antenna, and treeline,
cell-shaded yellow and dusty-rose color blocks with subtle cross-hatching in shadow,
camera EWS from a high angle locked off, 16:9 cinematic composition,
{NEG}
```

**lightingMood:** sodium-warm afternoon haze, long east-pulling shadows, dust-particle motes

**Continuity:** establishing the city; recurring vista for A7

---

### A1_SH02 — WS eye static — Courtyard, heroine with pram + older daughter

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
wide shot of an inner courtyard between five-storey panel apartment blocks in Mogilev, summer 2008,
{HEROINE_ELENA_AGE_28} walks with a small white baby pram across the courtyard,
beside her {DAUGHTER_OLDER_AGE_04} holding the side of the pram with her right hand, a small cotton sundress in pale yellow,
broken asphalt with weeds at the edges, a single rusting playground swing-set in the background,
warm sodium afternoon light, long shadows pulling east,
poplar fluff drifting in the air,
hard ink outline on the pram, the figures, the swing-set,
cell-shaded color in two tones,
camera WS eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm sodium afternoon, long east shadows, light dust haze

**Continuity:** older daughter (4yo) holding pram — her first frame; pram returns A1_SH03, SH14, SH15

---

### A1_SH03 — MS eye track_lateral — Walking to pharmacy

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
medium shot of {HEROINE_ELENA_AGE_28} pushing a white baby pram along the shaded sidewalk of Pervomayskaya street in Mogilev,
{DAUGHTER_OLDER_AGE_04} walking beside the pram holding its side,
ahead the green-painted facade of a small Soviet-style pharmacy with a faded sign reading АПТЕКА ЗДОРОВЬЕ in cyrillic above the door,
the shaded side of the street, dappled tree-shadow on the asphalt,
warm sodium afternoon light bleeding in from beyond the trees,
hard ink outline on the pharmacy sign, the pram, the figures,
cell-shaded color blocks with dappled hatching for tree shadow,
camera MS eye level tracking laterally alongside the walking figures, 16:9,
{NEG}
```

**lightingMood:** dappled afternoon under trees, sodium warmth from the unshaded side, deep cool shadows on shaded side

**Continuity:** pharmacy facade — establishes location for A1_SH04-13 and A4_SH25-28

---

### A1_SH04 — CU eye static — Mother (Galina) behind the counter

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
close-up of {MOM_GALINA_AGE_60} behind a small Soviet pharmacy counter,
grey pharmacist's lab coat over a beige knit cardigan visible at the collar,
thin steel-link chain holding reading glasses around her neck, glasses resting on the chest of the lab coat,
thinning grey-streaked hair pinned back severely, tired grey-blue eyes with deep crow's feet,
small dark mole on left jawline (matching daughter's anchor),
behind her warm wooden pharmacy shelves with rows of medicines, soft sodium-yellow ceiling light,
hard ink outline on her face, glasses chain, lab coat collar,
cell-shaded skin two-tone with subtle hatching under the eyes and along the jaw,
camera CU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm sodium ceiling light from above, soft cool fill from front shop window, faint shop-shelf glow behind

**Continuity:** glasses chain anchor — visual rhyme with A6_SH12 notary; matching mole with heroine (visual rhyme)

---

### A1_SH05 — OTS eye static — Over Galina's shoulder, heroine at counter

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
over-the-shoulder shot from behind {MOM_GALINA_AGE_60}, looking past her grey lab coat collar at the pharmacy counter,
on the glass counter a green-and-white box of children's milk formula labeled НУТРИЛАК in cyrillic, next to a small bottle of paracetamol syrup,
on the customer side {HEROINE_ELENA_AGE_28} stands with a small white baby pram beside her,
shallow depth of field — Galina's shoulder soft in foreground, counter and heroine sharp,
warm sodium overhead pharmacy light, cool daylight bleeding from the front window,
hard ink outline on the counter products, the heroine's silhouette,
cell-shaded color blocks, cyrillic typography on the box rendered with crisp ink lines,
camera OTS eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm overhead pharmacy sodium + cool daylight from window behind heroine, soft falloff into Galina's shoulder

**Continuity:** product brands (Nutrilak, paracetamol) — period-accurate 2008 Belarus

---

### A1_SH06 — ECU eye static — Fingers in wallet

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme close-up of {HEROINE_ELENA_AGE_28}'s hands holding a small worn brown leather wallet open,
inside the wallet a crumpled 10-rouble Belarusian note, several copper 20-kopeck coins, one single 200-rouble note,
her fingertips counting the coins, slight tremor in the index finger,
the pharmacy counter edge just visible below the wallet,
warm sodium overhead light catching the metal of the coins,
hard ink outline on coin edges, wallet seams, fingernails,
cell-shaded color: brown leather warm, coin copper warm catchlight, paper notes pale,
camera ECU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm overhead sodium, hard catchlight on coin metal, deep shadow inside wallet recess

**Continuity:** poverty marker; 200-rouble note callback in A6_SH17 (then she'll have 142.000 in same blue notes)

---

### A1_SH07 — WS eye static — Pharmacy queue behind heroine

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
wide shot of the interior of the small Soviet pharmacy on Pervomayskaya in Mogilev,
{HEROINE_ELENA_AGE_28} at the counter on the left, baby pram beside her,
behind her a queue of six people in summer dress: three elderly women in floral house dresses each holding a prescription slip, a middle-aged man in a checked shirt, a young woman holding a small child of about 18 months,
warm wooden pharmacy shelves on both walls, sodium ceiling lights,
hard ink outline on every figure and shelf edge,
cell-shaded color blocks in two tones for each figure,
camera WS eye level locked off, 16:9 cinematic composition,
{NEG}
```

**lightingMood:** warm sodium ceiling lights, soft window daylight from entrance behind queue

**Continuity:** queue is six people — narration count match

---

### A1_SH08 — MS eye static — Neighbor Tamara turns around

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
medium shot of {NEIGHBOR_TAMARA_AGE_55} in the pharmacy queue, just ahead of the heroine,
she is turning in three-quarter view toward the camera/heroine, recognition starting on her face,
bright floral summer dress in faded blues and pinks, canvas shoulder bag with leather handles,
salt-and-pepper hair pinned up loosely showing grey roots at the temples,
burgundy lipstick painted slightly past the natural lip line, gold-tone clip earrings,
warm sodium pharmacy ceiling light, soft cool window-fill from the right,
hard ink outline on her silhouette, dress floral pattern, bag,
cell-shaded with subtle cross-hatching on dress fabric,
camera MS eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm sodium overhead + cool window-fill from right, two-tone shading on dress

**Continuity:** Tamara introduced; her single appearance throughout the entire film

---

### A1_SH09 — CU eye static — Tamara's face, kind concerned eyes

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
close-up of {NEIGHBOR_TAMARA_AGE_55}'s face in three-quarter view,
soft round face, kind worried hazel eyes with crow's feet,
burgundy lipstick painted slightly past her upper lip outline, the imperfection deliberate and visible,
grey roots showing at her temples where her hair is pinned up,
faint blush on cheekbones from the summer warmth,
gold-tone clip earring visible at the right ear,
warm sodium overhead light from the pharmacy ceiling, soft cool fill from the front window,
hard ink outline on lip contour, eye contours, earring,
cell-shaded skin in two tones with subtle hatching under the eyes,
camera CU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm sodium top + cool front-fill, soft skin tones

**Continuity:** burgundy lipstick → Tamara anchor; same color reappears on Sveta in A2 (different character, similar provincial signifier)

---

### A1_SH10 — ECU eye static — Tamara reaches into her bag

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme close-up of {NEIGHBOR_TAMARA_AGE_55}'s right hand emerging from the open mouth of a canvas shoulder bag with leather handles,
her fingers holding a small white plastic pill bottle with a forest-green label,
the bag's interior dim with a yellow shopping receipt visible inside,
slight tremor of recognition in the heroine's hand reaching toward it from the right edge of frame,
warm sodium pharmacy light catching the white plastic of the bottle, cool shadow inside the bag,
hard ink outline on the bottle, the canvas bag stitching, the fingers,
cell-shaded color blocks: white bottle warm, green label flat color, canvas bag cool grey-brown,
camera ECU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm catchlight on bottle, deep cool shadow inside bag, soft sodium overall

**Continuity:** the bottle — the central object of the entire film, first physical appearance

---

### A1_SH11 — ECU eye push_in — Magnesium bottle close-up **(Iconic)**

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme close-up pushing in slowly on a small white plastic pill bottle held up between thumb and forefinger,
on its forest-green-and-white label cyrillic typography in bold sans-serif: БИОПЛЮС — МАГНИЙ+,
beneath in smaller text 30 КАПСУЛ. ПРОБНИК. БЕСПЛАТНО,
a small green silhouette of a leaf icon at the top-left of the label,
beige-cream background of the pharmacy interior, warm sodium catchlight on the bottle plastic,
hard ink outline crisp on every cyrillic letterform and the leaf icon,
cell-shaded color blocks: white plastic bottle, forest-green label, ink-black text,
camera ECU eye level slow push-in, 16:9 cinematic iconic composition,
{NEG}
```

**lightingMood:** warm sodium catchlight on plastic, soft beige background falloff

**Continuity:** the iconic object — appears identical throughout A2/A3/A4; absent in A7 (no BIO+ on shelves)

**Iconic frame:** yes — paste-ready for thumbnail use

---

### A1_SH12 — OTS eye static — Tamara talking, heroine holding bottle

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
over-the-shoulder shot from behind {HEROINE_ELENA_AGE_28} looking at {NEIGHBOR_TAMARA_AGE_55} ahead of her in the queue,
Tamara turned three-quarters, her burgundy-lipsticked mouth moving in mid-sentence,
in the heroine's hand the small white BIO+ Magnesium bottle held loosely,
shallow focus — heroine's shoulder soft in foreground, Tamara's face sharp,
warm sodium pharmacy ceiling light, queue of women visible behind Tamara out of focus,
hard ink outline on Tamara's face, the bottle in foreground, the heroine's shoulder,
cell-shaded coloring, 16:9 cinematic OTS composition,
{NEG}
```

**lightingMood:** warm sodium top, shallow DOF separates planes

**Continuity:** dialogue paraphrase shot — narrator quotes Tamara's promotional line

---

### A1_SH13 — CU eye static — Heroine hesitates, then pockets it

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
close-up of {HEROINE_ELENA_AGE_28}'s face in three-quarter view,
expression uncertain — her eyes flick down to her own hand holding the bottle, then back up at Tamara off-frame,
in the foreground bottom edge her right hand visible holding the small white BIO+ Magnesium bottle, fingertips closing around it,
younger smooth skin, brighter pale grey-blue eyes, no grey hair, very faint sunburn on the nose bridge from summer outside,
warm sodium pharmacy light from above, cool fill from the front window,
hard ink outline on her face, the bottle, her fingertips,
cell-shaded skin two-tone with subtle hatching under the eyes,
camera CU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm overhead + cool window-fill, hesitation captured in light asymmetry

**Continuity:** the moment of acceptance — narrative pivot

---

### A1_SH14 — WS eye static — Exit pharmacy with pram in summer heat

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
wide shot of {HEROINE_ELENA_AGE_28} pushing the white baby pram out of the pharmacy door onto the Pervomayskaya street pavement,
{DAUGHTER_OLDER_AGE_04} walking beside the pram still holding its side,
behind them the green-painted pharmacy facade with the cyrillic sign АПТЕКА ЗДОРОВЬЕ,
above them the sky a hot summer washed-out white-blue at 31°C, heat shimmer visible at the edges of the road,
short sharp shadows directly under each figure,
warm-yellow sodium daylight, dust haze in the air,
hard ink outline on the figures, the pram, the pharmacy sign,
cell-shaded color blocks, 16:9 cinematic composition,
camera WS eye level locked off,
{NEG}
```

**lightingMood:** hot summer overhead noon-like sun, short hard shadows, dust haze

**Continuity:** Pharmacy facade matches A1_SH03 (return shot)

---

### A1_SH15 — MS eye track_lateral — Walking home on shaded side

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
medium shot of {HEROINE_ELENA_AGE_28} pushing the white baby pram along the shaded side of Pervomayskaya street,
{DAUGHTER_OLDER_AGE_04} holding the side of the pram in silence,
dappled tree-shadow across the asphalt, ribbon of warm sodium sun on the unshaded side beyond,
in the heroine's right pocket of her cotton summer sundress a faint bulge of the small white pill bottle,
camera tracks laterally at eye level matching the slow walk,
hard ink outline on the figures, dappled cross-hatching for tree shadow,
cell-shaded color, 16:9 cinematic composition,
{NEG}
```

**lightingMood:** dappled tree shadow on asphalt, warm sodium ribbon beyond, cool blue shadow under trees

**Continuity:** bottle now in pocket — transition to home

---

### A1_SH16 — ECU low static — Bottle corner in sundress pocket

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme close-up from a low angle of the pocket of a cotton summer sundress in pale yellow,
inside the pocket the curved corner of a small white plastic pill bottle pushing the fabric out,
weave of the cotton fabric visible, slight sunlight bleeding through the thin material,
the bottle inside catching a sliver of warm sodium light from above,
hard ink outline on the fabric weave, the bottle curve,
cell-shaded color: pale yellow cotton with subtle cross-hatching, white bottle warm-toned,
camera ECU at low angle locked off, 16:9,
{NEG}
```

**lightingMood:** warm sodium top with light filtering through thin cotton fabric, soft shadow inside pocket

**Continuity:** bottle in pocket — payoff for SH15

---

### A1_SH17 — EWS eye static — Apartment kitchen (yellow wallpaper)

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme wide establishing shot of a small Soviet-era kitchen in a Mogilev panel apartment, 2008,
yellow floral wallpaper with faded daisy pattern covering the walls,
a round wooden table in the centre under a single hanging pendant lamp with a beige fabric shade,
the table covered with a faded green-and-white checked plastic tablecloth,
a window on the right looking out onto the inner courtyard with summer light coming through,
old gas stove against the far wall, small porcelain sink under the window,
an empty wooden high-chair against the wall, an old TV-set "Рубин" on a stand in the doorway to the room,
hard ink outline on every furniture edge, wallpaper pattern abstracted to flat shapes,
cell-shaded color in three tones, 16:9 cinematic composition,
camera EWS eye level locked off,
{NEG}
```

**lightingMood:** warm summer afternoon daylight through window, soft warm fill from yellow walls, cool shadow in corners

**Continuity:** yellow wallpaper kitchen — recurring location through A1/A2/A3/A4/A5

---

### A1_SH18 — MS eye static — Heroine places bottle on table

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
medium shot of {HEROINE_ELENA_AGE_28} standing at the kitchen table,
her right hand placing the small white BIO+ Magnesium pill bottle on the green-and-white checked tablecloth,
in the doorway to the living room behind her, the back of {DAUGHTER_OLDER_AGE_04}'s head visible facing an old "Рубин" TV set showing flickering colored Soyuzmultfilm cartoons,
warm afternoon daylight through the kitchen window from the right,
hard ink outline on the heroine's silhouette, the bottle, the kitchen elements, the TV silhouette,
cell-shaded color blocks two-tone, 16:9 cinematic composition,
camera MS eye level locked off,
{NEG}
```

**lightingMood:** warm afternoon window light from right, cool ambient kitchen shadow, faint flickering glow from TV in background doorway

**Continuity:** TV cartoons (period-appropriate Soviet animation) — provincial nostalgia signifier

---

### A1_SH19 — ECU eye push_in — Bottle label fine print

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme close-up pushing in slowly on the small white BIO+ Magnesium bottle label,
cyrillic fine print directly readable: ПО ОДНОЙ КАПСУЛЕ В ДЕНЬ. БИОЛОГИЧЕСКИ АКТИВНАЯ ДОБАВКА. БЕЗ РЕЦЕПТА,
forest-green label background with white sans-serif typography,
slight specular highlight on the rounded white plastic shoulder of the bottle,
behind the bottle the green-and-white checked tablecloth out of focus,
hard ink outline crisp on every cyrillic letterform,
cell-shaded color: white bottle, forest-green label, ink-black text,
camera ECU eye level slow push-in, 16:9 cinematic close-up composition,
{NEG}
```

**lightingMood:** warm afternoon sidelight, sharp catchlight on bottle plastic, soft fall-off behind

**Continuity:** same bottle as A1_SH11 from different angle; fine print readable

---

### A1_SH20 — CU eye static — Unscrewing the lid

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
close-up of {HEROINE_ELENA_AGE_28}'s face and hands at the kitchen table,
both hands working the white plastic cap of the BIO+ Magnesium bottle, just unscrewed,
her nose tilted slightly toward the open bottle as the smell rises,
subtle expression of curiosity — eyes half-closed catching the smell,
warm afternoon sidelight from the window on the right,
hard ink outline on her face, hands, the bottle cap,
cell-shaded skin in two tones with very subtle hatching at the bridge of the nose where she focuses,
camera CU eye level locked off, 16:9,
{NEG}
```

**lightingMood:** warm window sidelight from right, cool fill from kitchen wallpaper reflection, soft skin tones

**Continuity:** sensory beat — smell — leads to leitmotif birth in SH22

---

### A1_SH21 — ECU high static — Capsule on palm, then in mouth

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
extreme close-up from a high angle of a single small dark-amber gelatin capsule resting in the centre of {HEROINE_ELENA_AGE_28}'s pale palm,
behind the palm at the bottom of the frame the corner of a chipped white enamel cup with cold tap water inside,
soft warm afternoon kitchen light from above the right,
hard ink outline on the capsule, the palm creases, the cup rim,
cell-shaded color: warm pale skin, dark amber capsule, cool white cup highlight,
camera ECU at high angle locked off, 16:9,
{NEG}
```

**lightingMood:** warm afternoon top-right light, hard catchlight on the capsule's gelatin sheen, cool catch on the cup rim

**Continuity:** body-action — capsule consumed; sets up leitmotif birth

---

### A1_SH22 — CU eye push_in — Leitmotif birth, first smile **(Iconic)**

**positiveTemplate:**
```
{STYLE}, {PALETTE_A1},
close-up of {HEROINE_ELENA_AGE_28} sitting at the kitchen table forty minutes after taking the magnesium capsule,
her face in three-quarter view, eyes half-closed in mild physical surprise, a faint involuntary smile pulling at the corner of her mouth — the first smile in the entire film,
warm afternoon kitchen light from the window on the right, golden cast on her cheek and hair,
soft cool ambient fill from the yellow wallpaper bouncing back,
hard ink outline on her face, hair, the table edge in foreground,
cell-shaded skin in two tones with very subtle hatching just above the navel area where the warm "knot" sensation begins (this is the sensory anchor, even if not directly visible),
camera CU eye level slow push-in, 16:9 cinematic iconic composition,
{NEG}
```

**lightingMood:** warm afternoon golden sidelight, soft yellow-wallpaper bounce, faint glow on cheekbone (the "warm knot" externalized through warm-bias palette)

**Continuity:** sensory leitmotif BIRTH — same camera direction will recur in A2_SH28, A3_SH14, A3_SH25, A4_SH09, A5_SH21, A6_SH08, A6_SH15. Then absent in A7+Coda.

**Iconic frame:** yes

---

## ИТОГО Cold open + A1

- 12 + 22 = **34 шота**
- Длительность: ~170 сек = 2:50
- 5 iconic frames: A1_SH01, A1_SH11, A1_SH22, C11, C12
- 2 named characters introduced: HEROINE_ELENA (28), MOM_GALINA (60), NEIGHBOR_TAMARA (55), DAUGHTER_OLDER (4), DAUGHTER_YOUNGER (in pram, 0)
- Anchor establishment: mother's cross (hidden, C3), Galina's glasses-chain (A1_SH04), the bottle (A1_SH10/11), Tamara's burgundy lipstick (A1_SH08/09)

---

## Что дальше

Жди ОК на этот блок (34 промпта Cold open + A1) — потом пишу **A2 «Вход»** (28 шотов).
