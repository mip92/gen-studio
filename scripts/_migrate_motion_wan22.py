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
  PYTHONIOENCODING=utf-8 python scripts/_migrate_motion_wan22.py apply   cloakroom all
  PYTHONIOENCODING=utf-8 python scripts/_migrate_motion_wan22.py revert  car_flipper

  3rd arg = scope: 'pending' (default, only shots with no completed video) or
  'all' (every shot carrying a legacy tail — no video file is ever touched).
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

# ── Phrase-level negation → positive lock ─────────────────────────────────────
# The older seeding engines did not put a per-shot head in front of the guard —
# for those projects the guard IS the whole motionPrompt (cloakroom 392 shots on
# 2 distinct strings, wall 426 on 2, tiler 398 on 6, …), so there is no tail to
# swap. These rewrite the negation clauses in place instead, wherever they sit.
# Ordered: longest / most specific first, so a broad pattern never eats a
# specific one. Applied case-insensitively.
PHRASES = [
    # ---- "empty scene" family --------------------------------------------------
    (r'an empty still concourse with no people and no figures',
     'the concourse stays deserted, every surface holding its exact position'),
    (r'an empty (?:still )?scene with no people and no figures and no television',
     'the place stays deserted, the cabinet top bare, every surface holding its exact position'),
    (r'an empty (?:still )?scene with no people and no figures',
     'the place stays deserted, every surface and object holding its exact position'),
    (r'an empty kitchen with no people',
     'the kitchen stays deserted'),
    (r'an empty screen with no person shown',
     'the screen stays unattended'),
    # ---- "closed cast" family --------------------------------------------------
    (r'no new people entering, no extra figures appearing',
     'the frame keeps exactly the figures it already has'),
    (r'no new people or figures appearing',
     'the frame keeps exactly the figures it already has'),
    (r'no new people, no extra figures',
     'the frame keeps exactly the figures it already has'),
    (r'the existing group does not change, no new figures enter the frame',
     'the group stays exactly as it is'),
    (r'no new figures enter the frame',
     'the frame keeps exactly the figures it already has'),
    (r'subtle natural motion of only the figure already present(?: in the frame)?',
     'only the figure already in frame moves, with subtle natural motion'),
    (r'only the figure already present in the frame',
     'only the figure already in frame moving'),
    # ---- object-hero inserts ---------------------------------------------------
    (r'no people, no hands, no figures, only the still ',
     'the frame holds only the still '),
    (r'no hand reaches into frame, nobody appears, nothing new enters the shot',
     'the frame stays closed to anything new'),
    # ---- camera negations ------------------------------------------------------
    (r'no camera movement(?:,? no zoom)?(?:,? no pan)?(?:,? no parallax)?(?:,? no dolly)?(?:,? no handheld shake)?',
     'the camera stays locked and fixed'),
    (r'no camera motion(?:,? no parallax)?(?:,? no zoom)?(?:,? no pan)?(?:,? no dolly)?(?:,? no handheld shake)?',
     'the camera stays locked and fixed'),
    # ---- generic last resort ---------------------------------------------------
    (r'no people and no figures',
     'the place stays deserted'),
]
PHRASES = [(re.compile(p, re.I), r) for p, r in PHRASES]


def normalize_negations(text: str) -> str:
    """Rewrite every known negation clause in place, then tidy punctuation."""
    for rx, repl in PHRASES:
        text = rx.sub(repl, text)
    # collapse the debris a substitution can leave behind
    text = re.sub(r',\s*,', ',', text)
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'\.\s*\.', '.', text)
    # a clause that became a duplicate of its neighbour
    text = re.sub(r'(the camera stays locked and fixed)(,\s*\1)+', r'\1', text, flags=re.I)
    return text.strip()


def _style_word(old_tail: str) -> str:
    """Keep the project's own word for the drawing."""
    return 'the cell-shaded illustration' if 'cell-shaded' in old_tail else 'the illustration'


def rewrite(prompt: str):
    """→ (new_prompt, kind) or (None, reason) when nothing safe can be done.

    Two strategies, in order:
      1. the prompt has a per-shot head followed by a known guard tail → swap the
         tail for the positive lock and leave the head byte-identical;
      2. otherwise (the generic-template projects, where the guard IS the whole
         string) → rewrite the negation clauses in place.
    Either way the result is re-checked, and anything still carrying a negation is
    refused rather than half-fixed.
    """
    for marker, kind in MARKERS:
        idx = prompt.find(marker)
        if idx < 0:
            continue
        head, old_tail = prompt[:idx], prompt[idx:]
        ill  = _style_word(old_tail)
        tail = (ENV_LOCK if kind == 'env' else CHAR_LOCK).format(ill=ill)
        new  = head.rstrip().rstrip(',') + tail
        if NEG_RE.search(new):
            # the head itself contains a negation (e.g. "no welcome in it") —
            # a regex has no business deciding what that should become
            return None, 'negation survives in the head — needs manual authoring'
        return new, kind

    new = normalize_negations(prompt)
    if new == prompt:
        return None, 'no known guard tail and no known negation phrase'
    leftover = NEG_RE.search(new)
    if leftover:
        return None, f'negation left after phrase pass: "{leftover.group(0)}"'
    kind = 'env-phrase' if 'stays deserted' in new else 'char-phrase'
    return new, kind


# Scope is NOT gated on renderMode.
#
# The projects still waiting for GPU carry most of their shots as
# renderMode='static' (cloakroom 341, wall 323, fortune 293, …) but their
# motionPrompts are already baked — with the legacy negation tail. They get
# flipped to 'animated' when their turn comes (`POST /projects/<slug>/shots/
# render-mode/animated-prefix`), and would then render under the old system.
#
# Two scopes:
#   default — only shots with NO completed video, so no finished clip is left
#             describing a prompt that no longer exists.
#   'all'   — every shot carrying a legacy tail, rendered or not. This is the
#             user's explicit call (2026-07-30): «то что нагенерённое ничего не
#             удаляй, промпты меняй, если мне не понравится то что было
#             нагенерено не по правилам я перегенерю по новым промптам». No
#             video file is touched either way — only `promptFields`.
SELECT_SQL = '''
SELECT s.id, s."shotCode", coalesce(s."cameraMove", ''), s."promptFields"
FROM shots s JOIN projects p ON p.id = s."projectId"
WHERE p.slug = %s
  AND nullif(trim(s."promptFields"->>'motionPrompt'), '') IS NOT NULL
  AND (%s OR NOT EXISTS (SELECT 1 FROM video_renders v WHERE v."shotId" = s.id AND v.status = 'completed'))
ORDER BY s."shotCode"
'''


def run(mode: str, slug: str, scope: str = 'pending'):
    include_rendered = (scope == 'all')
    cx = psycopg2.connect(_dsn()); cx.autocommit = False
    cur = cx.cursor()
    cur.execute(SELECT_SQL, (slug, include_rendered))
    rows = cur.fetchall()
    if not rows:
        print(f'{slug}: nothing in scope (no baked motionPrompt, or wrong slug)')
        return

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

    print(f'{slug}: {len(rows)} in scope ({scope}), {len(done)} would change, {len(skipped)} skipped')
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
    scope = sys.argv[3] if len(sys.argv) > 3 else 'pending'
    if scope not in ('pending', 'all'):
        raise SystemExit("scope must be 'pending' (default) or 'all'")
    run(sys.argv[1], sys.argv[2], scope)
