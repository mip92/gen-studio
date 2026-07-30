# -*- coding: utf-8 -*-
"""Two completeness gaps found by auditing the motion corpus for stunted prompts.

Nothing here is about truncation — no prompt in the corpus is cut (0 end on a comma,
0 on a preposition, 0 with doubled punctuation, all 3 997 end with their style
cadence). These are two places where a prompt is grammatically whole but
informationally incomplete.

GAP A — a lock that never closes the cast (8 shots: seller 3, station 5).
Their tail reads «breathing and small weight shifts only, the rest of the frame
holding still, …» — it locks the surroundings but never says the cast is closed,
which is the clause that actually keeps extra figures out at cfg=1. The neutral
closed-cast statement is inserted in front of it.

GAP B — a motion clause that is not motion (21 shots across donor, shuttle,
surrogate, webcam). These projects only ever got the mechanical tail migration, so
their heads are whatever the old engine baked: abstractions («the woman absorbing
the irreversible loss», «the mother unable to answer, ashamed») or static noun
phrases («a wall calendar with a birthday circled», «frost feathering an empty
stall counter»). Wan answers an abstraction by inventing motion, and a noun phrase
by inventing a camera move — Skill(gen-studio-wan22) §5. Each is rewritten into what
physically moves. The lock tail is preserved untouched.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/_fix_prompt_completeness_wan22.py preview
  PYTHONIOENCODING=utf-8 python scripts/_fix_prompt_completeness_wan22.py apply
"""
import sys, os, re, json, psycopg2
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('mig', os.path.join(_here, '_migrate_motion_wan22.py'))
mig = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(mig)

CAST = 'the frame keeps exactly the figures it already has, '
PARTIAL_LOCK = ', breathing and small weight shifts only'
CAST_MARKERS = ('keeps exactly the figures', 'same single figure', 'same two figures',
                'hands already in frame', 'stays deserted')

# (slug, shotCode) -> authored motion clause. What is deliberately absent: any
# camera wording (derived from Shot.cameraMove) and any negation.
CLAUSES = {
 ('donor', 'A4_SH03'):     "the woman's eyes stay level as she listens and her jaw sets, one slow blink crossing her face",
 ('donor', 'A4_SH21'):     'thin haze drifts over the rooftops and the light shifts slowly across the aerials and water tanks',
 ('donor', 'A5_SH05'):     "the woman's face softens, her eyes moving once and her mouth easing into the beginning of a smile",
 ('donor', 'A8_SH14'):     "the woman's face stills as it lands, her eyes widening a fraction and her lips parting",
 ('donor', 'A8_SH16'):     "the woman's shoulders shake once and a tear runs down her cheek, her breath catching",
 ('donor', 'A9_SH19'):     "the older woman's hands settle in her lap and her chest rises once, her eyes staying on the middle distance",
 ('shuttle', 'A4_SH07B'):  'frost creeps a little further across the empty counter and a breath of air stirs the loose dust on it',
 ('shuttle', 'A4_SZ51'):   'the strung holiday lights sway and blink in turn above the shuttered row',
 ('shuttle', 'A7_SH08'):   'the two hands close and shake twice over the stacked boxes and then release',
 ('surrogate', 'A10_SH12'): "the son's mouth moves through the quiet question and his eyes stay fixed on her",
 ('surrogate', 'A10_SH13'): "the mother's lips part and close again and her eyes drop away, her shoulders sinking",
 ('surrogate', 'A11_SH05'): "the woman's lips move through the count and her fingers lift one after another",
 ('surrogate', 'A7_SH05'):  'the coordinator leans in a little as she talks and her hand turns palm-up on the table',
 ('surrogate', 'A9_SH04'):  'the lightbox glow pulses faintly and the clipped scan sheets lift a little at their corners',
 ('surrogate', 'A9_SH06'):  "the woman's face holds still as it settles, one slow blink and her chest rising once",
 ('webcam', 'A11_SH03'):    'the finger presses the ring-light switch down and the glow fades out around it',
 ('webcam', 'A2_SH07'):     "the manager's hand flicks twice towards the dashboards as he talks, the screen light shifting on his sleeve",
 ('webcam', 'A3_SH15'):     'a hanger swings where something was pulled out and the packed clothes settle against each other',
 ('webcam', 'A5_SH06'):     "the woman's eyes drop and her mouth tightens, her breath going out slowly",
 ('webcam', 'A5_SH13'):     'the calendar page lifts and settles in a draught and light creeps across the circled date',
}

LOCK_STARTS = (', the place stays deserted', ', the frame keeps exactly the figures it already has',
               ', the same single figure throughout', ', the same two figures throughout',
               ', only the hands already in frame move', PARTIAL_LOCK)


def split_lock(prompt):
    for marker in LOCK_STARTS:
        i = prompt.find(marker)
        if i >= 0:
            return prompt[:i], prompt[i:]
    return prompt, ''


def main(mode):
    cx = psycopg2.connect(mig._dsn()); cx.autocommit = False
    cur = cx.cursor()
    fixed_a = fixed_b = 0

    # ── GAP A ──────────────────────────────────────────────────────────────────
    cur.execute('''SELECT s.id, p.slug, s."shotCode", s."promptFields"
                   FROM shots s JOIN projects p ON p.id = s."projectId"
                   WHERE nullif(trim(p."youtubeUrl"),'') IS NULL
                     AND s."promptFields"->>'motionPrompt' LIKE %s''', ('%' + PARTIAL_LOCK + '%',))
    for sid, slug, code, pf in cur.fetchall():
        pf = pf or {}
        old = (pf.get('motionPrompt') or '').strip()
        if any(mk in old for mk in CAST_MARKERS):
            continue                                    # already has a closed cast
        new = old.replace(PARTIAL_LOCK, ', ' + CAST.rstrip(', ') + PARTIAL_LOCK, 1)
        print(f'[A] {slug} {code}\n    {new}\n')
        fixed_a += 1
        if mode == 'apply':
            pf.setdefault('motionPromptPreCompleteness', old)
            pf['motionPrompt'] = new
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))

    # ── GAP B ──────────────────────────────────────────────────────────────────
    for (slug, code), clause in CLAUSES.items():
        if mig.NEG_RE.search(clause) or re.search(r'camera|handheld|point of view', clause, re.I):
            print(f'[B] REFUSED {slug} {code}: negation or camera wording in the clause'); continue
        cur.execute('''SELECT s.id, s."promptFields" FROM shots s JOIN projects p ON p.id = s."projectId"
                       WHERE p.slug = %s AND s."shotCode" = %s''', (slug, code))
        row = cur.fetchone()
        if not row:
            print(f'[B] MISSING {slug} {code}'); continue
        sid, pf = row[0], row[1] or {}
        old = (pf.get('motionPrompt') or '').strip()
        _head, lock = split_lock(old)
        if not lock:
            print(f'[B] SKIP {slug} {code}: no recognised lock tail'); continue
        new = clause.rstrip().rstrip(',') + lock
        print(f'[B] {slug} {code}  ({len(clause.split())} words of motion)\n    OLD {_head}\n    NEW {clause}\n')
        fixed_b += 1
        if mode == 'apply':
            pf.setdefault('motionPromptPreCompleteness', old)
            pf['motionPrompt'] = new
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))

    print(f'gap A (cast clause inserted): {fixed_a}   gap B (motion authored): {fixed_b}')
    if mode == 'apply':
        cx.commit(); print('committed')
    else:
        cx.rollback(); print('dry run — nothing written')


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('preview', 'apply'):
        raise SystemExit(__doc__)
    main(sys.argv[1])
