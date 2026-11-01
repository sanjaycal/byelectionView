<script>
  import { partyColor, formatNumber, formatPct, formatDelta } from '../format.js'

  let { riding, previous, onclose } = $props()

  const previousByParty = $derived(
    new Map((previous?.candidates ?? []).map((c) => [c.party, c]))
  )
  const currentByParty = $derived(
    new Map(riding.candidates.map((c) => [c.party, c]))
  )

  function swing(candidate) {
    const before = previousByParty.get(candidate.party)
    if (!before) return null
    return candidate.pct - before.pct
  }

  function onkeydown(event) {
    if (event.key === 'Escape') onclose()
  }
</script>

<svelte:window {onkeydown} />

<div
  class="overlay"
  role="presentation"
  onclick={(event) => {
    if (event.target === event.currentTarget) onclose()
  }}
>
  <div class="modal" role="dialog" aria-modal="true" tabindex="-1" aria-label={riding.displayName}>
    <header>
      <h2>{riding.displayName}</h2>
      <div class="meta">
        <span class="tag">{riding.type}</span>
      </div>
      <button class="close" type="button" onclick={onclose} aria-label="Close">X</button>
    </header>

    <div class="columns">
      <section class="col">
        <h3>Current results</h3>
        <p class="sub">by-election &mdash; {riding.type}</p>
        {#if previous}
          <p class="legend"><span class="tick"></span>2025 general election</p>
        {/if}
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th class="num">Votes</th>
              <th class="num">%</th>
              <th class="num">vs 2025</th>
            </tr>
          </thead>
          <tbody>
            {#each riding.candidates as candidate, i (candidate.surname + candidate.party)}
              {@const delta = swing(candidate)}
              {@const mark = previousByParty.get(candidate.party)?.pct}
              <tr>
                <td>
                  <div class="cand">
                    <span class="rank">{i + 1}</span>
                    <span class="chip" style="background:{partyColor(candidate.party)}"></span>
                    <span class="cname">{candidate.name}</span>
                  </div>
                  <div class="party">{candidate.party}</div>
                </td>
                <td class="num">{formatNumber(candidate.votes)}</td>
                <td class="num pct">{formatPct(candidate.pct)}</td>
                <td class="num delta" class:up={delta > 0} class:down={delta < 0}>
                  {formatDelta(delta)}
                </td>
              </tr>
              <tr class="bar-row">
                <td colspan="4">
                  <span class="bar">
                    <i style="width:{candidate.pct}%;background:{partyColor(candidate.party)}"></i>
                    {#if mark != null}
                      <span
                        class="marker"
                        style="left:{mark}%"
                        title="2025 general election: {formatPct(mark)}"
                      ></span>
                    {/if}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <dl class="foot-stats">
          <div><dt>Ballots cast</dt><dd>{formatNumber(riding.totalBallots)}</dd></div>
          <div><dt>Rejected</dt><dd>{formatNumber(riding.rejected)}</dd></div>
          <div><dt>Valid votes</dt><dd>{formatNumber(riding.totalBallots - riding.rejected)}</dd></div>
        </dl>
      </section>

      <section class="col">
        <h3>Previous results</h3>
        <p class="sub">2025 federal general election</p>
        {#if previous}
          <p class="legend"><span class="tick"></span>by-election result</p>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th class="num">Votes</th>
                <th class="num">%</th>
                <th class="num"></th>
              </tr>
            </thead>
            <tbody>
              {#each previous.candidates as candidate, i (candidate.surname + candidate.party)}
                {@const mark = currentByParty.get(candidate.party)?.pct}
                <tr>
                  <td>
                    <div class="cand">
                      <span class="rank">{i + 1}</span>
                      <span class="chip" style="background:{partyColor(candidate.party)}"></span>
                      <span class="cname">{candidate.name}</span>
                    </div>
                    <div class="party">{candidate.party}</div>
                  </td>
                  <td class="num">{formatNumber(candidate.votes)}</td>
                  <td class="num pct">{formatPct(candidate.pct)}</td>
                  <td class="num delta"></td>
                </tr>
                <tr class="bar-row">
                  <td colspan="4">
                    <span class="bar">
                      <i style="width:{candidate.pct}%;background:{partyColor(candidate.party)}"></i>
                      {#if mark != null}
                        <span
                          class="marker"
                          style="left:{mark}%"
                          title="by-election: {formatPct(mark)}"
                        ></span>
                      {/if}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          <dl class="foot-stats">
            <div><dt>Valid votes</dt><dd>{formatNumber(previous.totalValid)}</dd></div>
            <div><dt>Ballots cast</dt><dd>{formatNumber(previous.ballotsCast)}</dd></div>
            <div><dt>Rejected</dt><dd>{formatNumber(previous.rejected)}</dd></div>
            <div><dt>Turnout</dt><dd>{formatPct(previous.turnout)}</dd></div>
            <div><dt>Electors</dt><dd>{formatNumber(previous.eligible)}</dd></div>
          </dl>
        {:else}
          <p class="empty">No 2025 results on file for this riding.</p>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(40, 45, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    z-index: 20;
  }

  .modal {
    width: min(1500px, 100%);
    max-height: 90vh;
    overflow: auto;
    background: var(--bg);
    border: 1px solid var(--accent-dim);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12), 0 24px 60px rgba(0, 0, 0, 0.25);
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.2rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
    position: sticky;
    top: 0;
  }

  header h2 {
    margin: 0;
    font-size: 1.3rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .meta {
    display: flex;
    gap: 0.4rem;
    flex: 1;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dim);
    border: 1px solid var(--line);
    padding: 0.12rem 0.4rem;
  }

  .close {
    font: inherit;
    font-size: 1.05rem;
    color: var(--text);
    background: transparent;
    border: 1px solid var(--line);
    padding: 0.1rem 0.6rem;
    cursor: pointer;
  }

  .close:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .columns {
    display: grid;
    grid-template-columns: 3fr 2fr;
  }

  .col {
    padding: 0.95rem 1.1rem 1.2rem;
    border-right: 1px solid var(--line);
    min-width: 0;
  }

  .col:last-child {
    border-right: none;
  }

  .col h3 {
    margin: 0;
    font-size: 1.25rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .sub {
    margin: 0.2rem 0 0.9rem;
    font-size: 0.82rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dim);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
    text-align: left;
    font-weight: normal;
    border-bottom: 1px solid var(--line);
    padding: 0 0.4rem 0.4rem 0;
  }

  td {
    padding: 0.4rem 0.4rem 0.4rem 0;
    border-bottom: 1px solid var(--line-soft);
    font-size: 1.25rem;
    vertical-align: top;
  }

  .num {
    text-align: right;
    white-space: nowrap;
    min-width: 4.2rem;
  }

  .pct {
    color: var(--text);
  }

  .cand {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .rank {
    color: var(--dim);
    font-size: 1rem;
    min-width: 1.4rem;
  }

  .chip {
    width: 0.7rem;
    height: 0.7rem;
    flex: none;
    display: inline-block;
  }

  .cname {
    overflow-wrap: break-word;
  }

  .party {
    color: var(--dim);
    font-size: 0.88rem;
    padding-left: 1.75rem;
  }

  .delta {
    color: var(--dim);
    font-size: 1rem;
  }

  .delta.up {
    color: var(--up);
  }

  .delta.down {
    color: var(--down);
  }

  .bar-row td {
    border-bottom: 1px solid var(--line-soft);
    padding: 0 0 0.25rem 0;
  }

  .bar {
    position: relative;
    display: block;
    height: 18px;
    background: var(--line);
  }

  .bar i {
    display: block;
    height: 100%;
  }

  .marker {
    position: absolute;
    top: -4px;
    height: 26px;
    width: 4px;
    background: var(--text);
    opacity: 0.7;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.82rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
    margin-top: 0.6rem;
  }

  .legend .tick {
    display: inline-block;
    width: 3px;
    height: 15px;
    background: var(--text);
    opacity: 0.7;
  }

  .foot-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1.4rem;
    margin: 0.8rem 0 0;
  }

  .foot-stats div {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  dt {
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
  }

  dd {
    margin: 0;
    font-size: 1.15rem;
  }

  .empty {
    color: var(--dim);
    font-size: 1.1rem;
  }

  @media (max-width: 1000px) {
    .columns {
      grid-template-columns: 1fr;
    }

    .col {
      border-right: none;
      border-bottom: 1px solid var(--line);
    }
  }
</style>
