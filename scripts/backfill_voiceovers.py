# -*- coding: utf-8 -*-
"""
One-shot backfill: consolidate every project's per-project voice_reference clip
into the shared `voiceovers` library (data/_voices/<slug>/), dedup by md5, and
repoint each project to the shared row via projects.ttsVoiceoverId (+ mirror
ttsVoiceRefPath). Then delete the now-redundant per-project copies.

Ordering is crash-safe: the shared file is written and the DB pointer is moved to
it BEFORE any old copy is deleted, so projects.ttsVoiceRefPath always points at a
file that exists.

Dry-run by default. Mutate with:  python backfill_voiceovers.py apply
"""
import hashlib
import os
import shutil
import sys
import uuid
import psycopg2

APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # gen-studio/
DATA = os.path.join(APP_ROOT, "data")
VOICES_ROOT = os.path.join(DATA, "_voices")
APPLY = len(sys.argv) > 1 and sys.argv[1] == "apply"

def md5_of(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

conn = psycopg2.connect(host="localhost", dbname="gen_studio",
                        user="gen_studio", password="gen_studio")
conn.set_client_encoding("UTF8")
cur = conn.cursor()

# 1) Map slug -> project id, and which projects already have a voiceover.
cur.execute('SELECT id, slug, "ttsVoiceRefPath", "ttsVoiceoverId" FROM projects ORDER BY slug')
projects = cur.fetchall()
slug_to_id = {p[1]: p[0] for p in projects}

# 2) Scan on-disk per-project voice_reference.* (skip .norm* caches).
found = []  # (slug, abspath, ext, md5, bytes)
for slug in slug_to_id:
    tts_dir = os.path.join(DATA, slug, "tts")
    if not os.path.isdir(tts_dir):
        continue
    for fn in os.listdir(tts_dir):
        if fn.startswith("voice_reference.") and not fn.startswith("."):
            ap = os.path.join(tts_dir, fn)
            ext = os.path.splitext(fn)[1].lower()
            found.append((slug, ap, ext, md5_of(ap), os.path.getsize(ap)))

# 3) Group by md5.
groups = {}
for slug, ap, ext, digest, size in found:
    groups.setdefault(digest, []).append((slug, ap, ext, size))

print(f"APP_ROOT = {APP_ROOT}")
print(f"projects with a voice file on disk: {len(found)}  ->  distinct voices: {len(groups)}")
print(f"mode: {'APPLY' if APPLY else 'DRY-RUN'}\n")

# Existing checksums already in the library (idempotent re-run).
cur.execute("SELECT checksum, id, slug, \"filePath\", ext FROM voiceovers")
existing = {row[0]: row for row in cur.fetchall()}

used_slugs = set()
cur.execute("SELECT slug FROM voiceovers")
for (s,) in cur.fetchall():
    used_slugs.add(s)

def unique_slug(base):
    s = base
    n = 2
    while s in used_slugs:
        s = f"{base}-{n}"; n += 1
    used_slugs.add(s)
    return s

planned_deletions = []  # abspaths to remove after DB is consistent

for digest, members in sorted(groups.items(), key=lambda kv: sorted(s for s, *_ in kv[1])[0]):
    member_slugs = sorted(m[0] for m in members)
    ext = members[0][2]
    size = members[0][3]
    rep_slug, rep_ap = sorted(((m[0], m[1]) for m in members))[0]
    label = " / ".join(member_slugs)

    if digest in existing:
        vo_id, vo_slug, vo_path, vo_ext = existing[digest][1:]
        print(f"[exists] voice {digest[:12]}  '{vo_slug}'  <- already in library; ensuring projects point to it")
    else:
        vo_slug = unique_slug(rep_slug)
        vo_id = str(uuid.uuid4())
        vo_path = f"data/_voices/{vo_slug}/voice_reference{ext}"
        dest_dir = os.path.join(VOICES_ROOT, vo_slug)
        dest = os.path.join(dest_dir, f"voice_reference{ext}")
        print(f"[new]    voice {digest[:12]}  slug='{vo_slug}'  name='{label}'  ({size} B)")
        print(f"         copy {os.path.relpath(rep_ap, APP_ROOT)} -> {vo_path}")
        if APPLY:
            os.makedirs(dest_dir, exist_ok=True)
            if not os.path.exists(dest):
                shutil.copy2(rep_ap, dest)
            cur.execute(
                'INSERT INTO voiceovers (id, slug, name, "filePath", ext, bytes, checksum, "createdAt", "updatedAt") '
                "VALUES (%s,%s,%s,%s,%s,%s,%s, now(), now())",
                (vo_id, vo_slug, label, vo_path, ext, size, digest),
            )

    # Repoint every project in the group to the shared row + mirror path.
    for slug in member_slugs:
        print(f"         assign project '{slug}'  ttsVoiceoverId={vo_id[:8]}  ttsVoiceRefPath={vo_path}")
        if APPLY:
            cur.execute(
                'UPDATE projects SET "ttsVoiceoverId"=%s, "ttsVoiceRefPath"=%s WHERE slug=%s',
                (vo_id, vo_path, slug),
            )

    # Mark old per-project copies for deletion (incl. representative source &
    # its .norm cache) — but never the new _voices file.
    for slug, ap, _ext, _sz in members:
        norm = os.path.join(os.path.dirname(ap), ".norm_voice_reference.wav")
        planned_deletions.append(ap)
        if os.path.exists(norm):
            planned_deletions.append(norm)

if APPLY:
    conn.commit()
    print("\nDB committed. Deleting redundant per-project copies...")

print(f"\n{'DELETING' if APPLY else 'WOULD DELETE'} {len(planned_deletions)} old file(s):")
for ap in planned_deletions:
    rel = os.path.relpath(ap, APP_ROOT)
    print(f"  - {rel}")
    if APPLY:
        try:
            os.remove(ap)
        except OSError as e:
            print(f"    (skip: {e})")

cur.close(); conn.close()
print("\nDONE." if APPLY else "\nDRY-RUN complete. Re-run with 'apply' to execute.")
