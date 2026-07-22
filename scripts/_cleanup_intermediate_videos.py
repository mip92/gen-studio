"""
Clean up intermediate video tiers, keeping CapCut drafts working.

Rule (per shot, DONE projects only): keep the BEST surviving tier
(videos_smooth > videos_fhd > videos), delete strictly-lower tiers. Never
delete a shot's only/best copy. Every CapCut draft reference is repointed to
the best surviving tier ON W: (this also pulls E:-referencing drafts onto W:).
E: (stale copy) is wiped only after every draft ref resolves to a real W: file.

DRY-RUN by default. Pass --apply to actually rewrite drafts + delete files.
Pass --wipe-e to additionally delete the E: stale copy (only if no draft still
references E: after repointing). Every modified draft_content.json is backed up
to <name>.bak-cleanup before editing.
"""
from __future__ import annotations
import argparse, glob, json, os, re, shutil, sys
try:
    sys.stdout.reconfigure(encoding="utf-8")  # Windows console is cp1251 by default
except Exception:
    pass

W_DATA = r"W:\Programs\ComfyUI\gen-studio\data"
E_ROOT = r"E:\ComfyUI\gen-studio"
DRAFTS = r"C:\Users\mip\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft"

# Projects with in-flight jobs or never rendered — TOUCH NOTHING on disk for these.
EXCLUDE = {"coffee","lottery","shuttle","collector","kept_woman","surrogate",
           "webcam","sailor_wife","trucker","teacher","donor","comic_debug"}

TIERS = ["videos_smooth", "videos_fhd", "videos"]  # best → worst
MP4_RE = re.compile(r'[EW]:[^"]*?(?:videos_smooth|videos_fhd|videos)[/\\][^"]*?\.mp4', re.IGNORECASE)

def rel_parts(p):
    """From any full mp4 path, return (slug, shotCode, tier, basename) or None."""
    q = p.replace("\\", "/")
    m = re.search(r'/data/([^/]+)/shots/([^/]+)/(videos_smooth|videos_fhd|videos)/([^/]+\.mp4)$', q, re.IGNORECASE)
    return m.groups() if m else None

def w_path(slug, shot, tier, base):
    return os.path.join(W_DATA, slug, "shots", shot, tier, base)

def best_w(slug, shot, base):
    """Best surviving tier for this shot on W:, as (tier, fullpath) or None."""
    for t in TIERS:
        fp = w_path(slug, shot, t, base)
        if os.path.exists(fp):
            return t, fp
    return None

def fsize(p):
    try: return os.path.getsize(p)
    except OSError: return 0

def gb(n): return f"{n/1024/1024/1024:.2f} GB"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--wipe-e", action="store_true")
    args = ap.parse_args()
    APPLY = args.apply

    # ── 1. Draft repointing plan ────────────────────────────────────────────
    draft_edits = {}          # draft_path -> [(old, new), ...]
    dangling = []             # refs with no W: counterpart (BLOCKERS)
    e_refs_after = 0          # E: refs that would remain after repoint
    for d in sorted(glob.glob(os.path.join(DRAFTS, "*", "draft_content.json"))):
        txt = open(d, encoding="utf-8", errors="ignore").read()
        refs = set(MP4_RE.findall(txt))
        edits = []
        for old in refs:
            parts = rel_parts(old)
            if not parts:
                continue
            slug, shot, tier, base = parts
            bw = best_w(slug, shot, base)
            if bw is None:
                dangling.append((os.path.basename(os.path.dirname(d)), old))
                if old[:2].upper() == "E:":
                    e_refs_after += 1
                continue
            new = bw[1].replace("\\", "/")
            oldn = old.replace("\\", "/")
            if new.lower() != oldn.lower():
                edits.append((old, new))
        if edits:
            draft_edits[d] = edits

    # ── 2. Disk deletion plan (DONE projects only) ──────────────────────────
    del_files, del_bytes = [], 0
    kept_best = 0
    for slug in sorted(os.listdir(W_DATA)):
        if slug in EXCLUDE:
            continue
        shots_dir = os.path.join(W_DATA, slug, "shots")
        if not os.path.isdir(shots_dir):
            continue
        for shot in os.listdir(shots_dir):
            base_present = {}
            for t in TIERS:
                td = os.path.join(shots_dir, shot, t)
                if os.path.isdir(td):
                    for f in os.listdir(td):
                        if f.endswith(".mp4"):
                            base_present.setdefault(f, set()).add(t)
            for base, tiers in base_present.items():
                # best tier for this basename
                best = next((t for t in TIERS if t in tiers), None)
                if best is None:
                    continue
                kept_best += 1
                for t in tiers:
                    if t != best:  # strictly-lower tier → delete
                        fp = os.path.join(shots_dir, shot, t, base)
                        del_files.append(fp); del_bytes += fsize(fp)

    # ── Report ──────────────────────────────────────────────────────────────
    print("=" * 72)
    print(f"MODE: {'APPLY' if APPLY else 'DRY-RUN (no changes)'}")
    print("=" * 72)
    print(f"\nDRAFT REPOINTS: {len(draft_edits)} drafts, "
          f"{sum(len(v) for v in draft_edits.values())} path rewrites")
    for d, edits in draft_edits.items():
        name = os.path.basename(os.path.dirname(d))
        drives = {o[:2].upper() for o, _ in edits}
        print(f"  {name:<42} {len(edits):>4} rewrites (from {','.join(sorted(drives))})")

    print(f"\nBLOCKERS (draft ref with NO W: counterpart): {len(dangling)}")
    for name, old in dangling[:20]:
        print(f"  ! {name}: {old}")
    if len(dangling) > 20:
        print(f"  ... +{len(dangling)-20} more")

    print(f"\nDISK DELETIONS (done projects only): {len(del_files)} files, {gb(del_bytes)}")
    print(f"  shots whose BEST copy is preserved: {kept_best}")
    print(f"  excluded (in-flight/never-rendered): {', '.join(sorted(EXCLUDE))}")

    print(f"\nE: stale copy: {e_refs_after} draft refs would still point at E: after repoint")
    if args.wipe_e:
        if e_refs_after == 0 and not dangling:
            print(f"  → E: wipe ELIGIBLE ({E_ROOT})")
        else:
            print(f"  → E: wipe BLOCKED (unresolved refs) — will NOT touch E:")

    # ── Apply ────────────────────────────────────────────────────────────────
    if not APPLY:
        print("\n(dry-run — pass --apply to execute)")
        return

    if dangling:
        print("\nABORT: blockers present — refusing to delete while draft refs are unresolved.")
        sys.exit(2)

    # 2a. rewrite drafts (with backup)
    for d, edits in draft_edits.items():
        bak = d + ".bak-cleanup"
        if not os.path.exists(bak):
            shutil.copy2(d, bak)
        txt = open(d, encoding="utf-8", errors="ignore").read()
        for old, new in edits:
            txt = txt.replace(old, new)
        open(d, "w", encoding="utf-8").write(txt)
    print(f"\nrewrote {len(draft_edits)} drafts (backups: *.bak-cleanup)")

    # 2b. delete superseded files
    freed = 0
    for fp in del_files:
        try:
            freed += fsize(fp); os.remove(fp)
        except OSError as e:
            print(f"  skip {fp}: {e}")
    print(f"deleted {len(del_files)} files, freed {gb(freed)}")

    # 2c. optional E: wipe
    if args.wipe_e and e_refs_after == 0:
        if os.path.isdir(E_ROOT):
            print(f"wiping E: stale copy {E_ROOT} ...")
            shutil.rmtree(E_ROOT, ignore_errors=True)
            print("E: wiped")

if __name__ == "__main__":
    main()
