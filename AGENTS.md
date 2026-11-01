# AGENTS.md

Notes for anyone (human or agent) working on this repo. Read this before
changing the UI.

## What the app is

A client-only Svelte 5 + Vite dashboard. It polls the Elections Canada results
download every 10 seconds and renders one card per by-election, plus a modal
with the current and previous results. There is no server, no database and no
build-time API dependency — `npm run build` produces a static bundle.

```
npm run dev              # vite dev server (5173, or 5174 if 5173 is taken)
npm run build            # static bundle into dist/
npm run preview          # serve dist/
npm run fetch:previous   # regenerate src/data/previous-results-2025.json
```

A dev server is often already running in the workspace; check before starting
another one.

## Data flow

1. `src/App.svelte` calls `fetchResults()` in `src/lib/ec.js` every 10s.
2. The Elections Canada endpoint sends no CORS headers, so the request goes
   through a CORS proxy. `PROXY_TEMPLATES` lists them; the app tries the
   selected one first and falls back through the rest until one returns a
   response that actually contains the results table. The winner is shown in the
   header and stored in `localStorage`.
3. `parseResults()` splits the tab delimited file. It locates the header row by
   looking for `Electoral district number` rather than assuming it is on line
   2, because some proxies (r.jina.ai) prepend their own preamble. Column
   indexes are resolved from the header names, not hardcoded positions.
4. Rows are grouped by riding and by result type. Only `preliminary` rows are
   used for the live view.
5. The modal's right hand column comes from `src/data/previous-results-2025.json`,
   looked up by riding name through `src/lib/previous.js`.

## Things that are true and easy to break

- **"Polls reporting" is `N/A` and always will be.** The download file has no
  poll counts. Do not invent them. Ballots cast is shown instead.
- **The 2025 file is generated, not hand-edited.** `scripts/fetch-previous-results.mjs`
  pulls riding results from Wikipedia (whose underlying source is Elections
  Canada). It keys them by the Elections Canada spelling (`Chicoutimi--Le
  Fjord`) while the UI shows em dashes; `previous.js` normalises both.
- **Wikipedia rate limits aggressively.** The generator runs one request at a
  time with backoff and writes progress to disk so it can be re-run. Do not add
  parallel workers — that is what caused the 429s before.
- **`border-radius: 0 !important` is global** in `src/app.css`. Everything is
  meant to be square corners. Do not add rounded corners anywhere.
- **The theme is light mode** with Share Tech Mono (`@fontsource/share-tech-mono`).
  Colours are CSS custom properties in `src/app.css`; the dark palette it
  replaced is gone.

## Svelte gotchas that bit us

These cost real time; check them before assuming the CSS is broken.

- **The compiler prunes CSS rules it cannot statically match.** A selector like
  `.cparty.is-short .full` is dropped from the build when `is-short` is only
  ever added at runtime with `classList`. Write it as
  `.cparty:global(.is-short) .full`. This is why the party abbreviation
  appeared to "do nothing" until it was fixed.
- **Scoped styles do not reach into a child component's markup.** An attempt to
  build a reusable `<BarText>` component left the party labels unstyled,
  because the parent's `.cparty` rules never matched the element the child
  rendered. Shared markup now lives in the parent, and the shared helper
  classes (`.bar-wrap`, `.bar-under`, `.bar-over`, on `experiment/bar-text`)
  are global in `app.css`.
- **`text-overflow: ellipsis` only works when the text is a direct inline
  child of the clipped box.** Wrapping the text in an `inline-flex` child
  silently loses the ellipsis. Keep the text inline.
- **Measuring text in the DOM is unreliable right after mount.** The webfont
  arrives after first paint and changes every width. The actions in
  `src/lib/partyLabel.js` re-measure on `ResizeObserver`, on `window.resize` and
  on `document.fonts.ready`. Keep all three.

## Layout gotchas

- **Grid and flex items have an automatic minimum size of `auto`**, so a long
  unbreakable riding name used to force the whole card wider than its column
  and push a horizontal scrollbar onto the page (visible around 900–1000px
  with a devtools panel docked). The fix was `min-width: 0` on the card,
  `overflow-wrap: anywhere` on the riding title, and a stats row that wraps.
  If a new column is added, give it the same treatment.
- **Tables size their columns to their content.** On `master` the modal's
  tables use `table-layout: fixed` with sized numeric columns, because a long
  candidate name used to push the votes column off the edge of the modal. On
  `experiment/bar-text` the tables were replaced with flex rows entirely.

## The bar-with-text technique (experiment/bar-text)

Each candidate row is the bar: the row's background is a gradient that fills to
the candidate's share, and the text sits on top of it.

To change the text colour exactly at the edge of the fill, the text is drawn
twice:

- `.bar-under` — the normal colour, in the flow, keeps the ellipsis.
- `.bar-over` — the contrast colour, absolutely positioned on top, clipped to
  the filled part with `width: var(--visible)`.

`barContrast()` in `src/lib/partyLabel.js` measures the fill edge and sets
`--visible` on each label, so the boundary lands mid-glyph. The over copy needs
`text-overflow: clip`, otherwise it draws an ellipsis at the cut point instead
of a clean cut.

The contrast colour is chosen per party by `contrastText()` in `format.js`:
white on the red, blue and green fills, near-black on orange, where white is
unreadable. That means the split is invisible on orange rows.

## Party abbreviations (experiment branches)

On the experiment branches the party label is shortened per row when the full
one will not fit next to the candidate name. `abbreviateParty()` maps the long
labels to the short ones (`NDP-New Democratic Party` → `NDP`, `Liberal` →
`LPC`, and so on), falling back to initials for anything unknown, and
`shortenIfNeeded()` decides per row whether to swap it in. Both live in
`src/lib/partyLabel.js` and are shared by the card and the modal.

`master` still shows the full party label under the candidate name.

## Verifying a change

There is no test suite. Check things by eye:

```bash
npm run build                                     # must be clean
npm run dev &
google-chrome --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1600,900 --virtual-time-budget=13000 \
  --screenshot=/tmp/shot.png "http://localhost:5173/?proxy=jina"
```

Add `--force-device-scale-factor=2.5` to read small text in the screenshot.
Useful query strings: `?proxy=jina` (pick the proxy that works from this
machine), `?source=/EventResults.txt` (no network), `?open=24018` (open a
riding).

Check for horizontal overflow at the widths that broke before — 900, 950,
1000px — by comparing `document.documentElement.scrollWidth` with `clientWidth`;
they must be equal.

## Branch workflow

`master` is the stable view and the two `experiment/*` branches are the
playground. When an experiment is done, `master` moves on and the experiment is
rebased onto it:

```bash
git checkout master && git commit ...      # land the shared fix on master
git checkout experiment/bar-text
git rebase master                          # replay the experiment on top
```

`experiment/bar-text` is stacked on `experiment/cards-cleanup`, which is stacked
on `master`, so a rebase has to go through the stack in order. Nothing is
pushed to `origin` unless it is asked for.

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$props`), `onclick={...}` handlers.
- Component styles are scoped; shared or dynamically-classed selectors use
  `:global()`.
- Colours come from the custom properties in `src/app.css`.
- Two decimal places are not needed anywhere; percentages are shown to one.
- Commit messages are short and lowercase, e.g. `fix horizontal overflow
  between 900-1000px`.
