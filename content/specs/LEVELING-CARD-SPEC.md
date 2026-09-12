# "Leveling build" card contract (one card per class fragment)

You are converting `C:\_Wiki\Resources\Gaming\AION 2 Research\leveling-<class>.md` into ONE new card inserted into the class fragment `fragments\frag-class-<class>.html` (same folder as this file). You are restructuring sourced research into guide-page form, like a maxroll or icy-veins leveling build page. Never add a fact that is not in the research note. Never drop a source that supports a fact you use.

Read first, in this order: `FRAGMENT-SPEC.md` (building blocks), `READABILITY-SPEC.md` (hard limits), the research note, then the existing fragment (at least the "Skill priority" card and the final Sources list, so you do not repeat what is already on the page and so you match its voice).

## Where the card goes
Insert the new `<article>` immediately after the closing `</article>` of the card whose `<h3>` is "Skill priority" (it becomes card 3 on the page). Do not move, rename or renumber any other card.

## Card skeleton (use exactly these blocks, in this order; drop a block only if the note has nothing for it and say so in a `<p class="why">`)

```html
<article class="card" data-tags="<class> leveling build skill point order breakpoints stigma daevanion rotation starter" data-level="1">
  <header class="card-h">
    <h3>Leveling build</h3>
    <span class="meta">Lv 1 to cap</span>
    <span class="badge conf-single">single source</span>   <!-- or conf-confirmed / conf-contested, whichever fits the build as a whole -->
    <span class="badge kr-era">kr-era</span>
  </header>
  <div class="card-b">
    <p class="tldr">One sentence, max 160 chars, no chips: the two or three skills to push first and the first stigma pick.</p>
    <p class="why">Two sentences: where the build comes from (Korean class boards, guide site) and the caveat that sources give the skill's own level (8/12/16/20 breakpoints), not your character level, unless a step is anchored to one.</p>

    <h4>Skill point order</h4>
    <div class="tbl"><table>
      <thead><tr><th>Step</th><th>When</th><th>Skill</th><th>Take to</th><th>Why</th><th>Src</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>From Lv 1</td><td><strong>Fierce Strike</strong> (맹렬한 일격)</td><td>Skill Lv 8</td><td>basics carry damage between cooldowns</td><td><a class="src" href="URL" target="_blank" rel="noopener">inven</a></td></tr>
      </tbody>
    </table></div>
    <!-- "When" is a character level or band when the source gives one, otherwise "Next" / "When points allow". "Take to" is the skill level target. "Why" is under 12 words. Chip text inside the table stays under 20 characters (site name only) because table chips are not numbered. -->
    <!-- If the note has two competing orders, use the two-column block: <div class="cols"><div class="col"><h4>Order A: name</h4><ol class="prio">...</ol></div><div class="col"><h4>Order B: name</h4>...</div></div> and follow it with one <p> saying which one the note recommends and why. -->

    <h4>Leave at level 1</h4>
    <ul><li><strong>Skill</strong>: one clause why <a class="src" ...>chip</a></li></ul>

    <h4>Passives</h4>
    <ol class="prio">
      <li class="p1"><strong>First:</strong> Passive name, one clause why <a class="src" ...>chip</a></li>
      <li class="p2"><strong>Then:</strong> ...</li>
      <li class="p3"><strong>Later:</strong> ...</li>
    </ol>

    <h4>Level by level</h4>
    <ol class="timeline">
      <li><span class="lvl">Lv 1-12</span><div><strong>Headline instruction for this band (this is the only text left in Compact view, so make it the action: "Push both basics to 8, rotation is A > B > C")</strong><p>One or two sentences of detail with chips.</p><ul><li>rotation step or spend note</li></ul></div></li>
      <li><span class="lvl">Lv 12</span><div><strong>Daevanion board opens: ...</strong><p>...</p></div></li>
      <li><span class="lvl">Lv 23</span><div><strong>Stigma: slot X first, feed shards to it</strong><p>...</p><ul><li>slots 2-4 in order ...</li></ul></div></li>
      <li><span class="lvl">Lv 23-45</span><div><strong>...</strong>...</div></li>
      <li><span class="lvl">Lv 45-50</span><div><strong>Greater stigma quest, ...</strong>...</div></li>
      <li><span class="lvl">At cap</span><div><strong>What changes: hand-off in one sentence</strong><p>Point to the Skill priority, Stigma picks and Daevanion cards above and below for the endgame spread.</p></div></li>
    </ol>
    <!-- Use the bands the research note actually supports; merge or drop bands with nothing in them rather than padding. Every band that exists needs at least one chip. -->

    <h4>Gear while leveling</h4>
    <ul>...</ul>   <!-- omit the whole block if the note's section is empty or "no reliable source found" -->

    <div class="note">Disagreements between sources, one sentence each, with chips. Omit if none.</div>
    <div class="warn"><strong>Avoid:</strong> the one leveling mistake the note supports, with chip.</div>
  </div>
</article>
```

## Sources
Append every NEW source you cite (one not already in the fragment's final Sources list) as an `<li>` to the last `<ol>` inside the final `<div class="sources">` (or inside the "Sources used" card if the fragment has no standalone sources div). Format matches the existing items: title, link, date or "date unknown", trust note. Do not duplicate an entry that is already there.

## Rules (all mechanically checked afterwards)
- Chip format exactly `<a class="src" href="URL" target="_blank" rel="noopener">shortname, YYYY-MM or date unknown</a>`; visible text under 30 characters; at most two chips per sentence or list item.
- Every fact-bearing sentence, table row, list item and timeline band carries at least one chip. The tldr carries none.
- Keep skill names as the note spells them; give the Korean in parentheses the first time a skill appears in the card.
- No `<p>` over 350 visible characters, no `<li>` top-level text over 260 characters, `<h4>` only inside the card, no em dash character, no inline styles, no script or style tags, `&` written as `&amp;`.
- Do not touch any other card, and do not change the count of `class="src"` chips or badges anywhere outside the new card and the appended source items.
- Do not edit any file in `C:\_Wiki`; the only file you edit is the fragment in this folder.

## Validation before you return
Run `python check.py fragments\frag-class-<class>.html` (from this folder) before and after. After: paragraphs over 350 = 0, list items over 260 = 0, cards missing tldr = 0, cards found = before + 1, src chips = before + (chips you added). Also confirm the file still has balanced `<article>`/`</article>` counts (`grep -c "<article" ` equals `grep -c "</article>"`).

Reply with a 6 line summary: chips before/after, cards before/after, check.py result, the bands you used, and any block you dropped because the note had nothing.

## Encoding
Write Korean and any other non-ASCII text as literal UTF-8 characters. Never use numeric character references such as `&#47895;` (a writer garbled three skill names that way). The only entity allowed is `&amp;`.
