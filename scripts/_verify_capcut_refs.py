import glob, os, re, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
DRAFTS = r"C:\Users\mip\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft"
MP4_RE = re.compile(r'[EW]:[^"\\]*(?:[/\\][^"\\]+)*?[/\\](?:videos_smooth|videos_fhd|videos)[/\\][^"\\]+\.mp4', re.IGNORECASE)
total = dead = still_e = 0
bad_locations = {}
for draft_dir in sorted(glob.glob(os.path.join(DRAFTS, "*"))):
    if not os.path.isdir(draft_dir): continue
    for root, _, files in os.walk(draft_dir):
        for fn in files:
            if ".bak" in fn: continue
            fp = os.path.join(root, fn)
            try: txt = open(fp, encoding="utf-8", errors="strict").read()
            except Exception: continue
            for p in set(MP4_RE.findall(txt)):
                total += 1
                if p[:2].upper() == "E:": still_e += 1
                if not os.path.exists(p.replace("/", "\\")):
                    dead += 1
                    key = os.path.relpath(fp, DRAFTS)
                    bad_locations[key] = bad_locations.get(key, 0) + 1
print(f"total video refs across ALL files (nested incl.): {total}")
print(f"refs still on E:                                  {still_e}")
print(f"DEAD refs (file missing on disk):                 {dead}")
if bad_locations:
    for k, n in sorted(bad_locations.items()): print(f"  ! {k}: {n}")
else:
    print("  ALL REFERENCES RESOLVE - every draft (and nested timeline) is intact")
