"""Build public/content/** and src/generated/** for the AION 2 Compendium Vite app.

    python scripts/build_content.py            build the JSON the React app fetches at runtime
    python scripts/build_content.py --extract  regenerate content/i18n/en.blocks.json,
                                                content/i18n/en.strings.json, and
                                                content/i18n/todo/en-NN.json work units for
                                                any English block that still has no Polish entry

Pipeline for the normal build
  1. Assemble each page in the Pages table (see ARCHITECTURE.md) from its content/fragments/*.html
     pieces (concatenated in document order, one literal string for the "avoid" page intro).
  2. Parse every page into a small HTML tree (TreeBuilder) and tag every translatable block with a
     sha1-of-normalized-English-HTML key (Tagger). Keys must stay byte-identical or the 3847 existing
     Polish translations in content/i18n/pl/*.json stop matching.
  3. Walk each page's tree twice, once per language, turning it into the Block list ARCHITECTURE.md
     and src/content-types.ts describe (cards, the class head, roadmap phases, plain HTML, and one
     merged sources card per page). Polish substitution happens while rendering: a tagged node whose
     key has a Polish entry gets that entry's HTML with its <tok>n</tok> placeholders swapped back for
     the original atoms (links, icons, checkboxes) in document order, once at build time.
  4. Citation chips (a.src) are renumbered per card and per phase, skipping table and sources content,
     while everything else about the fragment HTML is left untouched.
  5. The UI dictionary (src/generated/ui.pl.json) is a copy of content/i18n/pl.strings.json, the
     single source of truth for interface strings, plus an HTML-unescaped variant of any key that
     still contains entities (build_ui_pl).

The --extract pipeline reuses the same assembly and tagging code to find every translatable block,
scans src/**/*.tsx and src/**/*.ts for T('...')/TH('...') calls plus data-title/title/placeholder/
aria-label attributes and content/fragments/tasks.json fields for plain UI strings, and writes the
translator work queue (content/i18n/todo/en-NN.json) for anything still missing a Polish entry.
"""
import glob
import hashlib
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
FRAG = os.path.join(CONTENT, "fragments")
I18N = os.path.join(CONTENT, "i18n")
PUBLIC_CONTENT = os.path.join(ROOT, "public", "content")
GENERATED = os.path.join(ROOT, "src", "generated")
COMPILED_DATE = "2026-09-12"


def fail(msg):
    raise SystemExit("build failed: " + msg)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write_text(path, text):
    """UTF-8, no BOM, LF newlines, as every generated file in this repo must be."""
    text = text.replace("\r\n", "\n")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def write_json(path, obj, indent=2):
    write_text(path, json.dumps(obj, ensure_ascii=False, indent=indent) + "\n")


# =====================================================================================
# The i18n tagging pipeline (TreeBuilder + Tagger). Do not change the logic in this
# section: the sha1 keys it produces must stay identical to the ones the 3847 existing
# Polish translations in content/i18n/pl/*.json were made against.
# =====================================================================================

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
BLOCK = {"div", "p", "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "h1", "h2", "h3", "h4",
         "h5", "h6", "dl", "dt", "dd", "section", "article", "header", "footer", "nav", "aside", "main", "figure",
         "figcaption", "blockquote", "form", "details", "summary", "hr", "pre", "select", "option", "optgroup",
         "button", "label", "fieldset", "legend"}
ATOMS = {"svg", "input", "a", "img", "br", "select", "textarea", "video", "audio", "iframe"}
RECURSE_ATOMS = {"select"}
SKIP = {"script", "style", "template", "title", "head"}
ATTRS = ("title", "placeholder", "aria-label", "data-title")
LETTERS = re.compile(r"[A-Za-z]{2,}")
TOK_OPEN, TOK_CLOSE = "⟦", "⟧"


class Node:
    __slots__ = ("kind", "tag", "raw", "children", "raw_end", "attrs", "parent", "i18n")

    def __init__(self, kind, tag=None, raw="", attrs=None):
        self.kind, self.tag, self.raw, self.attrs = kind, tag, raw, attrs or []
        self.children, self.raw_end, self.parent, self.i18n = [], "", None, None


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.root = Node("el", "#root")
        self.stack = [self.root]

    def _add(self, n):
        n.parent = self.stack[-1]
        self.stack[-1].children.append(n)
        return n

    def handle_starttag(self, tag, attrs):
        n = self._add(Node("el", tag, self.get_starttag_text(), attrs))
        if tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        self._add(Node("el", tag, self.get_starttag_text(), attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack[i].raw_end = "</%s>" % tag
                del self.stack[i:]
                return
        self._add(Node("raw", raw="</%s>" % tag))  # stray end tag, kept so the round trip stays exact

    def handle_data(self, d): self._add(Node("text", raw=d))
    def handle_entityref(self, name): self._add(Node("text", raw="&%s;" % name))
    def handle_charref(self, name): self._add(Node("text", raw="&#%s;" % name))
    def handle_comment(self, d): self._add(Node("raw", raw="<!--%s-->" % d))
    def handle_decl(self, d): self._add(Node("raw", raw="<!%s>" % d))
    def handle_pi(self, d): self._add(Node("raw", raw="<?%s>" % d))
    def unknown_decl(self, d): self._add(Node("raw", raw="<![%s]>" % d))


def serialize(n, out):
    if n.kind == "el":
        if n.tag != "#root":
            raw = n.raw
            if n.i18n and "data-i18n=" not in raw:
                raw = raw[:-1].rstrip("/").rstrip() + ' data-i18n="%s">' % n.i18n
            out.append(raw)
        for c in n.children:
            serialize(c, out)
        if n.tag != "#root":
            out.append(n.raw_end)
    else:
        out.append(n.raw)


def has_block_desc(n):
    for c in n.children:
        if c.kind == "el":
            if c.tag in BLOCK:
                return True
            if c.tag in ATOMS:
                continue
            if has_block_desc(c):
                return True
    return False


def text_of(nodes):
    buf = []
    for c in nodes:
        if c.kind == "text":
            buf.append(c.raw)
        elif c.kind == "el" and c.tag not in ATOMS:
            buf.append(text_of(c.children))
    return "".join(buf)


def key_text(nodes, atoms):
    out = []
    for c in nodes:
        if c.kind == "el":
            if c.tag in ATOMS:
                atoms.append(c)
                out.append(TOK_OPEN + str(len(atoms)) + TOK_CLOSE)
            else:
                out.append(c.raw)
                out.append(key_text(c.children, atoms))
                out.append(c.raw_end)
        else:
            out.append(c.raw)
    return "".join(out)


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def keyof(t):
    return hashlib.sha1(t.encode("utf-8")).hexdigest()[:8]


class Tagger:
    def __init__(self):
        self.blocks = {}
        self.order = []
        self.ctx_page = ""
        self.ctx_card = ""

    def register(self, nodes):
        atoms = []
        t = norm(key_text(nodes, atoms))
        if not LETTERS.search(text_of(nodes)):
            return None
        k = keyof(t)
        if k not in self.blocks:
            self.blocks[k] = {"en": t, "ctx": (self.ctx_page + " / " + self.ctx_card).strip(" /")}
            self.order.append(k)
        return k, atoms

    def process(self, n):
        if n.kind != "el":
            return
        if n.tag in SKIP or n.tag == "svg":
            return
        attrs = dict(n.attrs)
        if n.tag == "section" and "page" in (attrs.get("class") or ""):
            self.ctx_page = attrs.get("data-title") or attrs.get("id") or ""
            self.ctx_card = ""
        if n.tag in ("h2", "h3"):
            self.ctx_card = norm(re.sub(r"<[^>]+>", "", key_text(n.children, [])))
        if n.tag in ATOMS and n.tag not in RECURSE_ATOMS:
            return
        if n.tag not in ATOMS and not has_block_desc(n) and n.tag != "#root":
            r = self.register(n.children)
            if r:
                n.i18n = r[0]
                for a in r[1]:
                    if a.tag in RECURSE_ATOMS:
                        for c in a.children:
                            self.process(c)
                return
            for c in n.children:
                self.process(c)
            return
        new_children = []
        run = []

        def flush():
            if not run:
                return
            direct = any(c.kind == "text" and LETTERS.search(c.raw) for c in run)
            if direct:
                r = self.register(run)
                if r:
                    w = Node("el", "span", "<span>")
                    w.raw_end = "</span>"
                    w.i18n = r[0]
                    for c in run:
                        c.parent = w
                    w.children = list(run)
                    new_children.append(w)
                    for a in r[1]:
                        if a.tag in RECURSE_ATOMS:
                            for c in a.children:
                                self.process(c)
                    run.clear()
                    return
            for c in run:
                self.process(c)
                new_children.append(c)
            run.clear()

        for c in n.children:
            if c.kind == "el" and c.tag in BLOCK:
                flush()
                self.process(c)
                new_children.append(c)
            else:
                run.append(c)
        flush()
        n.children = new_children


def collect_attr_strings(n, out):
    if n.kind != "el" or n.tag in SKIP:
        return
    for k, v in n.attrs:
        if k in ATTRS and v and LETTERS.search(v):
            out.setdefault(v, None)
    for c in n.children:
        collect_attr_strings(c, out)


CALL_RE = re.compile(r"\b(?:T|TH)\(\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")")


def source_strings(src, out):
    """Every T('...') / TH('...') call in a .ts or .tsx file, single or double quoted."""
    for m in CALL_RE.finditer(src):
        if m.group(1) is not None:
            s = m.group(1).replace("\\'", "'")
        else:
            s = m.group(2).replace('\\"', '"')
        if LETTERS.search(s):
            out.setdefault(s, None)


def task_strings(tasks_json, out):
    try:
        tasks = json.loads(tasks_json)
    except Exception:
        return
    for t in tasks:
        for f in ("name", "group", "note", "unit"):
            v = t.get(f)
            if v and LETTERS.search(v):
                out.setdefault(v, None)


# =====================================================================================
# Page assembly.
# =====================================================================================

# The literal intro prepended before part-avoid-from-01.html for the "avoid" page.
AVOID_INTRO = ('<div class="intro"><h2>What to avoid</h2><p class="lead">Beginner mistakes collected from community '
               'write-ups, grouped by theme. Each line links to where it came from.</p></div>')

CLASS_IDS = ["templar", "gladiator", "assassin", "ranger", "sorcerer", "spiritmaster", "cleric", "chanter"]

# page id -> ordered list of fragment filenames (relative to content/fragments) or literal HTML strings.
# Matches the Pages table in ARCHITECTURE.md, minus "home" and "checklist" which have no fragment
# source (Home is JSX, checklist is tasks.json only).
PAGES = {
    "start": ["frag-start.html"],
    "priorities": ["frag-priorities.html"],
    "systems": ["frag-systems.html", "part-systems-missing.html"],
    "dungeons": ["frag-dungeons.html"],
    "money": ["frag-money.html"],
    "avoid": [AVOID_INTRO, "part-avoid-from-01.html"],
    "classes": ["part-class-picker.html"],
    "class-templar": ["frag-class-templar.html"],
    "class-gladiator": ["frag-class-gladiator.html"],
    "class-assassin": ["frag-class-assassin.html"],
    "class-ranger": ["frag-class-ranger.html"],
    "class-sorcerer": ["frag-class-sorcerer.html"],
    "class-spiritmaster": ["frag-class-spiritmaster.html"],
    "class-cleric": ["frag-class-cleric.html"],
    "class-chanter": ["frag-class-chanter.html"],
    "roadmap": ["frag-roadmap.html"],
    "sources": ["frag-sources.html", "part-glossary-from-02.html", "part-glossary-missing.html"],
}
PAGE_ORDER = list(PAGES.keys())

PAGE_TITLES = {
    "start": "Start Here",
    "priorities": "Priorities",
    "systems": "Systems",
    "dungeons": "Dungeons and Energy",
    "money": "Premium and Spending",
    "avoid": "What to avoid",
    "classes": "Classes",
    "class-templar": "Templar",
    "class-gladiator": "Gladiator",
    "class-assassin": "Assassin",
    "class-ranger": "Ranger",
    "class-sorcerer": "Sorcerer",
    "class-spiritmaster": "Spiritmaster",
    "class-cleric": "Cleric",
    "class-chanter": "Chanter",
    "roadmap": "Progression roadmap",
    "sources": "Sources and Glossary",
}

TOKEN_RE = re.compile(TOK_OPEN + r"(\d+)" + TOK_CLOSE)


def fragment_html(name):
    """A fragment filename is read from disk; anything else is a literal HTML string (the avoid intro)."""
    if name.endswith(".html"):
        return read(os.path.join(FRAG, name))
    return name


def parse_fragment(src):
    p = TreeBuilder()
    p.feed(src)
    p.close()
    rt = []
    serialize(p.root, rt)
    if "".join(rt) != src:
        fail("round trip mismatch parsing a fragment, first 200 chars: " + src[:200])
    return p.root


def load_polish_blocks():
    blocks = {}
    pld = os.path.join(I18N, "pl")
    if os.path.isdir(pld):
        for f in sorted(os.listdir(pld)):
            if f.endswith(".json"):
                blocks.update(json.loads(read(os.path.join(pld, f))))
    return blocks


def load_polish_strings():
    p = os.path.join(I18N, "pl.strings.json")
    return json.loads(read(p)) if os.path.exists(p) else {}


# ---- tree helpers -------------------------------------------------------------------

def class_list(node):
    for k, v in node.attrs:
        if k == "class":
            return (v or "").split()
    return []


def attr(node, name):
    for k, v in node.attrs:
        if k == name:
            return v
    return None


def find_child(node, tag, cls=None):
    if node is None:
        return None
    for c in node.children:
        if c.kind == "el" and c.tag == tag and (cls is None or cls in class_list(c)):
            return c
    return None


def find_all_children(node, tag, cls=None):
    if node is None:
        return []
    return [c for c in node.children if c.kind == "el" and c.tag == tag and (cls is None or cls in class_list(c))]


def html_to_text(html_str):
    return re.sub(r"<[^>]+>", "", html_str)


def count_src(node):
    total = 0
    if node.kind == "el":
        if node.tag == "a" and "src" in class_list(node):
            total += 1
        for c in node.children:
            total += count_src(c)
    return total


# ---- rendering (translation happens here) --------------------------------------------

def render(node, lang, pl_blocks):
    """Serialize a node to HTML. For lang='pl', any tagged descendant with a Polish entry gets that
    entry's HTML instead, with its <tok>n</tok> placeholders swapped back for the original atoms
    (links, icons, checkboxes, selects) in document order. Untagged or untranslated nodes, and every
    node when lang='en', are serialized verbatim (their own raw open/close tags, never a data-i18n
    attribute: that was a runtime detail, this is a build-time substitution)."""
    if node.kind != "el":
        return node.raw
    if lang == "pl" and node.i18n and node.i18n in pl_blocks:
        atoms = []
        key_text(node.children, atoms)
        pl_html = pl_blocks[node.i18n]
        toks = sorted(int(x) for x in TOKEN_RE.findall(pl_html))
        expected = list(range(1, len(atoms) + 1))
        if toks and toks != expected:
            print("warn: token mismatch for block %s, falling back to English" % node.i18n)
            inner = "".join(render(c, lang, pl_blocks) for c in node.children)
        else:
            atom_html = [render(a, lang, pl_blocks) for a in atoms]

            def sub(m):
                i = int(m.group(1)) - 1
                return atom_html[i] if 0 <= i < len(atom_html) else m.group(0)

            inner = TOKEN_RE.sub(sub, pl_html)
    else:
        inner = "".join(render(c, lang, pl_blocks) for c in node.children)
    if node.tag == "#root":
        return inner
    return node.raw + inner + node.raw_end


def render_children(node, lang, pl_blocks):
    return "".join(render(c, lang, pl_blocks) for c in node.children)


def plain_text(node, lang, pl_blocks):
    return norm(html_to_text(render(node, lang, pl_blocks)))


# ---- citation chips -------------------------------------------------------------------

CHIP_RE = re.compile(r'<a class="src"([^>]*)>([^<]*)</a>')


def find_skip_ranges(html_str):
    """Byte ranges of html_str that fall inside a <div class="tbl"> or <div class="sources"> block,
    tracked with a simple nested-<div> depth counter so chips inside stay untouched."""
    ranges = []
    for opener in ('<div class="tbl">', '<div class="sources">'):
        start = 0
        while True:
            i = html_str.find(opener, start)
            if i == -1:
                break
            depth = 1
            j = i + len(opener)
            while depth > 0:
                nd = html_str.find("<div", j)
                nc = html_str.find("</div>", j)
                if nc == -1:
                    j = len(html_str)
                    break
                if nd != -1 and nd < nc:
                    depth += 1
                    j = nd + 4
                else:
                    depth -= 1
                    j = nc + 6
            ranges.append((i, j))
            start = j
    return ranges


def rewrite_chips(html_str, start_n=1):
    """Number every a.src chip outside a div.tbl or div.sources, starting at start_n. Returns the
    rewritten string and the next free number, so callers can thread numbering across several pieces
    of the same card or phase."""
    skip_ranges = find_skip_ranges(html_str)

    def in_skip(pos):
        return any(s <= pos < e for s, e in skip_ranges)

    out = []
    last = 0
    n = start_n
    for m in CHIP_RE.finditer(html_str):
        out.append(html_str[last:m.start()])
        if in_skip(m.start()):
            out.append(m.group(0))
        else:
            attrs, text = m.group(1), m.group(2)
            href_m = re.search(r'href="([^"]*)"', attrs)
            href = href_m.group(1) if href_m else ""
            out.append('<a class="src cite" href="%s" target="_blank" rel="noopener" data-n="%d" '
                       'title="%s (opens in new tab)"><span class="cite-full">%s</span>'
                       '<span class="cite-n">%d</span></a>' % (href, n, text, text, n))
            n += 1
        last = m.end()
    out.append(html_str[last:])
    return "".join(out), n


# ---- card / phase / classHead extraction ----------------------------------------------

def is_sources_card(article):
    header = find_child(article, "header", "card-h")
    h3 = find_child(header, "h3")
    if not h3:
        return False
    return bool(re.match(r"(?i)sources", norm(text_of(h3.children))))


def extract_compare(table, lang, pl_blocks):
    thead = find_child(table, "thead")
    tbody = find_child(table, "tbody")
    header_row = find_child(thead, "tr") if thead else None
    ths = find_all_children(header_row, "th") if header_row else []
    heads = [plain_text(th, lang, pl_blocks) for th in ths]
    heads_en = [plain_text(th, "en", pl_blocks) for th in ths]
    rows = []
    for tr in find_all_children(tbody, "tr"):
        tds = find_all_children(tr, "td")
        if not tds:
            continue
        name = plain_text(tds[0], lang, pl_blocks)
        name_en_lower = plain_text(tds[0], "en", pl_blocks).lower()
        class_id = None
        for cid in CLASS_IDS:
            if name_en_lower.startswith(cid):
                class_id = cid
                break
        cells_html = [render_children(td, lang, pl_blocks) for td in tds[1:]]
        row = {"name": name, "cellsHtml": cells_html}
        if class_id:
            row["classId"] = class_id
        rows.append(row)
    return {"heads": heads, "headsEn": heads_en, "rows": rows}


def build_card(article, page_id, n, lang, pl_blocks, is_classes_page):
    header = find_child(article, "header", "card-h")
    h3 = find_child(header, "h3")
    if header is None or h3 is None:
        fail("card without a header/h3 on page " + page_id)
    idx = header.children.index(h3)
    extras_raw = "".join(render(c, lang, pl_blocks) for c in header.children[idx + 1:])
    card_b = find_child(article, "div", "card-b")
    if card_b is None:
        fail("card without a card-b on page " + page_id)

    title = plain_text(h3, lang, pl_blocks)
    title_en = plain_text(h3, "en", pl_blocks)
    tags = attr(article, "data-tags") or ""
    level_raw = attr(article, "data-level")
    level = int(level_raw) if level_raw not in (None, "") else None
    card_id = attr(article, "id") or ("%s-c%d" % (page_id, n))

    compare = None
    body_after_html = None
    table = None
    tbl_idx = None
    if is_classes_page:
        for i, c in enumerate(card_b.children):
            if c.kind == "el" and c.tag == "div" and "tbl" in class_list(c):
                t = find_child(c, "table")
                if t is not None:
                    tbl_idx, table = i, t
                    break

    if table is not None:
        compare = extract_compare(table, lang, pl_blocks)
        before, after = card_b.children[:tbl_idx], card_b.children[tbl_idx + 1:]
        extras_html, n_cite = rewrite_chips(extras_raw, 1)
        body_html, n_cite = rewrite_chips("".join(render(c, lang, pl_blocks) for c in before), n_cite)
        body_after_html, n_cite = rewrite_chips("".join(render(c, lang, pl_blocks) for c in after), n_cite)
    else:
        extras_html, n_cite = rewrite_chips(extras_raw, 1)
        body_html, n_cite = rewrite_chips("".join(render(c, lang, pl_blocks) for c in card_b.children), n_cite)

    block = {
        "type": "card", "id": card_id, "title": title, "titleEn": title_en,
        "headExtrasHtml": extras_html, "bodyHtml": body_html, "tags": tags,
    }
    if level is not None:
        block["level"] = level
    if compare is not None:
        block["compare"] = compare
        block["bodyAfterHtml"] = body_after_html
    return block


def build_class_head(div, lang, pl_blocks):
    return {"type": "classHead", "role": attr(div, "data-role") or "", "html": render_children(div, lang, pl_blocks)}


def build_phase(section, page_id, idx, lang, pl_blocks):
    header = find_child(section, "header", "phase-h")
    num_span = find_child(header, "span", "phase-num")
    num = norm(text_of(num_span.children)) if num_span is not None else ""
    title_div = next((c for c in header.children if c.kind == "el" and c.tag == "div"), None)
    h3 = find_child(title_div, "h3") if title_div is not None else find_child(header, "h3")
    title = plain_text(h3, lang, pl_blocks) if h3 is not None else ""
    goal_p = find_child(title_div, "p", "phase-goal") if title_div is not None else find_child(header, "p", "phase-goal")

    n_cite = 1
    goal_html = ""
    if goal_p is not None:
        goal_html, n_cite = rewrite_chips(render_children(goal_p, lang, pl_blocks), n_cite)

    phase_b = find_child(section, "div", "phase-b")
    ul = find_child(phase_b, "ul", "chk")
    milestones = []
    if ul is not None:
        for li in find_all_children(ul, "li"):
            label = find_child(li, "label")
            input_node = next((c for c in label.children if c.kind == "el" and c.tag == "input"), None)
            key = attr(input_node, "data-key") or "" if input_node is not None else ""
            label_children = [c for c in label.children if c is not input_node]
            label_raw = "".join(render(c, lang, pl_blocks) for c in label_children)
            label_html, n_cite = rewrite_chips(label_raw, n_cite)
            why_p = find_child(li, "p", "why")
            why_html = ""
            if why_p is not None:
                why_html, n_cite = rewrite_chips(render_children(why_p, lang, pl_blocks), n_cite)
            milestones.append({"key": key, "labelHtml": label_html, "whyHtml": why_html})

    extra_nodes = [c for c in (phase_b.children if phase_b is not None else []) if c is not ul]
    extra_raw = "".join(render(c, lang, pl_blocks) for c in extra_nodes)
    extra_html, n_cite = rewrite_chips(extra_raw, n_cite)

    return {
        "type": "phase", "id": "%s-p%d" % (page_id, idx), "num": num, "title": title,
        "goalHtml": goal_html, "milestones": milestones, "extraHtml": extra_html,
    }


def build_sources_block(contributors, lang, pl_blocks, pl_strings):
    parts = []
    for i, (kind, node) in enumerate(contributors):
        if i > 0:
            parts.append('<hr class="srcsep">')
        if kind == "card":
            card_b = find_child(node, "div", "card-b")
            parts.append("".join(render(c, lang, pl_blocks) for c in card_b.children))
        else:
            parts.append(render(node, lang, pl_blocks))
    body_html = "".join(parts)
    link_count = body_html.count('class="src"')
    title = "Sources used"
    if lang == "pl":
        title = pl_strings.get("Sources used", title)
    return {"type": "sourcesCard", "title": title, "bodyHtml": body_html, "linkCount": link_count}


def localized_title(page_id, lang, pl_strings):
    title = PAGE_TITLES[page_id]
    if lang == "pl":
        title = pl_strings.get(title, title)
    return title


def build_page(page_id, root_children, lang, pl_blocks, pl_strings):
    is_classes = page_id == "classes"
    blocks = []
    sources_contributors = []
    card_n = 0
    phase_n = 0
    for node in root_children:
        if node.kind != "el":
            continue
        cls = class_list(node)
        if node.tag == "article" and "card" in cls:
            if is_sources_card(node):
                sources_contributors.append(("card", node))
                continue
            card_n += 1
            blocks.append(build_card(node, page_id, card_n, lang, pl_blocks, is_classes))
        elif node.tag == "div" and "sources" in cls:
            sources_contributors.append(("div", node))
        elif node.tag == "div" and "class-head" in cls:
            blocks.append(build_class_head(node, lang, pl_blocks))
        elif node.tag == "section" and "phase" in cls:
            blocks.append(build_phase(node, page_id, phase_n, lang, pl_blocks))
            phase_n += 1
        else:
            blocks.append({"type": "html", "html": render(node, lang, pl_blocks)})
    if sources_contributors:
        blocks.append(build_sources_block(sources_contributors, lang, pl_blocks, pl_strings))

    page = {
        "id": page_id,
        "title": localized_title(page_id, lang, pl_strings),
        "single": card_n == 1,
        "blocks": blocks,
    }
    if page_id.startswith("class-"):
        page["classId"] = page_id[len("class-"):]
    return page


# ---- search index, tasks, meta, ui.pl.json --------------------------------------------

def build_search_entries(pages_data):
    entries = []
    for page in pages_data:
        for b in page["blocks"]:
            if b["type"] == "card":
                text = " ".join([b["title"], html_to_text(b["bodyHtml"]), b.get("tags", "")])
                if b.get("bodyAfterHtml"):
                    text += " " + html_to_text(b["bodyAfterHtml"])
                compare = b.get("compare")
                if compare:
                    text += " " + " ".join(compare["heads"])
                    for row in compare["rows"]:
                        text += " " + row["name"]
                        text += " " + " ".join(html_to_text(cell) for cell in row["cellsHtml"])
                entries.append({"page": page["id"], "pageTitle": page["title"], "cardId": b["id"],
                                 "title": b["title"], "text": norm(html.unescape(text)).lower()})
            elif b["type"] == "sourcesCard":
                text = b["title"] + " " + html_to_text(b["bodyHtml"])
                entries.append({"page": page["id"], "pageTitle": page["title"], "cardId": page["id"] + "-sources",
                                 "title": b["title"], "text": norm(html.unescape(text)).lower()})
    return entries


def build_meta(en_pages, total_src_links):
    cards_total = 0
    page_counts = {}
    for page in en_pages:
        non_sources = sum(1 for b in page["blocks"] if b["type"] == "card")
        has_sources = any(b["type"] == "sourcesCard" for b in page["blocks"])
        phases = sum(1 for b in page["blocks"] if b["type"] == "phase")
        page_cards = non_sources + (1 if has_sources else 0)
        cards_total += page_cards
        page_counts[page["id"]] = page_cards + phases
    return {"cards": cards_total, "sourceLinks": total_src_links, "pageCounts": page_counts, "compiled": COMPILED_DATE}


def build_ui_pl(pl_strings):
    """content/i18n/pl.strings.json is the complete UI dictionary: every interface string, its
    token-stripped variant, and its HTML-unescaped variant were folded into it once, permanently.
    Copy it, then add an HTML-unescaped variant for any key that still contains entities, so a
    future key added with `&amp;` etc. is also reachable unescaped without a second manual entry."""
    ui = dict(pl_strings)
    for key, value in pl_strings.items():
        if "&" in key and "<" not in key:
            ui.setdefault(html.unescape(key), value)
    return ui


# =====================================================================================
# main build
# =====================================================================================

def build_page_trees():
    trees = {}
    for pid, frag_list in PAGES.items():
        raw = "\n".join(fragment_html(f) for f in frag_list)
        trees[pid] = parse_fragment(raw)
    return trees


def run_build():
    pl_blocks = load_polish_blocks()
    pl_strings = load_polish_strings()
    trees = build_page_trees()

    tg = Tagger()
    for pid in PAGE_ORDER:
        tg.ctx_page, tg.ctx_card = pid, ""
        for c in trees[pid].children:
            tg.process(c)

    total_src_links = sum(count_src(trees[pid]) for pid in PAGE_ORDER)

    en_pages = [build_page(pid, trees[pid].children, "en", pl_blocks, pl_strings) for pid in PAGE_ORDER]
    pl_pages = [build_page(pid, trees[pid].children, "pl", pl_blocks, pl_strings) for pid in PAGE_ORDER]

    for page in en_pages:
        write_json(os.path.join(PUBLIC_CONTENT, "en", page["id"] + ".json"), page)
    for page in pl_pages:
        write_json(os.path.join(PUBLIC_CONTENT, "pl", page["id"] + ".json"), page)

    write_json(os.path.join(PUBLIC_CONTENT, "en", "search.json"), build_search_entries(en_pages))
    write_json(os.path.join(PUBLIC_CONTENT, "pl", "search.json"), build_search_entries(pl_pages))

    tasks_raw = read(os.path.join(FRAG, "tasks.json"))
    json.loads(tasks_raw)  # fail fast if the source itself is invalid JSON
    write_text(os.path.join(PUBLIC_CONTENT, "tasks.json"), tasks_raw)

    meta = build_meta(en_pages, total_src_links)
    write_json(os.path.join(GENERATED, "meta.json"), meta)

    ui_pl = build_ui_pl(pl_strings)
    write_json(os.path.join(GENERATED, "ui.pl.json"), ui_pl)

    missing = [k for k in tg.order if k not in pl_blocks]
    non_sources_cards = sum(1 for p in en_pages for b in p["blocks"] if b["type"] == "card")
    print("pages: en %d, pl %d" % (len(en_pages), len(pl_pages)))
    print("non-sources cards (en): %d" % non_sources_cards)
    print("source links / chips (structural count, en): %d" % total_src_links)
    print("tagged blocks: %d (%d without Polish)" % (len(tg.blocks), len(missing)))
    print("meta: %s" % json.dumps(meta, ensure_ascii=False))
    if missing:
        print("missing block keys (first 20): " + " ".join(missing[:20]))


# =====================================================================================
# --extract
# =====================================================================================

def collect_all_strings():
    out = {}
    for name in sorted(os.listdir(FRAG)):
        if not name.endswith(".html"):
            continue
        root = parse_fragment(read(os.path.join(FRAG, name)))
        collect_attr_strings(root, out)
    for pattern in ("*.tsx", "*.ts"):
        for path in sorted(glob.glob(os.path.join(ROOT, "src", "**", pattern), recursive=True)):
            source_strings(read(path), out)
    task_strings(read(os.path.join(FRAG, "tasks.json")), out)
    return out


def run_extract():
    pl_blocks = load_polish_blocks()
    pl_strings = load_polish_strings()
    trees = build_page_trees()

    tg = Tagger()
    for pid in PAGE_ORDER:
        tg.ctx_page, tg.ctx_card = pid, ""
        for c in trees[pid].children:
            tg.process(c)

    write_json(os.path.join(I18N, "en.blocks.json"), {k: tg.blocks[k] for k in tg.order}, indent=1)

    strings = collect_all_strings()
    write_json(os.path.join(I18N, "en.strings.json"), sorted(strings), indent=1)

    todo_dir = os.path.join(I18N, "todo")
    if os.path.isdir(todo_dir):
        for f in os.listdir(todo_dir):
            if re.match(r"en-\d+\.json$", f):
                os.remove(os.path.join(todo_dir, f))

    limit = 14000
    chunk, size, idx = {}, 0, 1
    missing_keys = [k for k in tg.order if k not in pl_blocks]
    for k in missing_keys:
        e = tg.blocks[k]
        if size and size + len(e["en"]) > limit:
            write_json(os.path.join(todo_dir, "en-%02d.json" % idx), chunk, indent=1)
            idx += 1
            chunk, size = {}, 0
        chunk[k] = e
        size += len(e["en"])
    chunks_written = idx - 1
    if chunk:
        write_json(os.path.join(todo_dir, "en-%02d.json" % idx), chunk, indent=1)
        chunks_written = idx

    total_chars = sum(len(e["en"]) for e in tg.blocks.values())
    missing_strings = [s for s in strings if s not in pl_strings]

    print("blocks: %d unique, %d chars total, %d missing Polish, %d todo work units"
          % (len(tg.blocks), total_chars, len(missing_keys), chunks_written))
    print("strings: %d total, %d missing Polish" % (len(strings), len(missing_strings)))


def main():
    if "--extract" in sys.argv[1:]:
        run_extract()
    else:
        run_build()


if __name__ == "__main__":
    main()
