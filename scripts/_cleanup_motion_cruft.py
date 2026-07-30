#!/usr/bin/env python3
"""Drop the leftovers of the 2026-07-30 Wan-2.2 motion-prompt migration.

Three separate defects, each scoped to a named project list and each printing
its own row count (house rule: an unscoped UPDATE on shotCode has destroyed
three projects before — feedback-scope-updates-by-project):

  1. `promptFields.motionPromptPreWan22` — the pre-migration backup string that
     `_migrate_motion_wan22.py` stashed on every shot it rewrote. The migration
     is verified and shipped, so this is dead weight inside the jsonb.
  2. a DOUBLED cast lock — shots carrying BOTH `the same … figures throughout
     the shot` AND `the frame keeps exactly the figures it already has`. Two
     locks say the same thing twice and put the token *figures* into the
     positive three times, which is the exact failure mode §3 of
     Skill(gen-studio-wan22) exists to avoid. The second clause is the
     interloper; the canonical tail keeps `the same … throughout the shot`.
  3. two genuine negations the migration's `\\mno |\\mwithout ` regex could not
     see, because they are phrased with other negative words.

Usage:  python scripts/_cleanup_motion_cruft.py preview
        python scripts/_cleanup_motion_cruft.py apply
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


SLUGS = ("car_flipper", "caregiver", "station", "seller")

DUP_LOCK = "the frame keeps exactly the figures it already has, "

# shotCode → (exact substring to find, replacement). Hand-authored: turning a
# negation into a positive lock is authoring, not a regex.
NEGATION_FIXES = {
    ("station", "A10_SH17"): (
        "neither figure moves and the bag strap settles",
        "both figures hold completely still and the bag strap settles",
    ),
    ("car_flipper", "A9_SH26"): (
        "his face holds nothing but patience",
        "his face holding only patience",
    ),
}


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "preview"
    if mode not in ("preview", "apply"):
        print(__doc__)
        return 2
    apply = mode == "apply"

    conn = psycopg2.connect(_dsn())
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cur.execute('SELECT id, slug FROM projects WHERE slug = ANY(%s)', (list(SLUGS),))
    projects = {r["slug"]: r["id"] for r in cur.fetchall()}
    missing = set(SLUGS) - set(projects)
    if missing:
        print(f"!! unknown slug(s): {sorted(missing)} — aborting")
        return 1
    pids = list(projects.values())
    print(f"scope: {len(pids)} projects {SLUGS}\n")

    # ── 1. drop the migration backup key ──────────────────────────────────────
    cur.execute(
        '''SELECT count(*) FROM shots
           WHERE "projectId" = ANY(%s) AND "promptFields" ? 'motionPromptPreWan22' ''',
        (pids,),
    )
    n_backup = cur.fetchone()[0]
    print(f"1. motionPromptPreWan22 backup key .......... {n_backup} shots")
    if apply and n_backup:
        cur.execute(
            '''UPDATE shots SET "promptFields" = "promptFields" - 'motionPromptPreWan22'
               WHERE "projectId" = ANY(%s) AND "promptFields" ? 'motionPromptPreWan22' ''',
            (pids,),
        )
        print(f"   -> updated {cur.rowcount}")

    # ── 2. de-duplicate the cast lock ─────────────────────────────────────────
    cur.execute(
        '''SELECT s.id, p.slug, s."shotCode", s."promptFields"->>'motionPrompt' AS mp
           FROM shots s JOIN projects p ON p.id = s."projectId"
           WHERE s."projectId" = ANY(%s)
             AND s."promptFields"->>'motionPrompt' LIKE %s
             AND s."promptFields"->>'motionPrompt' ~ 'the same (single |two |)figures? throughout the shot'
           ORDER BY p.slug, s."shotCode" ''',
        (pids, f"%{DUP_LOCK}%"),
    )
    dups = cur.fetchall()
    print(f"\n2. doubled cast lock ........................ {len(dups)} shots")
    for r in dups:
        new = r["mp"].replace(DUP_LOCK, "")
        print(f"   {r['slug']:12} {r['shotCode']:9} -{len(r['mp']) - len(new)} chars")
        if apply:
            cur.execute(
                '''UPDATE shots
                   SET "promptFields" = jsonb_set("promptFields", '{motionPrompt}', to_jsonb(%s::text))
                   WHERE id = %s''',
                (new, r["id"]),
            )

    # ── 3. hand-fix the two real negations ────────────────────────────────────
    print(f"\n3. leftover negations ....................... {len(NEGATION_FIXES)} shots")
    for (slug, code), (old, new_frag) in NEGATION_FIXES.items():
        cur.execute(
            '''SELECT s.id, s."promptFields"->>'motionPrompt' AS mp
               FROM shots s WHERE s."projectId" = %s AND s."shotCode" = %s''',
            (projects[slug], code),
        )
        row = cur.fetchone()
        if not row:
            print(f"   !! {slug} {code} not found — skipped")
            continue
        if old not in row["mp"]:
            print(f"   !! {slug} {code} phrase already gone — skipped")
            continue
        new = row["mp"].replace(old, new_frag)
        print(f"   {slug:12} {code:9} «{old}» -> «{new_frag}»")
        if apply:
            cur.execute(
                '''UPDATE shots
                   SET "promptFields" = jsonb_set("promptFields", '{motionPrompt}', to_jsonb(%s::text))
                   WHERE id = %s''',
                (new, row["id"]),
            )

    if apply:
        conn.commit()
        print("\nCOMMITTED")
    else:
        conn.rollback()
        print("\n(preview — nothing written; re-run with `apply`)")
    cur.close()
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
