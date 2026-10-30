/**
 * Builds src/data/previous-results-2025.json
 *
 * Source: Wikipedia riding articles (the "2025 Canadian federal election" results
 * table is transcluded into every federal riding article, and its underlying data
 * is Elections Canada's official voting results).
 *
 * Requests are issued one at a time with a fixed delay and exponential backoff on
 * 429s, and progress is written to disk after every riding so the script can be
 * re-run to fill in gaps.
 *
 * Usage: node scripts/fetch-previous-results.mjs [--limit N] [--only "Riding A,Riding B"]
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/data/previous-results-2025.json')
const API = 'https://en.wikipedia.org/w/api.php'
const UA = 'byelection-view/1.0 (https://localhost; dev tool)'

const REQUEST_DELAY_MS = 700
const MAX_TRIES = 6

const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
  'Northwest Territories',
  'Nunavut'
]

const PARTY_ALIASES = {
  'New Democratic': 'NDP-New Democratic Party',
  'NDP': 'NDP-New Democratic Party',
  'Green': 'Green Party',
  "People's": "People's Party - PPC",
  'People’s': "People's Party - PPC",
  'Bloc Québécois': 'Bloc Québécois',
  'Independent': 'Independent',
  'Conservative': 'Conservative',
  'Liberal': 'Liberal',
  'Canadian Future Party': 'Canadian Future Party'
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let lastRequest = 0
async function throttle() {
  const wait = REQUEST_DELAY_MS - (Date.now() - lastRequest)
  if (wait > 0) await sleep(wait)
  lastRequest = Date.now()
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: 'json', formatversion: '2', maxlag: '5' })}`
  let backoff = 3000
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    await throttle()
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.status === 429) throw new Error('429 rate limited')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === MAX_TRIES) throw err
      console.warn(`  retry (${err.message}), waiting ${backoff}ms`)
      await sleep(backoff)
      backoff = Math.min(backoff * 2, 60000)
    }
  }
}

async function listRidings() {
  const titles = []
  for (const province of PROVINCES) {
    const data = await api({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${province} federal electoral districts`,
      cmlimit: '500',
      cmnamespace: '0'
    })
    for (const m of data.query?.categorymembers ?? []) titles.push(m.title)
  }
  return [...new Set(titles)].sort()
}

/** Split html into top-level <table> blocks (depth aware). */
export function splitTables(html) {
  const tables = []
  let cursor = 0
  while (cursor < html.length) {
    const start = html.indexOf('<table', cursor)
    if (start === -1) break
    let depth = 0
    let i = start
    let end = -1
    while (i < html.length) {
      const open = html.indexOf('<table', i)
      const close = html.indexOf('</table', i)
      if (close === -1) break
      if (open !== -1 && open < close) {
        depth++
        i = open + 6
      } else {
        depth--
        i = close + 7
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end === -1) break
    tables.push(html.slice(start, end))
    cursor = end
  }
  return tables
}

export function textOf(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&rsquo;/g, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

export function rowsOf(table) {
  const rows = []
  const tr = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
  let m
  while ((m = tr.exec(table))) {
    const cells = []
    const td = /<(t[hd])\b[^>]*>([\s\S]*?)<\/\1>/gi
    let c
    while ((c = td.exec(m[1]))) cells.push(textOf(c[2]))
    rows.push(cells)
  }
  return rows
}

function num(value) {
  if (value == null) return null
  const cleaned = value.replace(/,/g, '').replace(/[^\d.\-]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

const SKIP = /^(total|turnout|eligible voters|swing|notional|valid votes|rejected ballots)/i

export function parseResultsTable(table) {
  const rows = rowsOf(table).map((cells) => (cells[0] === '' ? cells.slice(1) : cells))
  const start = rows.findIndex((cells) => cells.join(' ').includes('2025 Canadian federal election'))
  if (start === -1) return null

  const candidates = []
  let totalValid = null
  let rejected = null
  let turnout = null
  let ballotsCast = null
  let eligible = null

  for (const cells of rows.slice(start + 1)) {
    if (cells.length === 0) continue
    const label = cells[0]
    if (/^total valid votes/i.test(label)) {
      totalValid = num(cells[1]) ?? totalValid
      continue
    }
    if (/^total rejected ballots/i.test(label)) {
      rejected = num(cells[1]) ?? rejected
      continue
    }
    if (/^turnout/i.test(label)) {
      ballotsCast = num(cells[1]) ?? ballotsCast
      turnout = num(cells[2]) ?? turnout
      continue
    }
    if (/^eligible voters/i.test(label)) {
      eligible = num(cells[1]) ?? eligible
      continue
    }
    if (SKIP.test(label)) continue
    if (cells.length < 4) continue

    const votes = num(cells[2])
    const pct = num(cells[3])
    if (votes == null || pct == null) continue

    const party = PARTY_ALIASES[label] ?? label
    candidates.push({
      party,
      name: cells[1],
      votes,
      pct: Math.round(pct * 100) / 100
    })
  }

  if (!candidates.length) return null
  return { candidates, totalValid, rejected, turnout, ballotsCast, eligible }
}

async function resultsForRiding(title) {
  const data = await api({ action: 'parse', page: title, prop: 'text', redirects: '1' })
  const raw = data.parse?.text
  const html = typeof raw === 'string' ? raw : raw?.['*'] ?? ''
  let best = null
  for (const table of splitTables(html)) {
    const parsed = parseResultsTable(table)
    if (parsed && parsed.candidates.length > (best?.candidates.length ?? 0)) best = parsed
  }
  if (!best) return null
  return {
    year: 2025,
    title,
    candidates: best.candidates,
    totalValid: best.totalValid,
    rejected: best.rejected,
    turnout: best.turnout,
    ballotsCast: best.ballotsCast,
    eligible: best.eligible
  }
}

/** "Chicoutimi—Le Fjord" -> "Chicoutimi--Le Fjord" (Elections Canada style). */
export function toEcName(title) {
  return title
    .replace(/\s*\((?:federal )?electoral district\)\s*$/i, '')
    .replace(/—/g, '--')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const limitArg = process.argv.indexOf('--limit')
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity
  const onlyArg = process.argv.indexOf('--only')
  const only =
    onlyArg > -1
      ? process.argv[onlyArg + 1].split(',').map((s) => s.trim()).filter(Boolean)
      : null

  let titles = await listRidings()
  if (only) titles = only
  titles = titles.slice(0, limit)
  console.log(`riding pages to fetch: ${titles.length}`)

  const out = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : {}
  await mkdir(dirname(OUT), { recursive: true })

  let done = 0
  const failures = []
  for (const title of titles) {
    const key = toEcName(title)
    if (out[key]) {
      done++
      continue
    }
    try {
      const res = await resultsForRiding(title)
      if (res) out[key] = res
      else failures.push(title)
    } catch (err) {
      failures.push(title)
      console.warn(`  ! ${title}: ${err.message}`)
    }
    done++
    if (done % 25 === 0) {
      console.log(`  ${done}/${titles.length} (saved ${Object.keys(out).length})`)
      await writeFile(OUT, JSON.stringify(out))
    }
  }

  await writeFile(OUT, JSON.stringify(out))
  console.log(
    `wrote ${Object.keys(out).length} ridings to ${OUT} (${failures.length} failures: ${failures.join(' | ')})`
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
