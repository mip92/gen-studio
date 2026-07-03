# -*- coding: utf-8 -*-
"""Sample a few shot positives per taboo project to design motion-derivation."""
import psycopg2
PROJ={"kept_woman":"7e630000-0000-4000-8000-000000000001","surrogate":"7e640000-0000-4000-8000-000000000001",
      "webcam":"7e650000-0000-4000-8000-000000000001","donor":"7e660000-0000-4000-8000-000000000001"}
cx=psycopg2.connect(host="localhost",dbname="gen_studio",user="gen_studio",password="gen_studio"); cur=cx.cursor()
for name,pid in PROJ.items():
    print("\n==== %s ===="%name)
    cur.execute('''SELECT "shotCode", "workflowRouteKey", left("promptFields"->>'positive',170),
                          left(coalesce("promptFields"->>'motionPrompt',''),60)
                   FROM shots WHERE "projectId"=%s ORDER BY "shotCode" LIMIT 4''',(pid,))
    for code,rk,pos,mot in cur.fetchall():
        print("  [%s] route=%s"%(code, (rk or '')[-12:]))
        print("     POS: %s"%pos)
        print("     MOT: %s"%mot)
cur.close(); cx.close()
