# By-election live results

Client-only Svelte dashboard that polls the Elections Canada results download
(`https://enr.elections.ca/DownloadResults.aspx`) every 10 seconds and shows one
card per by-election in a grid (3 across on wide screens, 2 then 1 as the
viewport narrows). Clicking a card opens a modal with the current by-election
results on the left two thirds and the previous (2025 general election) results
on the right third.

Each candidate row carries a bar in the party's colour with a tick marking where
that party stood in the 2025 general election, so the shift is visible at a
glance. In the modal the previous results column mirrors it, with the tick
marking the by-election result instead.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
```

## How the data is fetched

Elections Canada sends no CORS headers, so the browser cannot read the download
endpoint directly. The app requests it through a CORS proxy and falls back
through a list of proxies until one works; the proxy that succeeded is shown in
the header and remembered in `localStorage`. The proxy and the source URL can be
changed in the **settings** panel, or via query string:

```
?proxy=jina                  # pick a proxy
?source=/EventResults.txt    # serve a local copy (same origin, fetched directly)
?open=24018                  # open a riding by district number
```

`public/EventResults.txt` is a copy of the download so the UI can be developed
without hitting the network.

## Data notes

- Only `preliminary` rows are used as the live result (validated rows are kept
  out of the live view).
- The download file has no poll counts, so the **Polls reporting** field shows
  `N/A`. Ballots cast is shown instead because it is in the file.
- Cards list the top 5 candidates (all of them when there are fewer).
- The grid drops to 2 columns below 1500px and 1 column below 900px.
- The middle modal column uses the 2025 general election result for the riding.
  Those figures live in `src/data/previous-results-2025.json` and are generated
  with:

  ```bash
  npm run fetch:previous
  ```

  which pulls the official 2025 riding results from the Wikipedia riding
  articles (their underlying source is Elections Canada) for all 323 ridings of
  the current representation order. The script is polite (one request at a
  time, backoff on 429) and resumable.
