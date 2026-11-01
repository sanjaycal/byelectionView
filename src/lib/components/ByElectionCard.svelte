<script>
  import { partyColor, formatNumber, formatPct } from '../format.js'
  import { abbreviateParty, shortenIfNeeded } from '../partyLabel.js'

  let { riding, previous, onopen } = $props()

  const top = $derived(riding.candidates.slice(0, 5))
  const previousPct = $derived(
    new Map((previous?.candidates ?? []).map((c) => [c.party, c.pct]))
  )
</script>

<button class="card" type="button" onclick={() => onopen(riding)}>
  <div class="card-top">
    <h2>{riding.displayName}</h2>
    <div class="tags">
      <span class="badge">{riding.type}</span>
      <span class="badge">click for details</span>
    </div>
  </div>

  <dl class="stats">
    <div>
      <dt>Polls reporting</dt>
      <dd class="na">N/A</dd>
    </div>
    <div>
      <dt>Ballots cast</dt>
      <dd>{formatNumber(riding.totalBallots)}</dd>
    </div>
    {#if previous}
      <div class="legend-item">
        <dt>Last election</dt>
        <dd class="legend">2025 general election</dd>
      </div>
    {/if}
  </dl>

  <ol class="candidates">
    {#each top as candidate, i (candidate.surname + candidate.party)}
      {@const mark = previousPct.get(candidate.party)}
      <li>
        <span class="who" use:shortenIfNeeded>
          <span class="cname">{candidate.name}</span>
          <span class="cparty">
            <i class="chip" style="background:{partyColor(candidate.party)}"></i>
            <span class="full">{candidate.party}</span>
            <span class="abbr">{abbreviateParty(candidate.party)}</span>
          </span>
        </span>
        <span class="votes">{formatNumber(candidate.votes)}</span>
        <span class="pct">{formatPct(candidate.pct)}</span>
        <span class="bar">
          <i style="width:{candidate.pct}%;background:{partyColor(candidate.party)}"></i>
          {#if mark != null}
            <span class="marker" style="left:{mark}%" title="2025 general election: {formatPct(mark)}"
            ></span>
          {/if}
        </span>
      </li>
    {/each}
    {#if riding.candidates.length > 5}
      <li class="more">+{riding.candidates.length - 5} more candidate(s)</li>
    {/if}
  </ol>
</button>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    min-width: 0;
    height: 100%;
    overflow: hidden;
    padding: 1.25rem;
    text-align: left;
    font: inherit;
    color: inherit;
    background: var(--panel);
    border: 1px solid var(--line);
    cursor: pointer;
  }

  .card:hover,
  .card:focus-visible {
    border-color: var(--accent);
    outline: none;
    background: var(--panel-hi);
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid var(--line);
    padding-bottom: 0.6rem;
  }

  .tags {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
    flex: none;
  }

  h2 {
    margin: 0;
    font-size: 1.6rem;
    letter-spacing: 0.04em;
    line-height: 1.25;
    text-transform: uppercase;
    overflow-wrap: anywhere;
    min-width: 0;
  }

  .badge {
    flex: none;
    font-size: 0.88rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
    border: 1px solid var(--line);
    padding: 0.2rem 0.5rem;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.15rem 2rem;
    margin: 0;
  }

  .stats > div {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  dt {
    font-size: 0.85rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
  }

  dd {
    margin: 0;
    font-size: 1.3rem;
    color: var(--text);
  }

  dd.na {
    color: var(--dim);
  }

  dd.legend {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.88rem;
    color: var(--dim);
    white-space: nowrap;
  }

  .candidates {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
  }

  .candidates li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    grid-template-areas:
      'who votes pct'
      'bar bar bar';
    align-items: center;
    column-gap: 0.6rem;
  }

  .who {
    grid-area: who;
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    min-width: 0;
    overflow: hidden;
  }

  .cname {
    font-size: 1.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 0 1 auto;
    min-width: 0;
  }

  .cparty {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    font-size: 0.88rem;
    color: var(--dim);
    white-space: nowrap;
    overflow: hidden;
    flex: 0 0 auto;
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

  .chip {
    flex: none;
    width: 0.7rem;
    height: 0.7rem;
    display: inline-block;
    transform: translateY(0.1rem);
  }

  .votes {
    grid-area: votes;
    font-size: 1.3rem;
    color: var(--text);
  }

  .pct {
    grid-area: pct;
    font-size: 1.3rem;
    color: var(--accent);
    min-width: 4.6rem;
    text-align: right;
  }

  .bar {
    grid-area: bar;
    position: relative;
    display: block;
    height: 18px;
    background: var(--line);
    margin-top: 0.2rem;
  }

  .bar i {
    display: block;
    height: 100%;
  }

  .marker {
    position: absolute;
    top: -5px;
    height: 28px;
    width: 4px;
    background: var(--text);
    opacity: 0.7;
  }

  .candidates li.more {
    display: block;
    color: var(--dim);
    font-size: 0.95rem;
    padding-top: 0.05rem;
  }

  .tick {
    display: inline-block;
    width: 3px;
    height: 15px;
    background: var(--text);
    opacity: 0.7;
  }

</style>
