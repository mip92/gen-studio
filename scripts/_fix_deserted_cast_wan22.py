# -*- coding: utf-8 -*-
"""Fix env shots whose lock claims an empty place while the frame is full of people.

The env positive lock is `the place stays deserted, every surface and object holding
its exact position, only air and light in motion` — a strong anti-hallucination
statement, and the right one for a genuinely empty frame. But some env-framed shots
ARE about a crowd: coffee's whole success arc is queues at a window. Telling Wan
that a frame with a queue in it stays deserted is a contradiction, and it resolves
it by erasing or melting the queue.

So for shots whose own text names a collective of people, the lock is swapped for a
cast-neutral one that says the same thing about invention without asserting
emptiness. Only collective nouns are matched (queue, crowd, customers, passers-by,
pedestrians, shoppers, commuters, people) — singular «woman/man/girl» is skipped on
purpose, because in this corpus it is usually a possessive («an elderly woman's
bedroom») or a depicted image («a framed photograph of a girl»), where the deserted
lock is correct and stronger.

Skill(gen-studio-wan22) §3. Finished films (Project.youtubeUrl set) are left alone.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/_fix_deserted_cast_wan22.py preview
  PYTHONIOENCODING=utf-8 python scripts/_fix_deserted_cast_wan22.py apply
"""
import sys, os, re, json, psycopg2
import importlib.util

_here = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('mig', os.path.join(_here, '_migrate_motion_wan22.py'))
mig = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(mig)

OLD_LOCK = 'the place stays deserted, every surface and object holding its exact position, only air and light in motion'
NEW_LOCK = ('the frame keeps exactly the figures it already has, everything else holding its exact position, '
            'only air and light moving besides them')

CROWD = re.compile(r'\b(queues?|crowd|customers|passers-by|pedestrians|shoppers|commuters|people)\b', re.I)

SQL = '''
SELECT s.id, p.slug, s."shotCode", s."promptFields"
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE nullif(trim(p."youtubeUrl"), '') IS NULL
  AND s."promptFields"->>'motionPrompt' LIKE %s
ORDER BY p.slug, s."shotCode"
'''


def main(mode):
    cx = psycopg2.connect(mig._dsn()); cx.autocommit = False
    cur = cx.cursor()
    cur.execute(SQL, ('%' + OLD_LOCK + '%',))
    changed = 0
    for sid, slug, code, pf in cur.fetchall():
        pf = pf or {}
        old = (pf.get('motionPrompt') or '').strip()
        head = old.split(', ' + OLD_LOCK)[0]
        if not CROWD.search(head):
            continue
        new = old.replace(OLD_LOCK, NEW_LOCK)
        if mig.NEG_RE.search(new):
            print(f'REFUSED {slug} {code}: negation in result'); continue
        print(f'{slug} {code}\n  {new}\n')
        changed += 1
        if mode == 'apply':
            pf.setdefault('motionPromptPreWan22', old)   # never clobber an existing backup
            pf['motionPrompt'] = new
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))
    if mode == 'apply':
        cx.commit(); print(f'committed {changed} rows')
    else:
        cx.rollback(); print(f'dry run — {changed} rows would change')


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('preview', 'apply'):
        raise SystemExit(__doc__)
    main(sys.argv[1])
