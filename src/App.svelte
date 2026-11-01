<script>
  import { onMount } from 'svelte'
  import ByElectionCard from './lib/components/ByElectionCard.svelte'
  import ResultsModal from './lib/components/ResultsModal.svelte'
  import { EC_RESULTS_URL, PROXY_TEMPLATES, fetchResults, parseResults } from './lib/ec.js'
  import { previousFor, previousCount } from './lib/previous.js'

  const REFRESH_MS = 10_000

  let ridings = $state([])
  let selected = $state(null)
  let status = $state('connecting')
  let error = $state('')
  let sourceLine = $state('')
  let fetchedAt = $state(null)
  let via = $state('')
  let proxyId = $state('allorigins')
  let sourceUrl = $state(EC_RESULTS_URL)
  let showSettings = $state(false)
  let nextRefresh = $state(0)
  let now = $state(Date.now())
  let openDistrict = $state(null)

  const proxy = $derived(PROXY_TEMPLATES.find((p) => p.id === proxyId) ?? PROXY_TEMPLATES[0])
  const previous = $derived(selected ? previousFor(selected.name) : null)
  const count = $state(previousCount)

  $effect(() => {
    if (!openDistrict || !ridings.length) return
    const match = ridings.find((r) => r.id === openDistrict)
    if (match) {
      selected = match
      openDistrict = null
    }
  })

  let timer = null
  let controller = null

  async function load() {
    controller?.abort()
    controller = new AbortController()

    // Try the chosen proxy first, then fall back through the others so one
    // blocked proxy does not take the whole dashboard down.
    const ordered = [
      proxy,
      ...PROXY_TEMPLATES.filter((p) => p.id !== proxy.id && p.template)
    ]

    let lastError = null
    for (const option of ordered) {
      if (sourceUrl.startsWith('/')) {
        try {
          const text = await fetchResults(sourceUrl, option.template, controller.signal)
          apply(text, 'direct')
          return
        } catch (err) {
          if (err.name === 'AbortError') return
          lastError = err
          break
        }
      }

      try {
        const text = await fetchResults(sourceUrl, option.template, controller.signal)
        apply(text, option.label)
        proxyId = option.id
        localStorage.setItem('byelection.proxy', option.id)
        return
      } catch (err) {
        if (err.name === 'AbortError') return
        lastError = err
      }
    }

    status = 'error'
    error = lastError?.message ?? 'unknown error'
    nextRefresh = Date.now() + REFRESH_MS
  }

  function apply(text, viaLabel) {
    const parsed = parseResults(text)
    ridings = parsed.ridings
    sourceLine = parsed.updatedLine
    fetchedAt = new Date()
    status = 'live'
    error = ''
    via = viaLabel
    nextRefresh = Date.now() + REFRESH_MS
  }

  function startPolling() {
    stopPolling()
    load()
    timer = setInterval(load, REFRESH_MS)
    now = Date.now()
  }

  function stopPolling() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function changeProxy(id) {
    proxyId = id
    localStorage.setItem('byelection.proxy', id)
  }

  function changeSource(url) {
    sourceUrl = url
    localStorage.setItem('byelection.source', url)
  }

  onMount(() => {
    const savedProxy = localStorage.getItem('byelection.proxy')
    const savedSource = localStorage.getItem('byelection.source')
    if (savedProxy && PROXY_TEMPLATES.some((p) => p.id === savedProxy)) proxyId = savedProxy
    if (savedSource) sourceUrl = savedSource

    const params = new URLSearchParams(window.location.search)
    if (params.get('source')) sourceUrl = params.get('source')
    if (params.get('proxy') && PROXY_TEMPLATES.some((p) => p.id === params.get('proxy'))) {
      proxyId = params.get('proxy')
    }
    openDistrict = params.get('open')

    startPolling()
    const tick = setInterval(() => (now = Date.now()), 1000)
    return () => {
      stopPolling()
      clearInterval(tick)
      controller?.abort()
    }
  })

  const secondsLeft = $derived(Math.max(0, Math.ceil((nextRefresh - now) / 1000)))
</script>

<header class="topbar">
  <div class="brand">
    <h1>By-election live results</h1>
    <p>Elections Canada data</p>
  </div>

  <div class="status">
    <span class="dot" class:live={status === 'live'} class:error={status === 'error'}></span>
    <span class="line">
      {#if status === 'live'}
        live &mdash; next refresh in {secondsLeft}s
      {:else if status === 'error'}
        error &mdash; {error}
      {:else}
        connecting
      {/if}
    </span>
    {#if sourceLine}
      <span class="line dim">{sourceLine}</span>
    {/if}
    {#if via}
      <span class="line dim">via {via}</span>
    {/if}
    <button class="gear" type="button" onclick={() => (showSettings = !showSettings)}>
      {showSettings ? 'close' : 'settings'}
    </button>
  </div>
</header>

{#if showSettings}
  <div class="settings">
    <label>
      <span>Source</span>
      <input
        type="text"
        value={sourceUrl}
        oninput={(event) => changeSource(event.currentTarget.value)}
      />
    </label>
    <label>
      <span>CORS proxy</span>
      <select value={proxyId} onchange={(event) => changeProxy(event.currentTarget.value)}>
        {#each PROXY_TEMPLATES as option (option.id)}
          <option value={option.id}>{option.label}</option>
        {/each}
      </select>
    </label>
    <button type="button" onclick={load}>refresh now</button>
    <p class="hint">
      The Elections Canada download endpoint sends no CORS headers, so the browser reads it
      through a proxy. Swap the proxy here if one is blocked on your network.
    </p>
  </div>
{/if}

<main>
  {#if ridings.length}
    <div class="grid">
      {#each ridings as riding (riding.id)}
        <ByElectionCard {riding} previous={previousFor(riding.name)} onopen={(r) => (selected = r)} />
      {/each}
    </div>
  {:else if status === 'error'}
    <p class="empty">Could not load results: {error}</p>
  {:else}
    <p class="empty">loading results...</p>
  {/if}
</main>

{#if selected}
  <ResultsModal riding={selected} {previous} onclose={() => (selected = null)} />
{/if}

<style>
  .topbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding: 0.7rem 1.25rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
  }

  h1 {
    margin: 0;
    font-size: 1.1rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .brand p {
    margin: 0.2rem 0 0;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
  }

  .dot {
    width: 0.55rem;
    height: 0.55rem;
    background: var(--dim);
    display: inline-block;
  }

  .dot.live {
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
  }

  .dot.error {
    background: var(--down);
  }

  .line.dim {
    color: var(--dim);
  }

  .gear {
    font: inherit;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dim);
    background: transparent;
    border: 1px solid var(--line);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
  }

  .gear:hover {
    color: var(--accent);
    border-color: var(--accent);
  }

  .settings {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel-hi);
  }

  .settings label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .settings span {
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
  }

  input,
  select {
    font: inherit;
    font-size: 0.9rem;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--line);
    padding: 0.3rem 0.45rem;
    min-width: 18rem;
  }

  select {
    min-width: 12rem;
  }

  .settings button {
    font: inherit;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    background: transparent;
    border: 1px solid var(--accent-dim);
    padding: 0.35rem 0.7rem;
    cursor: pointer;
  }

  .hint {
    margin: 0;
    flex: 1 1 100%;
    font-size: 0.8rem;
    color: var(--dim);
  }

  main {
    padding: 0.9rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.7rem;
    align-items: stretch;
  }

  .empty {
    color: var(--dim);
    font-size: 1.05rem;
    padding: 2rem 0;
  }

  @media (max-width: 1500px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
