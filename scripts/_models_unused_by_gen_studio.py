"""Which model files on disk are referenced by gen-studio, and which are not.

Three sources are checked, and all three matter — the first pass of this audit
only looked at the first two and would have called a live model dead:

  1. every workflow JSON under data/**/comfy/  (the graphs actually dispatched)
  2. every hardcoded filename in src/**/*.ts   (env defaults live there)
  3. the DATABASE — `projects.settings.styleLora / anchorStyleLora /
     fluxBaseModel` and `character_profiles.loraPath`. A project can point at a
     LoRA that appears in no file at all.

Trained per-character LoRAs under models/loras/gen-studio/** are always kept:
they are our own training output, not something that was downloaded.

So is anything in KEEP_PATTERNS — models a wired-up engine will load but whose
name does not appear in any file or row YET. Without that list this script would
call a freshly downloaded 47 GB stack dead the moment it finished landing, which
is exactly when it looks most disposable.

Prints a report. Deletes nothing — pass the list to whatever removes files, so
that the decision and the deletion stay separate steps.

    python scripts/_models_unused_by_gen_studio.py
"""
import json
import os
import re
import subprocess
import sys

BS = chr(92)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(os.path.dirname(ROOT), "models")
MODEL_EXT = (".safetensors", ".gguf", ".ckpt", ".pt", ".pth", ".bin")

# Downloaded for an engine that is not wired into gen-studio yet, so no workflow
# and no row names them. Deleting them would mean re-downloading tens of GB.
# Remove an entry only when its engine is gone for good, not merely unfinished.
KEEP_PATTERNS = (
    "ltx-2.5-",     # LTX-2.5 transformer, VAEs, latent upscaler
    "gemma4",       # LTX-2.5 text encoders
)


def basename(s: str) -> str:
    return s.replace(BS, "/").split("/")[-1].strip()


def from_workflows() -> set:
    found = set()
    for dirpath, _dirs, files in os.walk(os.path.join(ROOT, "data")):
        if os.path.basename(dirpath) != "comfy":
            continue
        for fn in files:
            if not fn.endswith(".json"):
                continue
            try:
                graph = json.load(open(os.path.join(dirpath, fn), encoding="utf-8"))
            except Exception:
                continue
            for node in graph.values():
                if not isinstance(node, dict):
                    continue
                for value in (node.get("inputs") or {}).values():
                    if isinstance(value, str) and value.lower().endswith(MODEL_EXT):
                        found.add(basename(value))
    return found


def from_sources() -> set:
    found = set()
    pattern = re.compile(r"""['"]([^'"]+\.(?:safetensors|gguf|ckpt|pt|pth|bin))['"]""")
    for dirpath, _dirs, files in os.walk(os.path.join(ROOT, "src")):
        for fn in files:
            if not fn.endswith(".ts"):
                continue
            text = open(os.path.join(dirpath, fn), encoding="utf-8", errors="ignore").read()
            for m in pattern.finditer(text):
                found.add(basename(m.group(1).replace(BS + BS, BS)))
    return found


def from_database() -> set:
    """Model names that exist only as a row in Postgres."""
    sql = """
        SELECT DISTINCT x FROM (
          SELECT settings->'styleLora'->>'name'        AS x FROM projects
          UNION ALL SELECT settings->'anchorStyleLora'->>'name' FROM projects
          UNION ALL SELECT settings->>'fluxBaseModel'           FROM projects
          UNION ALL SELECT "loraPath"                           FROM character_profiles
        ) q WHERE x IS NOT NULL AND x <> ''
    """
    env = dict(os.environ)
    dsn = None
    for line in open(os.path.join(ROOT, ".env"), encoding="utf-8", errors="ignore"):
        if line.startswith("DATABASE_URL"):
            dsn = line.split("=", 1)[1].strip().strip('"')
    if not dsn:
        print("!! DATABASE_URL не найден — проверка по БД ПРОПУЩЕНА", file=sys.stderr)
        return set()
    m = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(\w+)", dsn)
    if not m:
        print("!! DATABASE_URL не разобран — проверка по БД ПРОПУЩЕНА", file=sys.stderr)
        return set()
    user, pwd, host, port, db = m.groups()
    env["PGPASSWORD"] = pwd
    out = subprocess.run(
        ["psql", "-U", user, "-h", host, "-p", port, "-d", db, "-At", "-c", sql],
        capture_output=True, text=True, env=env,
    )
    if out.returncode != 0:
        print("!! psql failed — проверка по БД ПРОПУЩЕНА:", out.stderr[:200], file=sys.stderr)
        return set()
    return {basename(l) for l in out.stdout.splitlines() if l.strip()}


def main() -> None:
    used = from_workflows() | from_sources() | from_database()
    kept_dir = os.path.join(MODELS, "loras", "gen-studio")

    unused, total_all, total_unused = [], 0.0, 0.0
    for dirpath, _dirs, files in os.walk(MODELS):
        for fn in files:
            if not fn.lower().endswith(MODEL_EXT):
                continue
            path = os.path.join(dirpath, fn)
            gb = os.path.getsize(path) / 1073741824
            total_all += gb
            if gb < 0.05:
                continue
            if fn in used or path.startswith(kept_dir):
                continue
            if any(pat in fn.lower() for pat in KEEP_PATTERNS):
                continue
            unused.append((gb, path))
            total_unused += gb

    unused.sort(reverse=True)
    print("моделей на диске: %.0f ГБ" % total_all)
    print("НЕ используется gen-studio: %d файлов, %.1f ГБ" % (len(unused), total_unused))
    print()
    for gb, path in unused:
        print("%7.2f ГБ  %s" % (gb, os.path.relpath(path, MODELS)))


if __name__ == "__main__":
    main()
