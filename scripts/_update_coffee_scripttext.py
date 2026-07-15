# -*- coding: utf-8 -*-
"""Sync coffee_scriptText.md -> projects.scriptText (no PATCH endpoint; documented exception)."""
import os, psycopg2
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT,"scripts","coffee_scriptText.md"),encoding="utf-8") as f: script=f.read()
cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
cur.execute('UPDATE projects SET "scriptText"=%s, "updatedAt"=now() WHERE slug=%s',(script,"coffee"))
cx.commit(); print("OK scriptText updated, rows=",cur.rowcount); cur.close(); cx.close()
