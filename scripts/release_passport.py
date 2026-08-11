# -*- coding: utf-8 -*-
"""Паспорт релиза: один markdown со всеми копипаст-полями и чеклистом под
двухшаговый процесс заливки (related-ссылки шортсов пользователь ставит сам
между шагами — в чеклисте их НЕТ намеренно).

  python release_passport.py <slug>              -> data/<slug>/exports/release_passport.md
  python release_passport.py --thumb <файл.png>  -> <файл>_yt.jpg (<=2МБ, лимит Data API)
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def compress_thumb(src):
    base, _ = os.path.splitext(src)
    dst = base + '_yt.jpg'
    for q in (2, 3, 5, 7, 10, 15):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-q:v', str(q), dst], check=True)
        size = os.path.getsize(dst)
        if size <= 2 * 1024 * 1024:
            print(f'OK: {dst} ({size//1024} КБ, q={q})')
            return dst
    print(f'ВНИМАНИЕ: даже q=15 дал {size//1024} КБ — проверь исходник')
    return dst


def passport(slug):
    import psycopg2
    conn = psycopg2.connect(dbname='gen_studio', user='gen_studio', password='gen_studio', host='localhost')
    cur = conn.cursor()
    cur.execute('SELECT id, name, settings FROM projects WHERE slug=%s', (slug,))
    pid, name, settings = cur.fetchone()
    yt = (settings or {}).get('youtube', {})
    main, shorts = yt.get('main', {}), yt.get('shorts', {})

    plan_file = os.path.join(HERE, f'{slug}_shorts_plan.json')
    plan = json.load(open(plan_file, encoding='utf-8')) if os.path.exists(plan_file) else {'shorts': []}
    plan_slugs = [s['slug'] for s in plan['shorts']]

    L = []
    L.append(f'# Паспорт релиза — {name} (`{slug}`)\n')
    L.append('## Шаг 0 — до заливки')
    L.append('- [ ] Обложка ≤2МБ: `python scripts/release_passport.py --thumb <файл>` (иначе Studio, не API)')
    L.append('- [ ] CapCut-экспорт фильма и шортсов готов (субтитры/дорожки — как обычно)')
    L.append('- [ ] Время публикации: 16:00 (фактический слот канала)\n')

    L.append('## Шаг 1 — фильм\n')
    L.append(f'**Название:**\n```\n{main.get("title", "(не заполнено)")}\n```')
    L.append(f'**Описание:**\n```\n{main.get("description", "(не заполнено)")}\n```')
    tags = main.get('tags', [])
    L.append(f'**Теги (одной строкой):**\n```\n{", ".join(tags)}\n```')
    L.append('- [ ] Конечная заставка: подписка + предыдущий фильм')
    L.append('- [ ] После заливки: вставить ссылку на видео в приложение (страница /projects/… — поле YouTube URL); это подставит {{main_url}} в описания шортсов\n')

    L.append('## Шаг 2 — шортсы (related на фильм настраиваешь сам между шагами)\n')
    for s in plan['shorts']:
        pk = shorts.get(s['slug'], {})
        L.append(f'### {s["slug"]} — {pk.get("title", s.get("title", ""))}')
        L.append(f'**Описание (после выхода фильма):**\n```\n{pk.get("descAfter", "(не заполнено)")}\n```')
        stags = pk.get('tags', [])
        if stags:
            L.append(f'**Теги:** `{", ".join(stags)}`')
        L.append('')
    orphans = [k for k in shorts if k not in plan_slugs]
    if orphans:
        L.append(f'_Упаковка без плана (проверить): {", ".join(orphans)}_\n')

    L.append('## После релиза')
    L.append('- [ ] Закреплённый комментарий — спроси у Клода текст под этот фильм (вопрос-приманка по теме)')
    L.append('- [ ] Через 3–4 дня: Клод снимает удержание/скип и сравнивает с прогнозом\n')

    out_dir = os.path.join(ROOT, 'data', slug, 'exports')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, 'release_passport.md')
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
    print(f'OK: {out}')


if __name__ == '__main__':
    if sys.argv[1] == '--thumb':
        compress_thumb(sys.argv[2])
    else:
        passport(sys.argv[1])
