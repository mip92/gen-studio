# -*- coding: utf-8 -*-
"""Seed COLD OPEN shots (scene cold_open) for project `message`. Idempotent per shotCode."""
import sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID  = "7e550000-0000-4000-8000-000000000001"
SCENE_ID = "7e550000-0000-4000-8000-0000000000e0"   # cold_open
LOC_KITCHEN = "7e550000-0000-4000-8000-0000000000f0" # irina_kitchen_night
IRINA_CID = "7e550000-0000-4000-8000-0000000000c1"
IRINA_PID = "7e550000-0000-4000-8000-0000000000d1"
ROUTE_CHAR = "message_character_ip"
ROUTE_ENV  = "message_environment"

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, "
         "hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, "
         "16:9 cinematic composition, no photorealism, no 3D render, no plastic skin, painterly comic-book aesthetic")
PALETTE = ("cold blue night-kitchen glow with a warm pendant-bulb pool and pale phone screen-light, "
           "deep blue-black shadows, tense quiet high-contrast mood")
TECH = "hard black ink outline on every edge, flat cell-shaded color blocks with subtle cross-hatching in the shadows"

def pos(subject, shot, angle, move):
    cam = f"{shot}, {angle} angle, {move} camera, 16:9"
    return f"{STYLE}, {subject}, {PALETTE}, {TECH}, {cam}"

# code, char?, subject, shotType, angle, move, broll, iconic, narr, continuity
SHOTS = [
 ("C_SH01", False,
  "extreme close-up of a smartphone screen on a dark kitchen table showing a Kaspi money-transfer screen with the sum 350 000 tenge and a finger hovering over the confirm button, the contact name Viktor at the top of the screen, pale screen light",
  "ECU","eye","push_in", False, True,
  "три часа ночи, ты сидишь на тёмной кухне, палец застыл над кнопкой перевести триста пятьдесят тысяч тенге",
  {"withNext": "same phone on the kitchen table, screen still glowing"}),
 ("C_SH02", True,
  "close-up of a tired 48-year-old woman's face lit from below by a phone screen in a dark kitchen, eyes fixed on the screen, faint hope under exhaustion",
  "CU","low","static", False, False,
  "на экране его имя, виктор, и под рёбрами толкает тёплым, как каждый раз когда оно загорается", None),
 ("C_SH03", True,
  "wide high-angle shot of a small dark soviet-era kitchen, the lone woman sitting at the table under a single warm pendant bulb, a cold blue window behind her, the empty apartment around her",
  "WS","high","static", False, False,
  "вокруг только лампа над столом и синий свет двора в окне, в квартире давно никого кроме тебя", None),
 ("C_SH04", False,
  "close-up still-life of a Halyk bank card and a cheap squared notebook covered in handwritten sums on the kitchen table beside a cold mug of tea",
  "CU","high","static", True, False,
  "рядом твоя карта халык и тетрадь, где ты считала и пересчитывала, сколько ещё осталось", None),
 ("C_SH05", False,
  "extreme close-up of the woman's trembling hand hovering over the glowing phone on the table, a thin plain gold wedding ring on her finger",
  "ECU","eye","push_in", True, False,
  "рука дрожит, на пальце ещё твоё обручальное кольцо, ты говоришь себе что это в последний раз",
  {"withNext": "the same hand and phone, about to press the button"}),
 ("C_SH06", True,
  "medium side shot of the woman at the table, phone glow on her face, the dark open doorway of the empty apartment behind her",
  "MS","eye","static", False, False,
  "ты ещё не знаешь, что это не последние его слова, а последние твои деньги", None),
 ("C_SH07", False,
  "wide low-angle exterior shot of a single lit ninth-floor kitchen window in a dark snowy soviet-era panel block at night, the rest of the building black, a frozen empty courtyard below",
  "WS","low","push_in", True, True,
  "за окном спящий петропавловск, минус двадцать, во дворе ни одной живой души", None),
 ("C_SH08", False,
  "extreme close-up of a finger pressing the confirm button on the phone, the screen flashing green with a completed-transfer checkmark",
  "ECU","eye","static", False, True,
  "ты нажимаешь перевести, экран коротко вспыхивает зелёным, перевод выполнен",
  {"withPrevious": "the trembling hand that was hovering over the phone"}),
 ("C_SH09", True,
  "close-up of the woman's face as the phone screen light fades, a fragile faint relief, deep shadows closing in",
  "CU","eye","static", False, False,
  "и под рёбрами теплеет ещё раз, последний раз за всю эту зиму", None),
 ("C_SH10", True,
  "medium shot slowly pulling back from the woman alone at the lit kitchen table as the room sinks into darkness around her",
  "MS","eye","pull_out", False, True,
  "этого человека с фото никогда не существовало, хочешь знать, как ты дошла до этой кнопки, останься до конца, подпишись", None),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor()
    seeded = 0
    try:
        for i, (code, is_char, subj, st, ang, mv, broll, iconic, narr, cont) in enumerate(SHOTS, start=1):
            cur.execute('SELECT 1 FROM shots WHERE "projectId"=%s AND "shotCode"=%s', (PROJ_ID, code))
            if cur.fetchone():
                continue
            sid = f"7e550000-0000-4000-8000-0100000000{i:02x}"
            positive = pos(subj, st, ang, mv)
            pf = {"positive": positive, "positivePrompt": positive, "narrationRu": narr}
            if cont:
                pf["continuity"] = cont
            route = ROUTE_CHAR if is_char else ROUTE_ENV
            ref   = IRINA_PID if is_char else None
            cur.execute(
                'INSERT INTO shots (id,"projectId","sceneId","shotCode","promptFields","workflowRouteKey",'
                ' "referenceProfileId","narrationText","shotType","cameraAngle","cameraMove",'
                ' "isBroll","isIconic","timeOfDay","paletteKey","locationId","renderMode","createdAt","updatedAt") '
                'VALUES (%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(), now())',
                (sid, PROJ_ID, SCENE_ID, code, __import__("json").dumps(pf, ensure_ascii=False), route,
                 ref, narr, st, ang, mv, broll, iconic, "march_night_2026", "COLD_OPEN_kitchen_glow",
                 LOC_KITCHEN, "animated"),
            )
            if is_char:
                pp = f"7e550000-0000-4000-8000-0150000000{i:02x}"
                cur.execute(
                    'INSERT INTO shot_participants (id,"shotId","characterId",label,"profileId") '
                    'VALUES (%s,%s,%s,%s,%s)',
                    (pp, sid, IRINA_CID, "IRINA", IRINA_PID),
                )
            seeded += 1
        conn.commit()
        print(f"OK cold_open: seeded {seeded}/{len(SHOTS)} shots")
        for code, is_char, _, st, ang, mv, broll, iconic, *_ in SHOTS:
            scale = "W" if st in ("EWS","WS") else ("M" if st in ("MS","MCU","OTS") else "C")
            print(f"  {code} {('CHAR' if is_char else 'ENV '):4s} {scale} {st:3s}/{ang}/{mv:8s} broll={int(broll)} iconic={int(iconic)}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
