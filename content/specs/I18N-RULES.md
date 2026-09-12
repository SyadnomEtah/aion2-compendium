# Polish translation rules for the AION 2 Beginner Compendium

You translate one JSON work unit. Input: `content/i18n/todo/en-NN.json`, an object of `key -> {"en": "<html snippet>", "ctx": "Page / Card"}` in document order. Output: `content/i18n/pl/pl-NN.json`, an object of `key -> "<polish html snippet>"` with exactly the same keys, in the same order. Write the output with the Write tool as UTF-8 JSON, `ensure_ascii` off (real Polish letters, not `ł`).

## What the reader is

A Polish MMO player about to start AION 2 on the global (English-language) client. They read Polish but play in English, so every name they will see on screen must stay in English.

## Hard rules (a validator rejects the file if any is broken)

1. **Keys**: same set, nothing added, nothing dropped.
2. **Tokens**: every `⟦n⟧` placeholder (U+27E6 digit U+27E7) in the English appears exactly once in the Polish, same numbers. They stand for links, icons, and form inputs. Move them to where they fit the Polish sentence, never delete, never duplicate, never write text inside them.
3. **Tags**: the Polish must contain the same HTML tags with the same attributes, in the same order, as the English. Only `<strong>`, `<b>`, `<em>`, `<span class="...">` occur. Translate the text inside them, keep the tags verbatim. Never add tags. Never use `<br>`.
4. **Entities**: write `&amp;` for `&`, `&lt;` for `<`, keep any `&quot;`/`&#...;` as is.
5. **No em dash** (U+2014) anywhere. Use a comma, a colon, or a hyphen.
6. **Numbers, dates, times, percentages, level ranges, currency amounts stay exactly as written** (`2026-10-05`, `05:00`, `Lv 12`, `40 energy`, `15%`, `$70 million`).
7. **Class names stay English and uninflected**: Templar, Gladiator, Assassin, Ranger, Sorcerer, Spiritmaster, Cleric, Chanter. Never "Templariusz", never "Gladiatora", never "Templarem". Keep the word in nominative and build the sentence around it: "klasa Templar", "postać klasy Templar", "gra jako Templar", "Templar ma...", "wybierz Templar". The validator counts each class name and rejects the file if a count changed.
8. **JSON validity**: escape `"` inside strings as `\"`.

## In-game terminology: keep in English

Do not translate anything the player will see as a name in the game or in the sources. Keep the exact spelling and capitalization from the English. Do not inflect them; when a Polish case is needed, put a Polish generic noun in front and leave the term in nominative ("waluta Kinah", "w strefie Abyss", "system Daevanion", "tablica Daevanion Board", "karta Arcana", "kamień Stigma").

Categories and examples (the list is not exhaustive, apply the principle):

- Factions, races, world: Elyos, Asmodian, Daeva, Balaur, Atreia, Abyss, Elysea, Asmodae, Sanctum, Pandaemonium, Shugo, Inder, Odella
- Systems and mechanics with a game name: Daevanion, Daevanion Board, Daevanion Crystal, Stigma, Arcana, Odyle Energy, Odella Energy, Pantheon, Legion (guild), Transcendence, Transcendence Charge, Dimensional Invasion, Nightmare Dungeon, Ascension Trial, Conquest Dungeon, Sanctum Library, Abyss Citadel, The Eternity Breach, Ladra Raid, Sanctuary, Expedition, Heroic, Mythic, Legendary tier, Bio-Research Base Challenge Ticket, Dream Fragment, Enhancement Stone, Manastone, Godstone, Shugo Fiesta Key, Attendance
- Currencies and shop: Kinah, Quna, Founder pack, Membership, Daeva Pass, Battle Pass, PURPLE (launcher), Steam
- Quest types written as names: Episode quest, Region quest, Mission quest, Duty quest (keep capitalized name, you may add "zadania" in front: "zadania Episode", "zadania Region")
- Skill names, item names, mount names, dungeon names, boss names, NPC names, zone names, server names, site names (aion2hub, maxroll, inven, aion2kina, mmorpg.com), YouTuber names
- Korean/Chinese text in parentheses stays as is
- Source-chip text like "nc.com, 2025-11" or "date unknown" inside `⟦n⟧` is not visible to you anyway

Badge texts inside `<span class="badge ...">` ARE translated (they are guide UI, not game names): confirmed = potwierdzone, single source = jedno źródło, contested = sporne, kr-era / KR-era = era KR, official = oficjalne, marketing = marketing, unverified = niezweryfikowane, legend = legenda, still contested = nadal sporne. Use exactly these.

## Gaming register

Write natural Polish as Polish MMO players write guides. Keep the English gaming jargon Polish players actually use, uninflected or with the usual Polish inflection when it is universal: DPS, tank, healer, support, buff, debuff, cooldown, AoE, CC, DoT, proc, burst, kite, farm, farmić, grind, endgame, gear, build, rotacja, stat, item level, gear score, tier, meta, PvP, PvE, raid, dungeon (you may also write "instancja" or "loch" where it reads better, "dungeon" is fine), party, premade, solo, alt, main, lockout, reset, cap, drop, loot, exp/XP, level/poziom ("lvl" in tables is fine). Role labels: "Tank", "Healer", "Support" stay; "Melee DPS" = "DPS wręcz", "Ranged DPS" = "DPS dystansowy", "Magic DPS" = "DPS magiczny".

Tone: second person singular ("zrób", "nie kupuj"), direct, no fluff, matches the terse English. Short sentences. Keep the guide's hedging words ("reportedly" = "podobno" / "według źródeł", "unverified" = "niezweryfikowane", "contested" = "sporne").

Fixed phrases that recur, translate consistently:
- "Beginner tip:" = "Wskazówka dla początkujących:"
- "Avoid:" = "Unikaj:"
- "Do first:" = "Najpierw:"; "Then:" = "Potem:"; "Later / optional:" = "Później / opcjonalnie:"
- "In short:" = "W skrócie:"
- "Sources used" / "Sources" (heading) = "Źródła"
- "Worth it:" = "Warto:"; "Situational:" = "Zależy:"; "Skip:" = "Pomiń:"
- "Do" / "Do not" (column heads) = "Rób" / "Nie rób"
- "Unlocks lvl 12" = "Odblokowuje się na lvl 12"
- "KR-era" in prose = "z ery KR"
- "global launch" = "globalna premiera"; "advance access" = "wcześniejszy dostęp"
- "compiled 2026-09-12" = "zebrane 2026-09-12"

## Do not

- Do not add explanations, translator notes, or brackets.
- Do not "improve" facts, numbers, or hedges.
- Do not translate anything inside `⟦n⟧` (you cannot see it, so nothing to do).
- Do not leave a value in English because it looks hard; translate the prose and keep the names.
- Do not use quotation marks „ ” typographic variants; plain `"` escaped as `\"` in JSON, or avoid quotes.
