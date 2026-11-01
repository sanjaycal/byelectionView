const PARTY_COLORS = {
  Liberal: '#e5424b',
  Conservative: '#2f6fd0',
  'Bloc Québécois': '#4aa3df',
  'NDP-New Democratic Party': '#f0803c',
  'Green Party': '#39a24b',
  "People's Party - PPC": '#8a63c8',
  'Canadian Future Party': '#12a0a0',
  Independent: '#9aa5a0'
}

/** Maps Wikipedia party labels onto Elections Canada party names. */
export function normalizeParty(party) {
  if (!party) return party
  const value = party.toLowerCase()
  if (value.includes('new democratic') || value.includes('ndp')) return 'NDP-New Democratic Party'
  if (value.includes('green')) return 'Green Party'
  if (value.includes('people')) return "People's Party - PPC"
  if (value.includes('canadian future')) return 'Canadian Future Party'
  if (value.includes('bloc')) return 'Bloc Québécois'
  if (value.includes('independent')) return 'Independent'
  if (value.includes('conservative')) return 'Conservative'
  if (value.includes('liberal')) return 'Liberal'
  return party
}

export function partyColor(party) {
  if (!party) return '#6b7a74'
  if (PARTY_COLORS[party]) return PARTY_COLORS[party]
  const key = Object.keys(PARTY_COLORS).find((name) => party.includes(name))
  return key ? PARTY_COLORS[key] : '#7d8a84'
}

/** Picks a readable text colour to sit on top of a background colour. */
export function contrastText(hex) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16) / 255
  const g = parseInt(value.slice(2, 4), 16) / 255
  const b = parseInt(value.slice(4, 6), 16) / 255
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma > 0.55 ? '#14181a' : '#ffffff'
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toLocaleString('en-CA')
}

export function formatPct(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Number(value).toFixed(1)}%`
}

export function formatDelta(value) {
  if (value == null || Number.isNaN(value)) return ''
  const rounded = Math.round(value * 10) / 10
  if (rounded === 0) return '±0.0'
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`
}
