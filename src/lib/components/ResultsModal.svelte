<script>
  import { partyColor, contrastText, formatNumber, formatPct, formatDelta } from '../format.js'
  import { abbreviateParty, barContrast, shortenIfNeeded } from '../partyLabel.js'

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
        <div class="rows">
          <div class="head">
            <span>Candidate</span>
            <span class="num">Votes</span>
            <span class="num">%</span>
            <span class="num">vs 2025</span>
          </div>
          {#each riding.candidates as candidate, i (candidate.surname + candidate.party)}
            {@const delta = swing(candidate)}
            {@const mark = previousByParty.get(candidate.party)?.pct}
            {@const colour = partyColor(candidate.party)}
            <div
              class="row"
              use:barContrast
              style="--pct:{candidate.pct}%; --party:{colour}; --on-fill:{contrastText(colour)}"
            >
              <span class="who" use:shortenIfNeeded>
                <span class="cname bar-wrap" data-on-bar>
                  <span class="bar-under">{candidate.name}</span>
                  <span class="bar-over" aria-hidden="true">{candidate.name}</span>
                </span>
                <span class="cparty bar-wrap" data-on-bar>
                  <span class="bar-under">
                    <span class="full">{candidate.party}</span>
                    <span class="abbr">{abbreviateParty(candidate.party)}</span>
                  </span>
                  <span class="bar-over" aria-hidden="true">
                    <span class="full">{candidate.party}</span>
                    <span class="abbr">{abbreviateParty(candidate.party)}</span>
                  </span>
                </span>
              </span>
              <span class="num votes bar-wrap" data-on-bar>
                <span class="bar-under">{formatNumber(candidate.votes)}</span>
                <span class="bar-over" aria-hidden="true">{formatNumber(candidate.votes)}</span>
              </span>
              <span class="num pct bar-wrap" data-on-bar>
                <span class="bar-under">{formatPct(candidate.pct)}</span>
                <span class="bar-over" aria-hidden="true">{formatPct(candidate.pct)}</span>
              </span>
              <span class="num delta bar-wrap" data-on-bar class:up={delta > 0} class:down={delta < 0}>
                <span class="bar-under">{formatDelta(delta)}</span>
                <span class="bar-over" aria-hidden="true">{formatDelta(delta)}</span>
              </span>
              {#if mark != null}
                <span
                  class="marker"
                  style="left:{mark}%"
                  title="2025 general election: {formatPct(mark)}"
                ></span>
              {/if}
            </div>
          {/each}
        </div>
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
          <div class="rows">
            <div class="head">
              <span>Candidate</span>
              <span class="num">Votes</span>
              <span class="num">%</span>
            </div>
            {#each previous.candidates as candidate, i (candidate.surname + candidate.party)}
              {@const mark = currentByParty.get(candidate.party)?.pct}
              {@const colour = partyColor(candidate.party)}
              <div
                class="row"
                use:barContrast
                style="--pct:{candidate.pct}%; --party:{colour}; --on-fill:{contrastText(colour)}"
              >
                <span class="who" use:shortenIfNeeded>
                  <span class="cname bar-wrap" data-on-bar>
                    <span class="bar-under">{candidate.name}</span>
                    <span class="bar-over" aria-hidden="true">{candidate.name}</span>
                  </span>
                  <span class="cparty bar-wrap" data-on-bar>
                    <span class="bar-under">
                      <span class="full">{candidate.party}</span>
                      <span class="abbr">{abbreviateParty(candidate.party)}</span>
                    </span>
                    <span class="bar-over" aria-hidden="true">
                      <span class="full">{candidate.party}</span>
                      <span class="abbr">{abbreviateParty(candidate.party)}</span>
                    </span>
                  </span>
                </span>
                <span class="num votes bar-wrap" data-on-bar>
                  <span class="bar-under">{formatNumber(candidate.votes)}</span>
                  <span class="bar-over" aria-hidden="true">{formatNumber(candidate.votes)}</span>
                </span>
                <span class="num pct bar-wrap" data-on-bar>
                  <span class="bar-under">{formatPct(candidate.pct)}</span>
                  <span class="bar-over" aria-hidden="true">{formatPct(candidate.pct)}</span>
                </span>
                {#if mark != null}
                  <span
                    class="marker"
                    style="left:{mark}%"
                    title="by-election: {formatPct(mark)}"
                  ></span>
                {/if}
              </div>
            {/each}
          </div>
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

  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
    padding: 0 0.6rem 0.5rem;
    border-bottom: 1px solid var(--line);
  }

  .num {
    text-align: right;
    white-space: nowrap;
    flex: none;
    width: 6.5rem;
  }

  .head .num:last-child,
  .row .delta {
    width: 5.5rem;
  }

  .pct {
    color: var(--text);
  }

  .row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 30px;
    padding: 0.2rem 0.6rem;
    overflow: hidden;
    font-size: 1.25rem;
    background: linear-gradient(
      to right,
      var(--party) 0 var(--pct),
      var(--line) var(--pct) 100%
    );
  }

  [data-on-bar]:global(.on-fill) {
    color: var(--on-fill);
  }

  [data-on-bar]:global(.straddle) {
    color: var(--text);
    text-shadow: 0 0 3px rgba(255, 255, 255, 0.9);
  }

  .who {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    min-width: 0;
    overflow: hidden;
    flex: 1 1 auto;
  }

  .cname {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 0 1 auto;
    min-width: 0;
  }

  .cname .bar-under {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cparty {
    display: inline-block;
    font-size: 0.88rem;
    color: var(--dim);
    white-space: nowrap;
    overflow: hidden;
    flex: 0 0 auto;
    max-width: 100%;
  }

  .cparty .bar-under,
  .cparty .bar-over {
    gap: 0.35rem;
  }

  .cparty .full {
    flex: none;
  }

  .cparty .abbr {
    display: none;
  }

  .cparty:global(.is-short) .full {
    position: absolute;
    left: 0;
    top: 0;
    visibility: hidden;
  }

  .cparty:global(.is-short) .abbr {
    display: inline;
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

  .marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 0;
    z-index: 1;
  }

  .marker::before,
  .marker::after {
    content: '';
    position: absolute;
    left: -5px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    opacity: 0.85;
  }

  .marker::before {
    top: 0;
    border-top: 6px solid var(--text);
  }

  .marker::after {
    bottom: 0;
    border-bottom: 6px solid var(--text);
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
