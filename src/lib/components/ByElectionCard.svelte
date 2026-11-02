<script>
  import { partyColor, contrastText, formatNumber, formatPct } from '../format.js'
  import { abbreviateParty, barContrast, shortenIfNeeded } from '../partyLabel.js'

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
      {@const colour = partyColor(candidate.party)}
      <li
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
        <span class="votes bar-wrap" data-on-bar>
          <span class="bar-under">{formatNumber(candidate.votes)}</span>
          <span class="bar-over" aria-hidden="true">{formatNumber(candidate.votes)}</span>
        </span>
        <span class="pct bar-wrap" data-on-bar>
          <span class="bar-under">{formatPct(candidate.pct)}</span>
          <span class="bar-over" aria-hidden="true">{formatPct(candidate.pct)}</span>
        </span>
        {#if mark != null}
          <span
            class="marker"
            style="left:{mark}%"
            title="2025 general election: {formatPct(mark)}"
          ></span>
        {/if}
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

  .candidates li.row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 28px;
    padding: 0.15rem 0.6rem;
    overflow: hidden;
    background: linear-gradient(
      to right,
      var(--party) 0 var(--pct),
      var(--line) var(--pct) 100%
    );
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
    font-size: 1.3rem;
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
    width: max-content;
    visibility: hidden;
  }

  .cparty:global(.is-short) .abbr {
    display: inline;
  }

  .votes {
    flex: none;
    font-size: 1.3rem;
    color: var(--text);
  }

  .pct {
    flex: none;
    font-size: 1.3rem;
    color: var(--accent);
    min-width: 4.6rem;
    text-align: right;
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

  .candidates li.more {
    display: block;
    color: var(--dim);
    font-size: 0.95rem;
    padding-top: 0.05rem;
  }
</style>
