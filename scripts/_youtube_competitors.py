"""What the same format looks like on other channels, by real view counts.

The channel's own numbers say which of OUR videos worked. They cannot say which
THEMES the format rewards, because we only ever shot our own themes. This asks
YouTube search for the format itself — «(и это вся твоя жизнь)» and its
variants — and reports every hit with its channel and lifetime views, ours
included, so the comparison is on one scale.

Search returns ids only; views come from a second videos.list call. Both use the
stored upload token, which needs no extra scope for public data.

Writes a TSV to the scratchpad — piping Cyrillic titles through stdout on
Windows mangles them.

    python scripts/_youtube_competitors.py <out.tsv>
"""
import json
import os
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN_PATH = os.path.join(ROOT, "data", "youtube-auth.json")

QUERIES = [
    "и это вся твоя жизнь",
    "ты киллер и это вся твоя жизнь",
    "ты зэк и это вся твоя жизнь",
    "ты гопник и это вся твоя жизнь",
    "и это вся твоя жизнь 90е",
    "ты бандит и это вся твоя жизнь",
    "ты коллектор и это вся твоя жизнь",
    "ты вор и это вся твоя жизнь",
]


def env(name: str) -> str:
    for line in open(os.path.join(ROOT, ".env"), encoding="utf-8", errors="ignore"):
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("%s not found in .env" % name)


def post(url: str, data: dict) -> dict:
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode())
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def get(url: str, params: dict, token: str) -> dict:
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params),
                                 headers={"Authorization": "Bearer " + token})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "youtube_competitors.tsv"
    refresh = json.load(open(TOKEN_PATH, encoding="utf-8")).get("refresh_token")
    if not refresh:
        raise SystemExit("no refresh_token in " + TOKEN_PATH)
    token = post("https://oauth2.googleapis.com/token", {
        "client_id": env("YT_CLIENT_ID"),
        "client_secret": env("YT_CLIENT_SECRET"),
        "refresh_token": refresh,
        "grant_type": "refresh_token",
    })["access_token"]

    ids, found_by = set(), {}
    for q in QUERIES:
        try:
            res = get("https://www.googleapis.com/youtube/v3/search", {
                "part": "snippet", "q": q, "type": "video",
                "maxResults": 50, "relevanceLanguage": "ru", "order": "viewCount",
            }, token)
        except Exception as exc:  # noqa: BLE001
            print("query %r failed: %s" % (q, str(exc)[:160]), file=sys.stderr)
            continue
        for it in res.get("items", []):
            vid = it["id"]["videoId"]
            ids.add(vid)
            found_by.setdefault(vid, q)

    rows = []
    ordered = sorted(ids)
    for i in range(0, len(ordered), 50):
        batch = get("https://www.googleapis.com/youtube/v3/videos",
                    {"part": "snippet,statistics,contentDetails",
                     "id": ",".join(ordered[i:i + 50])}, token)
        for v in batch["items"]:
            rows.append((
                int(v["statistics"].get("viewCount", 0)),
                v["snippet"]["channelTitle"],
                v["snippet"]["title"],
                v["snippet"]["publishedAt"][:10],
                v["contentDetails"]["duration"],
                int(v["statistics"].get("likeCount", 0)),
                "https://youtu.be/" + v["id"],
            ))
    rows.sort(reverse=True)

    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("views\tchannel\ttitle\tpublished\tduration\tlikes\turl\n")
        for r in rows:
            f.write("\t".join(str(x) for x in r) + "\n")
    print("videos: %d  ->  %s" % (len(rows), out_path))


if __name__ == "__main__":
    main()
