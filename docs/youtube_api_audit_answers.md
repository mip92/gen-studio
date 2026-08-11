# YouTube API Services — Compliance Audit: заготовки ответов

Форма: https://support.google.com/youtube/contact/yt_api_form (заполняет владелец
Google Cloud проекта 966803052219). Ответы ниже — на английском (форма
англоязычная), курсивом — пояснения по-русски. Смысл заявки: единственный
пользователь = владелец канала, заливаем только собственный контент на
собственный канал → снять принудительный private с загрузок через API.

---

**API Client name / Project number:** gen-studio (Google Cloud project 966803052219)

**Describe your application and its core functionality:**

> gen-studio is a private, single-user desktop content-production studio. It
> manages the full production pipeline of original narrated story videos
> (scriptwriting, image generation, voice-over, music, editing) and publishes
> the finished videos to the owner's own YouTube channel («Чужие сны»). The
> application runs locally on the owner's computer; there are no other users,
> no public access, and no third-party accounts involved.

*Приложение — личная студия производства контента; один пользователь, он же
владелец канала; никакого стороннего доступа.*

**Which YouTube API Services do you use and why?**

> - YouTube Data API v3: `videos.insert` and `thumbnails.set` to upload the
>   owner's own finished videos and their thumbnails to the owner's own
>   channel; `videos.list` / `channels.list` to read back statistics of the
>   same channel.
> - YouTube Analytics API v2 (read-only): retention, traffic-source and
>   engagement reports for the owner's own channel, used to improve future
>   videos.
> - YouTube Reporting API v1 (read-only): bulk daily reach reports
>   (thumbnail impressions / CTR) for the owner's own channel.

**OAuth scopes requested and justification:**

> - `youtube.upload` — required by `videos.insert` (uploading our own videos).
> - `youtube.force-ssl` — required by `thumbnails.set`.
> - `yt-analytics.readonly` — read-only analytics of our own channel.
>
> The OAuth consent flow is completed once by the channel owner on their own
> machine; tokens are stored locally and never leave the device.

**How many users does your application have?**

> One. The developer, the operator and the channel owner are the same person.
> The application is not distributed.

**Do you store or share YouTube user data?**

> No third-party user data is accessed at all. The only data processed is the
> owner's own channel analytics, stored locally on the owner's computer for
> content-planning purposes. Nothing is shared with anyone.

**Why do you need uploads to be public?**

> The application uploads finished videos scheduled for public release on the
> owner's channel. The current audit-pending policy forces API uploads to
> remain private, so the owner has to re-upload every video manually through
> YouTube Studio, which duplicates work. We request standard (non-restricted)
> upload capability for the owner's own channel only.

**Quota:**

> Current default quota is sufficient for reads. For uploads we publish up to
> 2 long videos and a few Shorts per week (≈10 uploads/week at 1600 units
> each); the default 10,000 units/day covers this. No quota increase is
> requested beyond the standard allocation.

*Квоту сверх стандартной не просим — так заявка проще проходит.*

**Что приложить (готовь заранее):**
- Скриншот формы «Заливка на YouTube» в приложении (страница проекта → YouTube).
- Скриншот экрана OAuth-подключения (`/youtube` статус «подключено: Чужие сны»).
- Ссылку на канал.

**После одобрения:** загрузки через API перестанут лочиться в private —
включаем полный автоматический пайплайн (видео + обложка ≤2МБ + описание из
паспорта релиза одной операцией). До тех пор — заливка руками по паспорту.
