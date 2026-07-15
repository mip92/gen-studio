# -*- coding: utf-8 -*-
"""Sync lottery_scriptText.md -> projects.scriptText."""
import os, psycopg2
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT,"scripts","lottery_scriptText.md"),encoding="utf-8") as f: script=f.read()
cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
cur.execute('UPDATE projects SET "scriptText"=%s, "updatedAt"=now() WHERE slug=%s',(script,"lottery"))
cx.commit(); print("OK scriptText updated, rows=",cur.rowcount); cur.close(); cx.close()
