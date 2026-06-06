# -*- coding: utf-8 -*-
"""Seed OUTRO scene (order 30) for project `beauty`: direct-address coda + subscribe CTA +
disclaimer (Track B §3.7/§4). Creates the scene row, then seeds 5 static end-card shots.
Idempotent."""
import sys, psycopg2
from _seed_beauty_act_engine import seed_act
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e570000-0000-4000-8000-000000000001"
ORDER = 30

def ensure_scene():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor()
    try:
        sid = f"7e570000-0000-4000-8000-000000000e{ORDER:02x}"
        cur.execute('SELECT 1 FROM scenes WHERE id=%s', (sid,))
        if not cur.fetchone():
            cur.execute('INSERT INTO scenes (id,"projectId","sceneKey",title,"sortOrder",'
                '"defaultReferenceProfileCode","actBeat","defaultTimeOfDay","defaultPaletteKey","createdAt") '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now())',
                (sid, PROJ_ID, "outro_cta", "Аутро — кода, подписка, дисклеймер", ORDER,
                 "HEROINE_OLD", "resolution", "old_now", "old_grey"))
            conn.commit(); print("OK outro scene created")
        else:
            print("outro scene already exists")
    except Exception as e:
        conn.rollback(); print("SCENE ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

MOOD = "quiet sober afterword light, the narrator's calm direct address, the lesson stated plainly"
# scale: M C M W C  (no 3-run; seam after CH29 ...ECU(C),WS(W) -> MCU(M) is fine)
SHOTS = [
 ("O_SH01", "HEROINE_OLD", "old_flat",
  "medium close-up of the aged heroine looking calmly and directly at the viewer beside a sheeted mirror",
  "MCU","eye","push_in","old_now",False,True,
  "если ты сейчас стоишь у зеркала и думаешь, ещё чуть-чуть, и стану счастливой, прошу тебя, остановись."),
 ("O_SH02", None, "family",
  "close-up of a warm shelf of family photographs, the people in them, not the mirror",
  "CU","eye","static","old_now",True,False,
  "счастье никогда не живёт в отражении, оно всегда рядом, в тех, кто любит тебя без всяких масок."),
 ("O_SH03", None, "old_flat",
  "medium shot of a softly lit sheeted mirror in the quiet room, a calm closing mood",
  "MS","eye","static","old_now",True,False,
  "если эта история тебя зацепила, подпишись на канал, чтобы не пропустить новые честные истории."),
 ("O_SH04", None, "old_flat",
  "wide shot of the calm grey room with the mother's closed powder compact on the table",
  "WS","eye","static","old_now",True,False,
  "посмотри другие наши видео вот здесь, на экране, и обязательно поделись этим со своими близкими."),
 ("O_SH05", None, "old_flat",
  "extreme close-up of the bare wall where a mirror once hung, a quiet final frame",
  "ECU","eye","static","old_now",True,True,
  "эта история вымышлена, любые совпадения случайны, не повторяй чужих ошибок, береги себя настоящую."),
]
if __name__ == "__main__":
    ensure_scene()
    seed_act(ORDER, "old_grey", MOOD, "static", "OUTRO", SHOTS)
