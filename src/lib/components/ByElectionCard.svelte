<script>
  import { partyColor, formatNumber, formatPct } from '../format.js'

  let { riding, previous, onopen } = $props()

  const top = $derived(riding.candidates.slice(0, 5))
  const previousPct = $derived(
    new Map((previous?.candidates ?? []).map((c) => [c.party, c.pct]))
  )
</script>

<button class="card" type="button" onclick={() => onopen(riding)}>
  <div class="card-top">
    <h2>{riding.name}</h2>
    <span class="badge">{riding.type}</span>
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
  </dl>

  <ol class="candidates">
    {#each top as candidate, i (candidate.surname + candidate.party)}
      {@const mark = previousPct.get(candidate.party)}
      <li>
        <span class="rank">{i + 1}</span>
        <span class="who">
          <span class="cname">{candidate.name}</span>
          <span class="cparty">
            <i class="chip" style="background:{partyColor(candidate.party)}"></i>{candidate.party}
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

  <div class="card-foot">
    <span>click for details</span>
    {#if previous}
      <span class="legend"><span class="tick"></span>2025 general election</span>
    {/if}
  </div>
</button>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    height: 100%;
    padding: 1rem;
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

  h2 {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: 0.04em;
    line-height: 1.25;
    text-transform: uppercase;
  }

  .badge {
    flex: none;
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
    border: 1px solid var(--line);
    padding: 0.1rem 0.35rem;
  }

  .stats {
    display: flex;
    gap: 1.5rem;
    margin: 0;
  }

  .stats div {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  dt {
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
  }

  dd {
    margin: 0;
    font-size: 1rem;
    color: var(--text);
  }

  dd.na {
    color: var(--dim);
  }

  .candidates {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    flex: 1;
  }

  .candidates li {
    display: grid;
    grid-template-columns: 1.2rem 1fr auto auto;
    grid-template-areas:
      'rank who votes pct'
      'bar bar bar bar';
    align-items: center;
    column-gap: 0.5rem;
  }

  .rank {
    grid-area: rank;
    color: var(--dim);
    font-size: 0.75rem;
  }

  .who {
    grid-area: who;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .cname {
    font-size: 0.92rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cparty {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.62rem;
    color: var(--dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip {
    flex: none;
    width: 0.5rem;
    height: 0.5rem;
    display: inline-block;
  }

  .votes {
    grid-area: votes;
    font-size: 0.92rem;
    color: var(--text);
  }

  .pct {
    grid-area: pct;
    font-size: 0.92rem;
    color: var(--accent);
    min-width: 3.6rem;
    text-align: right;
  }

  .bar {
    grid-area: bar;
    position: relative;
    display: block;
    height: 4px;
    background: var(--line);
    margin-top: 0.15rem;
  }

  .bar i {
    display: block;
    height: 100%;
  }

  .marker {
    position: absolute;
    top: -3px;
    height: 10px;
    width: 2px;
    background: var(--text);
    opacity: 0.7;
  }

  .candidates li.more {
    display: block;
    color: var(--dim);
    font-size: 0.7rem;
    padding-top: 0.15rem;
  }

  .card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dim);
    border-top: 1px solid var(--line);
    padding-top: 0.5rem;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    letter-spacing: 0.08em;
  }

  .tick {
    display: inline-block;
    width: 2px;
    height: 9px;
    background: var(--text);
    opacity: 0.7;
  }

  .card:hover .card-foot {
    color: var(--accent);
  }
</style>
