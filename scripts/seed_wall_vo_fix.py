# -*- coding: utf-8 -*-
"""VO polish for `wall` per skill 3.3a: de-cluster 'впервые' (keep <=1 per chapter),
replace explainer 'понимаешь что' with showing, trim filler 'по-настоящему'. Idempotent UPDATE."""
import sys, psycopg2
DSN = dict(host="localhost", dbname="gen_studio", user="gen_studio", password="gen_studio")
PID = "7e580000-0000-4000-8000-000000000001"
FIX = {
 # de-cluster впервые (drop the weaker of two-per-chapter)
 "CH05_SH07":"ты подкрашиваешь губы материной помадой, и зеркало вдруг отвечает тебе одобрением.",
 "CH07_SH07":"и наутро ты чувствуешь это, сладкую ночь и холодное гулкое утро наедине с собой.",
 "CH13_SH02":"здесь так тепло и тихо, и тебе вдруг совсем не хочется бежать к утру в чужую ночь.",
 "CH28_SH08":"ты сидишь на краю кровати и наконец узнаёшь на себе, каково это, быть просто использованной.",
 "CH37_SH03":"ты держишь его и на этот раз не захлопываешь шкатулку, а позволяешь себе всё вспомнить.",
 # explainer 'понимаешь что' -> showing / 'до тебя доходит'
 "CH14_SH10":"ты сжимаешь этот ключ в кулаке и не знаешь, спасение это твоё или всё-таки ловушка.",
 "CH17_SH08":"ты идёшь вдоль стены, и до тебя доходит, что сама построила такую же, только внутри себя.",
 "CH32_SH09":"ты достаёшь ключ Андреаса, и до тебя доходит, что и его дверь ты закрыла этой же стеной.",
 "CH33_SH10":"вот и весь итог, долгая жизнь, полная мужчин, и при этом ты совершенно одна.",
 # trim filler по-настоящему + drop впервые from CH25_SH10
 "CH25_SH10":"и теперь ты всерьёз боишься того, что всегда было твоей силой, своего возраста.",
 "CH17_SH05":"вдруг однажды ты захочешь вернуться насовсем, и тогда эта дверь всё ещё будет открыта.",
 "CH33_SH01":"годы идут, и однажды охотиться уже не на что и незачем, ты состарилась окончательно.",
}
def main():
    conn = psycopg2.connect(**DSN); conn.autocommit = False; cur = conn.cursor(); upd=miss=0
    try:
        for code, txt in FIX.items():
            cur.execute('UPDATE shots SET "narrationText"=%s, '
                '"promptFields"=jsonb_set("promptFields",\'{narrationRu}\',to_jsonb(%s::text)), '
                '"updatedAt"=now() WHERE "projectId"=%s AND "shotCode"=%s', (txt, txt, PID, code))
            if cur.rowcount==0: miss+=1; print("  MISSING:",code)
            else: upd+=cur.rowcount
        conn.commit()
        print(f"OK VO fix: updated {upd}, missing {miss}")
    except Exception as e:
        conn.rollback(); print("ROLLBACK:", repr(e).encode('ascii','replace').decode()); sys.exit(1)
    finally:
        cur.close(); conn.close()
if __name__ == "__main__":
    main()
