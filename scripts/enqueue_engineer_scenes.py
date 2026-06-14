# -*- coding: utf-8 -*-
"""Enqueue ALL engineer scene renders via the app API, in play order (scene.sortOrder, shotCode).
POST /generation/shots/:id/enqueue. Does NOT touch existing queue entries (FIFO append only).
Skips any shot that already has a pending/running scene_render_job (no duplicates).
Run: PYTHONIOENCODING=utf-8 python gen-studio/scripts/enqueue_engineer_scenes.py"""
import json, sys, time, urllib.request, urllib.error
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e590000-0000-4000-8000-000000000001"
BASE = "http://localhost:4000"

def main():
    conn = psycopg2.connect(**DSN); cur = conn.cursor()
    # shots in play order
    cur.execute('''SELECT sh.id, sh."shotCode" FROM shots sh JOIN scenes sc ON sh."sceneId"=sc.id
                   WHERE sh."projectId"=%s ORDER BY sc."sortOrder", sh."shotCode"''', (PROJ_ID,))
    shots = cur.fetchall()
    # shots that already have a live (pending/running) scene render -> skip to avoid duplicate jobs
    cur.execute('''SELECT DISTINCT "shotId" FROM scene_render_jobs
                   WHERE status IN ('pending','running','queued','dispatched')''')
    live = {r[0] for r in cur.fetchall()}
    cur.close(); conn.close()

    queued = skipped = failed = 0
    for sid, code in shots:
        if sid in live:
            skipped += 1; continue
        try:
            req = urllib.request.Request(f"{BASE}/generation/shots/{sid}/enqueue",
                                         data=b'{}', method="POST",
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status in (200, 201):
                    queued += 1
                else:
                    failed += 1; print(f"  WARN {code}: HTTP {r.status}")
        except urllib.error.HTTPError as e:
            failed += 1; print(f"  FAIL {code}: HTTP {e.code} {e.read().decode('utf-8','replace')[:200]}")
        except Exception as e:
            failed += 1; print(f"  FAIL {code}: {e!r}")
    print(f"--- enqueue done: queued={queued} skipped(already live)={skipped} failed={failed} / total {len(shots)} ---")

if __name__ == "__main__":
    main()
