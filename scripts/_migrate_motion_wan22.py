# -*- coding: utf-8 -*-
"""Rewrite the negation guard tail of a project's motionPrompt corpus into the
positive-lock form required by Skill(gen-studio-wan22) §3.

WHY
  The default i2v path runs at cfg=1.0, where the negative prompt is
  mathematically inert — the positive `motionPrompt` is the ONLY text that
  reaches Wan. Every seeding engine appended a guard tail built out of negations
  ("an empty still scene with no people and no figures", "no new people
  entering, no extra figures appearing"), which hands the token *people* to a
  model we are trying to keep a frame empty. Measured 2026-07-30: 5 662 of 5 671
  animated shots carried such a tail.

WHAT THIS DOES
  Replaces ONLY the trailing guard clause with the positive-lock tail already in
  use by the two projects that were seeded correctly (`station`, `seller`). The
  head of the prompt — the per-shot text before the guard — is left byte-identical,
  so this migration is mechanical and reviewable. Making the head itself obey the
  `Motion + Camera movement` formula (§2) is an authoring pass, not a script.

WHAT THIS DOES NOT DO
  - It does not inject a camera clause. `video-render.service.ts` derives that at
    dispatch from `Shot.cameraMove` (CAMERA_CLAUSE), so the text stays free of a
    second source of truth.
  - It never touches a shot that already has a completed video render — changing
    the prompt would make that clip stale (feedback-rework-invalidate-stale-renders).
  - It never touches `motionNegative`: inert at cfg=1, and correct as-is for the
    `mode='cfg'` path.

SAFETY
  - `apply` requires an explicit project slug; there is no "all projects" mode
    (feedback-scope-updates-by-project — an unscoped UPDATE has destroyed three
    projects before).
  - The previous string is preserved at `promptFields.motionPromptPreWan22`, so
    every row is individually revertable.
  - Rows whose guard tail is not recognised are SKIPPED and listed, never guessed at.

USAGE
  PYTHONIOENCODING=utf-8 python scripts/_migrate_motion_wan22.py preview car_flipper
  PYTHONIOENCODING=utf-8 python scripts/_migrate_motion_wan22.py apply   car_flipper
  PYTHONIOENCODING=utf-8 python scripts/_migrate_motion_wan22.py revert  car_flipper
"""
import sys, os, re, json, psycopg2

# ── DB connection, read from .env like the rest of the backend ────────────────
def _dsn():
    env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    url = None
    if os.path.exists(env):
        with open(env, encoding='utf-8') as fh:
            for line in fh:
                if line.startswith('DATABASE_URL'):
                    url = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break
    if not url:
        raise SystemExit('DATABASE_URL not found in gen-studio/.env')
    return url.split('?')[0]

# ── The guard tails written by the seeding engines, longest-first ─────────────
# Each entry: (marker that starts the guard, 'env' | 'char')
# The marker is matched literally; anything from it to the end of the string is
# the guard and gets replaced.
MARKERS = [
    (', with only ambient environmental motion',                       'env'),
    (', subtle natural motion of only the figures already present in the frame', 'char'),
    (', subtle natural motion of only the figure already present in the frame',  'char'),
    (', the moment continuing naturally, subtle breathing',            'char'),
]

# ── Positive-lock tails, copied verbatim from station/seller ──────────────────
# `{ill}` is the project's own style word for the drawing, preserved from the old
# tail so a cell-shaded project stays cell-shaded.
ENV_LOCK  = (', the place stays deserted, every surface and object holding its exact position, '
             'only air and light in motion, {ill} barely coming to life, hand-drawn animation cadence')
# Neutral on head-count on purpose: the old plural guard ("only the figures
# already present") was engine boilerplate, not a real count, so asserting
# "single" or "two" here would be inventing a fact. Prefer the explicit
# "the same single figure throughout the shot" / "the same two figures ..." when
# authoring by hand and the count is actually known (§3).
CHAR_LOCK = (', the frame keeps exactly the figures it already has, breathing and small weight '
             'shifts only, the rest of the frame holding still, {ill} in motion, '
             'hand-drawn animation cadence')

NEG_RE = re.compile(r'\b(no|without)\s+\w+', re.I)


def _style_word(old_tail: str) -> str:
    """Keep the project's own word for the drawing."""
    return 'the cell-shaded illustration' if 'cell-shaded' in old_tail else 'the illustration'


def rewrite(prompt: str):
    """→ (new_prompt, kind) or (None, reason) when the guard is unrecognised."""
    for marker, kind in MARKERS:
        idx = prompt.find(marker)
        if idx < 0:
            continue
        head, old_tail = prompt[:idx], prompt[idx:]
        ill  = _style_word(old_tail)
        tail = (ENV_LOCK if kind == 'env' else CHAR_LOCK).format(ill=ill)
        new  = head.rstrip().rstrip(',') + tail
        if NEG_RE.search(new):
            return None, 'negation survives in the head — needs manual authoring'
        return new, kind
    return None, 'no known guard tail'


SELECT_SQL = '''
SELECT s.id, s."shotCode", coalesce(s."cameraMove", ''), s."promptFields"
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE p.slug = %s
  AND s."renderMode" = 'animated'
  AND nullif(trim(s."promptFields"->>'motionPrompt'), '') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM video_renders v WHERE v."shotId" = s.id AND v.status = 'completed')
ORDER BY s."shotCode"
'''


def run(mode: str, slug: str):
    cx = psycopg2.connect(_dsn()); cx.autocommit = False
    cur = cx.cursor()
    cur.execute(SELECT_SQL, (slug,))
    rows = cur.fetchall()
    if not rows:
        raise SystemExit(f'{slug}: no rewritable animated shots (all rendered already, or wrong slug)')

    done, skipped, reverted = [], [], []
    for sid, code, cam, pf in rows:
        pf = pf or {}
        old = (pf.get('motionPrompt') or '').strip()

        if mode == 'revert':
            prev = pf.get('motionPromptPreWan22')
            if not prev:
                continue
            pf['motionPrompt'] = prev
            pf.pop('motionPromptPreWan22', None)
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))
            reverted.append(code)
            continue

        new, kind = rewrite(old)
        if new is None:
            skipped.append((code, kind, old[:90]))
            continue
        done.append((code, cam, kind, old, new))
        if mode == 'apply':
            # Preserve the previous string so every row stays individually revertable.
            pf.setdefault('motionPromptPreWan22', old)
            pf['motionPrompt'] = new
            cur.execute('UPDATE shots SET "promptFields" = %s WHERE id = %s', (json.dumps(pf), sid))

    if mode == 'revert':
        print(f'{slug}: reverting {len(reverted)} shots')
        cx.commit(); print('committed'); return

    print(f'{slug}: {len(rows)} rewritable shots, {len(done)} would change, {len(skipped)} skipped')
    words_before = sum(len(o.split()) for _, _, _, o, _ in done) / max(1, len(done))
    words_after  = sum(len(n.split()) for _, _, _, _, n in done) / max(1, len(done))
    print(f'  avg words {words_before:.1f} -> {words_after:.1f}')
    envs = sum(1 for r in done if r[2] == 'env'); print(f'  env tails {envs}, char tails {len(done) - envs}')
    if skipped:
        print('  SKIPPED (left untouched, need manual authoring):')
        for code, why, head in skipped[:20]:
            print(f'    {code}: {why} :: {head}...')
        if len(skipped) > 20:
            print(f'    ... and {len(skipped) - 20} more')

    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       f'tmp_motion_wan22_{slug}.txt')
    with open(out, 'w', encoding='utf-8') as fh:
        for code, cam, kind, o, n in done:
            fh.write(f'=== {code}  [cameraMove={cam or "-"}, {kind}]\n--- OLD\n{o}\n--- NEW\n{n}\n\n')
    print(f'  full before/after written to {out}')

    if mode == 'apply':
        cx.commit(); print(f'committed {len(done)} rows')
    else:
        cx.rollback(); print('dry run — nothing written')


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('preview', 'apply', 'revert'):
        raise SystemExit(__doc__)
    run(sys.argv[1], sys.argv[2])
