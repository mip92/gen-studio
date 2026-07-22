"""
Consolidate every finished shot to a SINGLE final tier (videos_smooth) and drop
the intermediate/redundant tiers. Per shot under data/<slug>/shots/<code>/:

  * has videos_smooth/*.mp4  -> keep smooth; delete videos_fhd/* and videos/*
  * only videos_fhd/*.mp4    -> PROMOTE: move fhd -> videos_smooth (as-is, no
                               re-render); delete videos/*
  * only videos/*.mp4        -> SKIP (base-only == upscale still pending; the
                               live pipeline needs the source clip)
  * nothing                  -> SKIP (env/static shot)

DRY-RUN by default; --apply performs moves/deletes. Idempotent: re-running after
apply is a no-op. Prints a per-project summary and total bytes reclaimed.

After --apply you MUST: (1) mark the promoted rows interp-completed in the DB,
(2) repoint CapCut drafts, (3) verify. See the runbook the caller follows.
"""
from __future__ import annotations
import argparse, glob, os, shutil, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

DATA = r"W:\Programs\ComfyUI\gen-studio\data"

def mp4s(d):
    return sorted(glob.glob(os.path.join(d, "*.mp4"))) if os.path.isdir(d) else []

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    APPLY = args.apply

    grand = {"promoted": 0, "smooth_cleaned": 0, "skipped_base": 0, "empty": 0,
             "fhd_deleted": 0, "base_deleted": 0, "bytes": 0}
    print(f"{'project':<16}{'promote':>9}{'clean':>9}{'base_only':>11}{'freedMB':>10}")
    for slug in sorted(os.listdir(DATA)):
        shots_root = os.path.join(DATA, slug, "shots")
        if not os.path.isdir(shots_root): continue
        p_prom = p_clean = p_base = p_bytes = 0
        for code in sorted(os.listdir(shots_root)):
            sd = os.path.join(shots_root, code)
            if not os.path.isdir(sd): continue
            smooth = mp4s(os.path.join(sd, "videos_smooth"))
            fhd    = mp4s(os.path.join(sd, "videos_fhd"))
            base   = mp4s(os.path.join(sd, "videos"))

            if smooth:
                for f in fhd + base:
                    p_bytes += os.path.getsize(f)
                    grand["fhd_deleted" if "videos_fhd" in f else "base_deleted"] += 1
                    if APPLY: os.remove(f)
                if fhd or base: p_clean += 1
            elif fhd:
                # promote: move fhd -> smooth (should be exactly one file)
                dest_dir = os.path.join(sd, "videos_smooth")
                if APPLY: os.makedirs(dest_dir, exist_ok=True)
                for f in fhd:
                    dest = os.path.join(dest_dir, os.path.basename(f))
                    if APPLY:
                        if os.path.exists(dest): os.remove(f)   # idempotent safety
                        else: shutil.move(f, dest)
                for f in base:
                    p_bytes += os.path.getsize(f)
                    grand["base_deleted"] += 1
                    if APPLY: os.remove(f)
                p_prom += 1
            elif base:
                p_base += 1
            else:
                grand["empty"] += 1

        grand["promoted"]       += p_prom
        grand["smooth_cleaned"] += p_clean
        grand["skipped_base"]   += p_base
        grand["bytes"]          += p_bytes
        if p_prom or p_clean or p_base:
            print(f"{slug:<16}{p_prom:>9}{p_clean:>9}{p_base:>11}{p_bytes/1e6:>10.0f}")

    print("-" * 55)
    print(f"{'TOTAL':<16}{grand['promoted']:>9}{grand['smooth_cleaned']:>9}{grand['skipped_base']:>11}{grand['bytes']/1e6:>10.0f}")
    print(f"\n{'APPLIED' if APPLY else 'DRY-RUN'} | promote(fhd->smooth): {grand['promoted']} shots | "
          f"cleaned(smooth kept): {grand['smooth_cleaned']} shots | base-only skipped: {grand['skipped_base']} | "
          f"empty: {grand['empty']}")
    print(f"delete: {grand['fhd_deleted']} fhd + {grand['base_deleted']} base files | "
          f"reclaim ~{grand['bytes']/1e9:.1f} GB")

if __name__ == "__main__":
    main()
