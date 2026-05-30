# bio_plus — Character profiles (cinematic graphic-novel style)

> **Visual style:** cinematic graphic novel illustration, cell-shaded coloring, hard black ink outline, warm lamp highlights, deep blue night shadows, flat color blocks with subtle hatching.
> **Identity stack:** no LoRA training. Identity holds via text-prompt anchor + one IP-Adapter reference image per character at weight 0.4-0.5. Comic-style consistency carries the rest.
> **Style block (prepend to every prompt):** `cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline, flat color blocks with subtle hatching, warm/cool light contrast, 16:9 cinematic composition, no photorealism`
> **Universal negative (append to every prompt):** `photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii`

---

## 1. HEROINE_ELENA_BASE — главная героиня (Елена)

**Character code:** HEROINE_ELENA
**Profile code:** HEROINE_ELENA_BASE
**Trigger token:** HEROINE_ELENA_BASE
**Primary age:** 38 (A2 entry into BIO+)
**Age variants:** 28 (A1), 38 (A2), 39 (A3), 41 (A4), 42 (A5), 44 (A6), 46 (A7+Coda)
**Identity anchor:** thin silver chain with a small mother's cross — worn under blouse through A1-A6, **moved over the blouse in A7+Coda**
**Target images for IP-Adapter:** 1 anchor portrait at age 38 (3/4 view, neutral grey backdrop)
**useIpAdapter:** true (at 0.4 weight)

### promptBase (identity-lock, ~500 char)

```
A Belarusian woman, mousy ash-brown hair shoulder length parted in the centre, pale grey-blue eyes set wide apart, thin pale lips slightly chapped, small dark mole on left jawline below the ear, narrow nose with a slight bump, thin silver chain necklace bearing a small Orthodox cross her mother gave her, modest middle-class workwear of provincial Belarus, quiet observant face that rarely smiles, slight downward set at the corners of the mouth, weary patient expression, small build, no makeup, no jewelry beyond the cross necklace.
```

### Age-variant overlay tokens (prepended to promptBase per act)

```
A1 (age 28, summer 2008):   younger face, brighter eyes, no grey hair, simple cotton sundress, faint sunburn, no fatigue lines, pushing a baby pram
A2 (age 38, autumn 2018):   first hint of crow's feet, brown autumn coat over white blouse, hair tied back, mother's cross under blouse
A3 (age 39, 2019):          dark navy blazer over white blouse, silver "Bronze Partner" name badge on lapel, hair pinned up, slight corporate polish
A4 (age 41, 2021):          same navy blazer with "Silver Partner" badge, very faint dark circles under eyes, slightly tighter mouth
A5 (age 42, autumn 2022):   visible fatigue, hair loose and unwashed, brown coat sodden with rain, no makeup
A6 (age 44, March 2024):    same navy blazer with "Gold Partner" badge but worn-looking, deeper crow's feet, holding a yellow plastic folder under the arm
A7 (age 46, Jan 2026):      grey at the temples, deeper lines, blue cleaner's smock with "Cleaner. Elena" badge, mother's cross over the smock — visible to the camera for the first time
```

### promptAngles (5 reference angles for IP-Adapter dataset, ~800 char)

```
front view, eye level, three-quarter framing, hands resting at sides, pale grey backdrop, soft north-window light, neutral expression
three-quarter left view, eye level, medium close-up, mother's cross half-visible at collar, same backdrop and light
profile right view, eye level, head-and-shoulders, hair tucked behind ear showing small mole on jawline
back of head, eye level, medium shot, ash-brown hair down to mid-back of the neck, blouse collar visible
extreme close-up of left jawline below ear, showing the small dark mole anchor, soft side light
```

### promptVariety (10 environmental scenes from her vignette, ~1500 char)

```
standing at a Belarusian pharmacy counter on Pervomaiskaya street in summer dust, mother (50s, grey pharmacist coat) on the other side, baby pram beside her
sitting at a round kitchen table under flowered yellow wallpaper, looking at a small white pill bottle in her hand, evening lamp light
walking down a queue inside a small panel-building pharmacy, holding the handle of a baby pram, light summer sundress
sitting in a third-row conference chair under cold corporate lighting, listening to a stage speaker, navy blazer with silver badge
standing on a hotel room balcony in Gomel looking down at Lenin Square at six in the evening, dark blue blazer
seated at a kitchen table at night surrounded by nine turquoise BIO+ cartons, single yellow ceiling lamp, calculator on the table
seated in a notary's office on a leather chair, hand on a stack of legal papers, yellow folder on the desk, fluorescent overhead light
descending a panel-building stairwell with a yellow plastic folder under the arm, neon corridor light from a single bulb above
mopping the floor of a supermarket aisle of dietary supplements, blue cleaner's smock, fluorescent retail lighting, mop and bucket
standing at a dormitory window at night, looking through a courtyard at the distant yellow neon of a pharmacy sign
```

### Negative (character-tailored, ~500 char)

```
glamour, beauty makeup, lipstick, mascara, false eyelashes, eye shadow, jewelry on hands except thin gold ring, large earrings, dangling earrings, plunging neckline, model pose, fashion shoot, runway, photoreal, photograph, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, anime, manga, chibi, kawaii, sexualization, swimwear, low-cut top, exposed cleavage, oversmooth, painterly stylization, oversaturated color, deformed hands, extra fingers, missing fingers, two heads, watermark, text
```

---

## 2. SPONSOR_SVETA_BASE — Светлана Орлова (вербовщик)

**Character code:** SPONSOR_SVETA
**Profile code:** SPONSOR_SVETA_BASE
**Trigger token:** SPONSOR_SVETA_BASE
**Primary age:** 42 (A2)
**Age variants:** 42 (A2), 43 (A3), 45 (A4), 46 (A5), 48 (A6), 50 (A7 TV-news arrest)
**Identity anchor:** **gold "Серебряный директор БиоПлюс" lapel badge** — always visible on her white blazer (except A7 TV-news, where her white blazer is dirty and she has handcuffs)
**Target images for IP-Adapter:** 1 anchor portrait at age 42, white blazer + badge
**useIpAdapter:** true

### promptBase (~480 char)

```
A Belarusian woman in her forties, shoulder-length light-brown hair professionally styled and slightly back-combed, warm hazel eyes with practised friendly crinkles, full lips painted burgundy red with a precise rim, broad cheekbones, no visible moles or scars, slim athletic build from gym work, white tailored business blazer over white silk shell blouse, single gold-toned lapel badge reading "Серебряный директор БиоПлюс", small gold stud earrings, French manicure, smell of jasmine and coffee.
```

### Age-variant overlay tokens

```
A2 (age 42, Oct 2018):  fresh styling, badge bright, freshly polished
A3 (age 43, 2019):      same look, slightly tired around the eyes after travel
A4 (age 45, 2021):      crisper jacket, hair higher and tighter, badge identical
A5 (age 46, 2 AM call): WITHOUT blazer — wearing a beige terrycloth robe, no makeup, dark circles, hair loose and flat, badge absent (this is the only shot showing her undressed-of-image)
A6 (age 48, Mar 2024):  back in full white blazer, burgundy lipstick fresh, badge on lapel, same hair
A7 (age 50, TV news):   white blazer SOILED with grey street grime, hair disheveled, handcuffs at wrists, no makeup, exhausted face, badge missing
```

### promptAngles (5 angles, ~700 char)

```
front view, eye level, three-quarter framing, hands clasped at waist, badge centred on lapel, pale grey backdrop, soft frontal light
three-quarter left view, eye level, medium close-up, badge in profile, gold catch light from frontal lamp
profile right view, eye level, head and shoulders, ear with gold stud earring visible
extreme close-up of left lapel showing "Серебряный директор БиоПлюс" badge in detail, gold-toned metal with engraved typography
back view, eye level, medium shot, back of styled hair and white collar of blazer
```

### promptVariety (10 scenes, ~1500 char)

```
standing behind a registration table at a Belarusian business centre lobby in October daylight, signing in attendees, turquoise BIO+ banner behind
on a conference stage at the regional Convention in Gomel with a microphone in hand, white blazer under stage lights
sitting next to the heroine in a third-row conference chair, leaning over to whisper, burgundy lipstick close to the heroine's ear
handing over a large turquoise "Bronze Starter Kit" box across a coffee-break table in a hotel lobby
walking arm-in-arm with the heroine along a corridor of the Belarusian Palace of the Republic in Minsk for the Diamond Rank gathering
opening a manila folder containing a microfinance loan flyer for the heroine in a coffee fairoom in Minsk
appearing in a 2 AM video call on a smartphone, wearing a beige robe in a dim bedroom — soft blue light from the phone screen on her face
sitting beside the heroine in the back of a Yandex taxi in March daylight, holding the heroine's hand on her thigh, white blazer crisp
standing in a notary's office on Leninskaya in Mogilev, watching the heroine sign over the older woman's left shoulder
appearing on a TV news segment under handcuffs in a courthouse corridor in Minsk — white blazer dirtied with road grime, no makeup
```

### Negative (~500 char)

```
sexualization, low-cut blouse, exposed cleavage, model pose, fashion shoot, runway, glamour, oversmooth skin, plastic skin, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, painterly stylization, oversaturated color, harsh dramatic shadows, deformed hands, extra fingers, two heads, watermark, text, brand logos on clothing other than the BIO+ badge, swimwear, lingerie
```

---

## 3. LEADER_VIKTOR_BASE — Виктор Соколовский (региональный лидер)

**Character code:** LEADER_VIKTOR
**Profile code:** LEADER_VIKTOR_BASE
**Trigger token:** LEADER_VIKTOR_BASE
**Primary age:** 55 (A2/A3)
**Age variants:** 55 (A2), 56 (A3), 58 (A4)
**Identity anchors (two, paired):** **gold pinky ring with cubic-zirconia "fake diamond"** + **gold-rimmed Seiko 5 (replica) watch on left wrist**
**Target images for IP-Adapter:** 1 anchor portrait at age 55, both anchors visible
**useIpAdapter:** true

### promptBase (~500 char)

```
A Belarusian man in his mid-fifties, broad-shouldered and tall (1m88), thick salt-and-pepper hair styled with pomade, deeply tanned face from a recent Turkish holiday, square jaw with grey stubble, narrow brown eyes set under heavy brows, broad fleshy nose, thin determined mouth, dark navy double-breasted suit with a faint pinstripe over a powder-blue shirt and no tie, gold pinky ring with a square cubic-zirconia stone on the right hand, gold-rimmed Seiko 5 replica watch on the left wrist, smell of expensive sandalwood cologne and cigarette smoke.
```

### Age-variant overlay tokens

```
A2 (age 55, Oct 2018):  fresh tan, suit slightly tighter at the chest
A3 (age 56, 2019):      same suit, slightly more grey, microphone in hand on a Gomel conference stage
A4 (age 58, Mar 2021):  same suit lapel pin BIO+ Diamond, microphone, sweat at hairline under stage lights
```

### promptAngles (5 angles, ~700 char)

```
front view, eye level, three-quarter framing, both hands visible at sides showing gold pinky ring on right and Seiko watch on left, pale grey backdrop
three-quarter left view, eye level, medium close-up, left wrist with Seiko watch raised toward camera
profile right view, eye level, head and shoulders, right hand at chin showing gold pinky ring
extreme close-up of right hand pinky ring with cubic-zirconia stone, gold band, against a dark navy suit cuff
extreme close-up of left wrist with gold-rimmed Seiko 5 replica watch face, dial visible, leather strap
```

### promptVariety (8 scenes, ~1200 char)

```
on a conference stage at a Mogilev business centre presenting BIO+ hierarchy slides under cold corporate lights, microphone in hand
on a stage at a Gomel hotel conference centre with two hundred attendees, gold pinky ring catching stage light
leaning toward the heroine at a coffee fair after a Gomel presentation, holding a glass of cheap champagne
on the Minsk Palace of Republic stage in March 2021, beside a white BMW X5 on a pedestal, under pink and white stage lighting
walking offstage at the Minsk Diamond Convention with Sveta Orlova behind him, both heading to the wings
in a private room at a Minsk hotel signing autographs for Silver-tier Partners, gold pinky ring prominent on signing hand
standing at a check-in counter at Minsk-2 airport handing his passport across — visible cuff link of gold-rimmed Seiko watch
on a CCTV still from a Tbilisi-Istanbul border crossing in February 2026, grainy low-resolution image of the same man with luggage
```

### Negative (~450 char)

```
weapons, gun, knife, military insignia, swastika, Z or V symbol, real political symbols, real-world brand logos other than the BIO+ pin, fashion shoot, glamour, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, painterly stylization, oversaturated color, deformed hands, extra fingers, two heads, watermark, text overlay, blood, wound, cigarette in mouth in close-up
```

---

## 4. FRIEND_LARISA_BASE — Лариса (подруга-критик)

**Character code:** FRIEND_LARISA
**Profile code:** FRIEND_LARISA_BASE
**Trigger token:** FRIEND_LARISA_BASE
**Primary age:** 38 (A2 introduction)
**Age variants:** 38 (A2), 42 (A5 ultimatum), 46 (A7 street encounter)
**Identity anchor:** **thin metal-frame glasses + always black turtleneck** (under various outer layers)
**Target images for IP-Adapter:** 1 anchor portrait at age 38, glasses + black turtleneck
**useIpAdapter:** true

### promptBase (~450 char)

```
A Belarusian woman in her late thirties, dark-brown hair pulled back into a low ponytail with no fly-away strands, oval face with sharp cheekbones, thin oval-shaped wire glasses with brushed-silver frames, calm hazel eyes, no makeup, thin pale lips, a faint vertical line between the eyebrows from years of close reading, always wearing a fitted black turtleneck sweater of merino wool under an outer garment, small build, no jewelry, modest middle-class librarian-academic aesthetic.
```

### Age-variant overlay tokens

```
A2 (age 38, Oct 2018):  beige autumn wool coat over the black turtleneck, hair slightly less tight
A5 (age 42, Oct 2022):  grey wool cardigan over the black turtleneck, slightly worn-looking from a year of MFO debt
A7 (age 46, Jan 2026):  black down winter jacket over the same black turtleneck, hat removed, glasses fogged from cold
```

### promptAngles (5 angles, ~700 char)

```
front view, eye level, three-quarter framing, glasses centred, hands in coat pockets, pale grey backdrop
three-quarter left view, eye level, medium close-up, brushed-silver glasses frame catching frontal light
profile right view, eye level, head and shoulders, ear visible beyond the pulled-back hair
extreme close-up of brushed-silver oval glasses frame against dark eyebrow, lens reflection of soft window light
back view, eye level, medium shot, low ponytail of dark-brown hair against black turtleneck collar
```

### promptVariety (8 scenes, ~1100 char)

```
hugging the heroine on the pavement outside a Belarusian business centre on a cool October afternoon, beige coat over black turtleneck
sitting on a third-row conference chair in a presentation hall, turning slightly toward the heroine with a worried expression
standing at a coffee-break table in a hotel lobby holding a plastic cup, eyebrows furrowed at the heroine across the room
sitting opposite the heroine at a window table in Cafe Lido in Mogilev on a grey October afternoon, grey cardigan, glasses
extending a smartphone across the cafe table toward the heroine, screen showing a microfinance debt statement
walking away from the heroine under a light October rain, beige coat, no hood up, glasses partially fogged
walking down Pushkinsky Prospekt in Mogilev in heavy winter wear with a black down jacket, glasses fogged, breath visible
freezing in mid-step on the snowy pavement when she recognises the heroine across the way
```

### Negative (~400 char)

```
makeup, lipstick, mascara, eye shadow, jewelry, glamour, model pose, fashion shoot, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, painterly stylization, oversaturated color, deformed hands, extra fingers, two heads, watermark, text overlay, blurry, low quality, harsh dramatic shadows
```

---

## 5. MOM_GALINA_BASE — Галина Степановна (мать героини)

**Character code:** MOM_GALINA
**Profile code:** MOM_GALINA_BASE
**Trigger token:** MOM_GALINA_BASE
**Primary age:** 60 (A1, 2008)
**Age variants:** 60 (A1), 73 (A4 refusal), 76 (A6 implied, mother is still alive when daughter signs; dies in A7 backstory)
**Identity anchor:** **grey pharmacist's lab coat + thin steel chain on reading glasses around neck** — visible in every appearance at her workplace
**Target images for IP-Adapter:** 1 anchor portrait at age 60, pharmacist's grey coat + chain glasses
**useIpAdapter:** true

### promptBase (~480 char)

```
A Belarusian woman in her early sixties (primary age) with thinning grey-streaked hair pinned back severely, deep-set tired grey-blue eyes with prominent crow's feet, thin pale lips set firmly, narrow lined face with a small mole on the left jawline (same as her daughter — visual rhyme), wearing a long grey pharmacist's lab coat over a beige knit cardigan, thin reading glasses on a steel-link chain hanging around her neck against the lab coat, no makeup, modest stud earrings, weary patient expression of decades of dealing with sick customers.
```

### Age-variant overlay tokens

```
A1 (age 60, summer 2008):    full grey-streaked hair, healthier color, fluorescent pharmacy lighting
A4 (age 73, autumn 2021):    thinner hair, more grey, deeper lines, slower posture, same uniform
A6/A7 (age 76, 2024-2026):    only appears in implied/back-of-frame shots and not as a face — referenced through the mirroring of her glasses chain in the notary's office (A6_SH12)
```

### promptAngles (5 angles, ~700 char)

```
front view, eye level, behind a pharmacy counter, three-quarter framing, hands resting on the counter glass, pale grey backdrop
three-quarter left view, eye level, medium close-up, glasses chain visible against grey lab coat
profile right view, eye level, head and shoulders, reading glasses lifted to the bridge of the nose
extreme close-up of the steel-link chain holding the reading glasses, against the grey lab coat collar
back view, eye level, medium shot, grey lab coat back with collar tag, hair pinned at the crown
```

### promptVariety (6 scenes, ~900 char)

```
standing behind a pharmacy counter at Pharmacy Zdorovye on Pervomaiskaya 38 in Mogilev during summer dust, processing a customer's prescription
handing a bottle of children's syrup to a young customer with a baby pram on the other side of the counter
returning a turquoise BIO+ Calcium bottle across the pharmacy counter to her daughter without speaking, neutral face
stocking pharmacy shelves with paracetamol behind the counter under cold fluorescent light, grey lab coat
taking a break sitting on a stool in the pharmacy's back room, glasses chain visible, beige cardigan under lab coat
sitting at home in a kitchen wearing the beige cardigan without the lab coat, hair down, holding a chipped enamel mug of tea
```

### Negative (~400 char)

```
young, youthful, glamour, makeup, lipstick, jewelry beyond modest studs, fashion, model pose, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, painterly stylization, oversaturated color, harsh dramatic shadows, deformed hands, extra fingers, two heads, watermark, text overlay, sexualization
```

---

## 6. NEIGHBOR_TAMARA_BASE — тётя Тамара (катализатор A1)

**Character code:** NEIGHBOR_TAMARA
**Profile code:** NEIGHBOR_TAMARA_BASE
**Trigger token:** NEIGHBOR_TAMARA_BASE
**Primary age:** 55 (A1 only — single appearance, catalyst)
**Identity anchor:** **burgundy lipstick over the natural lip line + grey roots at temples** (well-meaning provincial Russian women style); also: **bright floral summer dress + canvas shoulder bag**
**Target images for IP-Adapter:** 1 anchor portrait at age 55 in the pharmacy queue
**useIpAdapter:** false (single appearance — text-only consistency is enough)

### promptBase (~400 char)

```
A Belarusian woman in her mid-fifties, salt-and-pepper hair pinned up loosely with grey roots at the temples and burgundy-dyed lengths, soft round face with kind worried eyes, burgundy lipstick painted slightly outside the natural lip line, gold-tone clip earrings, bright floral summer dress in faded blues and pinks, canvas shoulder bag with leather handles, comfortable middle-class older-woman provincial aesthetic.
```

### promptAngles (3 angles, ~400 char)

```
three-quarter view, eye level, medium close-up, hand reaching into the canvas bag to pull out a small white pill bottle
front view, eye level, full body, standing in a pharmacy queue with the canvas bag over the shoulder
extreme close-up of the right hand holding a small white pill bottle with green "БиоПлюс — Магний+" label between thumb and index finger
```

### promptVariety (4 scenes, ~500 char)

```
standing in line ahead of the heroine inside the small Belarusian pharmacy on Pervomaiskaya, turning around in profile
holding a small white BIO+ Magnesium pill bottle in her right hand, extending it toward the heroine across the queue
speaking near the heroine's ear in the pharmacy queue, burgundy lipstick close to camera, baby pram in foreground
walking out of the pharmacy ahead of the heroine with a small plastic shopping bag and canvas shoulder bag
```

### Negative (~400 char)

```
sexualization, glamour, model pose, fashion shoot, runway, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, painterly stylization, oversaturated color, deformed hands, extra fingers, two heads, watermark, text overlay, blurry
```

---

## 7. DAUGHTER_OLDER_BASE — старшая дочь

**Character code:** DAUGHTER_OLDER
**Profile code:** DAUGHTER_OLDER_BASE
**Trigger token:** DAUGHTER_OLDER_BASE
**Primary age:** 11 (A3 — school-form scene, identity-lock age)
**Age variants:** 4 (A1 by pram), 11 (A3), 13 (A4), 14 (A5), 16 (A6 implied), 18 (A7 Krakow video call)
**Identity anchor:** **dragonfly hair clip with iridescent enamel wings** — worn through A2-A4, **placed on shelf in A7 video call**
**Target images for IP-Adapter:** 1 anchor portrait at age 11, school uniform + dragonfly clip
**useIpAdapter:** true (low weight 0.35 — child safety priority)

> ⚠️ **Child safety** — all shots of children in this profile must follow the strict child-safety negative block. No adult proportions, no fashion poses, no model framing, no swimwear, no exposed skin beyond face and hands, no sexualization in any form.

### promptBase (~450 char)

```
A Belarusian girl, eleven years old at primary age, ash-brown hair shoulder length, pale grey-blue eyes (same as her mother), small straight nose with no bump yet, full pale cheeks, thin pale lips set seriously, an iridescent dragonfly hair clip with enamel blue-green wings pinned just above the right ear, neat school uniform (white blouse, navy pleated skirt, navy cardigan, white knee-socks, dark loafers), small build, modest natural pose, serious quiet observant child.
```

### Age-variant overlay tokens

```
A1 (age 4, 2008):       small toddler holding the side of a baby pram, summer cotton sundress, no dragonfly clip yet
A3 (age 11, 2019):      school uniform, dragonfly clip, holding a school backpack on the floor at her feet
A4 (age 13, 2021):      slightly taller, school sweater over the blouse, dragonfly clip still pinned, very faint disapproval in the eyes
A5 (age 14, 2022):      casual hoodie at home, dragonfly clip removed from hair but kept on a shelf
A6 (age 16, Mar 2024):  ONLY a back-of-head shot ascending a stairwell with a grey backpack — face not shown
A7 (age 18, Krakow):    medical-student polo shirt with university logo, hair tied back, dragonfly clip visible on shelf behind her, NOT worn
```

### promptAngles (4 angles, ~500 char)

```
front view, eye level, three-quarter framing, hands at sides, dragonfly clip visible at right of head, pale grey backdrop, soft window light
three-quarter left view, eye level, medium close-up, dragonfly clip in profile catching iridescent blue-green light
profile right view, eye level, head and shoulders, dragonfly clip pinned at the right side of the head, ear visible
extreme close-up of the dragonfly hair clip pinned in the ash-brown hair, iridescent enamel blue-green wings against a brown background
```

### promptVariety (6 scenes, ~700 char)

```
standing by an apartment doorway in school uniform with a backpack on the floor next to her feet, dragonfly clip pinned, neutral expression
appearing on a smartphone video call screen from a Krakow student dormitory wearing a polo shirt, dragonfly clip on the shelf behind her
ascending a panel-building stairwell from below with a school backpack, only the back of her head and shoulders visible
standing in the doorway of an apartment kitchen watching her mother carry a large turquoise BIO+ Gold box through the doorway, quiet
sitting at a hallway shoe-bench tying her shoes for school in the morning, dragonfly clip pinned, neutral expression
walking beside her mother holding the side of a baby pram in a Mogilev courtyard in summer 2008 (age 4)
```

### Negative (child-safety priority, ~600 char)

```
adult body proportions, adult model pose, fashion shoot, runway pose, sexualization, swimwear, lingerie, underwear, exposed skin beyond face and hands, low-cut clothing, makeup, lipstick, eye shadow, mascara, false eyelashes, jewelry on hands, large earrings, dangling earrings, plunging neckline, mature breasts, hourglass figure, hip emphasis, tight clothing, leg emphasis, dance pose, gymnast pose, gymnastics, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, painterly stylization, oversaturated color, deformed hands, extra fingers, two heads, watermark, text overlay, low quality
```

---

## 8. DAUGHTER_YOUNGER_BASE — младшая дочь

**Character code:** DAUGHTER_YOUNGER
**Profile code:** DAUGHTER_YOUNGER_BASE
**Trigger token:** DAUGHTER_YOUNGER_BASE
**Primary age:** 13 (A6 stairwell encounter — identity-lock age, the catastrophe witness)
**Age variants:** 0 (A1 infant in pram), 8 (A3), 10 (A4), 11 (A5), 13 (A6), 15 (A7)
**Identity anchor:** **light freckles across the bridge of the nose + plush rabbit with one missing ear** (the rabbit accompanies her through A1-A5; absent in A7)
**Target images for IP-Adapter:** 1 anchor portrait at age 13, freckles + grey backpack
**useIpAdapter:** true (low weight 0.35 — child safety priority)

> ⚠️ **Child safety** — strict negative block, same as DAUGHTER_OLDER_BASE.

### promptBase (~470 char)

```
A Belarusian girl, thirteen years old at primary age, ash-brown hair short to the shoulders with a small fringe across the forehead, pale grey-blue eyes (same as her mother and sister), small straight nose, light scatter of small freckles across the bridge of the nose and cheekbones, full slightly chapped lips set seriously, modest school uniform (white blouse, navy pleated skirt or trousers, dark school jacket, white socks, dark school shoes), small build, modest natural pose, very quiet observant child with serious eyes.
```

### Age-variant overlay tokens

```
A1 (age 0, 2008):       newborn baby sleeping in a baby pram, soft cotton blanket, no visible features beyond head
A3 (age 8, 2019):       drawing at a kitchen table on lined paper, plush rabbit with one missing ear at her elbow, casual home clothes
A4 (age 10, 2021):      casual home clothes, plush rabbit on the bed in the background
A5 (age 11, 2022):      pyjamas at home, plush rabbit still on her pillow
A6 (age 13, Mar 2024):  school uniform with a grey backpack, dark winter coat over the uniform, ascending a stairwell, freckles visible
A7 (age 15, Jan 2026):  casual hoodie at home, plush rabbit absent, smartphone in hand at the meal table
```

### promptAngles (4 angles, ~500 char)

```
front view, eye level, three-quarter framing, hands at sides, freckles visible on nose bridge, pale grey backdrop, soft window light
three-quarter left view, eye level, medium close-up, freckles on left cheekbone visible, ear with no earring
profile right view, eye level, head and shoulders, fringe falling over forehead, freckles on nose bridge
extreme close-up of the bridge of the nose showing the light scatter of small freckles, soft frontal light
```

### promptVariety (6 scenes, ~800 char)

```
ascending a panel-building stairwell with a grey school backpack, dark winter coat over the school uniform, looking up
appearing on a smartphone video call from a kitchen table holding up the screen toward her mother, plush rabbit on her lap
sitting at a kitchen table drawing on lined paper with coloured pencils, plush rabbit with one missing ear on the table
eating buckwheat with stewed meat at a long dormitory common-kitchen table, smartphone propped against a salt shaker
sleeping in a small bedroom bed under a flowered quilt, plush rabbit with one ear missing on the pillow beside her
sleeping in a baby pram outside a Belarusian pharmacy under summer dust, only the top of the head visible
```

### Negative (child-safety priority, ~600 char)

```
adult body proportions, adult model pose, fashion shoot, runway pose, sexualization, swimwear, lingerie, underwear, exposed skin beyond face and hands, low-cut clothing, makeup, lipstick, eye shadow, mascara, false eyelashes, jewelry, plunging neckline, hourglass figure, hip emphasis, tight clothing, leg emphasis, dance pose, gymnastics, ballet pose, photoreal, photograph, 3D render, CGI, hyperrealistic, anime, manga, chibi, kawaii, painterly stylization, oversaturated color, deformed hands, extra fingers, two heads, watermark, text overlay, low quality
```

---

## Сводка по anchor-якорям (для проверки visual consistency)

| Персонаж | Якорь | Где обязателен в кадре |
|---|---|---|
| HEROINE_ELENA | Серебряный крестик матери на тонкой цепочке | A1-A6 под блузкой (намёк), A7+Coda — поверх блузки |
| SPONSOR_SVETA | Золотой значок «Серебряный директор БиоПлюс» | Все её появления **кроме** A5_SH16 (звонок в халате) и A7 TV-news |
| LEADER_VIKTOR | Перстень с фальш-брильянтом на правом мизинце + Сейко с золочёной рамкой на левом запястье | Все его появления (A2, A3, A4) — оба видимы хотя бы одним краем кадра |
| FRIEND_LARISA | Очки в тонкой серебристой металлической оправе + чёрная водолазка под верхней одеждой | Все её появления |
| MOM_GALINA | Серый аптечный халат + тонкая стальная цепочка для очков на шее | Все её появления в аптеке (A1, A4) |
| NEIGHBOR_TAMARA | Бордовая помада чуть за контур губы + холщовая сумка | Её единственное появление в A1 |
| DAUGHTER_OLDER | Заколка-стрекоза с переливающимися крыльями | A2-A4 на ней, A5 рядом, A7 на полке за плечом (не на ней) |
| DAUGHTER_YOUNGER | Веснушки на переносице + плюшевый заяц с одним ухом | Заяц A1-A5, веснушки всегда |

---

## Полные тригер-токены (для positive prompts шотов)

Эти токены вставляются в `promptFields.positive` шотов в формате `{HEROINE_ELENA_AGE_28}`, `{SPONSOR_SVETA_AGE_42}` и т.д. Резолвятся в полный identity-блок при прогоне `resolve_placeholders.sql`.

```
{HEROINE_ELENA_AGE_28}   — A1
{HEROINE_ELENA_AGE_38}   — A2
{HEROINE_ELENA_AGE_39}   — A3
{HEROINE_ELENA_AGE_41}   — A4
{HEROINE_ELENA_AGE_42}   — A5
{HEROINE_ELENA_AGE_44}   — A6
{HEROINE_ELENA_AGE_46}   — A7, Coda
{SPONSOR_SVETA_AGE_42}   — A2
{SPONSOR_SVETA_AGE_43}   — A3
{SPONSOR_SVETA_AGE_45}   — A4
{SPONSOR_SVETA_AGE_46_ROBE}  — A5 (the 2 AM phone call only)
{SPONSOR_SVETA_AGE_48}   — A6
{SPONSOR_SVETA_AGE_50_ARRESTED}  — A7 TV news
{LEADER_VIKTOR_AGE_55}   — A2
{LEADER_VIKTOR_AGE_56}   — A3
{LEADER_VIKTOR_AGE_58}   — A4
{FRIEND_LARISA_AGE_38}   — A2
{FRIEND_LARISA_AGE_42}   — A5
{FRIEND_LARISA_AGE_46}   — A7
{MOM_GALINA_AGE_60}      — A1
{MOM_GALINA_AGE_73}      — A4
{NEIGHBOR_TAMARA_AGE_55} — A1
{DAUGHTER_OLDER_AGE_04}  — A1 toddler
{DAUGHTER_OLDER_AGE_11}  — A3
{DAUGHTER_OLDER_AGE_13}  — A4
{DAUGHTER_OLDER_AGE_14}  — A5
{DAUGHTER_OLDER_AGE_16}  — A6 (back-only)
{DAUGHTER_OLDER_AGE_18}  — A7 Krakow
{DAUGHTER_YOUNGER_AGE_00}  — A1 newborn
{DAUGHTER_YOUNGER_AGE_08}  — A3
{DAUGHTER_YOUNGER_AGE_10}  — A4
{DAUGHTER_YOUNGER_AGE_11}  — A5
{DAUGHTER_YOUNGER_AGE_13}  — A6 stairwell
{DAUGHTER_YOUNGER_AGE_15}  — A7
```

---

## Также нужны style-блоки для прогонки через шот-промпты

### {STYLE} — глобальный визуальный стиль

```
cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, warm lamp light highlights against deep blue night shadows, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic similar to graphic-novel YouTube cautionary videos
```

### {NEG} — глобальный негатив

```
photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, missing fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, beauty retouching, fashion shoot, harsh dramatic shadows, side-lit drama, painterly stylization beyond comic-book hatching
```

### Палитры (один токен на акт)

```
{PALETTE_COLD_OPEN} — cool grey-blue stairwell daylight, neon yellow corridor bulb accents, deep indigo shadows in the corners
{PALETTE_A1}         — warm sodium pharmacy yellow, summer dust haze, brown tobacco-leaf shadows
{PALETTE_A2}         — corporate cool teal + brass-gold accents, cold office fluorescent fill, white-blue highlights
{PALETTE_A3}         — corporate white + cold conference-room blue, warm hotel-lamp accents for night shots
{PALETTE_A4}         — electric pink Minsk neon + chrome cold whites + bourbon amber for low-key fairoom shots, sodium dust yellow for the final pharmacy shot
{PALETTE_A5}         — cool grey overcast cafe daylight, then deep amber kitchen-lamp night with black windows
{PALETTE_A6}         — cool grey stairwell + sodium yellow notary office + cold silver street, transition palette
{PALETTE_A7}         — cold winter silver + flickering retail fluorescent white + grey-blue overcast street
{PALETTE_CODA}       — silvery night blue through dormitory window + distant warm yellow pharmacy sign on the horizon
```

---

## Что дальше

Эти 8 профилей пойдут в `character_profiles` таблицу seed-SQL. После заливки можно:
1. Сгенерировать **8 anchor-портретов** через Nano Banana (по 1 на персонажа в их primary age + якорь)
2. Использовать anchor-портреты как **IP-Adapter reference** при рендере шотов
3. **200 шот-промптов** будут собирать `{STYLE} + {PALETTE_AX} + {character age tokens} + сцена + {NEG}` через `resolve_placeholders.sql`

Следующая итерация — **полные 200 английских positive-промптов** для каждого шота. Пишу их теперь.
