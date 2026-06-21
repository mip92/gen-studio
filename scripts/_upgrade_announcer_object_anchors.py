# -*- coding: utf-8 -*-
"""OBJECT ANCHORS for announcer (user 2026-06-21: «предметы программа не рисует»).
For every object-hero close-up (a discrete PROP is the subject), rebuild the positive so the PROP dominates:
  STYLE + macro framing + rich OBJECT ANCHOR + sharp-focus/shallow-DOF directive + still-life palette + TECH + cam
and set locationId=NULL so the heavy 400-700char location prose no longer pulls the render toward "just a room".
Pure SCENE inserts (empty platforms/halls/facade/stage/crowd, the woman's face ECU) are LEFT untouched.
Idempotent: re-running rebuilds the same positives. Touches ONLY announcer.
"""
import json, psycopg2
from _announcer_engine import STYLE, TECH, _cam
PROJ="7e600000-0000-4000-8000-000000000001"

DOF=("the prop fills the frame as the single clear subject in crisp sharp focus, "
 "the surroundings thrown far out of focus into soft neutral shapes behind it, shallow depth of field, "
 "one warm focused light on the object")
OBJ_PAL="rich still-life palette, deep shadow and a single warm focused light isolating the object"

# canonical object anchors (reused identically wherever the prop recurs = visual consistency, like a character promptBase)
OBJ={
 "chime":"a single worn brass chime button, a small round burnished brass push-button with a polished rim set into a dark bakelite panel, fingerprints worn into its shine",
 "mic":"a heavy vintage bakelite announcer's microphone on a chrome stand, a round perforated grille, a small switch at its base, scuffed with age",
 "mic_chime":"a heavy vintage bakelite microphone on a stand beside a small worn brass chime button on a dark bakelite panel",
 "mic_monitor":"a heavy old bakelite microphone beside a sleek new flat speaker monitor, warm brass against cold grey plastic",
 "board":"a mechanical split-flap departures board, dense rows of black tiles with white letters and numbers caught mid-flip, a soft blur of flipping flaps, brass framing",
 "digital_board":"a flat modern digital departures display, cold blue LED rows of destinations and times, silent, with no moving flaps",
 "letter_photo":"a folded handwritten letter and a small worn black-and-white photograph of a young man in a soldier's uniform, the edges frayed white from handling",
 "yellow_scarf":"a soft knitted bright yellow woollen scarf, the wool a little fuzzed with wear",
 "yellow_scarf_faded":"a soft knitted woollen scarf faded by years of sun from bright yellow almost to white, the wool worn thin",
 "scarf_cap":"a soft bright yellow knitted scarf and a grey wool flat cap laid close together",
 "briefcase":"a battered tan leather briefcase with brass clasps worn to bare metal, a fourfold-folded newspaper tucked under the handle, leather cracked at the corners",
 "suitcases":"two old cardboard suitcases bound tightly with knotted rope, corners crushed and re-taped, paper labels peeling",
 "ticket_stub":"a single dropped paper railway ticket stub, creased and trodden, lying on stone",
 "oneway":"a single one-way paper railway ticket, slightly crumpled, the printed destination and a one-way mark visible",
 "ticket_flowers":"a small printed platform ticket held against a fresh bunch of simple paper-wrapped flowers",
 "flowers":"a modest bunch of fresh simple flowers in cheap paper wrapping",
 "flowers_wilt":"a bunch of wilting flowers, petals browning and drooping, the paper wrapping crumpled",
 "note_chime":"a handwritten missing-person note with a child's description lying beside a worn brass chime button on a dark panel",
 "cane":"a white folding blind-person's cane with a worn rubber tip and a red band, held upright",
 "thermos":"a battered dented metal thermos flask, its enamel chipped and worn pale, with a dented cup-lid",
 "loudspeaker":"a round vintage ceiling loudspeaker grille, concentric perforated metal rings, dust drifting in slatted light around it",
 "city_clocks":"a wall of ten round railway clocks set to different cities with brass rims, one clock face stopped with still hands while the others run",
 "server":"tall grey metal server racks of automated equipment, rows of small blinking blue indicator lights, neat cabling, cold and impersonal",
 "red_scarf":"a faded deep-red silk throat scarf, the silk worn thin and dulled, hung on a nail",
 "poster":"a printed gala anniversary poster reading the voice of the station in ornate lettering, with no personal name on it",
 "speaker_rack":"a flat grey loudspeaker mounted on a server rack with a small indicator light, emitting a recorded announcement",
 "soundwave":"a flat monitor screen showing a voice soundwave waveform in a cold blue glow with a digital readout",
 "empty_seat":"a single empty worn upholstered train window seat keeping the impression of long use",
 "empty_chair_clock":"an empty worn office chair behind a desk, and on the wall above it a single stopped railway clock with still hands",
 "automated_panel":"a sleek new automated announcement speaker panel, cold grey with a blue indicator, fixed to an old tiled wall beside an old mechanical board",
 "station_clock":"a giant round station clock with ornate hands reading midnight, a brass rim, suspended high under a vaulted roof",
}

# shotCode -> object key (object-hero close-ups only; scene-inserts deliberately omitted)
MAP={
 "A0_SH03":"chime","A0_SH07":"board","A0_SH15":"mic","A0_SH18":"station_clock",
 "A1_SH16":"mic_chime","A1_SH26":"board","A1_SH43":"board","A1_SH50":"mic",
 "GA_SH03":"letter_photo","GA_SH08":"board","GA_SH14":"letter_photo","GA_SH22":"scarf_cap","GA_SH29":"yellow_scarf","GA_SH33":"board","GA_SH37":"yellow_scarf_faded",
 "GB_SH03":"briefcase","GB_SH08":"board","GB_SH12":"empty_seat","GB_SH18":"board","GB_SH22":"suitcases","GB_SH29":"board","GB_SH34":"ticket_stub",
 "GC_SH02":"ticket_flowers","GC_SH06":"flowers_wilt","GC_SH09":"board","GC_SH13":"flowers","GC_SH16":"flowers","GC_SH20":"oneway","GC_SH23":"note_chime","GC_SH36":"oneway","GC_SH40":"oneway",
 "GD_SH02":"cane","GD_SH09":"mic","GD_SH13":"automated_panel","GD_SH19":"mic_monitor","GD_SH22":"thermos","GD_SH38":"mic",
 "GE_SH02":"loudspeaker","GE_SH08":"loudspeaker","GE_SH16":"city_clocks","GE_SH21":"server","GE_SH25":"empty_chair_clock","GE_SH37":"red_scarf","GE_SH40":"server",
 "TU_SH10":"poster","TU_SH33":"chime",
 "CA_SH04":"speaker_rack","CA_SH08":"soundwave","CA_SH21":"red_scarf","CA_SH24":"server","CA_SH31":"mic","CA_SH36":"server",
 "AF_SH09":"digital_board","AF_SH13":"mic","AF_SH30":"loudspeaker",
 "CO_SH04":"mic","CO_SH09":"chime","CO_SH13":"mic","CO_SH14":"chime",
}

cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio");cx.autocommit=False;cur=cx.cursor()
bad=[k for k in MAP.values() if k not in OBJ]
if bad: raise SystemExit("missing OBJ anchor for: %s"%set(bad))
n=0
for code,key in MAP.items():
    cur.execute('SELECT "promptFields","shotType","cameraAngle","cameraMove" FROM shots WHERE "projectId"=%s AND "shotCode"=%s',(PROJ,code))
    r=cur.fetchone()
    if not r: print("MISS",code); continue
    pf,st,ang,mv=r
    positive=STYLE+"macro insert, "+OBJ[key]+", "+DOF+", "+OBJ_PAL+", "+TECH+_cam(st,ang,mv)
    pf["positive"]=positive; pf["positivePrompt"]=positive
    cur.execute('UPDATE shots SET "promptFields"=%s::jsonb, "locationId"=NULL WHERE "projectId"=%s AND "shotCode"=%s',
                (json.dumps(pf,ensure_ascii=False),PROJ,code))
    n+=1
cx.commit()
print("object-anchored shots: %d  (locationId nulled, prop now dominates)"%n)
# report: remaining INSERT/ECU still with a location = the deliberate SCENE inserts
cur.execute("""SELECT count(*) FROM shots WHERE "projectId"=%s AND "shotType" IN ('INSERT','ECU') AND "locationId" IS NOT NULL""",(PROJ,))
print("scene-inserts left with location (intended):",cur.fetchone()[0])
cur.close();cx.close()
