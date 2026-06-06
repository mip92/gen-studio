-- Seed: «Газ» COLD OPEN (scene cold_open, 17 shots, renderMode=animated).
-- Track B 2nd-person present. The 4 seconds before the crash + CTA hook.
-- positive = baked style block || scene-specific subject/action/camera/anchor;
-- location.description adds the SPACE at render time. narrationText = RU, dotless.
SET client_encoding = 'UTF8';
BEGIN;

WITH
proj AS (SELECT '6a200000-0000-4000-8000-000000000001'::text AS id),
scn  AS (SELECT id FROM scenes    WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"='cold_open'),
style AS (SELECT 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic'::text AS sb),
v("shotCode", sub, narr, stype, sang, smove, broll, iconic, route, profid, locslug) AS (VALUES
 ('C_SH01', 'extreme close-up of a lean mans right hand wearing ONE worn brown leather fingerless driving glove gripping a car gear lever, a glowing orange tachometer needle trembling at the red line just behind the hand, cold blue dashboard glow, tense stillness, ECU slow push-in',
   'твоя правая ладонь в потёртой кожаной перчатке лежит на рычаге, стрелка тахометра дрожит у красной зоны', 'ECU','eye','push_in', false, false, 'gaz_environment', NULL, 'bmw_interior'),
 ('C_SH02', 'extreme wide high shot of the long empty deck of a cable-stayed bridge at night, two low cars lined up side by side far down the wet lane, sodium lamps receding, black river below, deserted',
   'южный мост через даугаву, без четверти час ночи, ноль градусов, мокрый асфальт блестит под фонарями', 'EWS','high','static', true, true, 'gaz_environment', NULL, 'southern_bridge'),
 ('C_SH03', 'close-up of an analog speedometer behind a steering wheel rim, the needle pinned near one hundred eighty, blurred dashboard, cold cockpit glow',
   'спидометр показывает сто восемьдесят, мотор твоей старой бэхи воет на четвёртой передаче', 'CU','eye','static', false, false, 'gaz_environment', NULL, 'bmw_interior'),
 ('C_SH04', 'medium low-angle shot of a black coupe idling and revving on the wet bridge lane at night, exhaust haze, glowing headlights, predatory stance',
   'рядом газует чёрная ауди твоего соперника, на кону триста евро и видео в закрытом чате', 'MS','low','static', false, true, 'gaz_environment', NULL, 'southern_bridge'),
 ('C_SH05', 'close-up of the focused face of a 28-year-old man with a short dark-brown buzz cut and narrow tired grey eyes reflected in a rear-view mirror, cold dashboard light on his cheek, total concentration',
   'ты смотришь только на светофор впереди, до зелёного две секунды, сердце ровное', 'CU','eye','static', false, false, 'gaz_character_ip', '6a200000-0000-4000-8000-0000000000f1', 'bmw_interior'),
 ('C_SH06', 'extreme close-up of a traffic light switching from red to green against the black night sky, lens of light, the instant of go',
   'загорается зелёный, и ты бросаешь сцепление так, как делал уже сотни раз', 'ECU','eye','static', false, true, 'gaz_environment', NULL, 'southern_bridge'),
 ('C_SH07', 'wide low-angle shot of two cars launching off the line on the wet bridge, rear ends squatting, spray of mist kicked up from the tyres glowing in the sodium light',
   'две машины срываются с места, мокрая взвесь летит из-под колёс в свете фонарей', 'WS','low','track_lateral', false, true, 'gaz_environment', NULL, 'southern_bridge'),
 ('C_SH08', 'medium close-up of a 28-year-old man pressed back into a worn black leather driver seat, both hands on the wheel, ONE brown leather glove on his right hand, jaw set, calm at speed',
   'тебя вдавливает в сиденье, и внутри становится тихо, как всегда на скорости', 'MCU','eye','push_in', false, true, 'gaz_character_ip', '6a200000-0000-4000-8000-0000000000f1', 'bmw_interior'),
 ('C_SH09', 'extreme wide high shot of a grey family hatchback slowly rolling out from a side slip-road onto the main road ahead, its headlights sweeping, unaware',
   'и тут на съезд медленно выезжает серый опель, в нём целая семья', 'EWS','high','static', false, true, 'gaz_environment', NULL, 'maskavas_intersection'),
 ('C_SH10', 'close-up through a car side window of a small child asleep buckled into a booster seat in the back of the grey hatchback, soft and peaceful, streetlight on the glass',
   'на заднем сиденье спит ребёнок, пристёгнутый в детском кресле, ему пять лет', 'CU','eye','static', false, true, 'gaz_environment', NULL, 'maskavas_intersection'),
 ('C_SH11', 'extreme close-up of a gloved right hand white-knuckled on the steering wheel and a boot stamping a brake pedal, sudden violence of reaction',
   'ты видишь его за полсекунды до того, как поздно тормозить, и нога сама бьёт по тормозу', 'ECU','eye','handheld', false, false, 'gaz_environment', NULL, 'bmw_interior'),
 ('C_SH12', 'wide dutch-angle shot of an old sedan skidding sideways with locked smoking wheels across the wet intersection toward the grey hatchback, headlights crossing',
   'но сто восемьдесят на мокром асфальте это сорок метров тормозного пути, а у тебя их нет', 'WS','dutch','track_lateral', false, true, 'gaz_environment', NULL, 'maskavas_intersection'),
 ('C_SH13', 'close-up of the 28-year-old drivers face in the final instant, eyes wide with the dawning understanding, cold light flooding the cockpit',
   'за это мгновение ты успеваешь подумать только одно, я не успеваю', 'CU','eye','push_in', false, true, 'gaz_character_ip', '6a200000-0000-4000-8000-0000000000f1', 'bmw_interior'),
 ('C_SH14', 'extreme wide high shot of the night intersection frozen one meter before impact, the two cars almost touching, the first blue strobe of a police light beginning to wash the wet asphalt',
   'ты ещё не знаешь, что эта секунда конец всему, и для тебя, и для них', 'EWS','high','static', false, true, 'gaz_environment', NULL, 'maskavas_intersection'),
 ('C_SH15', 'medium shot of an empty concrete garage ramp in a quiet courtyard at dusk, a childs bicycle lying on its side at the bottom, nostalgic and ordinary',
   'если хочешь понять, как восьмилетний мальчик на велосипеде доехал до этого перекрёстка, останься со мной', 'MS','eye','push_in', true, false, 'gaz_environment', NULL, 'bolderaja_yard'),
 ('C_SH16', 'wide shot of the same quiet courtyard between panel apartment blocks at dusk, warm windows lit, an empty bench, intimate and still',
   'досмотри до конца, подпишись, у меня много таких историй, и я хочу рассказать их пока кто-то слушает', 'WS','eye','static', true, false, 'gaz_environment', NULL, 'bolderaja_yard'),
 ('C_SH17', 'extreme wide high shot over a sunlit summer courtyard of panel blocks in a port district, poplar fluff drifting, harbour cranes beyond the rooftops, bright and innocent',
   'а пока тебе восемь лет, лето две тысячи четвёртого, рига, болдерая, и ты ещё ничего не знаешь', 'EWS','high','static', true, true, 'gaz_environment', NULL, 'bolderaja_yard')
)
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "isBroll", "isIconic",
  "renderMode", "workflowRouteKey", "referenceProfileId", "locationId",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(), (SELECT id FROM proj), (SELECT id FROM scn), v."shotCode",
  jsonb_build_object('positive', style.sb || ', ' || v.sub, 'narrationRu', v.narr),
  v.narr, v.stype, v.sang, v.smove, v.broll, v.iconic,
  'animated', v.route, v.profid,
  (SELECT id FROM locations WHERE "projectId"=(SELECT id FROM proj) AND slug=v.locslug),
  now(), now()
FROM v, style
ON CONFLICT ("projectId", "shotCode") DO NOTHING;

-- positivePrompt mirror (some readers use it; UI reads positive) — backfill once.
UPDATE shots SET "promptFields" = "promptFields" || jsonb_build_object('positivePrompt', "promptFields"->>'positive')
WHERE "projectId"='6a200000-0000-4000-8000-000000000001' AND "promptFields"->>'positivePrompt' IS NULL;

-- shot_participants for the face shots (RACER_ADULT) so IP-adapter locks identity.
INSERT INTO shot_participants (id, "shotId", "characterId", "profileId", label)
SELECT gen_random_uuid(), s.id, '6a200000-0000-4000-8000-0000000000c1', '6a200000-0000-4000-8000-0000000000f1', 'ты'
FROM shots s
WHERE s."projectId"='6a200000-0000-4000-8000-000000000001'
  AND s."shotCode" IN ('C_SH05','C_SH08','C_SH13')
  AND NOT EXISTS (SELECT 1 FROM shot_participants p WHERE p."shotId"=s.id);

COMMIT;
