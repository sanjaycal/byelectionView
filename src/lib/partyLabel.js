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
 * Expects the node to contain `.cname`, `.cparty` and a `.full` label inside
 * `.cparty`. A `.chip` swatch, if there is one, is counted as part of the
 * party label's width.
 */
export function shortenIfNeeded(node) {
  const update = () => {
    const name = node.querySelector('.cname')
    const party = node.querySelector('.cparty')
    const full = party?.querySelector('.full')
    if (!name || !party || !full) return

    const gap = parseFloat(getComputedStyle(node).columnGap) || 0
    const chip = party.querySelector('.chip')
    const chipWidth = chip
      ? chip.offsetWidth + (parseFloat(getComputedStyle(party).columnGap) || 0)
      : 0

    // The name is clipped with an ellipsis, so its box is narrower than the
    // text it holds: `scrollWidth` is the width the text actually wants.
    const nameWidth = name.scrollWidth
    const fullWidth = full.getBoundingClientRect().width

    const needed = nameWidth + gap + chipWidth + fullWidth
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
      const visible = Math.max(0, Math.min(box.width, fillWidth - left))
      element.style.setProperty('--visible', `${visible}px`)
    })
  }

  update()
  const observer = new ResizeObserver(update)
  observer.observe(node)
  // Swapping the party label for its abbreviation changes its width, which
  // moves it along the bar, so the fill edge has to be measured again.
  const mutations = new MutationObserver(update)
  mutations.observe(node, { attributes: true, attributeFilter: ['class'], subtree: true })
  window.addEventListener('resize', update)
  document.fonts?.ready.then(update)

  return {
    destroy() {
      observer.disconnect()
      mutations.disconnect()
      window.removeEventListener('resize', update)
    }
  }
}
