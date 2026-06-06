"""
Add VO-less landscape "breather" B-roll shots to bio_plus.

User request: "слишком много тараторит, надо разбавить просто пейзажами,
особенно на смене актов" — the film is wall-to-wall narration; insert silent
landscape pauses so the ear rests, especially at act transitions.

13 shots: one at the START of each of the 8 acts (act-opener establishing
breather, doubling as a season/time-jump marker) + 5 inside the longest,
talkiest acts (A2, A3x2, A4, A5).

Each shot:
  - NO narration (narrationText stays NULL → silent on the timeline; with the
    new export floor a VO-less animated shot just plays its native ~5s clip).
  - bio_plus_environment route, no participant/profile.
  - isBroll=true, renderMode=animated, ambient nature motion + hard "no people"
    motionNegative (per feedback_empty_broll_spawns_people — else Wan draws a
    human into the empty frame).
  - palette/timeOfDay copied from the act so the landscape matches the act look.

Created via the REST API (POST /projects/:id/shots), then the DTO-omitted
fields (isBroll, shotType, cameraAngle, cameraMove, timeOfDay, paletteKey,
narrativeFunction, renderMode) are set with a direct UPDATE — the documented
exception for fields CreateShotDto doesn't carry. Does NOT render anything.
"""
import sys
import requests
import psycopg2

API = "http://localhost:4000"
PID = "c3bd074a-4372-4cd4-a8ad-c0dce0ee24b4"
ROUTE = "bio_plus_environment"

SCENE = {
    "A1": "90876695-8ca8-4d82-a7b0-0c92ccf32050",
    "A2": "1aa13118-3046-4cd2-b25f-250f4ddb3ffa",
    "A3": "81288eaa-576f-41af-aa5a-c7e2112749c0",
    "A4": "af0bf111-d26e-404d-accb-8fd34476c1c0",
    "A5": "4a2b6bae-fbe0-4f23-9998-3d7eadad190b",
    "A6": "a06c6181-9eb9-4aa8-aa9e-fcd92dbe3e27",
    "A7": "ca23d7b1-44d0-4f38-85c9-2e9b97e8da5c",
    "CD": "011d78bd-c407-4898-9c1b-75a1efef33b9",
}

# (timeOfDay, paletteKey) per act — mirrors the existing shots of each act.
ACT_LOOK = {
    "A1": ("summer_afternoon_2008", "A1_sodium_summer"),
    "A2": ("october_day_2018",      "A2_corporate_teal"),
    "A3": ("spring_autumn_2019",    "A3_corporate_cold"),
    "A4": ("march_night_2021",      "A4_minsk_neon"),
    "A5": ("october_night_2022",    "A5_grey_amber_night"),
    "A6": ("march_afternoon_2024",  "A6_grey_yellow_silver"),
    "A7": ("january_winter_2026",   "A7_winter_silver"),
    "CD": ("january_night_2026",    "CODA_indigo_distant"),
}

STYLE = ("cinematic graphic novel illustration, illustrated comic book panel, "
         "cell-shaded coloring, hard black ink outline with variable line weight, "
         "flat color blocks with subtle hatching for shadow, 16:9 cinematic "
         "composition, no photorealism, no 3D render, no plastic skin, painterly "
         "comic-book aesthetic, ")

TECH = ("hard black ink outline on every edge, flat cell-shaded color blocks with "
        "subtle cross-hatching in the shadows, completely empty scene with no people, ")

NEG = ("photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient "
       "shading, hyperrealistic, real human face, raytraced, deformed hands, extra "
       "fingers, missing fingers, two heads, watermark, text overlay, blurry, low "
       "quality, anime, manga, chibi, kawaii, oversaturated color, glamour "
       "photography, beauty retouching, fashion shoot, runway, harsh dramatic "
       "shadows, side-lit drama, person, people, human figure, pedestrian, "
       "character, face, crowd")

MOTION_NEG = ("blurry, low quality, watermark, text overlay, jpeg artifacts, "
              "deformed face, deformed hands, extra fingers, bad anatomy, photoreal, "
              "photograph, plastic skin, oversmooth, smooth gradient shading, "
              "hyperrealistic, motion blur, frame stutter, jitter, warping, melted "
              "face, flicker, scene cut, sudden cut, abrupt transition, identity "
              "change, modern brand logos, person, people, human figure, pedestrian "
              "walking into frame, large foreground figure, character entering "
              "foreground, crowd, close-up of a person")

# code, act, shotType, cameraAngle, scene description, motion description
SHOTS = [
    ("A1_SH00", "A1", "WS", "eye",
     "warm sodium summer palette, golden afternoon sunlight, dusty yellow haze, an "
     "empty quiet courtyard between five-storey Khrushchev-era panel apartment blocks "
     "in the Mashinostroiteley district of Mogilev in summer 2008, cracked asphalt "
     "path, a rusty carpet-beating frame, overgrown green grass and dandelions, tall "
     "poplar and birch trees in full leaf, white poplar fluff drifting through the "
     "still warm air as small floating dots, long warm shadows across the yard, no "
     "people anywhere, ",
     "locked-off static camera, no camera movement. A quiet empty summer courtyard "
     "gently comes alive, white poplar fluff drifts slowly through the warm still air, "
     "leaves and tall grass sway faintly in a light breeze, warm afternoon light "
     "shimmers softly. Absolutely no people, no figures, nobody walks into frame, the "
     "courtyard stays completely empty."),

    ("A2_SH00", "A2", "WS", "eye",
     "cool corporate teal and muted autumn ochre palette, overcast grey-white October "
     "sky, an empty central Mogilev street in October 2018, wet dark asphalt, yellow "
     "and rust poplar and birch leaves scattered on the pavement and still falling, "
     "bare lower branches, a few cars parked along the kerb, weak directional daylight "
     "behind cloud, no people anywhere, ",
     "locked-off static camera, no camera movement. An empty cool autumn street quietly "
     "breathes, yellow and rust leaves fall and tumble along the wet pavement in a "
     "light breeze, slow overcast clouds drift across the grey sky. No people, no "
     "pedestrians, nobody enters the frame, the street stays empty."),

    ("A3_SH00", "A3", "WS", "low",
     "cold corporate grey-blue palette with pale spring light, early spring thaw in "
     "Mogilev 2019, wet grey pavement with shrinking patches of dirty melting snow, "
     "bare dark wet tree branches showing the first tiny green buds, dripping "
     "meltwater, low flat overcast sky, puddles reflecting the pale white sky, no "
     "people anywhere, ",
     "locked-off static camera, no camera movement. A cold empty spring thaw scene "
     "quietly comes to life, meltwater drips steadily from the bare branches, ripples "
     "spread slowly across the puddles, thin clouds drift across the pale sky. No "
     "people, no figures, nobody enters the frame."),

    ("A4_SH00", "A4", "EWS", "eye",
     "saturated Minsk neon night palette, electric blues and magentas with brass-gold "
     "accents, a wide rain-wet Minsk avenue at night in March 2021, glossy black "
     "asphalt mirroring coloured neon signage and lit shop windows, tall "
     "Soviet-monumental facades and a few modern glass towers with lit windows, sodium "
     "and neon glow, light cold drizzle haze around the lamps, distant red tail-light "
     "streaks, no people anywhere, ",
     "locked-off static camera, no camera movement. A glossy neon night avenue glows "
     "quietly, neon reflections shimmer and ripple on the wet black asphalt, faint "
     "drizzle drifts through the lamp halos, distant light streaks glide far away. No "
     "people, no pedestrians, nobody enters the frame, the avenue stays empty."),

    ("A5_SH00", "A5", "WS", "eye",
     "grey and amber autumn night palette, an empty autumn night street in Mogilev "
     "October 2022, warm amber sodium streetlamps casting pools of light on wet dark "
     "pavement, bare wet black tree branches, thin ground fog drifting low between the "
     "lamps, cold blue-grey shadows, fallen wet leaves, an empty park bench, no people "
     "anywhere, ",
     "locked-off static camera, no camera movement. A cold empty autumn night street "
     "settles quietly, thin ground fog drifts slowly between the amber streetlamps, "
     "bare branches sway faintly, a few wet leaves stir on the pavement. No people, no "
     "figures, nobody enters the frame."),

    ("A6_SH00", "A6", "WS", "high",
     "bleak grey-yellow-silver late-winter palette, an overcast late-winter afternoon "
     "over Mogilev in March 2024, dirty grey melting slush along the kerbs, bare black "
     "wet trees, low heavy flat grey sky, pale silver light with no shadows, wet dark "
     "rooftops of panel apartment blocks, a cold colourless thaw, no people anywhere, ",
     "locked-off static camera, no camera movement. A bleak grey thaw scene barely "
     "moves, low heavy clouds drift slowly across the flat sky, meltwater drips from "
     "the wet eaves, a thin cold wind stirs the bare branches. No people, no figures, "
     "nobody enters the frame."),

    ("A7_SH00", "A7", "EWS", "eye",
     "cold silver-white deep-winter palette, a silent snow-covered yard in Mogilev in "
     "January 2026, thick fresh white snow on the ground and on the roofs and branches, "
     "bare frosted black trees, pale silver overcast sky, faint blue shadows on the "
     "snow, soft falling snowflakes, an empty snow-covered bench and footpath, no "
     "people anywhere, ",
     "locked-off static camera, no camera movement. A silent deep-winter yard rests "
     "under snow, soft snowflakes drift down slowly through the still cold air, fine "
     "snow lifts and settles on the branches in a faint breeze. No people, no figures, "
     "nobody enters the frame, the snow stays untouched."),

    ("CD_SH00", "CD", "WS", "eye",
     "deep indigo winter night palette with a single distant warm glow, a quiet empty "
     "snow-covered Mogilev street at night in January 2026, deep blue indigo shadows on "
     "the snow, snowflakes drifting through the cold air, far down the street the small "
     "warm green-and-white glow of a lit pharmacy cross sign, bare frosted trees, no "
     "people anywhere, ",
     "locked-off static camera, no camera movement. A silent indigo winter night holds "
     "still, snowflakes drift slowly down through the cold air, the distant pharmacy "
     "cross glows steadily far away, faint snow lifts in a light breeze. No people, no "
     "figures, nobody enters the frame."),

    # ── mid-act breathers ──
    ("A2_SH14A", "A2", "WS", "low",
     "cool corporate teal and muted autumn palette, looking up at an overcast "
     "grey-white October sky over Mogilev 2018, slow drifting pale clouds, a thin "
     "tangle of black telephone and tram wires crossing the frame, the bare upper "
     "branches and last yellow leaves of tall poplars at the edges, a small distant "
     "flock of birds, cool flat daylight, no people anywhere, ",
     "locked-off static camera aimed up at the sky, no camera movement. Pale grey "
     "clouds drift slowly across the overcast sky, the last yellow leaves tremble on "
     "the high bare branches, a small flock of birds glides far away across the frame. "
     "No people, no figures, nothing enters the foreground."),

    ("A3_SH15A", "A3", "WS", "high",
     "cold grey-blue spring palette, a high view over the wet grey rooftops of Mogilev "
     "panel buildings during the early spring thaw 2019, melting dirty snow sliding off "
     "the metal roofs, wet dark slates reflecting the pale sky, thin smoke rising "
     "straight from a few chimneys, low flat overcast sky, a couple of pigeons on a "
     "ledge, no people anywhere, ",
     "locked-off static camera, no camera movement. A cold wet rooftop scene barely "
     "stirs, thin chimney smoke rises and drifts slowly, meltwater trickles off the "
     "eaves, a pigeon shifts on a ledge. No people, no figures, nobody enters the frame."),

    ("A3_SH24A", "A3", "MS", "low",
     "cold pale spring palette, a tight upward view of the bare crowns of tall poplar "
     "trees against a flat pale-grey overcast Mogilev sky in spring 2019, swaying thin "
     "black branches showing the first faint green buds, a few last clinging dry "
     "leaves, cold diffuse light, no people anywhere, ",
     "locked-off static camera aimed up, no camera movement. The bare poplar crowns "
     "sway slowly in a cold breeze against the pale sky, tiny buds tremble, a dry leaf "
     "drifts down. No people, no figures, nothing enters the foreground."),

    ("A4_SH14A", "A4", "CU", "high",
     "saturated neon night palette, a close downward view of a rain puddle on glossy "
     "black Minsk asphalt at night in March 2021, the puddle mirroring fragmented "
     "coloured neon signage in electric blue magenta and brass-gold, scattered ripples, "
     "a wet kerb edge and a few soaked leaves at the frame edge, cold reflected glow, "
     "no people anywhere, ",
     "locked-off static camera looking down at the puddle, no camera movement. Coloured "
     "neon reflections shimmer and break apart on the rippling puddle surface as fine "
     "drizzle dimples the water, the glow pulses gently. No people, no figures, no "
     "feet, nothing enters the frame."),

    ("A5_SH13A", "A5", "WS", "eye",
     "grey and amber autumn night palette, an empty stretch of wet night pavement under "
     "a single warm amber streetlamp in Mogilev October 2022, thick low fog rolling "
     "slowly through the lamp's cone of light, bare black wet branches overhead, an "
     "empty wet park bench, fallen leaves stuck to the dark asphalt, deep cold blue "
     "shadows beyond the lamp, no people anywhere, ",
     "locked-off static camera, no camera movement. Low fog rolls slowly through the "
     "warm amber lamplight, bare branches sway faintly overhead, a stray wet leaf stirs "
     "on the pavement. No people, no figures, nobody enters the frame, the bench stays "
     "empty."),
]


def build_positive(shot_type, angle, scene_desc):
    return (STYLE + scene_desc + TECH
            + f"{shot_type}, {angle} angle, static locked-off camera, 16:9")


def main():
    sess = requests.Session()
    created = {}   # shotCode -> shot id
    for code, act, st, ang, scene, motion in SHOTS:
        pos = build_positive(st, ang, scene)
        pf = {
            "positive": pos,
            "positivePrompt": pos,
            "narrationRu": "",
            "negativeRef": NEG,
            "motionPrompt": motion,
            "motionNegative": MOTION_NEG,
        }
        body = {
            "shotCode": code,
            "sceneId": SCENE[act],
            "promptFields": pf,
            "workflowRouteKey": ROUTE,
        }
        r = sess.post(f"{API}/projects/{PID}/shots", json=body, timeout=30)
        if r.status_code in (200, 201):
            created[code] = r.json()["id"]
            print(f"POST  {code:10s} -> {created[code]}")
        elif r.status_code == 400 and "already exists" in r.text:
            print(f"SKIP  {code:10s} (already exists)")
        else:
            print(f"FAIL  {code:10s} -> {r.status_code} {r.text[:200]}")
            sys.exit(1)

    # Stamp the DTO-omitted fields via direct UPDATE (documented exception).
    conn = psycopg2.connect(host="localhost", dbname="gen_studio",
                            user="gen_studio", password="gen_studio")
    conn.autocommit = True
    cur = conn.cursor()
    n = 0
    for code, act, st, ang, _scene, _motion in SHOTS:
        tod, pal = ACT_LOOK[act]
        cur.execute(
            'UPDATE shots SET "isBroll"=true, "isIconic"=false, '
            '"renderMode"=\'animated\', "shotType"=%s, "cameraAngle"=%s, '
            '"cameraMove"=\'static\', "timeOfDay"=%s, "paletteKey"=%s, '
            '"narrativeFunction"=\'atmosphere\' '
            'WHERE "projectId"=%s AND "shotCode"=%s',
            (st, ang, tod, pal, PID, code),
        )
        n += cur.rowcount
    print(f"\nUPDATE stamped {n} rows with B-roll/camera/atmosphere fields")
    cur.close()
    conn.close()
    print(f"DONE — {len(created)} created this run")


if __name__ == "__main__":
    main()
