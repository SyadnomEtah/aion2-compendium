# Readability rewrite contract

Goal: the same facts, same source chips, same badges, but scannable like a maxroll / icy-veins / lostark.nexus guide page. You are restructuring, not re-researching. Never add a fact, never drop a chip.

## Hard limits (checked mechanically after you finish)
- No `<p>` longer than 350 characters of visible text (tags stripped). Split or convert to a list.
- No `<li>` longer than 260 characters of visible text. Split into a lead sentence plus a nested `<ul>`, or move detail into a following `<p class="why">`.
- Every `.card-b` starts with `<p class="tldr">` : one sentence, max 160 characters, the single thing a beginner must take away. No chips inside the tldr.
- Any paragraph that enumerates 3 or more items (skills, stats, steps, sources, options) becomes a `<ul>` or `<ol>`, one item per line.
- A `.card-b` with more than about 6 blocks gets `<h4>` subheadings every 2 to 4 blocks so the eye can jump.
- Chips (`<a class="src">`) stay attached to the sentence or list item they support. Do not gather them into a pile at the end of a paragraph. Two chips per sentence maximum inline; if a sentence has more, keep the two strongest and move the rest onto the card's "Sources used" list (which already exists in class fragments) or into a trailing `<li>` "Also: chip chip".
- Keep every `<span class="badge ...">`, `.tip`, `.warn`, `.note`, `.cols`, `.tbl`, `ol.prio`, `ul.chk`, `ol.timeline`, `.verdict`, `data-tags`, `data-level`, `data-key` exactly as they are unless the paragraph they sit in is being split, in which case move them with their sentence.
- Sources cards: any card whose `<h3>` starts with "Sources" gets `class="card collapsed sources-card"`. Any standalone `<div class="sources">` (not inside a card) is wrapped in `<article class="card collapsed sources-card" data-tags="sources"><header class="card-h"><h3>Sources used</h3></header><div class="card-b"> ... </div></article>`.
- No em dash character. No inline styles. No script/style tags. Escape & as &amp;.

## Patterns to apply

Wall paragraph about a skill kit:
```
<p>The kit revolves around X (chip), with Y as filler (chip) and Z for burst (chip); guides disagree whether ... (chip chip)</p>
```
becomes
```
<p class="tldr">Level X first, use Y as filler, save Z for burst.</p>
<h4>Core skills</h4>
<ul>
  <li><strong>X</strong>: main damage, level it first <a class="src">chip</a></li>
  <li><strong>Y</strong>: filler between cooldowns <a class="src">chip</a></li>
  <li><strong>Z</strong>: burst window opener <a class="src">chip</a></li>
</ul>
<div class="note">Guides disagree on ... <a class="src">chip</a> <a class="src">chip</a></div>
```

Contested facts: keep the `.cols` two-column block; inside each `.col` use a short `<h4>` and bullets, not a paragraph.

Numbers and levels: bold the number or level once (`<strong>Lv 23</strong>`), do not bold whole sentences.

Headings inside a card use `<h4>` only. Never `<h2>` or `<h3>` inside `.card-b`.

Keep the card order and card titles unchanged.

## Voice
Short sentences. Imperative where it is advice ("Level Flaming Arrow first"). Plain words. Cut filler like "it is worth noting", "as mentioned", "in terms of". Never change a number, name, or claim.

## Validation you must run before returning
For each file you edited, reread it and count: paragraphs over 350 chars (must be 0 outside `.tbl`), list items over 260 chars (must be 0), cards without `p.tldr` (must be 0), `class="src"` count (must equal the count before you started), badge count (must equal before). Report the before/after numbers.
