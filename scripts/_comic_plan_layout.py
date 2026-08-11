# -*- coding: utf-8 -*-
"""Convert a legacy uniform-grid comic project to TEMPLATE page layout (monotown-style).

Usage:
  python _comic_plan_layout.py <slug> preview   # plan + rewrites, NO db writes
  python _comic_plan_layout.py <slug> apply     # seed comic_pages + shot assignments + prompt rewrites

Mirrors the monotown conventions exactly:
  - style-head composition token per shape (16:9 -> 2.35:1 / 9:16 / 1:1 / 2:3 / 9:20);
  - framing phrase rewritten per (current head, target shape);
  - shots fill template slots in play order; act boundary == page boundary;
  - diversity: no template repeated on adjacent pages or within the previous spread,
    global reuse penalised, tall_page capped at 3 per film.
Idempotent: refuses to run if the project already has comic_pages rows.
"""
import json, os, sys, uuid
import psycopg2

SLUG = sys.argv[1] if len(sys.argv) > 1 else 'hidden_layoff'
MODE = sys.argv[2] if len(sys.argv) > 2 else 'preview'

HERE = os.path.dirname(os.path.abspath(__file__))
TPLS = json.load(open(os.path.join(HERE, 'comic_page_templates.json'), encoding='utf-8'))['templates']
TPL = {t['id']: [s['shape'] for s in sorted(t['slots'], key=lambda s: s['order'])] for t in TPLS}

# pages per act (sums to an even total); key = act size, value = page count
PAGES_FOR_SIZE = {14: 3, 16: 4, 18: 4, 20: 4}
# per-slug parity overrides: {slug: {act sortOrder: page count}}
PAGES_OVERRIDE = {
    'optimizer': {11: 3},  # финал 16 кадров в 3 страницы — крупные панели развязки, итог чётный
}

COMP_TOKEN = {
    'landscape': '16:9 cinematic composition',
    'wide': '2.35:1 widescreen cinematic composition',
    'narrow': 'vertical 9:16 composition',
    'square': 'square 1:1 composition',
    'tall': 'vertical 2:3 portrait composition',
    'tall_page': 'towering 9:20 vertical composition',
}

# cost of putting a shotType into a shape (lower = better fit)
def shape_cost(stype, nchars, shape):
    t = stype or 'MS'
    C = {
        'EWS':    {'wide': 0.0, 'landscape': 0.15, 'square': 0.8, 'tall': 2.5, 'narrow': 2.5, 'tall_page': 4},
        'WS':     {'landscape': 0.2, 'wide': 0.25, 'tall': 0.15, 'narrow': 0.2, 'square': 0.4, 'tall_page': 0.55},
        'MS':     {'landscape': 0.2, 'square': 0.25, 'tall': 0.2, 'narrow': 0.25, 'wide': 1.4, 'tall_page': 2.5},
        'MCU':    {'landscape': 0.2, 'square': 0.2, 'narrow': 0.15, 'tall': 0.3, 'wide': 2.5, 'tall_page': 4},
        'CU':     {'landscape': 0.2, 'square': 0.15, 'narrow': 0.2, 'tall': 0.5, 'wide': 2.5, 'tall_page': 4},
        'ECU':    {'landscape': 0.2, 'square': 0.1, 'narrow': 0.45, 'tall': 0.6, 'wide': 2.2, 'tall_page': 4},
        'INSERT': {'landscape': 0.2, 'square': 0.1, 'narrow': 0.45, 'tall': 0.6, 'wide': 2.2, 'tall_page': 4},
        'POV':    {'landscape': 0.15, 'square': 0.25, 'narrow': 1.0, 'tall': 1.2, 'wide': 2.0, 'tall_page': 4},
        'OTS':    {'landscape': 0.15, 'square': 0.4, 'narrow': 1.0, 'tall': 1.0, 'wide': 1.8, 'tall_page': 4},
        'BACK':   {'landscape': 0.25, 'square': 0.3, 'tall': 0.2, 'narrow': 0.25, 'wide': 2.0, 'tall_page': 0.45},
    }
    base = C.get(t, C['MS'])[shape]
    if shape in ('tall', 'narrow', 'tall_page') and nchars >= 2:
        base += 0.8  # verticals want a single figure
    if t in ('EWS', 'WS') and shape == 'wide' and nchars == 0:
        base -= 0.1  # empty scenery loves the cinema band
    return base

# framing head rewrites: (head -> per-shape replacement); None = keep as is
HEADS = [
    "an extreme wide establishing shot",
    "a wide shot with the whole figure in frame",
    "a wide shot",
    "a medium shot from the knees up",
    "a medium close-up from the chest up",
    "a close-up on the face",
    "an extreme close-up of one small detail",
    "a tight insert shot of a single object filling the frame",
    "a first-person point-of-view shot with only the character's own hands entering the frame",
    "an over-the-shoulder shot past the near person's dark shoulder",
    "a shot from directly behind the figure, the face hidden",
]
def reframe(head, shape):
    if shape in ('landscape', 'square', 'wide'):
        return None  # keep head; square/wide differ only by composition token (per monotown)
    v = {
        "an extreme wide establishing shot": "a wide shot framed vertically",
        "a wide shot with the whole figure in frame": "a full-length shot framed vertically" if shape == 'narrow'
            else ("a full-length shot with the single figure head to toe" if shape == 'tall_page'
                  else "a full-length shot with the figure head to toe"),
        "a wide shot": "a wide shot framed vertically",
        "a medium shot from the knees up": "a medium shot framed vertically",
        "a medium close-up from the chest up": "a medium close-up framed vertically",
        "a close-up on the face": "a close-up on the face framed vertically",
        "an extreme close-up of one small detail": "an extreme close-up framed vertically",
        "a tight insert shot of a single object filling the frame": "a tight insert framed vertically",
        "a first-person point-of-view shot with only the character's own hands entering the frame": None,
        "an over-the-shoulder shot past the near person's dark shoulder": None,
        "a shot from directly behind the figure, the face hidden":
            "a shot from directly behind the figure framed vertically, the face hidden" if shape != 'tall_page'
            else "a full-length shot from directly behind the single figure head to toe, the face hidden",
    }
    return v.get(head)

conn = psycopg2.connect(dbname='gen_studio', user='gen_studio', password='gen_studio', host='localhost')
cur = conn.cursor()
cur.execute("SELECT id FROM projects WHERE slug=%s", (SLUG,))
pid = cur.fetchone()[0]
cur.execute("SELECT count(*) FROM comic_pages WHERE \"projectId\"=%s", (pid,))
if cur.fetchone()[0] > 0:
    print('ABORT: project already has comic_pages'); sys.exit(1)

cur.execute("""
  SELECT sc."sortOrder", s.id, s."shotCode", coalesce(s."shotType",'MS'),
         (SELECT count(*) FROM shot_participants sp WHERE sp."shotId"=s.id),
         s."promptFields"->>'positive'
  FROM shots s JOIN scenes sc ON s."sceneId"=sc.id
  WHERE s."projectId"=%s ORDER BY sc."sortOrder", s."shotCode" """, (pid,))
rows = cur.fetchall()
acts = {}
for so, sid, code, st, nch, pos in rows:
    acts.setdefault(so, []).append(dict(id=sid, code=code, st=st, nch=nch, pos=pos))

# --- beam search per act -----------------------------------------------------
def plan_act(shots, n_pages, global_use, prev_tpls, tall_page_used):
    # state: (idx, pages_list, cost, tp_used); beam over template choices
    beam = [(0, [], 0.0, tall_page_used)]
    for pg in range(n_pages):
        nxt = []
        for idx, pages, cost, tpu in beam:
            remain = len(shots) - idx
            pages_left = n_pages - pg
            for tid, shapes in TPL.items():
                L = len(shapes)
                if L > remain: continue
                rest = remain - L
                if not ((pages_left - 1) * 2 <= rest <= (pages_left - 1) * 7): continue
                c = sum(shape_cost(shots[idx + i]['st'], shots[idx + i]['nch'], sh) for i, sh in enumerate(shapes))
                recent = (prev_tpls + [p[0] for p in pages])[-3:]
                if pages and pages[-1][0] == tid: c += 1.5
                elif tid in recent: c += 0.8
                c += 0.25 * global_use.get(tid, 0)
                if tid == 'classic_6' and global_use.get(tid, 0) + sum(1 for p in pages if p[0] == tid) >= 2:
                    c += 2.0  # the legacy grid look — ration it hard
                ntpu = tpu + shapes.count('tall_page')
                if ntpu > 3: c += 5.0
                elif shapes.count('tall_page') and ntpu <= 2: c -= 0.15
                nxt.append((idx + L, pages + [(tid, idx)], cost + c, ntpu))
        nxt.sort(key=lambda x: x[2])
        beam = nxt[:60]
    done = [b for b in beam if b[0] == len(shots)]
    if not done: raise RuntimeError('no decomposition for act')
    return done[0]

all_pages = []  # (templateId, [shot dicts in slot order])
guse, tp_used, prev_tpls = {}, 0, []
for so in sorted(acts):
    shots = acts[so]
    npg = PAGES_OVERRIDE.get(SLUG, {}).get(so, PAGES_FOR_SIZE[len(shots)])
    _, pages, _, tp_used = plan_act(shots, npg, guse, prev_tpls, tp_used)
    for tid, idx in pages:
        guse[tid] = guse.get(tid, 0) + 1
        all_pages.append((so, tid, shots[idx:idx + len(TPL[tid])]))
    prev_tpls = [p[0] for p in pages]

assert sum(len(p[2]) for p in all_pages) == len(rows), 'coverage mismatch'
assert len(all_pages) % 2 == 0, 'odd page count'

# --- report + rewrites -------------------------------------------------------
shape_count, flagged, rewrites = {}, [], []
for pageIndex, (so, tid, pshots) in enumerate(all_pages):
    for slot, (shape, sh) in enumerate(zip(TPL[tid], pshots)):
        shape_count[shape] = shape_count.get(shape, 0) + 1
        cost = shape_cost(sh['st'], sh['nch'], shape)
        if cost >= 0.7: flagged.append((sh['code'], sh['st'], shape, round(cost, 2)))
        pos = sh['pos']
        new = pos.replace('16:9 cinematic composition', COMP_TOKEN[shape]) if shape != 'landscape' else pos
        head = next((h for h in sorted(HEADS, key=len, reverse=True) if h in new), None)
        if head:
            rep = reframe(head, shape)
            if rep: new = new.replace(head, rep, 1)
        if new != pos: rewrites.append((sh['id'], sh['code'], new))
        sh['assign'] = (pageIndex, tid, slot, shape)

print(f'{SLUG}: pages={len(all_pages)} shots={len(rows)} rewrites={len(rewrites)}')
print('shapes:', dict(sorted(shape_count.items(), key=lambda x: -x[1])))
print('template usage:', dict(sorted(guse.items(), key=lambda x: -x[1])))
print('\nPLAN:')
for i, (so, tid, pshots) in enumerate(all_pages):
    print(f'  p{i:02d} act{so} {tid:20s} {" ".join(s["code"] for s in pshots)}')
print(f'\nHAND-REVIEW ({len(flagged)}):')
for code, st, shape, c in flagged: print(f'  {code} {st} -> {shape} (cost {c})')

if MODE == 'apply':
    for pageIndex, (so, tid, pshots) in enumerate(all_pages):
        pgid = str(uuid.uuid4())
        cur.execute('INSERT INTO comic_pages (id, "projectId", "pageIndex", "templateId", "createdAt", "updatedAt") '
                    'VALUES (%s,%s,%s,%s,now(),now())', (pgid, pid, pageIndex, tid))
        for slot, sh in enumerate(pshots):
            cur.execute('UPDATE shots SET "comicPageId"=%s, "comicSlot"=%s, "comicPanelShape"=%s WHERE id=%s',
                        (pgid, slot, TPL[tid][slot], sh['id']))
    for sid, code, new in rewrites:
        cur.execute('UPDATE shots SET "promptFields"=jsonb_set("promptFields",\'{positive}\', to_jsonb(%s::text)) WHERE id=%s',
                    (new, sid))
    conn.commit()
    print(f'\nAPPLIED: {len(all_pages)} pages, {sum(len(p[2]) for p in all_pages)} assignments, {len(rewrites)} prompt rewrites')
else:
    print('\n(preview only — no DB writes)')
