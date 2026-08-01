# -*- coding: utf-8 -*-
"""Cold-viewer pass fixes: near-dup, money-trail, 2 anthropomorphisms."""
import psycopg2

PROJ = "7e730000-0000-4000-8000-000000000001"
FIX = {
    "A3_SZ02": "картонная коробка с девятнадцатью годами внутри доезжает до дома только к вечеру.",
    "A8_SH15": "от гаражных денег к началу октября остаётся тридцать семь тысяч — этого хватит ровно на месяц.",
    "A10_SZ01": "свет на кухне теперь гаснет последним во всей квартире, далеко за полночь.",
    "A5_SZ02": "к трём часам столовая пустеет, и по стеклу окна сползают медленные капли от кондиционера.",
}

cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
cur = cx.cursor()
for code, text in FIX.items():
    cur.execute('''UPDATE shots SET "narrationText"=%s,
        "promptFields"=jsonb_set("promptFields",'{narrationRu}',to_jsonb(%s::text)), "updatedAt"=now()
        WHERE "projectId"=%s AND "shotCode"=%s''', (text, text, PROJ, code))
    print(code, "rows=", cur.rowcount)
cx.commit(); cur.close(); cx.close()
