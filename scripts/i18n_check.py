"""Validate Polish translation files against the English extraction.
Usage: python scripts/i18n_check.py            -> all content/i18n/pl/pl-NN.json files
       python scripts/i18n_check.py 07 12      -> only those pl-NN.json numbers
       python scripts/i18n_check.py strings    -> validate content/i18n/pl.strings.json
Prints one line per failing key; exit code 1 if anything failed."""
import sys, os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(ROOT, "content", "i18n")
TOK = re.compile(r"⟦(\d+)⟧")
TAG = re.compile(r"<[^>]+>")
CLASSES = ["Templar", "Gladiator", "Assassin", "Ranger", "Sorcerer", "Spiritmaster", "Cleric", "Chanter"]
CLS_RE = re.compile(r"\b(" + "|".join(CLASSES) + r")\b")
BAD_CLS = re.compile(r"\b(Templar|Gladiator|Assassin|Ranger|Sorcerer|Spiritmaster|Cleric|Chanter)(a|em|owi|ów|ami|ach|y|ie|ze|zy|ów|ami|ów|ki)\b", re.I)
LETTERS = re.compile(r"[A-Za-z]{2,}")


def check_pair(k, en, pl, errs):
    if not isinstance(pl, str) or not pl.strip():
        errs.append((k, "empty or not a string")); return
    if "\u2014" in pl: errs.append((k, "em dash"))
    if sorted(TOK.findall(en)) != sorted(TOK.findall(pl)): errs.append((k, "token mismatch %s vs %s" % (TOK.findall(en), TOK.findall(pl))))
    if TAG.findall(en) != TAG.findall(pl): errs.append((k, "tag mismatch %s vs %s" % (TAG.findall(en), TAG.findall(pl))))
    stripped = TAG.sub("", pl)
    if "<" in stripped or ">" in stripped: errs.append((k, "stray < or > outside tags"))
    if re.search(r"&(?!(amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-fA-F]+);)", pl): errs.append((k, "raw & not escaped"))
    for c in CLASSES:
        if len(re.findall(r"\b%s\b" % c, en)) != len(re.findall(r"\b%s\b" % c, pl)):
            errs.append((k, "class name count changed: " + c))
    m = BAD_CLS.search(pl)
    if m and not re.search(r"\b" + re.escape(m.group(0)) + r"\b", en): errs.append((k, "inflected class name: " + m.group(0)))
    if pl.strip() == en.strip() and len(LETTERS.findall(TAG.sub("", TOK.sub("", en)))) > 3: print("WARN | %s | identical to English (fine only if it is all names): %s" % (k, en[:80]))
    for num in re.findall(r"\b\d{4}-\d{2}(?:-\d{2})?\b|\b\d+(?:[.,]\d+)?%", en):
        if num not in pl: errs.append((k, "number/date missing: " + num))


def main():
    args = sys.argv[1:]
    fail = 0
    if args == ["strings"]:
        en = json.load(open(os.path.join(I18N, "en.strings.json"), encoding="utf-8"))
        pl = json.load(open(os.path.join(I18N, "pl.strings.json"), encoding="utf-8"))
        errs = []
        for s in en:
            if s not in pl: errs.append((s, "missing")); continue
            v = pl[s]
            if "\u2014" in v: errs.append((s, "em dash"))
            if re.findall(r"\{\w+\}", s) and sorted(re.findall(r"\{\w+\}", s)) != sorted(re.findall(r"\{\w+\}", v)): errs.append((s, "placeholder mismatch"))
            for c in CLASSES:
                if len(re.findall(r"\b%s\b" % c, s)) != len(re.findall(r"\b%s\b" % c, v)): errs.append((s, "class name count changed"))
        for s in pl:
            if s not in en: errs.append((s, "unknown key"))
        for e in errs: print("strings | %s | %s" % e)
        print("strings: %d checked, %d errors" % (len(en), len(errs)))
        sys.exit(1 if errs else 0)
    en_blocks = json.load(open(os.path.join(I18N, "en.blocks.json"), encoding="utf-8"))
    nums = args or sorted(f[3:5] for f in os.listdir(os.path.join(I18N, "pl")) if re.match(r"pl-\d\d\.json$", f))
    for n in nums:
        pp = os.path.join(I18N, "pl", "pl-%s.json" % n)
        if not os.path.exists(pp): print("%s | missing file %s" % (n, pp)); fail += 1; continue
        try: pl = json.load(open(pp, encoding="utf-8"))
        except Exception as e: print("%s | invalid JSON: %s" % (n, e)); fail += 1; continue
        errs = []
        for k, v in pl.items():
            if k not in en_blocks:
                errs.append((k, "unknown key")); continue
            check_pair(k, en_blocks[k]["en"], v, errs)
        for e in errs: print("%s | %s | %s" % (n, e[0], e[1]))
        print("chunk %s: %d keys, %d errors" % (n, len(pl), len(errs)))
        fail += len(errs)
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
