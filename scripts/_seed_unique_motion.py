# -*- coding: utf-8 -*-
"""Seed UNIQUE per-shot motionPrompt for the 4 taboo projects, derived from each shot's own
action clause (the subj embedded in promptFields.positive). Keeps anti-hallucination guardrails.
Only rewrites promptFields.motionPrompt (positive motion); motionNegative is left as-is.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/_seed_unique_motion.py preview donor   # dry-run print
  PYTHONIOENCODING=utf-8 python scripts/_seed_unique_motion.py apply           # write all 4
"""
import sys, os, re, json, psycopg2
PROJ={"kept_woman":"7e630000-0000-4000-8000-000000000001","surrogate":"7e640000-0000-4000-8000-000000000001",
      "webcam":"7e650000-0000-4000-8000-000000000001","donor":"7e660000-0000-4000-8000-000000000001"}

# framing lead phrases to strip so the motion clause is the raw action, longest-first
FRAMES=sorted([
 "an extreme close-up macro insert of ","an extreme close-up of ","a close-up of ",
 "a medium close-up of ","a medium shot of ","a medium view of ",
 "a wide establishing view of ","a wide push-in view of ","a wide panning view of ",
 "a wide pulling-out view of ","a wide view of ","an over-the-shoulder view of ",
 "a low-angle view of ","a high-angle view of ","a point-of-view shot of ","a pov view of ",
], key=len, reverse=True)

CHAR_TAIL=(", the moment continuing naturally, subtle breathing and small quiet micro-movements, "
 "only the figure already present in the frame, no new people entering, no extra figures appearing, "
 "the cell-shaded illustration in motion, hand-drawn animation cadence")
ENV_TAIL=(", with only ambient environmental motion, slowly drifting dust and gently shifting light, "
 "faint atmospheric movement, an empty still scene with no people and no figures, "
 "the cell-shaded illustration in motion, hand-drawn animation cadence")

def style_prefix(positives):
    cp=os.path.commonprefix(positives)
    i=cp.rfind(", ")
    return cp[:i+2] if i>=0 else ""

def action_of(positive, style):
    region=positive[len(style):] if positive.startswith(style) else positive
    idx=region.find("palette")
    subj=(region[:idx].rsplit(", ",1)[0] if idx>0 else region).strip()
    subj=re.split(r",\s*filling the frame", subj)[0].strip()          # drop DOF boilerplate
    low=subj.lower()
    for f in FRAMES:
        if low.startswith(f):
            subj=subj[len(f):]; break
    return subj.strip().rstrip(",")

def motion_for(positive, style, is_char):
    act=action_of(positive, style)
    if not act: return None
    return act + (CHAR_TAIL if is_char else ENV_TAIL)

def run(mode, only=None):
    cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
    for name,pid in PROJ.items():
        if only and name!=only: continue
        cur.execute('SELECT id,"shotCode","workflowRouteKey","promptFields"->>\'positive\' FROM shots WHERE "projectId"=%s ORDER BY "shotCode"',(pid,))
        rows=cur.fetchall()
        style=style_prefix([r[3] for r in rows if r[3]])
        n=0
        for sid,code,rk,pos in rows:
            if not pos: continue
            is_char = bool(rk) and 'character' in rk
            mot=motion_for(pos, style, is_char)
            if not mot: continue
            if mode=="preview":
                if n<10: print("  [%s] %s\n     -> %s\n"%(code,('CHAR' if is_char else 'ENV '),mot[:200]))
            else:
                cur.execute('UPDATE shots SET "promptFields"=jsonb_set("promptFields",\'{motionPrompt}\',to_jsonb(%s::text)), "updatedAt"=now() WHERE id=%s',(mot,sid))
            n+=1
        print("== %s: %d shots, styleLen=%d%s"%(name,n,len(style)," (PREVIEW)" if mode=="preview" else " UPDATED"))
    if mode!="preview": cx.commit(); print("COMMITTED")
    cur.close(); cx.close()

if __name__=="__main__":
    mode=sys.argv[1] if len(sys.argv)>1 else "preview"
    only=sys.argv[2] if len(sys.argv)>2 else None
    run(mode, only)
