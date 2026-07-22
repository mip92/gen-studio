"""
Repoint EVERY video path (not just draft_content.json) inside each CapCut draft
folder to the best surviving tier on W:. Covers draft_meta_info.json,
timeline_layout.json, template-*.tmp scratch, and Timelines/**. Idempotent:
a path already pointing at the best surviving W: file is left untouched.

DRY-RUN by default; --apply writes. Each changed file is backed up once to
<file>.bak-repoint. Binary / undecodable files are skipped.
"""
from __future__ import annotations
import argparse, glob, os, re, shutil, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

W_DATA = r"W:\Programs\ComfyUI\gen-studio\data"
DRAFTS = r"C:\Users\mip\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft"
TIERS = ["videos_smooth", "videos_fhd", "videos"]
MP4_RE = re.compile(r'[EW]:[^"\\]*(?:[/\\][^"\\]+)*?[/\\](?:videos_smooth|videos_fhd|videos)[/\\][^"\\]+\.mp4', re.IGNORECASE)

def rel_parts(p):
    q = p.replace("\\", "/")
    m = re.search(r'/data/([^/]+)/shots/([^/]+)/(videos_smooth|videos_fhd|videos)/([^/]+\.mp4)$', q, re.IGNORECASE)
    return m.groups() if m else None

def best_w(slug, shot, base):
    for t in TIERS:
        fp = os.path.join(W_DATA, slug, "shots", shot, t, base)
        if os.path.exists(fp):
            return fp
    return None

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--apply", action="store_true")
    APPLY = ap.parse_args().apply
    changed_files = 0; total_rewrites = 0; unresolved = 0
    per_draft = {}
    for draft_dir in sorted(glob.glob(os.path.join(DRAFTS, "*"))):
        if not os.path.isdir(draft_dir): continue
        for root, _, files in os.walk(draft_dir):
            for fn in files:
                if ".bak" in fn: continue
                fp = os.path.join(root, fn)
                try:
                    txt = open(fp, encoding="utf-8", errors="strict").read()
                except (UnicodeDecodeError, OSError):
                    continue  # binary / unreadable → skip
                refs = set(MP4_RE.findall(txt))
                if not refs: continue
                edits = []
                for old in refs:
                    # Only touch DEAD references — a path whose file no longer
                    # exists on disk (E: wiped, or W: fhd/orig deleted). Live,
                    # already-correct paths are left strictly untouched.
                    if os.path.exists(old.replace("/", "\\")):
                        continue
                    parts = rel_parts(old)
                    if not parts: continue
                    slug, shot, tier, base = parts
                    bw = best_w(slug, shot, base)
                    if bw is None:
                        unresolved += 1; continue
                    new = bw.replace("\\", "/")
                    if new.lower() != old.replace("\\", "/").lower():
                        edits.append((old, new))
                if edits:
                    dname = os.path.basename(draft_dir)
                    per_draft.setdefault(dname, {}).setdefault(fn, 0)
                    per_draft[dname][fn] += len(edits)
                    changed_files += 1; total_rewrites += len(edits)
                    if APPLY:
                        bak = fp + ".bak-repoint"
                        if not os.path.exists(bak): shutil.copy2(fp, bak)
                        for old, new in edits: txt = txt.replace(old, new)
                        open(fp, "w", encoding="utf-8").write(txt)

    print(f"MODE: {'APPLY' if APPLY else 'DRY-RUN'}")
    print(f"files needing rewrites: {changed_files}, total path rewrites: {total_rewrites}, unresolved: {unresolved}")
    for dname, files in sorted(per_draft.items()):
        detail = ", ".join(f"{f}:{n}" for f, n in files.items())
        print(f"  {dname:<42} {detail}")
    if not APPLY: print("\n(dry-run — pass --apply)")

if __name__ == "__main__": main()
