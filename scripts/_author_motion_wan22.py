# -*- coding: utf-8 -*-
"""Hand-authored §2 motion clauses — the pass a regex cannot do.

`_migrate_motion_wan22.py` fixed the TAIL (negations → positive locks). This fixes
the HEAD: under Alibaba's I2V formula the prompt is `Motion + Camera movement`, and
the start image already carries the entity, the scene, the costume and the framing.
Re-describing them asks a generative model to re-generate what it was meant to
preserve — which is what identity drift and morphing are (verified: see
Skill(gen-studio-wan22) §6a).

So each clause here states ONLY what physically moves in those ~5 seconds, 15-25
words. What is deliberately dropped: costume and prop inventory ("a padded jacket
pulled on straight over a house vest"), framing ("seen from high above"), and any
camera instruction — the engine derives that from `Shot.cameraMove` at dispatch.
Env shots that had no motion at all get a real beat (drifting mist, a sliding torch
beam, a swaying bulb) instead of a static still-life description.

The lock tail is preserved from whatever the shot already carries, so char/env
assignment and the project's style word are never disturbed.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/_author_motion_wan22.py preview car_flipper A0
  PYTHONIOENCODING=utf-8 python scripts/_author_motion_wan22.py apply   car_flipper A0
  PYTHONIOENCODING=utf-8 python scripts/_author_motion_wan22.py revert  car_flipper A0
"""
import sys, os, re, json, psycopg2
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('mig', os.path.join(_here, '_migrate_motion_wan22.py'))
mig = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(mig)

# Where the lock tail starts, so the head can be replaced without touching it.
LOCK_STARTS = (
    ', the place stays deserted',
    ', the frame keeps exactly the figures it already has',
    ', the same single figure throughout the shot',
    ', the same two figures throughout the shot',
    ', only the hands already in frame move',
)

# project -> act -> shotCode -> motion clause
CLAUSES = {
 'car_flipper': {
  'A0': {
   'A0_SH01': 'blue beacon light sweeps slowly across the wet asphalt and thin exhaust drifts along the standing service vehicles',
   'A0_SH02': 'beacon light pulses across the torn guard rail and a few blades of pressed grass spring back in the ditch below',
   'A0_SH03': "Viktor leans a fraction over the tape and his eyes travel down the embankment, his hands staying at his sides",
   'A0_SH04': "Viktor's eyes move once to the left and stop there, his jaw tightening as the turning blue light crosses his face",
   'A0_SH05': 'the folded mirror trembles faintly on its arm and a bead of light slides along the hardened adhesive',
   'A0_SH06': "Viktor's fists tighten on the plastic tape and he leans slowly forward over it, his shoulders rising on a held breath",
   'A0_SH07': 'the flattened grass stirs in a faint wind along the arc behind the overturned saloon and dust settles slowly around its roof',
   'A0_SH08': 'the torch beam slides along the corroded brake line and the fresh sealant coat glistens as the light crosses it',
   'A0_SH09': 'Viktor closes his eyes for two long seconds and opens them again, his mouth staying a flat line while blue light crosses his face',
   'A0_SH10': "Viktor's shoulders rise and settle once at the tape line, the lit wreck holding still in the ditch far beyond him",
   'A0_SH11': 'the torch beam creeps across the wet grass and the frayed ear of the small bear rucksack lifts a little in the wind',
   'A0_SH12': 'Viktor turns his face away from the ditch and lowers his eyes to the asphalt in front of his boots',
   'A0_SH13': 'Viktor walks back along the closed lane between two cones, his hands deep in his pockets and his coat swinging with his stride',
   'A0_SH14': "Viktor's hands rest on the wheel and his chest rises once, beacon light still turning beyond the windscreen",
   'A0_SH15': 'the beacon light fades along the emptied lane and thin mist drifts low over the broken centre line',
   'A0_SH16': "the work lamp's hard circle of light trembles on the bench and one white digit of the odometer drum settles a fraction",
   'A0_SH17': 'mist drifts slowly over the cracked asphalt between the garage rows and the warm light in the open doorway flickers once',
   'A0_SH18': "Viktor drags the soaked rag along the taxi's flank in slow strokes, water running down the paint into the bucket at his feet",
   'A0_SH19': 'Viktor straightens up from the wet bonnet and wipes both palms down his thighs, faint steam rising off the bucket beside him',
   'A0_SH20': "Viktor's thumb moves across the coins and folded notes in his open palm and one corner of his mouth twitches up",
   'A0_SH21': 'the leather wrist pouch sways a few degrees on the bent nail and its scuffed zip catches the light',
   'A0_SH22': 'the bare bulb above the engine stand sways slightly in the doorway draught and its light shifts across the laid-out tools',
  },
  'A1': {
   'A1_SH01': 'the low strip of daylight creeps along the oily floor and dust turns in it above the engine stand',
   'A1_SH02': 'Gena turns the spanner in short quick strokes deep in the engine bay, the unlit cigarette shifting behind his ear',
   'A1_SH03': 'Gena straightens up from the engine and turns his head towards the doorway while the bucket sways once in Viktor’s hand',
   'A1_SH04': 'Gena tips his head back as he talks, one eye narrowing, and shoves the flat cap further back on his skull',
   'A1_SH05': 'a page of the spread newspaper lifts and settles under the hooked lamp and the loose coloured wires sway a little',
   'A1_SH06': "Gena's finger jabs down into the dashboard cavity twice while Viktor shifts his knees on the folded sack",
   'A1_SH07': 'Gena works the cable collar free with two fingers and the cluster tilts on his knee, the cap brim catching the lamp',
   'A1_SH08': 'the taped handle rocks a few degrees on the bench and the worn tip of the screwdriver catches a moving highlight',
   'A1_SH09': 'Viktor turns the small screwdriver a quarter turn at a time and the odometer drums step round under his thumb',
   'A1_SH10': 'the low lamp flame wavers over the bench and one white digit of the drum counter settles a fraction',
   'A1_SH11': 'Viktor lifts his face from the cluster, his eyes going very still and lamp light sliding along one cheek',
   'A1_SH12': 'dust drifts through the pool of lamp light over the opened cluster and a corner of the newspaper lifts',
   'A1_SH13': "Gena thumbs notes off the roll one by one into Viktor's flat palm and Viktor's fingers press closer together",
   'A1_SH14': "Gena's unlit cigarette shifts as he speaks and one eyebrow goes up, entirely calm",
   'A1_SH15': "the notes stay flat on Viktor's open palm and his eyes travel across them instead of folding them away",
   'A1_SH16': 'light spills from the one open doorway across the wet roofs and thin steam rises off the asphalt after rain',
   'A1_SH17': 'the paper price tag turns slowly on its split ring under the bulb and its shadow swings across the bench',
   'A1_SH18': 'Viktor kicks the bottle cap ahead of himself down the garage row, hands deep in his pockets, coat swinging',
   'A1_SH19': 'Viktor stops under the yard lamp and his breath shows in the cold, his eyes staying unfocused on the empty air',
   'A1_SH20': 'the kettle begins to steam on the stove and the pendant lamp sways almost imperceptibly over the two plates',
   'A1_SH21': 'Viktor eases the kitchen door shut behind him and slides the folded notes under the sugar tin',
   'A1_SH22': 'Viktor chews the inside of his cheek, his eyes staying fixed on the tin',
   'A1_SH23': 'the work jacket settles on the chair back and the scuffed zip of the leather pouch catches a shifting light',
   'A1_SH24': 'Viktor shifts his weight beside the closed door, the leather pouch swinging a little on his wrist',
   'A1_SH25': 'frost glitters along the bottom edge of the steel door and the open padlock swings slightly on the hasp',
   'A1_SH26': 'Viktor hauls the garage door up with both hands and warm light spills across his face and chest',
   'A1_SH27': 'chalk dust lifts off the ledge below the numbers and the light shifts across the crossed-out columns',
   'A1_SH28': 'water creeps along the hose across the asphalt and heat shimmer rises off the parked bonnets',
   'A1_SZ01': 'the rainbow film of oil spreads and swirls slowly across the standing puddle',
   'A1_SZ02': 'the bent aerials sway against the darkening sky and the one lit window flickers once',
  },
  'A2': {
   'A2_SH01': 'rain water shivers in the puddles between the rows and the cardboard cards lift at their corners under the wipers',
   'A2_SH02': 'Viktor squares the wing mirror with two fingers and the rag shifts on his shoulder',
   'A2_SH03': 'the cardboard price card flexes under the wiper and drying rain spots shrink across the board',
   'A2_SH04': "Viktor's eyes lose focus and his jaw shifts once as he works it out",
   'A2_SH05': 'Viktor wipes the bumper in slow passes on one knee while Gena turns the thermos cup in his hands on the stool',
   'A2_SH06': 'Viktor straightens up fast, pulls the rag off his shoulder and pushes it into his pocket',
   'A2_SH07': "the buyer's shoulder shifts in the foreground and Viktor's head turns to follow him across the car",
   'A2_SH08': "Viktor's face holds even and his eyes stay steady, the finished nod settling",
   'A2_SH09': "the folded money passes between the two hands over the car roof and the stranger's fingers close on it",
   'A2_SH10': 'water runs back across the dry rectangle of asphalt where the car stood and the puddles settle',
   'A2_SH11': 'Viktor counts notes into his lap, his boots swinging a little clear of the ground',
   'A2_SH12': 'Gena gives one slow nod and the corners of his eyes crease, the cigarette staying behind his ear',
   'A2_SH13': 'the sagging bunting swings on its wire and trodden paper cards flutter in the churned mud',
   'A2_SH14': "the keys spin on Viktor's finger as he walks his row, his eyes flicking to each windscreen card",
   'A2_SH15': "Lena's pen moves steadily down the ledger and she turns a page, her eyes staying down on it",
   'A2_SH16': "Lena flicks through the notes with her thumb inside the window while Viktor's forearms settle on the ledge outside",
   'A2_SH17': 'Lena lifts her eyes to the window with the notes still in her hands and one eyebrow goes up',
   'A2_SH18': "Viktor's mouth opens and closes once before he speaks, his eyes sliding away",
   'A2_SH19': 'the sliding glass shifts a little in its runner and light moves along the worn metal ledge',
   'A2_SH20': 'Lena unwraps a cup from newspaper on the floorboards while Viktor carries the taped box in through the doorway',
   'A2_SH21': 'the open locket rocks a few degrees on the folded shirt and light slides across the tiny photograph',
   'A2_SH22': 'Viktor turns the full cup in his hand at the balcony door, talking to the room while facing the glass',
   'A2_SH23': 'mist drifts low across the fields and the pale reflection of the sky slides along the wet road',
   'A2_SH24': 'Gena holds up two fingers explaining it while Viktor shifts the folder under his arm and listens',
   'A2_SH25': 'Gena speaks quietly with his chin tucked down and glances once off to the side',
   'A2_SH26': 'the row of cardboard cards flexes under the wipers and one amended number lifts at its corner',
   'A2_SH27': "Viktor's open palm turns further upward as he talks, entirely relaxed",
   'A2_SH28': 'tail lights slide out through the single gate and the rows of roofs go dark one after another',
   'A2_SZ01': 'rain streams off the roofs and down the windscreens into the mud in steady sheets',
   'A2_SZ02': 'rain dimples the soaked card in the mud and its written numbers run and blur further',
  },
  'A3': {
   'A3_SH01': 'the taped plastic sheeting breathes at the doorway and the hard cone of lamp light shifts across the grey primer',
   'A3_SH02': 'Viktor runs the bead along the seam under the sill and the mask on his forehead catches the flare',
   'A3_SH03': 'the spatula lifts a pale ridge of putty off the tin and tiny bubbles rise and burst in the paste',
   'A3_SH04': 'Viktor holds the test card against the fender and his eyes narrow, moving between the two surfaces',
   'A3_SH05': 'white dust rolls slowly through the lamp beam and a crumpled sheet of sanding paper stirs on the floor',
   'A3_SH06': 'Viktor pulls the dust mask down under his chin while Gena counts cars off on his fingers at him',
   'A3_SH07': "Gena closes one eye and his head moves slowly along the repaired wing, lit hard from one side",
   'A3_SH08': 'debris drifts slowly between the car roofs standing out of the brown water',
   'A3_SH09': 'the brown water laps at the door handles and the silt tide line darkens as it wets',
   'A3_SH10': 'Viktor wades to the hitch and hooks the tow strap onto the submerged eye, water breaking round his knees',
   'A3_SH11': 'the peeled carpet lifts a little off the floor pan and dried silt crumbles from the tide line',
   'A3_SH12': 'Viktor works the hot air blower along the open interior and the new carpet roll shifts against the wing',
   'A3_SH13': 'Viktor leans into the interior, draws one slow breath through his nose and closes his eyes',
   'A3_SH14': 'the fresh cards flex under the wipers of the clean row and the two waiting figures shift their weight',
   'A3_SH15': 'Viktor sorts the banded bundles into the pouch on his knee, his boots planted on the ground',
   'A3_SH16': "the folded jacket settles further to one side and the pouch's scuffed zip catches the light",
   'A3_SH17': 'the cloth over the plate lifts slightly in a draught and the lamp light trembles on the empty chair',
   'A3_SH18': "Lena's hand moves once on her stomach and her eyes stay on the door instead of the food",
   'A3_SH19': "green dashboard light moves on Viktor's face and his eyes stay fixed far down the road",
   'A3_SH20': 'steam lifts off the tiny socks on the radiator and morning light creeps up the wall behind them',
   'A3_SH21': 'Viktor shifts the box against his chest on the threshold, his eyes moving round the room for somewhere to set it',
   'A3_SH22': "Viktor's eyes travel round the room over the top edge of the box, measuring it",
   'A3_SH23': 'light moves slowly across the unswept floorboards and the roll of wallpaper leans a little further into the corner',
   'A3_SH24': 'Lena sets the two cups down on the oilcloth while Viktor pulls out the chair opposite her',
   'A3_SH25': "Lena's eyes go down to her cup and her face stays completely level",
   'A3_SH26': 'light slides along the tall aerosol can at the front of the shelf and the used nozzle glistens',
   'A3_SH27': 'Viktor lays an even grey coat along the sill with the can upside down, the spray blooming and settling',
   'A3_SH28': 'Viktor turns his face up towards the lamp and blinks once, grey overspray dusting his cheekbone',
   'A3_SH29': 'mist drifts in a thin band over the fields and the low sun flares between the stepping telegraph poles',
   'A3_SH30': 'long shadows stretch further across the churned ground as the thinning rows go quiet',
   'A3_SZ01': 'fine white dust lifts off the wing around the pressed handprint and settles again in the lamp light',
   'A3_SZ02': 'standing water on both sides ripples faintly and the grey sky slides along the wet road',
  },
  'A4': {
   'A4_SH01': 'water dries in a shrinking strip along the hosed asphalt between the four clean rows',
   'A4_SH02': 'Viktor walks the length of his row, flicking each wiper and door handle with one hand as he goes',
   'A4_SH03': "Viktor's stride breaks for a second in profile and his head turns a fraction as he recognises it",
   'A4_SH04': 'the mud-splashed saloon sits dead across the aisle and thin heat shimmer rises off its bonnet',
   'A4_SH05': 'the broken slab of filler swings a little further away from the bubbling metal at the door edge',
   'A4_SH06': 'Viktor wipes his hands on the rag as he comes, folds it away and keeps walking at the same pace',
   'A4_SH07': "the angry man's arm throws out towards the car in the foreground while Viktor's shoulders stay square",
   'A4_SH08': "Viktor's eyebrows lift a fraction and his mouth moves as he asks it back, his face staying level",
   'A4_SH09': 'Viktor opens the folder against his forearm and turns it round so the page faces outward',
   'A4_SH10': 'Viktor holds the open folder out at arm’s length while Gena rolls the unlit cigarette between his fingers',
   'A4_SH11': "Gena's eye narrows further and the corner of his mouth stays flat, faintly approving",
   'A4_SH12': 'Viktor shuts the folder in one movement and two fingers come up pointing towards the gate',
   'A4_SH13': 'dust settles into the fresh tyre tracks curving out of the cleared aisle and the closed rows stand quiet',
   'A4_SH14': "Lena's fingers tighten on the handles of the cloth bag and she stays exactly where the row ends",
   'A4_SH15': "Lena's jaw tightens and she blinks once, her eyes fixed on something past the lens",
   'A4_SH16': 'Lena lets go of the bag as Viktor takes it by the handles, her hands staying exactly where they were',
   'A4_SH17': 'steam thins off the two cups and the lamp light trembles on the chair pushed back at an angle',
   'A4_SH18': 'Lena speaks low over her linked hands and her chin presses a little harder onto them',
   'A4_SH19': "Viktor answers flatly, his eyes staying down on the tablecloth as the lamp light holds on one cheek",
   'A4_SH20': 'Lena leans back off the table, folds her arms and stops speaking',
   'A4_SH21': "Viktor's jaw works once and his eyes go to the dark window instead of to her",
   'A4_SH22': 'the night light glows steady on the skirting and the small jacket shifts a fraction on the chair back',
   'A4_SH23': 'the top sheet of the clipboard lifts at one corner in a draught and the fresh signature catches the lamp',
   'A4_SH24': 'Viktor rules a line under the new small print, the pen moving once along the ruler and lifting away',
   'A4_SH25': "Viktor's lips move silently as he reads his own added line back, dawn light rising on his face",
   'A4_SH26': 'the squared stacks of blank forms lift at their corners as the early light strengthens across the table',
   'A4_SH27': 'Viktor pushes back from the table and stands, taking the folders under his arm, his eyes going to the door',
   'A4_SH28': 'the single pair of headlights slides steadily along the road towards the horizon through the sunrise haze',
   'A4_SZ01': 'thick fog rolls slowly across the rows and swallows the nearest roofs a little further',
   'A4_SZ02': 'the puddle ripples once and the upside-down reflection of the price card wavers and settles',
  },
  'A5': {
   'A5_SH01': 'fresh white paint dries on the new slabs and the empty banner frame ticks in the wind at the entrance',
   'A5_SH02': 'Viktor walks backwards along the wire clipping triangles onto it one after another with both arms up',
   'A5_SH03': 'the coloured bunting snaps and twists in the wind and the wire sags and lifts between the masts',
   'A5_SH04': "Viktor's mouth moves on a silent number as his eyes travel up and across the banner frame",
   'A5_SH05': 'steam lifts from the kettle at the end of the laminate desk and the half-open blind sways in the draught',
   'A5_SH06': 'Viktor hooks the blind up on one finger and his head moves along the rows as he counts',
   'A5_SH07': 'the paper price tag turns slowly on its split ring on the numbered hook',
   'A5_SH08': 'Gena turns slowly on the spot taking the whole lot in while Viktor tips his chin at the rows, hands in his pockets',
   'A5_SH09': 'Gena squints up against the floodlight mast and the unlit cigarette shifts behind his ear',
   'A5_SH10': 'water dries in shrinking rings around the wheels and the coiled hoses settle at the edge of the rows',
   'A5_SH11': 'Denis works the sponge round the spokes one by one and water runs off the wheel into the tipped bucket',
   'A5_SH12': "Denis's lips move over the count in his fist and wet hair sticks and shifts on his forehead",
   'A5_SH13': 'Denis goes up on tiptoe with his chin on the sill while Viktor holds the driver’s door wide beside him',
   'A5_SH14': 'Viktor bends down towards the boy explaining it easily, one shoulder lifting in a small shrug',
   'A5_SH15': 'the bunting hangs still as the last floodlight dies and the slabs go flat grey',
   'A5_SH16': "Viktor's hands stay flat on his knees and his eyes move once as pages turn off frame",
   'A5_SH17': 'a draught lifts the edges of the fanned contracts and the three pulled aside settle squarely on their pile',
   'A5_SH18': "Viktor's eyes travel once across the desk and stop, everything else in his face held still",
   'A5_SH19': "Viktor's hand stays resting on the closed folder and his chest rises once in the empty container",
   'A5_SH20': 'heat shimmer rises off the full rows and the open container door swings a few degrees at the far end',
   'A5_SH21': 'Viktor slides three sheets across the oilcloth and holds out the pen, and Lena takes it, her eyes on his face',
   'A5_SH22': 'Lena glances up once with mild question in her face, her hand already reaching for the paper',
   'A5_SH23': 'the ballpoint rocks slightly where it rests across the signed line and the sheet lifts at one corner',
   'A5_SH24': 'Viktor gathers the signed sheets and taps their edges square against the table, his face turned away',
   'A5_SH25': 'the delivery truck creeps backwards in at the gate and heat shimmer lifts off the packed rows',
   'A5_SH26': 'Viktor ticks boxes on the clipboard as he walks the rows, his stride carrying him straight past each car',
   'A5_SH27': 'Viktor writes a figure on the pad with the phone tucked under his jaw, his pen moving in short bursts',
   'A5_SH28': 'the drawer rolls open a little further and the taped screwdriver shifts across the old receipts',
   'A5_SH29': 'Viktor pushes the drawer shut with his knee, still holding the phone, his eyes staying on the window',
   'A5_SH30': 'the floodlights burn steady over the rows and headlights slide past in a steady line on the road beyond',
   'A5_SZ01': 'the round beads of water tremble on the waxed bonnet and one runs and joins another',
   'A5_SZ02': 'the cloud of insects turns and boils in the cone of floodlight above the parked rows',
  },
  'A6': {
   'A6_SH01': 'low evening sun creeps along the worn walking lines and the repainted banner frame ticks once in the warm air',
   'A6_SH02': 'Viktor taps each wing mirror straight with a knuckle as he walks, the phone held against his ear',
   'A6_SH03': "Viktor's face turns a little into the warm low sun and he blinks once, his cuffs staying spotless",
   'A6_SH04': 'steam thins over the three plates and the propped envelope slides a few millimetres down the sugar tin',
   'A6_SH05': 'Denis talks with his chin up and his arm slung over the chair back, his stare staying flat',
   'A6_SH06': "Lena's eyes move off to somebody past the lens and her mouth stays closed, waiting",
   'A6_SH07': 'Viktor takes a long time lowering the cup to the counter, his back staying half turned',
   'A6_SH08': 'frost glitters and thins along the bunting wire and the long shadow shortens across the empty apron',
   'A6_SH09': 'Denis takes the bucket from Viktor with one hand, already turning his head towards the first car',
   'A6_SH10': "Denis works with his eyes down and his jaw set, drying foam cracking across his cheek",
   'A6_SH11': 'the numbered paper tags turn a little together on their hooks as a draught crosses the open cabinet',
   'A6_SH12': 'Denis leans over the desk explaining it with both hands while Viktor stays folded against the key cabinet',
   'A6_SH13': "Denis's face holds steady mid-sentence, his eyes staying level on somebody past the lens",
   'A6_SH14': 'something close to pride moves across Viktor’s face at the wall and his mouth softens a fraction',
   'A6_SH15': 'the rows go dark one after another as the floodlights die and the half-rolled gate stands still',
   'A6_SH16': 'Viktor runs his thumb along the underbody at the sill while Denis holds the torch low on the metal',
   'A6_SH17': 'Viktor explains it patiently, lit from below by the torch, his finger tracing the seam twice',
   'A6_SH18': 'the folded summons slides a little further out of the slit envelope and the pushed-aside mug rocks once',
   'A6_SH19': "Lena's lips move through the sheet a second time and her grip tightens on both edges of it",
   'A6_SH20': "Lena's hand strikes the desk flat once as she finishes, her face staying hard and level",
   'A6_SH21': 'Viktor raises both palms in a settling gesture while Lena turns away towards the container door',
   'A6_SH22': 'a draught lifts the top sheet of each squared pile and the pen rolls a few degrees across the paper',
   'A6_SH23': 'Denis pulls the first pile towards himself in his father’s chair, the red cap sitting backwards',
   'A6_SH24': 'light shifts along the open stamp pad and the clipboard sheet lifts at one corner under the strip light',
   'A6_SH25': 'Denis signs at the speed of somebody copying a shape, his head bent and untroubled over the paperwork',
   'A6_SH26': 'Viktor slides the next sheet forward with two fingers, his other hand resting on the back of the chair',
   'A6_SH27': 'the bright brackets of the new name board catch the last light and the bunting shivers along the frame',
   'A6_SH28': 'Denis repeats it back with a half smile while Viktor stays crossed-armed against the wing',
   'A6_SH29': "Denis says four words with easy warmth, his eyes staying completely steady",
   'A6_SH30': 'the floodlights burn over the full rows and the road beyond runs away into moving darkness',
   'A6_SZ01': 'the shadows of the bunting triangles crawl slowly across the warm asphalt as the sun drops',
   'A6_SZ02': 'the single key swings on its numbered hook and its paper tag turns slowly on the ring',
  },
  'A7': {
   'A7_SH01': 'rain dimples the puddles standing where cars used to be and the empty rows darken as the shower crosses them',
   'A7_SH02': 'the folding stool rocks once in the wind and the dented thermos cup rolls a few degrees on the ground',
   'A7_SH03': 'the pale ribbon on the plastic wreath whips and settles against the low fence rail',
   'A7_SH04': 'wind pulls at Viktor’s coat and he turns the cap slowly in both hands in front of him',
   'A7_SH05': "Viktor's mouth tightens as the count arrives, his eyes staying flat in the grey daylight",
   'A7_SH06': 'traffic creeps along the ring road far below while wind moves across the hillside grass',
   'A7_SH07': 'Viktor settles the cap back on his head and stands a moment longer, his eyes going down to the road',
   'A7_SH08': 'the taped sheet inside the office window lifts at one corner and thin frost thins off the nearest bonnets',
   'A7_SH09': 'Viktor holds one hand flat in the air as he talks and Denis’s jaw tightens as he listens',
   'A7_SH10': 'the uncapped highlighter rolls a little across the desk and the ticked column lifts as the page settles',
   'A7_SH11': "Viktor's eyes follow the reader across the report, his own face staying carefully neutral",
   'A7_SH12': 'weeds stir in the joints of the paving slabs and heat shimmer lifts from the wide gaps between the cars',
   'A7_SH13': 'Viktor counts the tin through twice and closes the lid on it, his thumb pressing the catch down',
   'A7_SH14': 'Denis reads a number off the schedule held down under two fingers, his other hand flat on the desk',
   'A7_SH15': "Denis's face holds the pause exactly as long as it needs, only one slow blink crossing it",
   'A7_SH16': 'steam climbs off the one cup on the oilcloth and the lamp light holds flat on the cleared side of the table',
   'A7_SH17': 'Lena says it over her shoulder at the stove and her hand keeps moving on the pan',
   'A7_SH18': "Viktor's eyes stay open and fixed on the empty tablecloth, his head lowered over the cup",
   'A7_SH19': 'brown water shifts slowly between the buildings and the broken grid of car roofs stands still in it',
   'A7_SH20': 'the flood water laps at the sills of the six cars and the bright paint above the tide line glistens',
   'A7_SH21': 'Viktor stands at the water’s edge with his hands in his pockets, the water creeping to his boot toes',
   'A7_SH22': 'the cardboard darkens as water soaks into it under the sill and the fresh grey coating glistens',
   'A7_SH23': 'Viktor lies on his back with the torch on his chest, his eyes travelling slowly across the floor pan',
   'A7_SH24': 'Viktor sits up out from under the car and wipes his hands slowly on the rag, his mouth staying shut',
   'A7_SH25': 'light slides along the tall aerosol can at the front of the shelf and the crusted nozzle catches it',
   'A7_SH26': 'Viktor pushes the rolled sheeting across the bay doorway and presses tape along the gap',
   'A7_SH27': "the can shifts once in Viktor's grip under the work lamp and his eyes stay level, everything already settled",
   'A7_SH28': 'mist drifts slowly over the fields on both sides and the wet surface holds a moving sheen',
   'A7_SZ01': 'the wet yellow leaves lift and resettle across the bonnet and one slides down the windscreen',
   'A7_SZ02': 'the empty banner frame swings a few degrees and hums in the wind against the grey sky',
  },
  'A8': {
   'A8_SH01': 'the taped masking paper breathes along the panel edges and the lamp burns steady at the raised sill',
   'A8_SH02': 'Viktor draws a slow bead along the fresh patch and the welding flare pulses under the lowered mask',
   'A8_SH03': 'the hard side light creeps along the underbody and the fresh grey coating glistens over the brake line',
   'A8_SH04': 'the can hisses in Viktor’s hand and his eyes travel slowly across what he has just covered',
   'A8_SH05': 'Viktor squeezes the clear bead along the cracked glass and draws the excess off with his thumb',
   'A8_SH06': 'Viktor works the cluster face-down at an even unhurried pace, his rolled sleeves shifting on his forearms',
   'A8_SH07': 'the lamp light trembles low over the bench and one white digit of the drum counter steps round',
   'A8_SH08': 'sunlight runs along the clean flank of the silver saloon and heat shimmer lifts off its roof',
   'A8_SH09': 'Denis tucks the fresh card under the wiper and steps back, his head tilting to check it sits straight',
   'A8_SH10': 'the family car creeps in at the gate and the gap in the second row stands open beside it',
   'A8_SH11': 'Anya walks slowly along the flank with the yellow rucksack swinging from one hand, her eyes on the panel gaps',
   'A8_SH12': 'Anya crouches lower at the wheel arch and tilts her head right down, trying to see under the car',
   'A8_SH13': 'the open door swings a few degrees in the sun and the frayed ear of the bear rucksack lifts on the seat',
   'A8_SH14': 'Viktor points into the engine bay under the propped bonnet while Anya leans in beside him, hands behind her back',
   'A8_SH15': 'dust settles into the fresh tyre tracks curving off the asphalt and the poplars stir behind the fence',
   'A8_SH16': 'Anya keeps both hands at ten and two and her head tilts a fraction, listening to the engine',
   'A8_SH17': 'Anya turns her head as the engine dies and her expression opens, direct and steady',
   'A8_SH18': "Anya's shoulder shifts in the foreground while Viktor's hand stays flat on the roof beyond her",
   'A8_SH19': 'the four words leave Viktor’s face as easily as breathing, his expression staying entirely at ease',
   'A8_SH20': "Viktor's eyes move once towards the front wheel arch and away again, his hand staying on the door frame",
   'A8_SH21': "Viktor's mouth closes on the unspoken word and his jaw settles back into place",
   'A8_SH22': 'the pen moves across the carbon form under Denis’s hand while Anya watches it, her bag on her knees',
   'A8_SH23': 'the peeled carbon sheet lifts a little further off the clipboard and the fresh signature catches the light',
   'A8_SH24': 'Denis stands up and puts his hand out across the desk, open and friendly',
   'A8_SH25': 'the key swings slowly on Viktor’s finger at the cabinet and his eyes stay on the window',
   'A8_SH26': 'dust drifts across the fresh tyre marks leading out to the gate and the rolled gate stands open to the road',
   'A8_SH27': "Viktor's hand raises in a short flat wave and the smile arrives a moment after it",
   'A8_SH28': 'the single pair of tail lights slides further down the road as the fields go dark on both sides',
   'A8_SZ01': 'pollen and dust turn slowly in the shaft of low sunlight over the warm bonnet',
   'A8_SZ02': 'heat shimmers off the asphalt towards the low sun and the cut summer fields stir either side',
  },
  'A9': {
   'A9_SH01': 'the amber lamps pulse on the recovery truck and the raised boom sways a fraction over the angled deck',
   'A9_SH02': 'swept glass slides and settles against the kerb and the open sack mouth breathes in the wind',
   'A9_SH03': 'the strip lighting holds shadowless over the raised silver car and dust turns slowly beneath it',
   'A9_SH04': 'Igor works the torch along the underbody from front to back, the clipboard shifting against his hip',
   'A9_SH05': "Igor's eyes travel along the metal behind the lowered glasses, his mouth staying closed",
   'A9_SH06': 'orange rust crumbles out from under the paint edge where the grey coating is scraped to a bright stripe',
   'A9_SH07': 'Igor lifts one hand up to the underbody, a shutter flashing once, then writes four short lines onto the form',
   'A9_SH08': 'light creeps along the overpainted seam and fine grit falls away from the cracked join',
   'A9_SH09': 'the white paper lifts at its corners on the bench beneath the raised car and the numbered parts settle',
   'A9_SH10': 'Igor turns the service history round and his eyes go back over the figure a second time',
   'A9_SH11': 'the loose coloured wires sway a little over the clean white paper beside the opened cluster',
   'A9_SH12': 'Igor signs the last page and squares the sheets against the desk, his face staying blank and official',
   'A9_SH13': 'the clipped contract lifts at one corner in the open folder and the handwritten seller line catches the light',
   'A9_SH14': 'the grid of barred window light creeps along the linoleum past the row of empty benches',
   'A9_SH15': 'Denis walks the corridor alone, the folded summons crumpling in his fist as he checks each numbered plate',
   'A9_SH16': "Denis's eyebrows draw together and his head tilts a fraction as the question lands on him blankly",
   'A9_SH17': 'Denis explains it too fast with both hands open in front of him, the words tumbling out',
   'A9_SH18': 'Viktor turns the cap slowly between his knees on the bench, his head lifting towards the closed door',
   'A9_SH19': 'the clock hand steps forward once high on the far wall and light creeps along the empty linoleum',
   'A9_SH20': 'Anya presses both hands flatter on her knees and the upright rucksack settles beside her',
   'A9_SH21': "Anya's eyes stay on the closed door and she blinks once, very still and very tired",
   'A9_SH22': 'Viktor stands up off the bench, takes three steps down the corridor and stops dead',
   'A9_SH23': "Viktor's mouth starts twice and closes twice, and he lowers himself back onto the bench",
   'A9_SH24': 'the grid of window light slides slowly across the worn linoleum past the bench leg',
   'A9_SH25': 'Viktor rises off the bench as Denis stops a metre short of him, the office door swinging shut behind him',
   'A9_SH26': "Denis's mouth forms one short question and his face holds nothing but patience",
   'A9_SH27': 'Viktor talks steadily through all of it in one unbroken run, his eyes staying down on the linoleum',
   'A9_SH28': 'the light drains out of the fields and the empty lanes go grey from end to end',
  },
  'A10': {
   'A10_SH01': 'dust drifts through the half-closed blinds across the empty raised bench and light shifts along the pale panelling',
   'A10_SH02': 'Viktor taps his own chest twice as he talks, his shoulders lifting on the second tap',
   'A10_SH03': "Viktor's tapping hand drops back to his side and his face settles as the answer lands",
   'A10_SH04': 'the fanned pages lift a little under the paper clip and the pencil rolls a few degrees across them',
   'A10_SH05': "Viktor's hands hang between his knees and his chest rises once, his eyes staying on the bench in front of him",
   'A10_SH06': "Viktor's face goes slack and his mouth opens slightly as the whole shape of it lands at once",
   'A10_SH07': 'a draught shifts the stacked folders on the clerk’s table and light moves along the scattered occupied seats',
   'A10_SH08': "Anya's arms tighten around the yellow rucksack on her lap and her back straightens further",
   'A10_SH09': 'Anya speaks evenly straight ahead, her chin steady and her eyes staying level',
   'A10_SH10': "Denis's hands stay loose at his sides inside the enclosure and his chest rises once",
   'A10_SH11': 'Denis faces the bench, his eyes moving once and his mouth staying closed',
   'A10_SH12': 'light shifts across the folded judgment beside the water glass and the clock hand steps forward once',
   'A10_SH13': 'Viktor stands perfectly still among the risen spectators, only his eyes lowering as the number is read',
   'A10_SH14': 'the side door swings the last few degrees shut and the pushed-back chairs settle in the empty enclosure',
   'A10_SH15': "Lena's bag shifts on her shoulder and she blinks once, her eyes staying dry",
   'A10_SH16': 'Lena says one short sentence and her mouth closes, the locket at her collar catching the light',
   'A10_SH17': 'Viktor half turns towards Lena and she keeps facing the far end of the corridor, speaking past him',
   'A10_SH18': "Viktor's mouth opens and closes on the objection and his lifted hand stops halfway and lowers",
   'A10_SH19': 'the open wardrobe door drifts a few degrees and the empty hangers swing and knock together on the rail',
   'A10_SH20': 'light creeps across the pale unfaded rectangle and the shadow of the small nail lengthens on the paper',
   'A10_SH21': 'the taped notice lifts at one corner on the gate and the tow truck chains sway as it settles',
   'A10_SH22': 'Viktor works the last bolt free and takes the name board under his arm as it comes away from the frame',
   'A10_SH23': 'the taped inventory sheet lifts inside the cabinet door and the last key turns slowly on its ring',
   'A10_SH24': "Viktor's empty hands open and close once and the pouch shifts on his wrist",
   'A10_SH25': 'Viktor pulls the gate across on its rollers and threads the padlock through the hasp, snapping it shut',
   'A10_SH26': 'the bunting shivers overhead above the bare painted lines and the last light drains off the apron',
  },
  'A11': {
   'A11_SH01': 'grey foam runs across the wet concrete towards the floor drain and steam lifts under the corrugated canopy',
   'A11_SH02': 'Viktor works the long brush across the roof in slow arcs, water running down his apron',
   'A11_SH03': 'the sheet of foam slides down the bonnet carrying a curtain of road dirt with it to the sill',
   'A11_SH04': 'spray drifts across Viktor’s face and his eyes travel along the car, his mouth staying shut',
   'A11_SH05': 'the plastic curtain swings slowly across the bay entrance and water drips steadily off the sill',
   'A11_SH06': 'Viktor lowers the brush and steps back from the window as the driver’s eyes pass straight through him',
   'A11_SH07': 'the locker door drifts open a little further and the leather pouch swings on its hook inside',
   'A11_SH08': 'the handset sways on its armoured cord and light crawls along the scratched glass partition',
   'A11_SH09': 'Viktor sits down on the bolted stool and lifts the handset off its hook with both hands',
   'A11_SH10': 'Viktor presses the handset to his ear and his eyes move across the empty far side of the glass',
   'A11_SH11': 'Denis picks up the handset and settles it against his shoulder beyond the glass',
   'A11_SH12': 'Viktor speaks into the handset and Denis answers beyond the scratched glass, both heads tilting to their receivers',
   'A11_SH13': "Denis's face stays easy and neutral through the glass, his mouth moving a little",
   'A11_SH14': 'Viktor leans closer to the glass and presses the handset harder to his ear as he asks it',
   'A11_SH15': 'Denis answers straight away and one shoulder lifts in a small shrug',
   'A11_SH16': "Viktor's free hand flattens on the counter as his mouth forms one more question",
   'A11_SH17': 'Denis says four short words through the glass and sets the handset back on its hook',
   'A11_SH18': 'the handset swings slowly on its cord above the empty stool beyond the scratched glass',
   'A11_SH19': 'the hose goes slack in Viktor’s hand and his eyes come up straight into the lens',
   'A11_SH20': 'Viktor speaks quietly and directly into the lens, his jaw moving in a plain flat register',
   'A11_SH21': 'light crawls along the repaired guard rail and thin mist drifts across the empty lanes',
   'A11_SH22': 'Viktor lets the hose sink towards the wet concrete and his shoulders come down as he stops talking',
   'A11_SH23': 'Viktor lowers the hose to the concrete in the mouth of the bay while cars pass on the road behind him',
   'A11_SH24': 'water spreads slowly across the wet apron and the traffic beyond the canopy keeps moving in a steady line',
  },
 },
}


def split_lock(prompt: str):
    """→ (head, lock) where lock includes its leading comma, or (prompt, '')."""
    for marker in LOCK_STARTS:
        i = prompt.find(marker)
        if i >= 0:
            return prompt[:i], prompt[i:]
    return prompt, ''


def main(mode, slug, act):
    clauses = CLAUSES.get(slug, {}).get(act)
    if not clauses:
        raise SystemExit(f'no authored clauses for {slug} {act}')
    cx = psycopg2.connect(mig._dsn()); cx.autocommit = False
    cur = cx.cursor()
    cur.execute('''SELECT s.id, s."shotCode", coalesce(s."cameraMove",''), s."promptFields"
                   FROM shots s JOIN projects p ON p.id = s."projectId"
                   WHERE p.slug = %s AND s."shotCode" = ANY(%s) ORDER BY s."shotCode"''',
                (slug, list(clauses.keys())))
    rows = cur.fetchall()
    missing = set(clauses) - {r[1] for r in rows}
    if missing:
        raise SystemExit(f'shots not found in {slug}: {sorted(missing)}')

    changed = 0
    for sid, code, cam, pf in rows:
        pf = pf or {}
        old = (pf.get('motionPrompt') or '').strip()

        if mode == 'revert':
            prev = pf.get('motionPromptPreAuthor')
            if not prev:
                continue
            pf['motionPrompt'] = prev
            pf.pop('motionPromptPreAuthor', None)
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))
            changed += 1
            continue

        _head, lock = split_lock(old)
        if not lock:
            print(f'SKIP {code}: no recognised lock tail to preserve'); continue
        new = clauses[code].rstrip().rstrip(',') + lock
        if mig.NEG_RE.search(new):
            print(f'REFUSED {code}: negation in the authored clause'); continue
        if re.search(r'camera|handheld|point of view', clauses[code], re.I):
            print(f'REFUSED {code}: camera belongs to cameraMove, not the text'); continue
        words = len(new.split())
        print(f'=== {code}  [cameraMove={cam or "-"}, {words} words]\n--- OLD\n{old}\n--- NEW\n{new}\n')
        changed += 1
        if mode == 'apply':
            pf.setdefault('motionPromptPreAuthor', old)
            pf['motionPrompt'] = new
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))

    if mode in ('apply', 'revert'):
        cx.commit(); print(f'committed {changed} rows')
    else:
        cx.rollback(); print(f'dry run — {changed} rows would change')


if __name__ == '__main__':
    if len(sys.argv) < 4 or sys.argv[1] not in ('preview', 'apply', 'revert'):
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2], sys.argv[3])
