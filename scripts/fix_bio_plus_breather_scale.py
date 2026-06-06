"""
§5.1 scale-run fix: 4 act-opener breathers (A1/A2/A4/A7_SH00) landed before an
already-wide establishing SH01, making a 3-wide run. Reframe them to MEDIUM
atmospheric beats (still silent landscapes, just tighter) so the eye re-frames
medium -> wide and the run is broken. Updates shotType + positive + motion.
"""
import requests, psycopg2

API = "http://localhost:4000"
PID = "c3bd074a-4372-4cd4-a8ad-c0dce0ee24b4"

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, "
         "cell-shaded coloring, hard black ink outline with variable line weight, "
         "flat color blocks with subtle hatching for shadow, 16:9 cinematic "
         "composition, no photorealism, no 3D render, no plastic skin, painterly "
         "comic-book aesthetic, ")
TECH = ("hard black ink outline on every edge, flat cell-shaded color blocks with "
        "subtle cross-hatching in the shadows, completely empty scene with no people, ")

# code -> (scene_desc, motion_desc)  [all reframed to MS, eye angle]
FIX = {
    "A1_SH00": (
        "warm sodium summer palette, golden afternoon light, a medium close view of "
        "white poplar fluff drifting through the warm still air among the sunlit green "
        "leaves and branches of a poplar tree in a Mogilev courtyard in summer 2008, "
        "soft warm dust haze, a pale-yellow Khrushchev-era panel building wall blurred "
        "behind, no people anywhere, ",
        "locked-off static camera, no camera movement. White poplar fluff drifts slowly "
        "through the warm still air, sunlit leaves and thin branches sway faintly in a "
        "light breeze, warm light shimmers. Absolutely no people, no figures, nothing "
        "enters the frame."),
    "A2_SH00": (
        "cool corporate teal and muted autumn ochre palette, a medium view looking down "
        "at yellow and rust autumn leaves falling and gathering on the wet dark pavement "
        "and low kerb of a Mogilev street in October 2018, the base of a bare wet tree "
        "trunk, a few leaves still drifting down, cool overcast grey light, no people "
        "anywhere, ",
        "locked-off static camera, no camera movement. Yellow and rust leaves fall and "
        "tumble slowly across the wet pavement in a light breeze, a few more drift down. "
        "No people, no figures, nothing enters the frame."),
    "A4_SH00": (
        "saturated Minsk neon night palette, electric blue and magenta with brass-gold "
        "accents, a medium view of a wet neon-lit Minsk street corner at night in March "
        "2021, glossy black asphalt reflecting coloured neon signage, a lit shop window "
        "and part of a Soviet-monumental facade, cold drizzle haze glowing around a "
        "lamp, no people anywhere, ",
        "locked-off static camera, no camera movement. Coloured neon reflections shimmer "
        "and ripple on the wet asphalt, fine drizzle drifts through the lamp glow, the "
        "neon sign pulses gently. No people, no figures, nothing enters the frame."),
    "A7_SH00": (
        "cold silver-white deep-winter palette, a medium view of fresh snow settling on "
        "a bare frosted black branch and an empty snow-covered bench in a Mogilev yard "
        "in January 2026, soft snowflakes falling through still cold air, pale silver "
        "winter light, faint blue shadows on the untouched snow, no people anywhere, ",
        "locked-off static camera, no camera movement. Soft snowflakes drift down slowly "
        "through the still cold air and settle on the branch and bench, fine snow lifts "
        "in a faint breeze. No people, no figures, nothing enters the frame, the snow "
        "stays untouched."),
}

CAM_TAIL = "MS, eye angle, static locked-off camera, 16:9"

sess = requests.Session()
# Fetch each shot to get its full promptFields, patch positive/motion, PATCH back.
ids = {}
shots = sess.get(f"{API}/projects/{PID}/shots?take=400", timeout=30).json()
by_code = {s["shotCode"]: s for s in shots}
for code, (scene, motion) in FIX.items():
    s = by_code[code]
    pf = dict(s.get("promptFields") or {})
    pos = STYLE + scene + TECH + CAM_TAIL
    pf["positive"] = pos
    pf["positivePrompt"] = pos
    pf["motionPrompt"] = motion
    r = sess.patch(f"{API}/shots/{s['id']}", json={"promptFields": pf}, timeout=30)
    print(f"PATCH {code} promptFields -> {r.status_code}")

# shotType is not in UpdateShotDto -> SQL (documented exception).
conn = psycopg2.connect(host="localhost", dbname="gen_studio",
                        user="gen_studio", password="gen_studio")
conn.autocommit = True
cur = conn.cursor()
for code in FIX:
    cur.execute('UPDATE shots SET "shotType"=\'MS\' WHERE "projectId"=%s AND "shotCode"=%s',
                (PID, code))
print(f"shotType=MS set on {len(FIX)} shots")
cur.close(); conn.close()
