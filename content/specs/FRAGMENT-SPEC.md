# HTML fragment contract for the AION 2 guide

Each research Markdown file is converted into ONE HTML fragment file that is pasted inside a `<section class="panel">` of the final page. Fragments must contain NO `<html>`, `<head>`, `<body>`, `<style>`, or `<script>` tags. Only the building blocks below. Any other markup is allowed but must use these classes for interactivity to work.

## Building blocks

### Section intro
```html
<div class="intro">
  <h2>Title of panel</h2>
  <p class="lead">One or two sentence summary for a beginner.</p>
</div>
```

### Card (the main unit; searchable and collapsible)
```html
<article class="card" data-tags="daevanion skills progression" data-level="12">
  <header class="card-h">
    <h3>Daevanion Board</h3>
    <span class="meta">Unlocks lvl 12</span>
    <span class="badge conf-confirmed">confirmed</span>
  </header>
  <div class="card-b">
    <p>Body text. Plain prose, no em dashes.</p>
    <ul>
      <li>Bullet with fact <a class="src" href="URL" target="_blank" rel="noopener">aion2hub, 2026-03</a></li>
    </ul>
    <div class="tip"><strong>Beginner tip:</strong> what to actually do.</div>
    <div class="warn"><strong>Avoid:</strong> the mistake.</div>
  </div>
</article>
```
Badge classes: `conf-confirmed` (2+ sources agree), `conf-single` (single source), `conf-contested` (sources disagree), `kr-era` (info from KR/TW version, may differ globally), `official` (from NCSoft/official page), `marketing` (boosting/marketing site, lower trust).

`data-tags`: lowercase space-separated keywords for the search box. `data-level` optional integer unlock level.

### Source chips
Every fact-bearing sentence or bullet gets at least one `<a class="src" href="..." target="_blank" rel="noopener">shortname, YYYY-MM or date unknown</a>` right after it. Keep the visible text under 30 characters. Multiple chips may follow one sentence.

### Priority list (ordered by importance)
```html
<ol class="prio">
  <li class="p1"><strong>Do first:</strong> text <a class="src" ...>src</a></li>
  <li class="p2"><strong>Then:</strong> text</li>
  <li class="p3"><strong>Later / optional:</strong> text</li>
</ol>
```
`p1` = critical, `p2` = important, `p3` = nice to have.

### Checklist (persisted in localStorage; give each a unique data-key)
```html
<ul class="chk">
  <li><label><input type="checkbox" data-key="daily-region-missions"> Region missions <a class="src" ...>src</a></label></li>
</ul>
```

### Level timeline
```html
<ol class="timeline">
  <li><span class="lvl">Lv 12</span><div><strong>Daevanion board unlocks</strong><p>What to do.</p></div></li>
</ol>
```

### Table (wrapped for horizontal scroll)
```html
<div class="tbl"><table>
  <thead><tr><th>Dungeon</th><th>Unlock</th><th>Type</th><th>Drops</th><th>Limit</th><th>Src</th></tr></thead>
  <tbody><tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td><td><a class="src" href="...">x</a></td></tr></tbody>
</table></div>
```

### Verdict blocks (monetization)
```html
<div class="verdict buy">Worth it: text</div>
<div class="verdict maybe">Situational: text</div>
<div class="verdict skip">Skip: text</div>
```

### Two column comparison
```html
<div class="cols">
  <div class="col"><h4>Do</h4><ul>...</ul></div>
  <div class="col"><h4>Do not</h4><ul>...</ul></div>
</div>
```

### Class guide fragments (one per class) additionally use
```html
<div class="class-head" data-role="tank">
  <h2>Templar</h2>
  <p class="lead">Role: Tank. Difficulty: Low. Weapon: Sword + Shield.</p>
  <div class="pills"><span class="pill">Tank</span><span class="pill">Melee</span><span class="pill">Beginner friendly</span></div>
</div>
```
Then cards with these exact h3 titles in this order: "Overview and role", "Skill priority", "Stigma picks", "Daevanion board route", "Arcana", "Gear and stat priority", "Rotation and combos", "Leveling notes", "Common mistakes", "Sources used".

## Rules
- Never drop a source. If the Markdown has a link, the fragment has a chip.
- Preserve confidence tags as badges. Preserve "KR-era" flags as `kr-era` badges.
- No em dashes anywhere. Use hyphen or comma.
- Escape `&` as `&amp;` inside text.
- No inline styles.
- Do not invent facts that are not in the Markdown.
- End the fragment with a `<div class="sources"><h3>Sources</h3><ol>...</ol></div>` listing every source with title, date, trust note.
