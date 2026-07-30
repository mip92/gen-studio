# -*- coding: utf-8 -*-
"""Hand-authored fixes for the 27 shots `_migrate_motion_wan22.py` refused.

Those shots carry a negation in the hand-written HEAD of the motion prompt, not in
the boilerplate tail — «without a word», «no cradle», «no calls», «no welcome in
it», «with no good answer». A regex has no business deciding what those become, and
Wan does not distinguish a narrative negation from a render constraint: `no calls`
still puts *calls* in the conditioning, and «the woman letting him go without a word
of the real reason» is an abstraction, which Wan answers by inventing motion.

So each one is rewritten by hand into what physically moves in its ~5 seconds,
plus the standard positive lock — Skill(gen-studio-wan22) §2/§3. Camera comes from
`Shot.cameraMove` at dispatch, so it is not written here.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/_fix_motion_leftovers_wan22.py preview
  PYTHONIOENCODING=utf-8 python scripts/_fix_motion_leftovers_wan22.py apply
"""
import sys, os, re, json, psycopg2
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('mig', os.path.join(_here, '_migrate_motion_wan22.py'))
mig = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(mig)

CHAR1 = ('the frame keeps exactly the figures it already has, breathing and small weight shifts only, '
         'the rest of the frame holding still, {ill} in motion, hand-drawn animation cadence')
CHAR2 = ('the same two figures throughout the shot, breathing and small weight shifts only, '
         'the rest of the frame holding still, {ill} in motion, hand-drawn animation cadence')
ENV   = ('the place stays deserted, every surface and object holding its exact position, '
         'only air and light in motion, {ill} barely coming to life, hand-drawn animation cadence')

CELL = 'the cell-shaded illustration'
PLAIN = 'the illustration'

# shotId -> (motion clause, lock template, style word)
FIXES = {
 # collector
 '7e670000-0000-4000-8000-010a00000000': ('the heavy-set man steps across the threshold in his boots and his shoulders fill the narrow hallway, the door swinging shut behind him', CHAR1, PLAIN),
 '7e670000-0000-4000-8000-0a0900000000': ("the mother's eyes hold steady in the narrow door gap and she blinks once, the gap staying exactly as wide as it is", CHAR1, PLAIN),
 # donor
 '7e660000-0000-4000-8000-0a0e00000000': ("the older woman's lips part and close again, her gaze dropping and her shoulders sinking a fraction", CHAR1, CELL),
 '7e660000-0000-4000-8000-020e00000000': ("the young woman's grip tightens on the envelope and her shoulders drop as she breathes out", CHAR1, CELL),
 '7e660000-0000-4000-8000-030400000000': ('the pen skates through the signature in one quick stroke and her hand lifts away from the form', CHAR1, CELL),
 '7e660000-0000-4000-8000-070900000000': ('the woman holds still in close-up, slow shallow breathing, one slow blink, her jaw tightening a fraction, a few strands of hair settling, her eyes staying glassy and dry', CHAR1, CELL),
 '7e660000-0000-4000-8000-071000000000': ('the two sit still at opposite ends of the room, only their breathing and a small shift of weight, the space between them holding', CHAR2, CELL),
 '7e660000-0000-4000-8000-071200000000': ('the woman watches him go, her mouth staying closed and her hand lowering slowly to her side', CHAR1, CELL),
 # sailor_wife
 '7e6c0000-0000-4000-8000-0a1100000000': ('his gaze rests on the far water, the folded forearms settling, one slow blink', CHAR1, PLAIN),
 '7e6c0000-0000-4000-8000-091000000000': ("the bare hook holds still by the door and the pen's nailed ribbon lifts a little in the draught, sea haze drifting past the lighter square of wallpaper", ENV, PLAIN),
 '7e6c0000-0000-4000-8000-091300000000': ('the spoons rise unhurried and his hand passes her the bread, the easy light shifting on the table', CHAR2, PLAIN),
 # shuttle — head has a working queue, so the ENV lock it used to carry was wrong
 '7e6a0000-0000-4000-8000-0a01b0000000': ('the queue shuffles one step forward at the busy counter and hands move over the goods, the low light shifting', CHAR1, PLAIN),
 # surrogate
 '7e640000-0000-4000-8000-011500000000': ("the woman's face settles into something new as she steps out of the office, her jaw firming and her eyes lifting", CHAR1, CELL),
 '7e640000-0000-4000-8000-030700000000': ('the woman lies still in the plain recovery room, her chest rising and falling once, the flat light holding on the bare wall beside her', CHAR1, CELL),
 '7e640000-0000-4000-8000-090f00000000': ('the phone lies still on the table, its screen staying black, dust drifting slowly through the shifting light', ENV, CELL),
 '7e640000-0000-4000-8000-0904a0000000': ('the phone lies still on the table in soft light, its screen staying black, dust turning slowly in the air above it', ENV, CELL),
 # teacher
 '7e6b0000-0000-4000-8000-0b0800000000': ('chalk dust drifts through the slanted winter sun over the empty desk rows and the washed green board dries to an even sheen', ENV, PLAIN),
 # trucker — all two-handers
 '7e6d0000-0000-4000-8000-030900000000': ('Maksim speaks two words from the office doorway and Arkady nods once behind the desk, the space heater glowing between them', CHAR2, PLAIN),
 '7e6d0000-0000-4000-8000-040600000000': ("Arkady presses the thick envelope into Maksim's hand in the shadow between the trailers and Maksim's fingers close on it", CHAR2, PLAIN),
 '7e6d0000-0000-4000-8000-050300000000': ("Stepanych holds out the enamel cup on its shoelace and Maksim's hand waves it aside, his eyes staying on the parked trucks", CHAR2, PLAIN),
 '7e6d0000-0000-4000-8000-050600000000': ('the two ride on in silence, only the dashboard glow sliding across their faces', CHAR2, PLAIN),
 '7e6d0000-0000-4000-8000-070500000000': ('Maksim pulls himself into the cab and clicks the belt across his chest while Stepanych watches him settle', CHAR2, PLAIN),
 # webcam
 '7e650000-0000-4000-8000-0a0600000000': ('cold daylight shifts along the ordinary street and dust drifts across the pavement, the doorways staying shut', ENV, CELL),
 '7e650000-0000-4000-8000-0a0e00000000': ('the dead monitor stays black in the dark bedroom, dust drifting through the faint light from the window', ENV, CELL),
 '7e650000-0000-4000-8000-070900000000': ('the woman studies her own face in the ring light, her eyes moving over it and her mouth tightening', CHAR1, CELL),
 '7e650000-0000-4000-8000-080500000000': ('the ruined woman speaks quietly, her lips moving and her eyes staying level, her shoulders settling', CHAR1, CELL),
 '7e650000-0000-4000-8000-090700000000': ("the mother's mouth opens and stays open a moment before she looks away from her child", CHAR1, CELL),
}


def main(mode):
    cx = psycopg2.connect(mig._dsn()); cx.autocommit = False
    cur = cx.cursor()
    bad = 0
    for sid, (motion, lock, ill) in FIXES.items():
        new = f'{motion}, ' + lock.format(ill=ill)
        if mig.NEG_RE.search(new):
            print(f'REFUSED (negation in the new text): {sid} :: {new[:80]}'); bad += 1; continue
        cur.execute('SELECT "shotCode", "promptFields" FROM shots WHERE id = %s', (sid,))
        row = cur.fetchone()
        if not row:
            print(f'MISSING shot {sid}'); bad += 1; continue
        code, pf = row[0], row[1] or {}
        old = (pf.get('motionPrompt') or '').strip()
        print(f'=== {code}\n--- OLD\n{old}\n--- NEW\n{new}\n')
        if mode == 'apply':
            pf.setdefault('motionPromptPreWan22', old)
            pf['motionPrompt'] = new
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))
    if bad:
        cx.rollback(); raise SystemExit(f'{bad} problem(s) — nothing written')
    if mode == 'apply':
        cx.commit(); print(f'committed {len(FIXES)} rows')
    else:
        cx.rollback(); print(f'dry run — {len(FIXES)} rows would change')


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('preview', 'apply'):
        raise SystemExit(__doc__)
    main(sys.argv[1])
