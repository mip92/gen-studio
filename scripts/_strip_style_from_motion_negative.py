#!/usr/bin/env python3
"""Drop the STYLE axis from `promptFields.motionNegative`.

Why: until 2026-07-30 the negative was never evaluated — the fast i2v path runs
at cfg 1.0 and ComfyUI skips the uncond branch entirely. The «страж» graph turns
cfg up on the first high-noise step, so the negative went live for the first
time, and it turned out to carry four STYLE tokens:

    photoreal, photograph, 3D render, plastic skin

Those were authored for `mode='cfg'` (52 renders in the whole history). On the
guard path the sampler shoves the latent away from "photographic" for exactly
one step and then releases it, and that shove-and-release along the style axis
is what produced the ramping contrast, the 2-second jump and the flicker. The
cast/artifact half of the negative (people, crowd, anime, deformed, warping) is
the half we actually want and is left untouched.

Scope: UNFINISHED projects only (`Project.youtubeUrl IS NULL`). Shipped films are
never re-rendered — same boundary as the 2026-07-30 motion migration.

Usage:  python scripts/_strip_style_from_motion_negative.py preview
        python scripts/_strip_style_from_motion_negative.py apply
"""
import os
import sys

import psycopg2
import psycopg2.extras

def _dsn() -> str:
    """Read DATABASE_URL out of gen-studio/.env — same helper as
    `_migrate_motion_wan22.py`, so no credential is ever hard-coded in a file
    that gets committed (.env is gitignored)."""
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

# Matched case-insensitively against whole comma-separated items, so a token is
# only dropped when it IS the item — never as a substring of a longer phrase.
DROP = {"photoreal", "photograph", "3d render", "plastic skin"}


def strip_style(neg: str) -> str:
    items = [t.strip() for t in neg.split(",")]
    kept = [t for t in items if t and t.lower() not in DROP]
    return ", ".join(kept)


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "preview"
    if mode not in ("preview", "apply"):
        print(__doc__)
        return 2
    apply = mode == "apply"

    conn = psycopg2.connect(_dsn())
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cur.execute(
        '''SELECT s.id, p.slug, s."shotCode", s."promptFields"->>'motionNegative' AS neg
           FROM shots s JOIN projects p ON p.id = s."projectId"
           WHERE p."youtubeUrl" IS NULL
             AND nullif(trim(s."promptFields"->>'motionNegative'), '') IS NOT NULL
           ORDER BY p.slug, s."shotCode" '''
    )
    rows = cur.fetchall()

    per_project: dict[str, int] = {}
    changed = []
    for r in rows:
        new = strip_style(r["neg"])
        if new != r["neg"]:
            changed.append((r["id"], new))
            per_project[r["slug"]] = per_project.get(r["slug"], 0) + 1

    print(f"кадров с негативом в незаконченных проектах: {len(rows)}")
    print(f"будет изменено: {len(changed)}\n")
    for slug in sorted(per_project):
        print(f"  {slug:16} {per_project[slug]:5}")

    if rows:
        sample = next((r for r in rows if strip_style(r["neg"]) != r["neg"]), None)
        if sample:
            print(f"\nпример  {sample['slug']} {sample['shotCode']}")
            print(f"  было:  {sample['neg']}")
            print(f"  стало: {strip_style(sample['neg'])}")

    if apply:
        for shot_id, new in changed:
            cur.execute(
                '''UPDATE shots
                   SET "promptFields" = jsonb_set("promptFields", '{motionNegative}', to_jsonb(%s::text))
                   WHERE id = %s''',
                (new, shot_id),
            )
        conn.commit()
        print(f"\nCOMMITTED — {len(changed)} строк")
    else:
        conn.rollback()
        print("\n(preview — ничего не записано; повторить с `apply`)")

    cur.close()
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
