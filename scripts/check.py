import re, sys, html

def strip_tags(s):
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).strip()

def top_level_li_text(li_inner):
    # remove nested ul/ol (and their li's) and nested p tags - these are validated
    # separately as their own elements; only the "lead" text of this li counts here.
    cleaned = re.sub(r'<(ul|ol)(?:\s[^>]*)?>.*?</\1>', '', li_inner, flags=re.S)
    return strip_tags(cleaned)

def check(path):
    with open(path, encoding='utf-8') as f:
        content = f.read()

    src_count = len(re.findall(r'class="src"', content))
    badge_count = len(re.findall(r'class="badge', content))

    # strip .tbl tables before paragraph scan (table cell text is exempt)
    no_tbl = re.sub(r'<div class="tbl">.*?</div>', '', content, flags=re.S)
    over_p = []
    for m in re.finditer(r'<p(?:\s[^>]*)?>(.*?)</p>', no_tbl, re.S):
        text = strip_tags(m.group(1))
        if len(text) > 350:
            over_p.append(len(text))

    # find every <li> by matching balanced-ish via manual scan (handle one level of nesting)
    over_li = []
    li_open_re = re.compile(r'<li(?:\s[^>]*)?>')
    pos = 0
    while True:
        m = li_open_re.search(content, pos)
        if not m:
            break
        start = m.end()
        depth = 1
        i = start
        while depth > 0:
            nextopen = content.find('<li', i)
            nextclose = content.find('</li>', i)
            if nextclose == -1:
                break
            if nextopen != -1 and nextopen < nextclose:
                depth += 1
                i = nextopen + 3
            else:
                depth -= 1
                i = nextclose + 5
        inner = content[start:i-5] if depth == 0 else content[start:]
        text = top_level_li_text(inner)
        if len(text) > 260:
            over_li.append(len(text))
        pos = m.end()

    cards = re.findall(r'<article class="card[^"]*"[^>]*>.*?</article>', content, re.S)
    missing_tldr = 0
    card_names = []
    for c in cards:
        h3m = re.search(r'<h3>(.*?)</h3>', c, re.S)
        name = strip_tags(h3m.group(1)) if h3m else '?'
        if 'class="tldr"' not in c:
            missing_tldr += 1
            card_names.append(name)

    print(f"== {path} ==")
    print(f"src chips: {src_count}")
    print(f"badges: {badge_count}")
    print(f"paragraphs over 350 chars: {len(over_p)} {over_p if over_p else ''}")
    print(f"list items over 260 chars (top-level text only): {len(over_li)} {over_li if over_li else ''}")
    print(f"cards found: {len(cards)}; cards missing tldr: {missing_tldr} {card_names}")
    print()

if __name__ == '__main__':
    for p in sys.argv[1:]:
        check(p)
