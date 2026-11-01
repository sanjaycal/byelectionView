# By-election live results

Client-only Svelte dashboard that polls the Elections Canada results download
(`https://enr.elections.ca/DownloadResults.aspx`) every 10 seconds and shows one
card per by-election. Clicking a card opens a modal with the current by-election
results on the left two thirds and the previous (2025 general election) results
on the right third.

Everything runs in the browser — there is no backend.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
npm run preview  # serve the built bundle
```

## The view

**Grid.** One card per by-election, three across on wide screens, two then one
as the viewport narrows (breaks at 1500px and 900px). Empty grid cells are left
empty rather than padded out.

**Card.** Riding name, `POLLS REPORTING`, `BALLOTS CAST` and `LAST ELECTION`,
then the top five candidates (all of them when there are fewer) with their votes
and share. Every candidate has a bar in the party's colour and a tick marking
where that party stood in the 2025 general election, so a swing is visible at a
glance.

**Modal.** Current by-election results on the left two thirds, 2025 general
election results on the right third. The previous column mirrors the current
one, with the tick marking the by-election result instead.

## How the data is fetched

Elections Canada sends no CORS headers, so the browser cannot read the download
endpoint directly. The app requests it through a CORS proxy and falls back
through a list of proxies until one works. The proxy that succeeded is shown in
the header and remembered in `localStorage`.

The proxy and the source URL can be changed in the **settings** panel or via
query string:

```
?proxy=jina                  # pick a proxy
?source=/EventResults.txt    # same-origin source, fetched directly
?open=24018                  # open a riding by district number
```

`public/EventResults.txt` is a copy of the download so the UI can be developed
without hitting the network.

## Data notes

- Only `preliminary` rows are treated as the live result. The file also carries
  `validated` rows (the returning officer's final numbers) and those are kept
  out of the live view.
- The download file has no poll counts, so **Polls reporting** is `N/A`.
  Ballots cast is shown instead because it is in the file.
- Riding names are shown with em dashes (`Chicoutimi—Le Fjord`). The source
  file uses `--`; the display name is derived in `src/lib/ec.js` while the raw
  name is kept as the key used for lookups.
- The right hand column of the modal is the 2025 general election result for
  the same riding. Those figures live in
  `src/data/previous-results-2025.json` (323 ridings) and are generated with:

  ```bash
  npm run fetch:previous
  ```

  The script pulls the official 2025 riding results out of the Wikipedia riding
  articles (their underlying source is Elections Canada). It is deliberately
  polite — one request at a time, exponential backoff on 429, and it writes
  progress to disk so it can be re-run to fill gaps. Do not parallelise it.

## Branches

`master` is the stable view. Two experiment branches build on it:

| Branch | What it changes |
| --- | --- |
| `master` | Stable layout: rank numbers, party chip under the name, a separate bar under each candidate row. |
| `experiment/cards-cleanup` | Drops the rank numbers, moves the party chip next to the candidate name, and abbreviates the party name per row (`NDP-New Democratic Party` → `NDP`) when the full label will not fit on the line. Applied to the card and the modal. |
| `experiment/bar-text` | The candidate row *is* the bar: the text sits inside the coloured bar and changes colour exactly at the edge of the fill, and the 2025 marker became a pair of triangles. Applied to the card and the modal. The modal's tables become flex rows and the column split becomes 3fr 2fr. |

`experiment/bar-text` builds on `experiment/cards-cleanup`, which builds on
`master`. See `AGENTS.md` for the implementation notes and the gotchas that
came out of building these.

## Project layout

```
src/App.svelte                        polling loop, header, grid, modal state
src/lib/ec.js                         download parsing + proxy list
src/lib/previous.js                   2025 results lookup and normalisation
src/lib/partyLabel.js                 party abbreviations + DOM measuring actions
src/lib/format.js                     number/percent formatting, party colours
src/lib/components/ByElectionCard.svelte
src/lib/components/ResultsModal.svelte
src/data/previous-results-2025.json   generated 2025 riding results
scripts/fetch-previous-results.mjs     generator for the file above
```
