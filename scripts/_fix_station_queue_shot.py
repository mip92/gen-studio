# -*- coding: utf-8 -*-
"""station A0_SH01: очередь должна заворачивать НА заправку и стоять у колонок."""
import json, urllib.request

SHOT = "cd8e03ae-e9a8-449f-b69a-4f9b4f8e0e4e"
BASE = "http://localhost:4000"

OLD_SUBJ = ("a kilometre of cars nose to tail along a road shoulder at dawn seen from high above, "
            "headlights on, a petrol station canopy at the head of the line")
NEW_SUBJ = ("a queue of cars at dawn turning off the road onto the forecourt of a petrol station, "
            "the first cars standing at the pumps under the canopy, the tail of the queue stretching "
            "down the road shoulder into the distance, headlights on")

OLD_MOT = ("exhaust drifts along the standing line and headlight beams glow in the cold mist, "
           "the place stays deserted, every surface and object holding its exact position, "
           "only air and light in motion, the illustration barely coming to life, hand-drawn animation cadence")
NEW_MOT = ("exhaust drifts along the standing queue and headlight beams glow in the cold mist, "
           "every car holding its exact place in the line, only air and light in motion, "
           "the illustration barely coming to life, hand-drawn animation cadence")

with urllib.request.urlopen(BASE + "/shots/" + SHOT, timeout=30) as r:
    shot = json.loads(r.read().decode("utf-8"))
pf = shot["promptFields"]
assert OLD_SUBJ in pf["positive"], "positive mismatch"
pf["positive"] = pf["positive"].replace(OLD_SUBJ, NEW_SUBJ)
if "positivePrompt" in pf:
    pf["positivePrompt"] = pf["positivePrompt"].replace(OLD_SUBJ, NEW_SUBJ)
assert pf.get("motionPrompt") == OLD_MOT, "motion mismatch"
pf["motionPrompt"] = NEW_MOT

body = json.dumps({"promptFields": pf}, ensure_ascii=False).encode("utf-8")
req = urllib.request.Request(BASE + "/shots/" + SHOT, data=body, method="PATCH",
                             headers={"Content-Type": "application/json; charset=utf-8"})
with urllib.request.urlopen(req, timeout=30) as r:
    r.read()
print("PATCH ok")
