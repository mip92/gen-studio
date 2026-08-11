# -*- coding: utf-8 -*-
"""Point-fixes for 2 short narrations flagged by the seed report."""
import psycopg2

PROJ = "7e740000-0000-4000-8000-000000000001"
FIX = {
    "A0_SH12": "телефоны по периметру опускаются сами — досматривать и выкладывать здесь больше нечего.",
    "A2_SH15": "эмалевый значок ветерана на её лацкане старше половины твоих корпоративных клиентов.",
}

cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
cur = cx.cursor()
for code, text in FIX.items():
    cur.execute('''UPDATE shots SET "narrationText"=%s,
        "promptFields"=jsonb_set("promptFields",'{narrationRu}',to_jsonb(%s::text)), "updatedAt"=now()
        WHERE "projectId"=%s AND "shotCode"=%s''', (text, text, PROJ, code))
    print(code, "rows=", cur.rowcount)
cx.commit(); cur.close(); cx.close()
