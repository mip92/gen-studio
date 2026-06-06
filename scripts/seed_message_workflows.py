# -*- coding: utf-8 -*-
"""Seed workflow_templates + workflow_routes for project `message`. Idempotent."""
import sys
import psycopg2

DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PROJ_ID = "7e550000-0000-4000-8000-000000000001"

TEMPLATES = [
    ("a1", "char_ip_graphic_novel",     "message/comfy/scene_single_character_graphic_novel_api.json",
     "Single-character cell-shaded scene (IP-Adapter anchor)"),
    ("a2", "environment_graphic_novel", "message/comfy/scene_environment_graphic_novel_api.json",
     "Environment / B-roll cell-shaded scene (no character)"),
]
ROUTES = [
    ("b1", "message_character_ip"),
    ("b2", "message_environment"),
]

def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute('SELECT count(*) FROM workflow_templates WHERE "projectId"=%s', (PROJ_ID,))
        if cur.fetchone()[0] > 0:
            print("ABORT: workflow_templates already exist for message."); return
        for suf, key, fp, desc in TEMPLATES:
            cur.execute(
                'INSERT INTO workflow_templates (id,"projectId","templateKey","filePath",description,"createdAt","visualStyle") '
                'VALUES (%s,%s,%s,%s,%s, now(), %s)',
                (f"7e550000-0000-4000-8000-0000000000{suf}", PROJ_ID, key, fp, desc, "graphic_novel_cell_shaded"),
            )
        for suf, key in ROUTES:
            cur.execute(
                'INSERT INTO workflow_routes (id,"projectId","routeKey","createdAt") VALUES (%s,%s,%s, now())',
                (f"7e550000-0000-4000-8000-0000000000{suf}", PROJ_ID, key),
            )
        conn.commit()
        print("OK seeded workflows for message:")
        for _, key, fp, _ in TEMPLATES:
            print(f"  template {key:26s} -> {fp}")
        for _, key in ROUTES:
            print(f"  route    {key}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()

if __name__ == "__main__":
    main()
