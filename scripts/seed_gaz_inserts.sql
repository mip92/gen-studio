-- «Газ» atmosphere/nature INSERTS (~22) for montage breathing + reaching ~45 min.
-- Pure environment B-roll, short concrete dotless VO (no AI-poet), shotCode <prev>B slots
-- between existing shots. renderMode per act (front=animated/back=static); animated-prefix re-run after.
SET client_encoding='UTF8';
\set pid '6a200000-0000-4000-8000-000000000001'
\set sb 'cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic, '
BEGIN;

WITH
proj AS (SELECT :'pid'::text AS id),
v("shotCode", scenekey, sub, narr, stype, sang, smove, iconic, rm, locslug) AS (VALUES
 ('A1_SH06B','act_01_origins','extreme close-up of white poplar fluff drifting through bright summer sunlight in a courtyard','над двором плывёт тополиный пух, июльское солнце стоит высоко','ECU','eye','static',false,'animated','bolderaja_yard'),
 ('A1_SH22B','act_01_origins','extreme wide shot of the heavy grey Daugava water rolling toward the gulf below the river dam at dusk','внизу под дамбой тяжёлая серая вода даугавы катится в залив','EWS','high','static',false,'animated','riga_port'),
 ('A1_SH31B','act_01_origins','close-up of bare wet birch branches with a thin skin of ice on the puddles below, autumn','берёзы во дворе облетели, на лужах по утрам уже ледок','CU','eye','static',false,'animated','bolderaja_yard'),
 ('A2_SH13B','act_02_first_car','extreme close-up of blue and white aviation lights blinking across a black field at night','за полем мигают синие огни аэродрома, больше в темноте ничего нет','ECU','eye','static',false,'animated','lidostas_road'),
 ('A2_SH22B','act_02_first_car','extreme wide high shot of an empty frost-rimed Riga street at night, long and deserted','к ноябрю ночи становятся длиннее, улицы пустеют раньше','EWS','high','static',false,'animated','maskavas_intersection'),
 ('A3_SH08B','act_03_chat','close-up of a single failing floodlight buzzing over frost-covered concrete in a derelict yard','над промзоной гудит единственный фонарь, бетон в инее','CU','low','static',false,'animated','industrial_race_lot'),
 ('A3_SH24B','act_03_chat','extreme wide high shot of Riga panel-block rooftops under wet falling snow at dusk','за окном зима, рига под мокрым снегом, две тысячи пятнадцатый кончается','EWS','high','static',false,'static','bolderaja_yard'),
 ('A4_SH18B','act_04_trener','extreme close-up of breath steaming in the freezing night air over a bridge railing under sodium light','три часа ночи, мороз, пар изо рта стоит над перилами моста','ECU','eye','static',false,'static','southern_bridge'),
 ('A4_SH28B','act_04_trener','extreme wide shot of grey port gantry cranes standing in a hazy summer afternoon','то лето стоит душное, над портом висит белёсая дымка','EWS','high','static',false,'static','riga_port'),
 ('A5_SH07B','act_05_climb','wide shot of dark pine forest rushing past at night, mist hanging low between the trunks','трасса в юрмалу идёт сквозь чёрный сосновый лес, в низинах стоит туман','WS','eye','track_lateral',false,'static','jurmala_highway'),
 ('A5_SH18B','act_05_climb','close-up of rain streaking down a dark window pane at night, blurred city lights beyond','за окном квартиры всю осень идёт дождь, ты его почти не замечаешь','CU','eye','static',false,'static','racer_apartment'),
 ('A5_SH33B','act_05_climb','extreme wide high shot of grey overcast Riga from above, a flat lifeless weekday','серый вторник, низкое небо над ригой, ничего не происходит','EWS','high','static',false,'static','southern_bridge'),
 ('A6_SH04B','act_06_liga','extreme wide shot of the wide calm Daugava glowing copper at sunset, a slow barge crossing','даугава в закате лежит широкая и медленная, по ней идёт баржа','EWS','eye','static',true,'static','daugava_embankment'),
 ('A6_SH06C','act_06_liga','close-up of gentle grey sea foam hissing over wet sand at the tideline','море у юрмалы серое и тихое, пена шипит на песке у самых ног','CU','high','static',false,'static','jurmala_beach'),
 ('A6_SH09B','act_06_liga','extreme wide shot of the Gauja river winding through red sandstone cliffs and dense green forest','под сигулдой гауя петляет среди красных скал и сплошного леса','EWS','high','static',true,'static','sigulda_gauja'),
 ('A6_SH28B','act_06_liga','close-up of the first December snow settling on a windowsill, a warm lit room behind the glass','приходит декабрь, на подоконник ложится первый снег, до свадьбы три месяца','CU','eye','static',false,'static','liga_apartment'),
 ('A7_SH01C','act_07_night','extreme close-up of sparse snowflakes landing on the black bonnet of a car and melting at once','редкие снежинки садятся на капот и тут же тают, ноль градусов','ECU','high','static',false,'static','southern_bridge'),
 ('A7_SH24B','act_07_night','extreme wide high shot of the frozen black Daugava far below the bridge, utterly still in the night','под мостом чёрная даугава стоит подо льдом, и над ней нет ни звука','EWS','high','static',true,'static','southern_bridge'),
 ('A8_SH16B','act_08_arrest','close-up of flat grey March daylight falling through half-closed courtroom blinds onto a wooden bench','за окнами суда плоский мартовский свет, снег на улице уже грязный','CU','eye','static',false,'static','courtroom'),
 ('A8_SH28B','act_08_arrest','extreme wide shot of the prison perimeter wall under a low leaden winter sky, snow lying on the razor wire','над бетонной стеной низкое зимнее небо, на колючей проволоке лежит снег','EWS','low','static',true,'static','jelgava_prison'),
 ('A9_SH16B','act_09_aftermath','close-up of drizzle falling past a half-raised workshop roller shutter, rings spreading in a grey puddle','за воротами шиномонтажа моросит, по луже идут круги','CU','eye','static',false,'static','tire_shop'),
 ('A9_SH24B','act_09_aftermath','extreme wide shot of bare wet cemetery trees under a low grey April sky','над кладбищем голые мокрые деревья, апрель, небо низкое и серое','EWS','high','static',false,'static','cemetery_riga')
)
INSERT INTO shots (
  id, "projectId", "sceneId", "shotCode", "promptFields", "narrationText",
  "shotType", "cameraAngle", "cameraMove", "isBroll", "isIconic",
  "renderMode", "workflowRouteKey", "referenceProfileId", "locationId", "createdAt", "updatedAt"
)
SELECT gen_random_uuid(), (SELECT id FROM proj),
  (SELECT id FROM scenes WHERE "projectId"=(SELECT id FROM proj) AND "sceneKey"=v.scenekey),
  v."shotCode",
  jsonb_build_object('positive', :'sb'||v.sub, 'positivePrompt', :'sb'||v.sub, 'narrationRu', v.narr),
  v.narr, v.stype, v.sang, v.smove, true, v.iconic,
  v.rm, 'gaz_environment', NULL,
  (SELECT id FROM locations WHERE "projectId"=(SELECT id FROM proj) AND slug=v.locslug),
  now(), now()
FROM v
ON CONFLICT ("projectId", "shotCode") DO NOTHING;

COMMIT;

SELECT 'inserts added: '||count(*) FROM shots WHERE "projectId"=:'pid' AND "shotCode" ~ 'SH[0-9]+[BC]$';
SELECT 'TOTAL shots: '||count(*) FROM shots WHERE "projectId"=:'pid';
