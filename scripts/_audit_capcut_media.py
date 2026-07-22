"""Read-only audit: what video files do existing CapCut drafts reference, and
which intermediates are safe to delete. Prints a report only — deletes nothing."""
import json, os, re, glob

DRAFTS = r"C:\Users\mip\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft"
MP4_RE = re.compile(r'([EW]:[^"]*?(?:videos|videos_fhd|videos_smooth)[/\\][^"]*?\.mp4)', re.IGNORECASE)

def norm(p):  # windows path as-is for os.path.exists
    return p.replace('/', '\\')

def dir_of(p):
    if 'videos_smooth' in p: return 'videos_smooth'
    if 'videos_fhd'   in p: return 'videos_fhd'
    return 'videos'

rows = []
for d in sorted(glob.glob(os.path.join(DRAFTS, '*', 'draft_content.json'))):
    name = os.path.basename(os.path.dirname(d))
    txt = open(d, encoding='utf-8', errors='ignore').read()
    paths = set(MP4_RE.findall(txt))
    if not paths: continue
    fhd = [p for p in paths if dir_of(p) == 'videos_fhd']
    smo = [p for p in paths if dir_of(p) == 'videos_smooth']
    orig = [p for p in paths if dir_of(p) == 'videos']
    drives = set(p[:2].upper() for p in paths)
    # for fhd refs: does a smooth sibling exist on disk?
    fhd_missing_smooth = []
    for p in fhd:
        sm = re.sub(r'videos_fhd', 'videos_smooth', p, flags=re.IGNORECASE)
        if not os.path.exists(norm(sm)):
            fhd_missing_smooth.append(p)
    rows.append((name, ''.join(sorted(drives)), len(orig), len(fhd), len(smo), len(fhd_missing_smooth)))

print(f"{'draft':<40} {'drives':<7} {'orig':>5} {'fhd':>5} {'smooth':>7} {'fhd_no_smooth':>13}")
for r in rows:
    print(f"{r[0]:<40} {r[1]:<7} {r[2]:>5} {r[3]:>5} {r[4]:>7} {r[5]:>13}")

print("\n=== TOTALS ===")
print("drafts referencing fhd:", sum(1 for r in rows if r[3]))
print("fhd refs total:", sum(r[3] for r in rows))
print("fhd refs WITH no smooth sibling (BLOCKERS):", sum(r[5] for r in rows))
