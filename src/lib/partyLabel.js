/** Short party labels, used when the full name will not fit on the line. */
export const PARTY_ABBREVIATIONS = {
  Liberal: 'LPC',
  Conservative: 'CPC',
  'NDP-New Democratic Party': 'NDP',
  'Bloc Québécois': 'BQ',
  'Green Party': 'GPC',
  "People's Party - PPC": 'PPC',
  'Canadian Future Party': 'CFP',
  Independent: 'IND'
}

export function abbreviateParty(party) {
  if (PARTY_ABBREVIATIONS[party]) return PARTY_ABBREVIATIONS[party]
  const words = party.split(/\s+/)
  if (words.length < 2) return party
  return words
    .map((word) => word[0].toUpperCase())
    .join('')
    .slice(0, 4)
}

/**
 * Svelte action: swaps a party label for its abbreviation when the full label
 * would not fit on the same line as the candidate name.
 *
 * Expects the node to contain `.cname`, `.cparty`, `.full` and `.chip`.
 */
export function shortenIfNeeded(node) {
  const update = () => {
    const name = node.querySelector('.cname')
    const party = node.querySelector('.cparty')
    const full = party?.querySelector('.full')
    const chip = party?.querySelector('.chip')
    if (!name || !party || !full || !chip) return

    const gap = parseFloat(getComputedStyle(node).columnGap) || 0
    const partyGap = parseFloat(getComputedStyle(party).columnGap) || 0
    const needed = name.scrollWidth + gap + chip.offsetWidth + partyGap + full.offsetWidth

    party.classList.toggle('is-short', needed > node.clientWidth + 1)
  }

  update()
  const observer = new ResizeObserver(update)
  observer.observe(node)
  window.addEventListener('resize', update)
  document.fonts?.ready.then(update)

  return {
    destroy() {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }
}

/**
 * Svelte action for bars that carry their own text: marks the bits of text that
 * sit over the coloured (filled) part of the bar so they can be recoloured.
 *
 * The row sets `--pct` (the filled share) and `--party` (the fill colour).
 */
export function barContrast(node) {
  const update = () => {
    const pct = parseFloat(node.style.getPropertyValue('--pct')) || 0
    const row = node.getBoundingClientRect()
    const fillWidth = (row.width * pct) / 100

    node.querySelectorAll('[data-on-bar]').forEach((element) => {
      const box = element.getBoundingClientRect()
      const left = box.left - row.left
      const right = left + box.width
      const onFill = Math.max(0, Math.min(right, fillWidth) - left)
      const onTrack = box.width - onFill
      element.classList.toggle('on-fill', onFill > 0 && onTrack === 0)
      element.classList.toggle('straddle', onFill > 0 && onTrack > 0)
    })
  }

  update()
  const observer = new ResizeObserver(update)
  observer.observe(node)
  window.addEventListener('resize', update)
  document.fonts?.ready.then(update)

  return {
    destroy() {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }
}
