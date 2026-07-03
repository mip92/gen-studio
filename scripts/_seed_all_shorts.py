"""
Batch: give EVERY project a shorts plan + shorts descriptions.

For each project (that doesn't already have a hand-made plan) it:
  1. picks 3 teaser shorts from the DB by act — hook = first scene, mid = the
     middle act with the most iconic shots, finale = last scene (≤6 shots each,
     iconic first, play order) — and writes scripts/<slug>_shorts_plan.json;
  2. generates per-short YouTube packaging (title / descBefore / descAfter / tags)
     grounded in each short's own opening narration, and merges it into
     Project.settings.youtube.shorts (preserving settings.youtube.main).

These are editable drafts (refine in the Шорты tab). Idempotent: a project that
already has scripts/<slug>_shorts_plan.json is skipped (e.g. painter).

  python scripts/_seed_all_shorts.py            # all projects
  python scripts/_seed_all_shorts.py <slug> ... # only these
"""
import json, os, re, sys
import psycopg2, psycopg2.extras

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

DB = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")

MAX_PER_SHORT = 6
MIN_PER_SHORT = 3

# Projects with hand-made shorts we must never overwrite when re-running.
PRESERVE = {"painter"}

# Per-short archetype: (slug, title, emoji tail already in title).
ARCHETYPES = {
    "hook":   "С ЭТОГО ВСЁ НАЧАЛОСЬ 👀",
    "mid":    "ВОТ ЧТО ПРОИЗОШЛО ДАЛЬШЕ 💔",
    "finale": "ЧЕМ ВСЁ ЗАКОНЧИЛОСЬ 🥀",
}


def role_of(name: str) -> str:
    """'ТЫ — Маляр. И это вся твоя жизнь.' -> 'Маляр'; else the name's first clause."""
    m = re.match(r"^\s*ТЫ\s*[—-]\s*([^.．]+)", name)
    if m:
        return m.group(1).strip()
    return re.split(r"[.．]", name)[0].strip()


def clean_hook(narr: str, limit: int = 180) -> str:
    """Turn a VO line into a teaser hook: strip f5 stress-marks (+), trim to a
    word boundary, capitalise the first letter."""
    t = (narr or "").replace("+", "")   # f5/RUAccent stress mark — never show it
    t = " ".join(t.split())
    if not t:
        return ""
    if len(t) > limit:
        t = t[:limit].rsplit(" ", 1)[0].rstrip(" ,;:—-") + "…"
    return t[0].upper() + t[1:]


def fill_tags(pool, limit=500):
    out = []
    for t in pool:
        if len(", ".join(out + [t])) <= limit:
            out.append(t)
    return out


def build_shorts_for_scenes(scenes_sorted):
    """scenes_sorted: list of (sortOrder, sceneKey, [ (code, iconic, narr) ]).
    Returns ordered list of (archetype, sceneKey, [shots]) — 1..3 shorts."""
    def pick(shots):
        iconic = [s for s in shots if s[1]]
        rest   = [s for s in shots if not s[1]]
        chosen = (iconic + rest)[:MAX_PER_SHORT] if len(iconic) < MAX_PER_SHORT else iconic[:MAX_PER_SHORT]
        # keep play order among the chosen
        chosen_codes = {c[0] for c in chosen}
        ordered = [s for s in shots if s[0] in chosen_codes]
        return ordered

    n = len(scenes_sorted)
    if n == 0:
        return []
    if n == 1:
        return [("hook", scenes_sorted[0][1], pick(scenes_sorted[0][2]))]
    if n == 2:
        return [
            ("hook",   scenes_sorted[0][1], pick(scenes_sorted[0][2])),
            ("finale", scenes_sorted[1][1], pick(scenes_sorted[1][2])),
        ]
    # 3+ scenes: hook=first, finale=last, mid=middle act with most iconic
    middle = scenes_sorted[1:-1]
    mid = max(middle, key=lambda s: (sum(1 for x in s[2] if x[1]), s[0]))
    out = [
        ("hook",   scenes_sorted[0][1],  pick(scenes_sorted[0][2])),
        ("mid",    mid[1],               pick(mid[2])),
        ("finale", scenes_sorted[-1][1], pick(scenes_sorted[-1][2])),
    ]
    return [o for o in out if len(o[2]) >= 1]


def main():
    only = set(sys.argv[1:])
    conn = psycopg2.connect(**DB)
    conn.set_client_encoding("UTF8")
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute('SELECT id, slug, name, "youtubeUrl", settings FROM projects ORDER BY slug')
    projects = {r["slug"]: r for r in cur.fetchall()}

    cur.execute(
        '''SELECT p.slug, sc."sortOrder" AS sort, sc."sceneKey" AS scene_key,
                  sh."shotCode" AS code, sh."isIconic" AS iconic,
                  coalesce(sh."narrationText",'') AS narr
           FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id JOIN projects p ON sh."projectId"=p.id
           ORDER BY p.slug, sc."sortOrder", sh."shotCode"'''
    )
    by_project = {}
    for r in cur.fetchall():
        by_project.setdefault(r["slug"], {}).setdefault(
            (r["sort"], r["scene_key"]), []
        ).append((r["code"], r["iconic"], r["narr"]))

    done, skipped = [], []
    for slug, proj in projects.items():
        if only and slug not in only:
            continue
        plan_path = os.path.join(SCRIPTS_DIR, f"{slug}_shorts_plan.json")
        if slug in PRESERVE:
            skipped.append(f"{slug} (hand-made, preserved)")
            continue
        scenes = by_project.get(slug)
        if not scenes:
            skipped.append(f"{slug} (no shots)")
            continue

        scenes_sorted = [(k[0], k[1], v) for k, v in sorted(scenes.items())]
        shorts = build_shorts_for_scenes(scenes_sorted)
        if not shorts:
            skipped.append(f"{slug} (no shorts built)")
            continue

        name = proj["name"] or slug
        role = role_of(name)
        is_tabu = bool(re.match(r"^\s*ТЫ\s*[—-]", name))
        role_tag = re.sub(r"[^0-9a-zа-яё]+", "", role.lower())
        genre_hash = ("#иэтовсятвояжизнь " if is_tabu else "") + f"#{role_tag} #shorts"
        tag_pool = ([role.lower()] + (["и это вся твоя жизнь"] if is_tabu else [])
                    + ["shorts", "шортс", "история предостережение", "поучительная история",
                       "грустная история", "до слёз", "реальная история", "истории на ночь",
                       "видео для сна", "озвучка"])
        short_tags = fill_tags(tag_pool)

        plan_shorts = []
        pkg_shorts = {}
        for arch, scene_key, shots in shorts:
            slug_s = arch
            codes = [c for (c, _i, _n) in shots]
            hook = ""
            for (_c, _i, narr) in shots:
                hook = clean_hook(narr)
                if hook:
                    break
            title = ARCHETYPES[arch]
            teaser = (hook + "\n\n") if hook else ""
            desc_before = f"{teaser}Полная история — уже скоро на канале. 🔔 Подпишись, чтобы не пропустить.\n\n{genre_hash}"
            desc_after  = f"{teaser}▶ Полная история: {{{{main_url}}}}\n🔔 Подпишись.\n\n{genre_hash}"

            plan_shorts.append({"slug": slug_s, "title": title, "shots": codes})
            pkg_shorts[slug_s] = {
                "title": title,
                "descBefore": desc_before,
                "descAfter": desc_after,
                "tags": short_tags,
            }

        # 1) write the plan file
        plan = {"project": slug, "fill": "cover", "width": 1080, "height": 1920, "fps": 30,
                "shorts": plan_shorts}
        with open(plan_path, "w", encoding="utf-8") as f:
            json.dump(plan, f, ensure_ascii=False, indent=2)

        # 2) merge packaging into settings.youtube.shorts (preserve .main)
        settings = proj["settings"] or {}
        yt = settings.get("youtube") or {}
        yt.setdefault("main", {"title": "", "description": "", "tags": []})
        yt["shorts"] = {**(yt.get("shorts") or {}), **pkg_shorts}
        settings["youtube"] = yt
        cur.execute("UPDATE projects SET settings = %s::jsonb WHERE id = %s",
                    (json.dumps(settings, ensure_ascii=False), proj["id"]))
        done.append(f"{slug}: {len(plan_shorts)} shorts ({', '.join(s['slug'] for s in plan_shorts)})")

    conn.commit()
    cur.close(); conn.close()
    print("=== DONE ===")
    for d in done:
        print("  +", d)
    print("=== SKIPPED ===")
    for s in skipped:
        print("  -", s)
    print(f"\n{len(done)} projects seeded, {len(skipped)} skipped")


if __name__ == "__main__":
    main()
