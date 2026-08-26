"""Pull the channel's real numbers: views and retention per video.

The app authorises YouTube for uploads and captions, but exposes no analytics
endpoint — so this reads the same stored refresh token directly and asks Google
twice:

  * Data API v3      — what exists: title, publish date, duration, lifetime views
  * Analytics API v2 — how it performed: views and averageViewPercentage, which
                       is the number that actually decides ranking

Retention is the point. YouTube ranks on watch time × completion, so a 30-minute
film held to 30% beats an hour held to 10% on both terms at once.

Writes a TSV to the scratchpad — piping Cyrillic titles through stdout on Windows
mangles them.

    python scripts/_youtube_stats.py <out.tsv>
"""
import json
import os
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN_PATH = os.path.join(ROOT, "data", "youtube-auth.json")


def env(name: str) -> str:
    for line in open(os.path.join(ROOT, ".env"), encoding="utf-8", errors="ignore"):
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("%s not found in .env" % name)


def post(url: str, data: dict) -> dict:
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=body)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def get(url: str, params: dict, token: str) -> dict:
    full = url + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(full, headers={"Authorization": "Bearer " + token})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "youtube_stats.tsv"
    stored = json.load(open(TOKEN_PATH, encoding="utf-8"))
    refresh = stored.get("refresh_token")
    if not refresh:
        raise SystemExit("no refresh_token in " + TOKEN_PATH)

    token = post("https://oauth2.googleapis.com/token", {
        "client_id": env("YT_CLIENT_ID"),
        "client_secret": env("YT_CLIENT_SECRET"),
        "refresh_token": refresh,
        "grant_type": "refresh_token",
    })["access_token"]

    # channel -> uploads playlist
    ch = get("https://www.googleapis.com/youtube/v3/channels",
             {"part": "contentDetails,snippet,statistics", "mine": "true"}, token)
    item = ch["items"][0]
    uploads = item["contentDetails"]["relatedPlaylists"]["uploads"]
    channel_id = item["id"]

    # every upload
    ids, page = [], None
    while True:
        params = {"part": "contentDetails", "playlistId": uploads, "maxResults": 50}
        if page:
            params["pageToken"] = page
        chunk = get("https://www.googleapis.com/youtube/v3/playlistItems", params, token)
        ids += [i["contentDetails"]["videoId"] for i in chunk["items"]]
        page = chunk.get("nextPageToken")
        if not page:
            break

    meta = {}
    for i in range(0, len(ids), 50):
        batch = get("https://www.googleapis.com/youtube/v3/videos",
                    {"part": "snippet,statistics,contentDetails",
                     "id": ",".join(ids[i:i + 50])}, token)
        for v in batch["items"]:
            meta[v["id"]] = {
                "title": v["snippet"]["title"],
                "published": v["snippet"]["publishedAt"][:10],
                "views": int(v["statistics"].get("viewCount", 0)),
                "duration": v["contentDetails"]["duration"],
            }

    # retention, per video, lifetime
    retention = {}
    try:
        rep = get("https://youtubeanalytics.googleapis.com/v2/reports", {
            "ids": "channel==" + channel_id,
            "startDate": "2020-01-01",
            "endDate": "2030-01-01",
            "metrics": "views,averageViewDuration,averageViewPercentage",
            "dimensions": "video",
            "sort": "-views",
            "maxResults": 200,
        }, token)
        for row in rep.get("rows", []):
            retention[row[0]] = {"views": row[1], "avg_sec": row[2], "avg_pct": row[3]}
    except Exception as exc:  # noqa: BLE001
        print("analytics unavailable: %s" % str(exc)[:200], file=sys.stderr)

    rows = []
    for vid, m in meta.items():
        r = retention.get(vid, {})
        rows.append((m["views"], vid, m["title"], m["published"], m["duration"],
                     r.get("avg_pct", ""), r.get("avg_sec", "")))
    rows.sort(reverse=True)

    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("views\tvideoId\ttitle\tpublished\tduration\tavg_view_pct\tavg_view_sec\n")
        for r in rows:
            f.write("\t".join(str(x) for x in (r[0], r[1], r[2], r[3], r[4], r[5], r[6])) + "\n")
    print("videos: %d  ->  %s" % (len(rows), out_path))


if __name__ == "__main__":
    main()
