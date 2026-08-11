# -*- coding: utf-8 -*-
"""Series-wide audit fixes for the 7 layoff films (plot-audit pass 2026-08-01).

1. NARR: robotic connectors (потому что >2/film, «, и это» -> 0), homographs
   (замок->застёжки/замочек, писать, кружки, «стоит» price-sense), cross-film
   tics («окно ... закрывается», «первый снег ложится»), «впервые»/«ровно»/
   numeral tics, best_thing timeline, irreplaceable «регламент №1» clash.
2. MOTION: 30 hand-frame env shots swap the deserted lock for a hands lock
   (+ CHAR motionNegative).
3. POSITIVE: english negations ('nothing') rewritten affirmatively.
"""
import json, psycopg2

PROJ = {
    "hidden_layoff": "7e730000-0000-4000-8000-000000000001",
    "optimizer":     "7e740000-0000-4000-8000-000000000001",
    "squeeze_out":   "7e750000-0000-4000-8000-000000000001",
    "preretire":     "7e760000-0000-4000-8000-000000000001",
    "irreplaceable": "7e770000-0000-4000-8000-000000000001",
    "best_thing":    "7e780000-0000-4000-8000-000000000001",
    "monotown":      "7e790000-0000-4000-8000-000000000001",
}

NARR = {
 # ---------------- hidden_layoff ----------------
 ("hidden_layoff","A1_SH03"): "две латунные застёжки щёлкают под твоими пальцами — клац-клац — и этот звук станет твоим будильником на девятнадцать лет.",
 ("hidden_layoff","A4_SH02"): "клац-клац — застёжки щёлкают так же уверенно, как в любое настоящее утро.",
 ("hidden_layoff","A6_SH16"): "в портфеле рядом с контейнером теперь живут шахматы, и застёжки щёлкают над ними так же уверенно.",
 ("hidden_layoff","A11_SH08"): "латунные застёжки молчат в темноте, и утро теперь начинается без всякого клац-клац.",
 ("hidden_layoff","A7_SH02"): "ключ от гаража ты отдаёшь легко, а вот амбарный замочек зачем-то оставляешь себе.",
 ("hidden_layoff","A7_SH03"): "старый замочек ложится в карман пиджака и звенит там о мелочь весь день.",
 ("hidden_layoff","A7_SZ02"): "амбарный замочек поселяется на кухонной полке между чаем и банкой шурупов.",
 ("hidden_layoff","A3_SH16"): "лена ничего не замечает — девятнадцать лет ты приходил домой с одним и тем же лицом.",
 ("hidden_layoff","A3_SH18"): "будильник остаётся на прежнем времени — завтра ты «идёшь на работу».",
 ("hidden_layoff","A4_SH08"): "ровно в тринадцать ноль-ноль ты обедаешь из контейнера — расписание держит человека.",
 ("hidden_layoff","A4_SH12"): "ложь оказывается лёгкой — она сделана из чистой правды прошлых лет.",
 ("hidden_layoff","A4_SH15"): "в дождь ты сидишь под зонтом — «работу» никто не отменял.",
 ("hidden_layoff","A5_SH08"): "в июне в парке плюс двадцать девять, а ты сидишь в шерстяном костюме — «на работе дресс-код».",
 ("hidden_layoff","A6_SH06"): "он узнаёт твоё расписание с одного взгляда — у него точно такое же.",
 ("hidden_layoff","A7_SH18"): "ты едешь в парк с пересадкой — прямой маршрут подорожал на восемь рублей.",
 ("hidden_layoff","A11_SH02"): "ты знаешь этот склад наизусть за месяц — снабжение остаётся снабжением с любой стороны ворот.",
 ("hidden_layoff","A2_SH16"): "щёлкает дверная ручка — единственный звук, который ты запомнишь из всего этого дня.",
 ("hidden_layoff","A3_SH09"): "нина хочет что-то сказать, но говорит только «позвоните, если что» — и звучит это как прощание.",
 ("hidden_layoff","A6_SH10"): "ты смотришь на семёна и видишь себя через год — зеркало страшнее любого отказа.",
 ("hidden_layoff","A9_SH14"): "вы идёте к выходу из парка на расстоянии вытянутой руки — самое длинное расстояние за семнадцать лет.",
 ("hidden_layoff","A11_SZ01"): "первый снег укрывает город без различия — фабрики, склады и парки под одним слоем.",
 # ---------------- optimizer ----------------
 ("optimizer","A0_SH02"): "тебя выдёргивают со встречи этажом выше — тишина это твой профиль.",
 ("optimizer","A3_SH05"): "ты говоришь фразы с карточки, и они работают — ты собрала их из настоящих разговоров.",
 ("optimizer","A5_SH06"): "она держит спину — на доске у проходной всё ещё висит её фотография.",
 ("optimizer","A9_SH09"): "ты кивком помогаешь ей дочитать — кто-то здесь должен остаться профессионалом.",
 ("optimizer","A9_SH16"): "у лифта ты считаешь этажи на табло — считать спокойнее, чем думать.",
 ("optimizer","A0_SH03"): "охрана предлагает просто взять его под руки — худшее, что можно сделать.",
 ("optimizer","A0_SH10"): "до турникета его коробку несёшь ты — техника, а не жест для публики.",
 ("optimizer","A1_SH10"): "в конверте тридцать тысяч — первые деньги, заработанные на чужом уходе.",
 ("optimizer","A4_SH07"): "трекер показывает семь часов двенадцать минут — лучший сон по отделу.",
 ("optimizer","A4_SH13"): "он говорит без укора — «устала — возьми неделю», — и звучит это как диагностика оборудования.",
 ("optimizer","A5_SH15"): "ты отвечаешь «у нас по-другому, мама» — правда, от которой не легче.",
 ("optimizer","A7_SH08"): "живых сессий в графике вдвое меньше — в отчётах это называется успехом внедрения.",
 ("optimizer","A10_SH05"): "вы едите молча — первое молчание за годы, в котором тебе не надо работать.",
 ("optimizer","A11_SH07"): "ты отвечаешь «по-разному» — самый честный твой ответ за девять лет.",
 # ---------------- squeeze_out ----------------
 ("squeeze_out","A0_SH10"): "домой ты едешь спать три часа — в полдень планёрка по новому мосту.",
 ("squeeze_out","A0_SH06"): "проект чист — значит, монтаж можно начинать по графику.",
 ("squeeze_out","A1_SH12"): "марина говорит, что замужем за бюро с пристройкой в виде тебя, — пока это шутка.",
 ("squeeze_out","A4_SH08"): "ты отвечаешь «вполне» — первая фраза за год, где вы оба соврали.",
 ("squeeze_out","A7_SH14"): "ты опускаешься на колени и извиняешься — первый раз осада вошла в твой дом.",
 ("squeeze_out","A11_SH10"): "тебя нельзя было уволить — правда: тебя четыре года увольняли по-другому и почти уволили от себя.",
 ("squeeze_out","A3_SH15"): "тима под столом водит динозавра по ножке стула и делает это непривычно молча.",
 ("squeeze_out","A9_SH14"): "ты читаешь вопрос про функции и смеёшься — по-настоящему, взахлёб.",
 ("squeeze_out","A10_SH07"): "на крыльце ты выдыхаешь так, как не выдыхал всю осаду, и воздух пахнет талым снегом.",
 ("squeeze_out","A8_SH16"): "шанс выйти отсюда партнёром истекает без звука — двери здесь вообще тихие.",
 ("squeeze_out","A6_SH16"): "на баки во дворе падает первый снег, и из-под крышки торчит колесо чьего-то кресла.",
 # ---------------- preretire ----------------
 ("preretire","A0_SH03"): "смена расступается — за тридцать восемь лет здесь выучили: сейчас будет тихо.",
 ("preretire","A4_SH08"): "алёна спрашивает, как поиски, и ты отвечаешь бодро — пока это чистая правда.",
 ("preretire","A10_SH11"): "ты соглашаешься одним кивком — горло на всякий случай лучше не пробовать.",
 ("preretire","A0_SH06"): "диагноз занимает минуту, замена — двенадцать: твой личный норматив.",
 ("preretire","A1_SH07"): "он переспрашивает по три раза — правильные три раза: так спрашивают те, кто останется.",
 ("preretire","A1_SH16"): "цех на пересменке дышит тёплым хлебом — твой любимый час на заводе.",
 ("preretire","A3_SH04"): "тебе говорят «вы мастер, вас с руками оторвут», и фраза ложится точно на твою гордость.",
 ("preretire","A7_SH15"): "часы на тумбочке идут ровно — единственный механизм, которому ты сейчас нужен.",
 ("preretire","A9_SH09"): "платят пятьсот рублей и банкой огурцов — первые честные деньги за четыре месяца.",
 ("preretire","A9_SH03"): "ты раскладываешь щупы на столе, и вывод складывается сам — руки без машины глохнут.",
 ("preretire","A5_SH13"): "алёна начинает звонить чаще воскресений, и по этому графику видно, как ты выглядишь со стороны.",
 ("preretire","A7_SH11"): "михалыч выслушивает историю про вахтёра и молчит дольше собственного чайника.",
 ("preretire","A5_SH03"): "в половине объявлений прямо стоит «до тридцати пяти», хотя такие объявления давно вне закона.",
 ("preretire","A2_SH03"): "датчик приклеили точно туда, куда ты кладёшь ладонь, и ты не знаешь, смеяться или ревновать.",
 ("preretire","A4_SH12"): "фильтр «наладчик, опыт от тридцати лет» выдаёт по городу ноль позиций.",
 ("preretire","A11_SH05"): "пенсия приходит через два года точно по календарю, и ты встречаешь её работающим человеком.",
 ("preretire","A6_SH07"): "в конце обещают сертификат — бумагу, которой весь твой стаж будет должен что-то доказывать.",
 ("preretire","A7_SH09"): "тебя зовут сторожить дверь, через которую ты полжизни носил завод на руках.",
 ("preretire","A11_SH03"): "щупы живут в нагрудном кармане новой спецовки — на том же месте, что и все заводские годы.",
 ("preretire","A8_SH16"): "все двери, куда тебя звали, закрылись — остаётся та, которую откроешь сам.",
 # ---------------- irreplaceable ----------------
 ("irreplaceable","A0_SH07"): "ты сидишь спокойно — эту базу ты знаешь глубже, чем написавший её студент двухтысячных.",
 ("irreplaceable","A6_SH02"): "вы сматываете его патч-корды вдвоём и оба тянете время — двадцать лет так просто не сматываются.",
 ("irreplaceable","A5_SH16"): "у внедренцев пицца и шарики — «этап два закрыт досрочно», и смеяться уже не хочется.",
 ("irreplaceable","A6_SZ01"): "в меню пельменной двадцать лет не хватает одной буквы — тоже форма стабильности.",
 ("irreplaceable","A7_SH14"): "у тебя вдруг есть время на шахматы в рабочий день — худшая новость года.",
 ("irreplaceable","A5_SH13"): "ночью ты всё-таки открываешь документацию новой системы — просто посмотреть, что там у них.",
 ("irreplaceable","A5_SH15"): "ты закрываешь ноутбук медленно, и в тишине квартиры отчётливо слышно, как тикает твой собственный план.",
 ("irreplaceable","A3_SH17"): "дома ты открываешь форум для привычной бравады, и бравада не пишется.",
 ("irreplaceable","A10_SH03"): "пишешь ты запоем, взахлёб — отдавать знание, оказывается, физически легче, чем стеречь.",
 ("irreplaceable","A10_SH08"): "гена присылает одну строчку — «говорят, ты сел за мануал, боря, значит, живой».",
 ("irreplaceable","A4_SZ01"): "у внедренцев всё бирюзовое — баннер, фирменные чашки и график сгорания задач.",
 ("irreplaceable","A7_SH12"): "ты читаешь их регламенты через стекло и признаёшь дикую мысль — написано толково.",
 ("irreplaceable","A8_SH08"): "её команда заезжает за один день, и на стену сразу ложатся первые печатные регламенты.",
 ("irreplaceable","A8_SH16"): "шанс войти в новый мир с командой истекает в новогоднюю ночь.",
 # ---------------- monotown ----------------
 ("monotown","A1_SH11"): "по пятницам вы с саней стучите домино во дворе — лучший отчёт о неделе.",
 ("monotown","A6_SH10"): "ты просишь у области время до весны — первая твоя нерешительность за двадцать шесть лет.",
 ("monotown","A8_SH16"): "план артели висит на магните у станка — семь человек, уже штатное расписание.",
 ("monotown","A11_SH08"): "накладную ты подписываешь на дверце платформы — первая большая бумага артели.",
 ("monotown","A0_SH06"): "цепь выбирает слабину звено за звеном, и трос наконец выдыхает.",
 ("monotown","A7_SH14"): "управляющий закрывает реестр вывоза и в кои-то веки выглядит довольным — активы оптимизированы.",
 ("monotown","A9_SH17"): "с пригорка завод стоит целиком тёмный — гора железа под луной.",
 ("monotown","A0_SH05"): "дальше работаешь руками других — тали, козлы, стропы, и каждый твой жест заменяет фразу.",
 # ---------------- best_thing ----------------
 ("best_thing","A1_SH11"): "перед сном ты подрезаешь черенки бабушкиными ножницами — твои личные десять минут.",
 ("best_thing","A1_SH13"): "в обед отдел поливает подоконник из кружек — лучший регламент компании.",
 ("best_thing","A2_SH06"): "вечером ты поливаешь подоконник по расписанию — руки заняты, и сейчас это главное их назначение.",
 ("best_thing","A6_SH13"): "твои букеты в ленте собирают сердечки от незнакомых людей — странная новая валюта.",
 ("best_thing","A10_SH08"): "по пятницам вас в мастерской трое — уже не хобби, а маленькая фирма с логистикой.",
 ("best_thing","A10_SH10"): "домой вы идёте пешком, уставшие одинаково, — лучшее равенство, какое вы знали.",
 ("best_thing","A10_SH14"): "год назад тебя сократили, и вспоминать это по-прежнему больно — просто теперь это начало истории, а не конец.",
 ("best_thing","A6_SH14"): "к маю роза выдаёт тебе ключи от субботы — в её школе это диплом с отличием.",
 ("best_thing","A7_SH01"): "в июне роза сама двигает тебе бумажку с контактом — «угол на рынке освобождается, иди, ученица».",
 ("best_thing","A7_SH11"): "к августу у угла появляется очередь из трёх человек, и двоих ты знаешь по именам.",
 ("best_thing","A7_SH18"): "в октябре приходит сообщение — свадьба, полное оформление, бюджет девяносто тысяч.",
 ("best_thing","A9_SH04"): "после свадьбы ты берёшь помощницу на выходные и слышишь в своём голосе интонации розы.",
 ("best_thing","A9_SH07"): "ноябрь закрывается в плюс на двадцать шесть тысяч, и почерк в тетради всё тот же ровный.",
 ("best_thing","A10_SH05"): "под нулём восьмого месяца ты проводишь линию, как под годовым балансом.",
 ("best_thing","A3_SH16"): "рябину за окном присыпает первым снегом, и одно окно на весь дом горит дольше всех — ваше.",
}

# --- motion lock swap: hand-frame env shots ---------------------------------
HANDS = {
 "best_thing": ["A6_SH13"],
 "hidden_layoff": ["A1_SH06","A1_SH12","A2_SH03","A2_SH16","A7_SH03","A8_SH13","A9_SH06","A9_SH17"],
 "irreplaceable": ["A4_SH10","A5_SZ01"],
 "monotown": ["A1_SH02"],
 "optimizer": ["A0_SH07","A0_SH11","A0_SH13","A10_SH06","A10_SH09","A2_SH04","A3_SH06","A5_SH03","A5_SH09","A9_SH17"],
 "preretire": ["A1_SH12","A3_SH14","A6_SH03","A9_SH18"],
 "squeeze_out": ["A1_SH10","A2_SH03","A3_SH14","A9_SH16"],
}
OLD_LOCK = "the place stays deserted, every surface and object holding its exact position, only air and light in motion"
NEW_LOCK = "only the hands already in frame in motion, every other surface and object holding its exact position"
CHAR_MNEG = ("extra people, additional figures, duplicate person, twin, clone, background crowd, anime character, anime girl, manga character, "
             "chibi, extra limbs, deformed face, merged faces, face swap, photoreal, photograph, 3D render, plastic skin, flicker, warping")

# --- positive rewrites (english negations + the regulation clash) ------------
POS = {
 ("squeeze_out","A6_SH12"): ("a bright nod that costs her nothing", "a bright effortless nod"),
 ("squeeze_out","A7_SH08"): ("with his notebook closed, writing nothing, which for him is the loudest act available",
                              "with his notebook closed and his pen idle, his stillness the loudest act available to him"),
 ("squeeze_out","A7_SH16"): ("the question landing where the lawyer and the plaque could reach nothing",
                              "the question landing deeper than the lawyer and the plaque ever reached"),
 ("squeeze_out","A8_SH07"): ("says nothing, washing one plate for a very long time",
                              "answers with silence, washing one plate for a very long time"),
 ("squeeze_out","A10_SH04"): ("the rolled original print, nothing else worth taking",
                               "the rolled original print, the whole worth of the place in one box"),
 ("preretire","A7_SH02"): ("the radio off to save nothing but habit", "the radio dark out of pure habit"),
 ("irreplaceable","A7_SH17"): ("Boris smokes nothing on the office steps, just stands in the cold where smokers stand",
                                "Boris stands empty-handed among the smokers on the office steps, keeping to the cold where talk happens"),
 ("best_thing","A10_SH06"): ("saying nothing for a long time", "keeping a long appraising silence"),
 ("irreplaceable","A8_SH08"): ("a printed regulation pinned as page one", "a first printed regulation pinned to the wall"),
}


def main():
    cx = psycopg2.connect(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
    cur = cx.cursor()
    n = 0
    for (slug, code), text in NARR.items():
        cur.execute('''UPDATE shots SET "narrationText"=%s,
            "promptFields"=jsonb_set("promptFields",'{narrationRu}',to_jsonb(%s::text)), "updatedAt"=now()
            WHERE "projectId"=%s AND "shotCode"=%s''', (text, text, PROJ[slug], code))
        if cur.rowcount != 1:
            raise SystemExit("NARR miss %s %s" % (slug, code))
        n += cur.rowcount
    print("narration updated:", n)

    m = 0
    for slug, codes in HANDS.items():
        for code in codes:
            cur.execute('SELECT "promptFields" FROM shots WHERE "projectId"=%s AND "shotCode"=%s', (PROJ[slug], code))
            pf = cur.fetchone()[0]
            if OLD_LOCK not in pf.get("motionPrompt", ""):
                raise SystemExit("LOCK miss %s %s" % (slug, code))
            pf["motionPrompt"] = pf["motionPrompt"].replace(OLD_LOCK, NEW_LOCK)
            pf["motionNegative"] = CHAR_MNEG
            cur.execute('UPDATE shots SET "promptFields"=%s::jsonb, "updatedAt"=now() WHERE "projectId"=%s AND "shotCode"=%s',
                        (json.dumps(pf, ensure_ascii=False), PROJ[slug], code))
            m += 1
    print("motion locks swapped:", m)

    p = 0
    for (slug, code), (old, new) in POS.items():
        cur.execute('SELECT "promptFields" FROM shots WHERE "projectId"=%s AND "shotCode"=%s', (PROJ[slug], code))
        pf = cur.fetchone()[0]
        if old not in pf.get("positive", ""):
            raise SystemExit("POS miss %s %s" % (slug, code))
        pf["positive"] = pf["positive"].replace(old, new)
        if "positivePrompt" in pf:
            pf["positivePrompt"] = pf["positivePrompt"].replace(old, new)
        cur.execute('UPDATE shots SET "promptFields"=%s::jsonb, "updatedAt"=now() WHERE "projectId"=%s AND "shotCode"=%s',
                    (json.dumps(pf, ensure_ascii=False), PROJ[slug], code))
        p += 1
    print("positives fixed:", p)

    cx.commit(); cur.close(); cx.close()
    print("ALL FIXES APPLIED")


if __name__ == "__main__":
    main()
