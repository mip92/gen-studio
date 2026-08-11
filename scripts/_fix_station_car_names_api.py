# -*- coding: utf-8 -*-
"""Re-apply the station VO fixes through the API (proper invalidation path),
since station already has rendered TTS on these shots."""
import json, urllib.request, psycopg2

PROJ = "7e710000-0000-4000-8000-000000000001"
BASE = "http://localhost:4000"
FIX = {
 "A0_SH04":  "из белого такси тебе кивает таксист, ты киваешь ему в ответ, не сбиваясь с шага.",
 "A0_SH11":  "в очереди третьей стоит Вера, и её серебристый седан снова ждёт ремонта.",
 "A0_SH14":  "а хозяин чёрного внедорожника заезжает без очереди и берёт из отдельной бочки.",
 "A5_SH11":  "Вера приезжает по вторникам на серебристом седане и всегда просит чек.",
 "A5_SH14":  "хозяин чёрного внедорожника чеков не просит никогда и платит на двадцать процентов больше.",
 "A6_SH10":  "а хозяину чёрного внедорожника ты наливаешь полный бак из отдельной бочки.",
 "A9_SH01":  "через месяц белое такси Валеры глохнет на подъёме и больше не заводится.",
 "A9_SH03":  "у фермера вездеход встаёт в поле в разгар уборки, и трактор он тоже заправлял у тебя.",
 "A9_SH04":  "хлебовоз опаздывает третий день, и его белый фургон стоит на подъёме у моста.",
 "A9_SH05":  "синий кроссовер молодой семьи глохнет с ребёнком в машине на переезде.",
 "A9_SH09":  "Вера приезжает на том же серебристом седане второй раз за полгода и достаёт из сумки папку.",
 "A9_SH18":  "а чёрный внедорожник не глохнет ни разу, ему ты наливаешь из своей бочки.",
 "A10_SH06": "первым к тебе на подъёмник заезжает Валера со своим белым такси.",
 "A11_SH05": "Вера привозит свой серебристый седан в ремонт и снова просит бумагу.",
}

cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
cur = cx.cursor()
cur.execute('SELECT "shotCode", id FROM shots WHERE "projectId"=%s AND "shotCode"=ANY(%s)', (PROJ, list(FIX.keys())))
ids = dict(cur.fetchall())
cur.close(); cx.close()

ok, fail = 0, []
for code, text in FIX.items():
    body = json.dumps({"text": text}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE + "/tts/shots/%s/narration" % ids[code], data=body, method="PATCH",
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            r.read()
        ok += 1
        print(code, "PATCH ok")
    except Exception as e:
        fail.append((code, str(e)))
        print(code, "FAIL", e)
print("ok=%d fail=%d" % (ok, len(fail)))
