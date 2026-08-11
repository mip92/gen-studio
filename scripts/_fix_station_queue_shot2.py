# -*- coding: utf-8 -*-
"""station A1_SH03: та же правка — очередь заворачивает на заправку."""
import json, urllib.request, psycopg2

BASE = "http://localhost:4000"
PROJ = "7e710000-0000-4000-8000-000000000001"

cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
cur = cx.cursor()
cur.execute('SELECT id, "promptFields"->>\'positive\', "promptFields"->>\'motionPrompt\' FROM shots WHERE "projectId"=%s AND "shotCode"=%s', (PROJ, "A1_SH03"))
sid, pos, mot = cur.fetchone()
cur.close(); cx.close()
print("BEFORE positive:", pos)
print("BEFORE motion:", mot)

OLD_SUBJ = ("a line of fifty parked cars nose to tail along a road shoulder before dawn seen from above, "
            "the tail curving out of sight")
NEW_SUBJ = ("a line of fifty cars before dawn bending off the road onto the forecourt of a small petrol station, "
            "the first cars waiting at the two pumps, the tail of the line curving out of sight down the road shoulder")

with urllib.request.urlopen(BASE + "/shots/" + sid, timeout=30) as r:
    shot = json.loads(r.read().decode("utf-8"))
pf = shot["promptFields"]
assert OLD_SUBJ in pf["positive"], "positive mismatch: " + pf["positive"]
pf["positive"] = pf["positive"].replace(OLD_SUBJ, NEW_SUBJ)
if "positivePrompt" in pf:
    pf["positivePrompt"] = pf["positivePrompt"].replace(OLD_SUBJ, NEW_SUBJ)
if "the place stays deserted, " in pf.get("motionPrompt", ""):
    pf["motionPrompt"] = pf["motionPrompt"].replace(
        "the place stays deserted, every surface and object holding its exact position",
        "every car holding its exact place in the line")

body = json.dumps({"promptFields": pf}, ensure_ascii=False).encode("utf-8")
req = urllib.request.Request(BASE + "/shots/" + sid, data=body, method="PATCH",
                             headers={"Content-Type": "application/json; charset=utf-8"})
with urllib.request.urlopen(req, timeout=30) as r:
    r.read()
print("PATCH ok")
print("AFTER motion:", pf["motionPrompt"])
