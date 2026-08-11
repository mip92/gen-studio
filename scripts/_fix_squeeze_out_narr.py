# -*- coding: utf-8 -*-
import psycopg2

PROJ = "7e750000-0000-4000-8000-000000000001"
t = "смех кончается, и ты вдруг видишь подвал глазами марины, паши и тимы сразу."
cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
cur = cx.cursor()
cur.execute('''UPDATE shots SET "narrationText"=%s,
    "promptFields"=jsonb_set("promptFields",'{narrationRu}',to_jsonb(%s::text)), "updatedAt"=now()
    WHERE "projectId"=%s AND "shotCode"='A9_SH15' ''', (t, t, PROJ))
print("rows=", cur.rowcount)
cx.commit(); cur.close(); cx.close()
