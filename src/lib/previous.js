import previousResults from '../data/previous-results-2025.json'
import { normalizeParty } from './format.js'

function normalize(name) {
  return (name ?? '')
    .replace(/—/g, '--')
    .replace(/\s+/g, ' ')
    .trim()
}

const cache = new Map()

/** 2025 general election result for a riding, keyed by Elections Canada riding name. */
export function previousFor(ridingName) {
  const key = normalize(ridingName)
  if (cache.has(key)) return cache.get(key)

  const raw = previousResults[key] ?? null
  let result = null

  if (raw) {
    const turnout =
      raw.turnout ??
      (raw.ballotsCast && raw.eligible ? (raw.ballotsCast / raw.eligible) * 100 : null)

    result = {
      year: raw.year,
      title: raw.title,
      candidates: raw.candidates.map((c) => ({ ...c, party: normalizeParty(c.party) })),
      totalValid: raw.totalValid,
      rejected: raw.rejected,
      turnout,
      ballotsCast: raw.ballotsCast,
      eligible: raw.eligible
    }
  }

  cache.set(key, result)
  return result
}

export const previousCount = Object.keys(previousResults).length
