#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Give a project labels the Qwen VL encoder can use (+ seller: style force).

TWO defects, both diagnosed on 2026-08-01 from the renders the user rejected.

1. LABELS. `Character.displayName` and `Prop.name` go VERBATIM into the composed
   instruction — `Picture 1 is <displayName>.` / `Keep <propName> exactly as in
   its reference picture.` The convention (see `car_flipper`, `caregiver`, both
   clean) is a bare Latin given name. `seller` instead carries Cyrillic
   descriptive phrases on all 9 characters and all 6 props: «Даша, дочь»,
   «Детская кофта с принтом». A 7B VL encoder reads that noun phrase as extra
   DESCRIPTION competing with promptBase, not as a name binding a picture.

2. STYLE FORCE. On the anchored path the baked style block is stripped from the
   positive and replaced by one trigger phrase, so the whole look rests on the
   RealComic LoRA. Its 0.5 was chosen in an A/B where `qwenReferenceLatents` was
   ON and the anchor carried the other half of the style. That channel was turned
   OFF for `seller` on 2026-08-01 to stop characters being pasted from their
   anchors — which left the style at half strength with nothing making up the
   difference. On a young-girl subject (the strongest anime attractor there is)
   that is where the anime came from. 0.5 -> 0.8.

Run per project: the mapping tables below are keyed by slug.

Usage:  python scripts/_fix_qwen_labels_seller.py <slug> preview
        python scripts/_fix_qwen_labels_seller.py <slug> apply
"""
import io
import os
import sys

import psycopg2
import psycopg2.extras

# Bare Latin given name — the role ("дочь", "юрист") lives in the screenplay and
# in promptBase, not in the picture binding.
CHARACTERS = {}
PROPS = {}
LORA = {}

CHARACTERS['seller'] = {
    'ANDREY': 'Andrey',
    'DASHA':  'Dasha',
    'DENIS':  'Denis',
    'KATYA':  'Katya',
    'LENA':   'Lena',
    'LUDA':   'Luda',
    'OKSANA': 'Oksana',
    'RITA':   'Rita',
    'SVETA':  'Sveta',
}

# Short English noun phrase. It reads as a label in the instruction and still
# reads fine in the UI next to the prop's CODE.
PROPS['seller'] = {
    'CAR':     'the grey hatchback',
    'HOODIE':  'the pink hoodie',
    'LABEL':   'the paper label',
    'MACHINE': 'the sewing machine',
    'PALLET':  'the wrapped pallet',
    'TRIPOD':  'the phone stand',
}

# seller: the 0.8 experiment failed (2026-08-01 evening) — with the pixel channel
# OFF the VL channel alone cannot hold face or drawing style and renders went
# anime. qwenReferenceLatents is back ON and strengthModel back at the tuned 0.5,
# same as every other realcomic_qwen project. Labels only from here on.

# `station` keeps qwenReferenceLatents ON, so its 0.5 is still correct - labels only.
# Brand names are dropped from the labels on purpose: this film does not name
# firms, and a brand in a picture binding is exactly where it would get drawn.
CHARACTERS['station'] = {
    'ARTEM':      'Artem',
    'BREADMAN':   'the bread driver',
    'CRUISERMAN': 'the SUV owner',
    'FARMER':     'the farmer',
    'FATHER':     'the father',
    'ILDAR':      'Ildar',
    'KOSTYA':     'Kostya',
    'LYOHA':      'Lyoha',
    'SERGEICH':   'Sergeich',
    'TAMARA':     'Tamara',
    'TAXI':       'Valera',
    'VERA':       'Vera',
    'YURI':       'Yuri',
}
PROPS['station'] = {
    'CAMRY':   'the silver sedan',
    'COMBINE': 'the combine harvester',
    'CRETA':   'the blue crossover',
    'CRUISER': 'the black SUV',
    'GAZELLE': 'the white box van',
    'GRANTA':  'the taxi',
    'PATRIOT': 'the green off-roader',
    'TANKER':  'the fuel tanker',
    'ZHIGUL':  'the cherry-red sedan',
}


def _dsn() -> str:
    env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    url = None
    if os.path.exists(env):
        with io.open(env, encoding='utf-8') as fh:
            for line in fh:
                if line.startswith('DATABASE_URL'):
                    url = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break
    if not url:
        raise SystemExit('DATABASE_URL not found in gen-studio/.env')
    return url.split('?')[0]


def main() -> int:
    slug = sys.argv[1] if len(sys.argv) > 1 else ''
    mode = sys.argv[2] if len(sys.argv) > 2 else 'preview'
    if slug not in CHARACTERS or mode not in ('preview', 'apply'):
        print(__doc__)
        return 2
    apply = mode == 'apply'

    conn = psycopg2.connect(_dsn())
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    chars_map, props_map = CHARACTERS[slug], PROPS[slug]
    cur.execute('SELECT id, settings FROM projects WHERE slug = %s', (slug,))
    proj = cur.fetchone()
    if not proj:
        print(f'!! project {slug} not found')
        return 1
    pid = proj['id']

    # ── 1a. characters ────────────────────────────────────────────────────────
    cur.execute(
        '''SELECT c.id, c.code, c."displayName"
           FROM characters c
           JOIN project_characters pc ON pc."characterId" = c.id
           WHERE pc."projectId" = %s ORDER BY c.code''',
        (pid,),
    )
    rows = cur.fetchall()
    print(f'1a. characters ({len(rows)})')
    n_c = 0
    for r in rows:
        want = chars_map.get(r['code'])
        if not want:
            print(f'   !! {r["code"]}: no mapping, skipped'); continue
        if r['displayName'] == want:
            continue
        print(f'   {r["code"]:8} «{r["displayName"]}» -> «{want}»')
        n_c += 1
        if apply:
            cur.execute('UPDATE characters SET "displayName" = %s WHERE id = %s', (want, r['id']))

    # ── 1b. props ─────────────────────────────────────────────────────────────
    cur.execute('SELECT id, code, name FROM props WHERE "projectId" = %s ORDER BY code', (pid,))
    rows = cur.fetchall()
    print(f'\n1b. props ({len(rows)})')
    n_p = 0
    for r in rows:
        want = props_map.get(r['code'])
        if not want:
            print(f'   !! {r["code"]}: no mapping, skipped'); continue
        if r['name'] == want:
            continue
        print(f'   {r["code"]:8} «{r["name"]}» -> «{want}»')
        n_p += 1
        if apply:
            cur.execute('UPDATE props SET name = %s, "updatedAt" = now() WHERE id = %s', (want, r['id']))

    # ── 2. style LoRA strength ────────────────────────────────────────────────
    # Only projects whose pixel channel is OFF need the LoRA raised — with the
    # anchor carrying half the style, 0.5 is still the tuned value.
    target = LORA.get(slug)
    settings = proj['settings'] or {}
    cur_strength = (settings.get('styleLora') or {}).get('strengthModel')
    print(f'\n2. RealComic LoRA strength: {cur_strength} -> {target if target else "не трогаем"}')
    if apply and target and cur_strength != target:
        cur.execute(
            '''UPDATE projects
               SET settings = jsonb_set(settings, '{styleLora,strengthModel}', %s::jsonb)
               WHERE id = %s''',
            (str(target), pid),
        )

    if apply:
        conn.commit()
        print(f'\nCOMMITTED — {n_c} characters, {n_p} props, lora={target or "unchanged"}')
    else:
        conn.rollback()
        print('\n(preview — nothing written; re-run with `apply`)')

    cur.close()
    conn.close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
