# -*- coding: utf-8 -*-
"""Point-fixes for 3 narrations flagged by the seed report (seeding phase)."""
import psycopg2

PROJ = "7e730000-0000-4000-8000-000000000001"
FIX = {
    "A5_SH10": "обедать ты ходишь в столовую за парком, где бизнес-ланч отдают за двести шестьдесят рублей.",
    "A11_SH08": "латунные замки молчат в темноте, и утро теперь начинается без всякого клац-клац.",
    "A9_SZ02": "жестяная коробочка с шахматами остаётся лежать на мокрой лавке до самого вечера.",
}

cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
cur = cx.cursor()
for code, text in FIX.items():
    cur.execute('''UPDATE shots SET "narrationText"=%s,
        "promptFields"=jsonb_set("promptFields",'{narrationRu}',to_jsonb(%s::text)), "updatedAt"=now()
        WHERE "projectId"=%s AND "shotCode"=%s''', (text, text, PROJ, code))
    print(code, "rows=", cur.rowcount)
cx.commit(); cur.close(); cx.close()
