import os, re, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
W_DATA = r"W:\Programs\ComfyUI\gen-studio\data"
TIERS = ["videos_smooth","videos_fhd","videos"]
MP4_RE = re.compile(r'[EW]:[^"\\]*(?:[/\\][^"\\]+)*?[/\\](?:videos_smooth|videos_fhd|videos)[/\\][^"\\]+\.mp4', re.IGNORECASE)
def rel_parts(p):
    q=p.replace("\\","/")
    m=re.search(r'/data/([^/]+)/shots/([^/]+)/(videos_smooth|videos_fhd|videos)/([^/]+\.mp4)$',q,re.IGNORECASE)
    return m.groups() if m else None
def best_w(slug,shot,base):
    for t in TIERS:
        fp=os.path.join(W_DATA,slug,"shots",shot,t,base)
        if os.path.exists(fp): return fp
    return None
D=r"C:\Users\mip\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\engineer_2026062018550\draft_content.json"
txt=open(D,encoding="utf-8",errors="strict").read()
for i,old in enumerate(sorted(set(MP4_RE.findall(txt)))[:3]):
    pr=rel_parts(old)
    new=best_w(*pr[:2],pr[3]) if pr else None
    newn=new.replace("\\","/") if new else None
    print(f"--- match {i} ---")
    print("OLD:", repr(old))
    print("NEW:", repr(newn))
    print("differ:", (newn or "").lower()!=old.replace("\\","/").lower())
