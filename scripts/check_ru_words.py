# -*- coding: utf-8 -*-
"""Report which of the given Russian words are not in a real Russian lexicon.

Used by ThumbnailRenderService as the last gate on model-written thumbnail
captions. The text model invents plausible-looking non-words — «СТАНДОР»,
«ТУДЕЛКА», «ВЕЗДА», «СЛАМЛЯН» — and a caption is drawn onto the cover with a
font, so garbage there wastes the whole render.

Lexicon: RUAccent's `accents.json.gz` (3.19M inflected forms, keys are plain
lowercase words). It ships with the TTS stack we already depend on, so this adds
no new download. Empirically it rejects every observed non-word while passing
every real word tested — but it is a WORDLIST, not a grammar checker: it cannot
see that «30 ЛЕТ ПИСЬМЕН» fails to agree, because both words exist.

I/O is JSON over stdin/stdout, explicitly UTF-8: Cyrillic through argv or the
default Windows console encoding arrives mangled.

  in : {"words": ["голос", "туделка"]}
  out: {"ok": true, "unknown": ["туделка"], "checked": 2, "lexicon": 3194879}

On any failure it answers {"ok": false, "error": "..."} with exit code 0 — the
caller must degrade to its own mechanical checks rather than block a cover on a
missing dictionary.
"""
import sys, io, os, json, gzip

DEFAULT_DICT = os.path.join(
    os.environ.get("KOHYA_DIR", r"E:\kohya_ss"),
    "venv", "Lib", "site-packages", "ruaccent", "dictionary", "accents.json.gz",
)


def main() -> int:
    out = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", newline="\n")
    try:
        payload = json.load(io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8"))
        words = [str(w).strip().lower() for w in payload.get("words", [])]
        words = [w for w in words if w]

        path = payload.get("dict") or os.environ.get("RUACCENT_DICT") or DEFAULT_DICT
        if not os.path.exists(path):
            json.dump({"ok": False, "error": "lexicon not found: %s" % path}, out, ensure_ascii=False)
            out.flush()
            return 0

        with gzip.open(path, "rt", encoding="utf-8") as f:
            lex = json.load(f)

        # `ё` is routinely typed as `е`; accept either spelling so a correct word
        # is never rejected over a typographic convention.
        def known(w: str) -> bool:
            if w in lex:
                return True
            if "е" in w and w.replace("е", "ё") in lex:
                return True
            if "ё" in w and w.replace("ё", "е") in lex:
                return True
            return False

        unknown = sorted({w for w in words if not known(w)})
        json.dump({"ok": True, "unknown": unknown, "checked": len(words), "lexicon": len(lex)},
                  out, ensure_ascii=False)
        out.flush()
        return 0
    except Exception as e:  # noqa: BLE001 — the caller degrades, never crashes
        json.dump({"ok": False, "error": "%s: %s" % (type(e).__name__, e)}, out, ensure_ascii=False)
        out.flush()
        return 0


if __name__ == "__main__":
    sys.exit(main())
