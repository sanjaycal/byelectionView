export const EC_RESULTS_URL = 'https://enr.elections.ca/DownloadResults.aspx'

/**
 * The Elections Canada download endpoint does not send CORS headers, so a browser
 * cannot read it directly. Each proxy below turns the request into a CORS query.
 * `{url}` is replaced with the URL-encoded target URL.
 */
export const PROXY_TEMPLATES = [
  { id: 'allorigins', label: 'allorigins', template: 'https://api.allorigins.win/raw?url={url}' },
  { id: 'jina', label: 'r.jina.ai', template: 'https://r.jina.ai/{raw}' },
  { id: 'codetabs', label: 'codetabs', template: 'https://api.codetabs.com/v1/proxy?quest={url}' },
  { id: 'corsproxy-io', label: 'corsproxy.io', template: 'https://corsproxy.io/?url={url}' },
  { id: 'corsproxy-org', label: 'corsproxy.org', template: 'https://corsproxy.org/?{raw}' },
  { id: 'cors-sh', label: 'proxy.cors.sh', template: 'https://proxy.cors.sh/{raw}' },
  { id: 'whateverorigin', label: 'whateverorigin', template: 'https://whateverorigin.org/get?url={url}' },
  { id: 'cors-lol', label: 'cors.lol', template: 'https://api.cors.lol/?url={url}' },
  { id: 'custom', label: 'custom', template: '' }
]

export function buildProxyUrl(template, target) {
  if (!template) return null
  return template.replace(/\{url\}/g, encodeURIComponent(target)).replace(/\{raw\}/g, target)
}

const HEADER_MARKER = 'Electoral district number'

/**
 * The download timestamp line. Some proxies (r.jina.ai) prepend their own
 * preamble, so pull out just the sentence that matters.
 */
function cleanUpdatedLine(line) {
  const match = line.match(/These results were downloaded and refreshed on\s+(.+?)\s*\/\s*Ces résultats/)
  if (match) return `Refreshed ${match[1].trim()}`
  const fallback = line.match(/refreshed on\s+(.+)/i)
  if (fallback) return `Refreshed ${fallback[1].trim()}`
  return line.replace(/\s+/g, ' ').trim()
}

/**
 * Parses the tab delimited Elections Canada download.
 * Header row is the second line of the file, data follows until the footnote lines.
 */
export function parseResults(text) {
  const lines = text.replace(/\r/g, '').split('\n')

  const headerIndex = lines.findIndex((line) => line.includes(HEADER_MARKER))
  if (headerIndex === -1) throw new Error('Unexpected format: no header row found')

  const columns = lines[headerIndex].split('\t').map((c) => c.trim())

  const col = {}
  columns.forEach((name, index) => {
    const english = name
      .split(' - ')[0]
      .replace(/\*+$/, '')
      .trim()
    col[english.toLowerCase()] = index
  })

  const idx = {
    districtNumber: col['electoral district number'],
    districtName: col['electoral district name'],
    districtNameFr: col['nom de la circonscription'],
    type: col['type of results'],
    surname: col['surname'],
    middle: col['middle name(s)'],
    given: col['given name'],
    party: col['political affiliation'],
    votes: col['votes obtained'],
    pct: col['% votes obtained'],
    rejected: col['rejected ballots'],
    totalBallots: col['total number of ballots cast']
  }

  const ridings = new Map()
  const updatedLine = cleanUpdatedLine(lines.slice(0, headerIndex).join(' ').trim())

  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim()) continue
    if (line.trimStart().startsWith('*')) break
    const cells = line.split('\t')
    if (cells.length < 4) continue

    const value = (i) => (i == null || i < 0 ? '' : (cells[i] ?? '').trim())
    const type = value(idx.type)
    if (!type) continue

    const id = value(idx.districtNumber)
    const key = id || value(idx.districtName)

    let riding = ridings.get(key)
    if (!riding) {
      riding = {
        id,
        name: value(idx.districtName),
        nameFr: value(idx.districtNameFr),
        byType: new Map()
      }
      ridings.set(key, riding)
    }

    let result = riding.byType.get(type)
    if (!result) {
      result = { candidates: new Map(), rejected: 0, totalBallots: 0 }
      riding.byType.set(type, result)
    }

    const votes = Number(value(idx.votes).replace(/,/g, '')) || 0
    const pct = Number.parseFloat(value(idx.pct)) || 0
    const party = value(idx.party)
    const surname = value(idx.surname)
    const given = value(idx.given)
    const middle = value(idx.middle)

    const name = [given, middle, surname].filter(Boolean).join(' ')

    const candidateKey = `${party}|${surname}`
    const existing = result.candidates.get(candidateKey)
    if (existing) {
      existing.votes = votes
      existing.pct = pct
    } else {
      result.candidates.set(candidateKey, { name, surname, party, votes, pct })
    }

    result.rejected = Number(value(idx.rejected).replace(/,/g, '')) || result.rejected
    result.totalBallots = Number(value(idx.totalBallots).replace(/,/g, '')) || result.totalBallots
  }

  const out = []
  for (const riding of ridings.values()) {
    // The preliminary result set is the live one; validated results are final.
    const type = riding.byType.has('preliminary') ? 'preliminary' : [...riding.byType.keys()][0]
    const result = riding.byType.get(type)
    const candidates = [...result.candidates.values()].sort((a, b) => b.votes - a.votes)

    out.push({
      id: riding.id,
      name: riding.name,
      displayName: riding.name.replace(/--/g, '\u2014'),
      nameFr: riding.nameFr,
      type,
      candidates,
      rejected: result.rejected,
      totalBallots: result.totalBallots
    })
  }

  out.sort((a, b) => a.name.localeCompare(b.name))

  return { ridings: out, updatedLine }
}

/** Fetches the download through a CORS proxy, validating the response shape. */
export async function fetchResults(target, template, signal) {
  // Same-origin (relative) sources are fetched directly, no proxy needed.
  const proxyUrl = target.startsWith('/') ? target : buildProxyUrl(template, target)
  if (!proxyUrl) throw new Error('No proxy configured')

  const res = await fetch(proxyUrl, { signal, headers: { Accept: 'text/plain, */*' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const text = await res.text()
  if (!text.includes(HEADER_MARKER)) {
    throw new Error('Proxy response did not contain the results table')
  }
  return text
}
