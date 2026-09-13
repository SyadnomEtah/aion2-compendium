# CLAUDE.md

Working rules for Claude Code editing this Vite + React 19 + TypeScript compendium.

## Content

Content edits go to `content/fragments/` only. Fragments follow `content/specs/FRAGMENT-SPEC.md`: no `<script>`, `<style>`, inline styles, em dashes; source chips on every fact; keep chip text under 30 characters. Do not edit `public/content/**` or `src/generated/**` by hand; these are regenerated with `npm run content` and must be committed together with the source change.

After editing fragments, run `npm run content` and commit the changed `content/fragments/` files alongside the regenerated `public/content/**` and `src/generated/**`. Commit message: cite which fragments or pages changed.

## Layout and behaviour

Layout and behaviour edits go to `src/`. Do not change the noindex meta tag in `index.html` or the disallow rule in `public/robots.txt`; the guide is intentionally unlisted.

## Build and test

Before committing any changes:
```bash
npm run typecheck
npm test
npm run build
```

All three must pass.

## i18n

i18n block keys are computed from the English HTML and are frozen by design. Any English text edit invalidates that block's Polish entry (so translators see it as a new block to be translated). Do not hand-edit keys or hash values.

UI strings in JSX go through `T()` from `src/lib/i18n.tsx`. New UI strings need an entry in `content/i18n/pl.strings.json` to be available in Polish. English UI strings are stored as keys, Polish translations as values.

## Data model

Store keys (in `src/lib/store.ts`), localStorage key prefixes (`aion2.*`), and backup file format are frozen and must not change (they carry user data across updates). See ARCHITECTURE.md "React conventions" for the full list and contract.

## Structure

For structural questions, see ARCHITECTURE.md, which is authoritative on pages, routing, content types, data flow and conventions.

## Gotchas

- Node 22.12 or newer is required (jsdom 27 fails on older 22.x with `ERR_REQUIRE_ESM`); CI builds on Node 24, keep local Node at 24 LTS for parity.
- The Browser pane hides CSS animations when it is not in front: computed opacity stays at the animation start and screenshots look faded or blank. Verify layout with `getBoundingClientRect` and class checks, not screenshots, or bring the pane to front first.
- Browser automation "Return" key presses did not trigger React `onKeyDown` Enter handlers; dispatching a synthetic `KeyboardEvent('keydown', { key: 'Enter' })` on the input did. Controlled inputs need the native value setter before dispatching `input` in JS-driven tests.
- `aion2.collapsed` stores only ids the visitor changed; sources cards default closed, everything else open. Roadmap phase ids already carry the `roadmap-` prefix.
- The first commit carries one failed "pages build and deployment" check: the built-in Jekyll build was queued before the Pages source was switched to GitHub Actions. It cannot recur while `build_type` is `workflow`.
