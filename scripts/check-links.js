#!/usr/bin/env bun
// Dead link checker for queeromaha
// Scheduled mode: bun scripts/check-links.js
//   Checks all non-hidden links, sets public:false on items with dead links,
//   creates a GitHub issue and PR. Exits 0 (outputs are the issue/PR).
//   Dry-run when GH_TOKEN is unset or --dry-run is passed.
// PR mode: bun scripts/check-links.js --pr
//   Checks only newly added URLs in the diff vs GITHUB_BASE_REF.
//   Exits 1 if any dead links found (blocks merge).
// Flags: --dry-run  report results without mutating YAML or calling GitHub API

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'src', 'content', 'pages')

const PR_MODE = process.argv.includes('--pr')
const DRY_RUN = process.argv.includes('--dry-run') || !process.env.GH_TOKEN

const CONCURRENCY = 10
const TIMEOUT_MS = 12_000
// Browser-like UA — some hosts reject non-browser agents outright
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Domains that block crawlers regardless of page status — skip dead-link
// classification to avoid false positives
const SKIP_DOMAINS = [
  'facebook.com',
  'm.facebook.com',
  'fb.com',
  'linkedin.com',
]

// Platform-specific "not found" body text — returned as HTTP 200
const SHADOW_PATTERNS = [
  { host: 'instagram.com', needle: "Sorry, this page isn't available" },
  { host: 'x.com', needle: "this page doesn't exist" },
  { host: 'twitter.com', needle: "this page doesn't exist" },
  { host: 'x.com', needle: 'account suspended' },
  { host: 'twitter.com', needle: 'account suspended' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isSkipDomain(url) {
  const h = getHost(url)
  return SKIP_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`))
}

// Detects when a URL with a real path redirected to its bare domain root,
// e.g. instagram.com/someuser → instagram.com/ (profile was deleted)
function isSuspiciousRedirect(originalUrl, finalUrl) {
  try {
    const o = new URL(originalUrl)
    const f = new URL(finalUrl)
    if (o.hostname !== f.hostname) return false
    const origPath = o.pathname.replace(/\/$/, '')
    const finalPath = f.pathname.replace(/\/$/, '')
    return origPath.length > 1 && finalPath === ''
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Link checking
// ---------------------------------------------------------------------------

async function checkLink(url) {
  if (isSkipDomain(url)) {
    return { status: 'skip', reason: 'known bot-blocking domain' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    })
    clearTimeout(timer)

    const statusCode = response.status
    const finalUrl = response.url

    // Only 404/410 are reliable "page is gone" signals. 403/415/429 and other
    // 4xx are typically bot-filtering or server quirks on pages that work in a
    // browser. 5xx may be temporary outages — warn but don't auto-hide.
    if (statusCode === 404 || statusCode === 410) {
      return {
        status: 'dead',
        statusCode,
        reason: `HTTP ${statusCode}`,
        finalUrl,
      }
    }
    if (statusCode >= 500) {
      return {
        status: 'shadow',
        statusCode,
        reason: `HTTP ${statusCode} (server error, may be temporary)`,
        finalUrl,
      }
    }
    if (statusCode >= 400) {
      return {
        status: 'skip',
        statusCode,
        reason: `HTTP ${statusCode} (likely bot-filtering)`,
        finalUrl,
      }
    }

    if (isSuspiciousRedirect(url, finalUrl)) {
      return {
        status: 'shadow',
        statusCode,
        reason: 'redirected to domain root',
        finalUrl,
      }
    }

    // Body scan for known shadow-404 platforms
    const host = getHost(url)
    const patterns = SHADOW_PATTERNS.filter((p) => host.includes(p.host))
    if (patterns.length > 0) {
      const body = await response.text()
      for (const p of patterns) {
        if (body.includes(p.needle)) {
          return {
            status: 'shadow',
            statusCode,
            reason: `body: "${p.needle}"`,
            finalUrl,
          }
        }
      }
    }

    return { status: 'ok', statusCode, finalUrl }
  } catch (err) {
    clearTimeout(timer)
    const reason =
      err?.name === 'AbortError' ? 'timeout' : (err?.message ?? String(err))
    return { status: 'dead', reason }
  }
}

// Classic worker-pool — workers share an index, JS single-thread ensures no
// race on idx++
async function checkAll(urls) {
  const results = new Array(urls.length)
  let idx = 0

  async function worker() {
    while (idx < urls.length) {
      const i = idx++
      const url = urls[i]
      process.stdout.write(`  ${url}\n`)
      results[i] = { url, ...(await checkLink(url)) }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker),
  )
  return results
}

// ---------------------------------------------------------------------------
// Gather links
// ---------------------------------------------------------------------------

function gatherAllLinks() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.yaml'))
  const entries = []
  for (const filename of files) {
    const text = readFileSync(join(CONTENT_DIR, filename), 'utf8')
    const data = parseDocument(text).toJS()
    for (const item of data.items ?? []) {
      if (item.public === false) continue
      for (const link of item.links ?? []) {
        entries.push({
          file: filename,
          itemName: item.name,
          label: link.label,
          url: link.url,
        })
      }
    }
  }
  return entries
}

function gatherNewLinksFromDiff() {
  const baseRef = process.env.GITHUB_BASE_REF ?? 'main'
  const proc = Bun.spawnSync(
    ['git', 'diff', `origin/${baseRef}...HEAD`, '--', 'src/content/pages/'],
    { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' },
  )
  const diff = new TextDecoder().decode(proc.stdout)
  const urls = new Set()
  for (const line of diff.split('\n')) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue
    const match = line.match(/^\+\s+url:\s+(\S+)\s*$/)
    if (match) urls.add(match[1])
  }
  return [...urls]
}

// ---------------------------------------------------------------------------
// YAML mutation
// ---------------------------------------------------------------------------

function hideItemsInYaml(deadByFile) {
  const modified = []
  for (const [filename, itemNames] of Object.entries(deadByFile)) {
    const path = join(CONTENT_DIR, filename)
    const text = readFileSync(path, 'utf8')
    const doc = parseDocument(text)
    const itemsSeq = doc.get('items')
    if (!itemsSeq?.items) continue

    // Map byte offset → line index so we can patch specific lines without
    // round-tripping through doc.toString() (which would reformat other fields)
    const lineStarts = [0]
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') lineStarts.push(i + 1)
    }
    function offsetToLine(offset) {
      let lo = 0,
        hi = lineStarts.length - 1
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (lineStarts[mid] <= offset) lo = mid
        else hi = mid - 1
      }
      return lo
    }

    const lines = text.split('\n')
    let changed = false

    // Iterate in reverse so splice insertions don't shift later items' line numbers
    for (const itemMap of [...itemsSeq.items].reverse()) {
      if (typeof itemMap?.get !== 'function') continue
      const name = itemMap.get('name')
      if (!itemNames.has(name)) continue

      let nameLineNum = -1
      let publicLineNum = -1
      for (const pair of itemMap.items ?? []) {
        const key = pair.key?.value ?? pair.key
        const range = pair.key?.range
        if (!range) continue
        const lineNum = offsetToLine(range[0])
        if (key === 'name') nameLineNum = lineNum
        if (key === 'public') publicLineNum = lineNum
      }

      if (publicLineNum !== -1) {
        // Replace existing value in-place, preserving indentation
        lines[publicLineNum] = lines[publicLineNum].replace(
          /(\s+public:\s*).*$/,
          '$1false',
        )
      } else if (nameLineNum !== -1) {
        lines.splice(nameLineNum + 1, 0, '    public: false')
      }
      changed = true
    }

    if (changed) {
      writeFileSync(path, lines.join('\n'))
      modified.push(filename)
    }
  }
  return modified
}

// ---------------------------------------------------------------------------
// GitHub operations (scheduled mode only)
// ---------------------------------------------------------------------------

function gh(...args) {
  const proc = Bun.spawnSync(args, {
    cwd: ROOT,
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return {
    out: new TextDecoder().decode(proc.stdout).trim(),
    err: new TextDecoder().decode(proc.stderr).trim(),
    ok: proc.exitCode === 0,
  }
}

function git(...args) {
  const proc = Bun.spawnSync(['git', ...args], {
    cwd: ROOT,
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (proc.exitCode !== 0) {
    const err = new TextDecoder().decode(proc.stderr).trim()
    console.error(`git ${args[0]} failed: ${err}`)
  }
  return proc.exitCode === 0
}

function createPR(modifiedFiles, dead, shadow) {
  const date = new Date().toISOString().slice(0, 10)
  const branch = `fix/dead-links-${date}`

  git('checkout', '-b', branch)
  git('add', ...modifiedFiles.map((f) => join('src/content/pages', f)))
  git('commit', '-m', `hide items with dead links (${date})`)
  git('push', '-u', 'origin', branch)

  let body =
    'Automatically hides items with confirmed dead links by setting `public: false`.\n\n'

  body += '## Broken links\n\n'
  body += '| File | Item | Label | URL | Reason |\n|---|---|---|---|---|\n'
  for (const r of dead) {
    body += `| ${r.file} | ${r.itemName} | ${r.label} | ${r.url} | ${r.reason ?? r.statusCode ?? ''} |\n`
  }

  if (shadow.length > 0) {
    body += `\n## Shadow 404s — needs human review\n\n`
    body +=
      'These returned HTTP 200 but may show a "not found" page. Not auto-hidden.\n\n'
    body += '| File | Item | Label | URL | Reason |\n|---|---|---|---|---|\n'
    for (const r of shadow) {
      body += `| ${r.file} | ${r.itemName} | ${r.label} | ${r.url} | ${r.reason ?? ''} |\n`
    }
    body += '\n'
  }

  body +=
    '\nTo re-enable an item after fixing its links, set `public: true` or remove the `public` key.'

  const result = gh(
    'gh',
    'pr',
    'create',
    '--title',
    `Hide items with dead links (${date})`,
    '--body',
    body,
    '--head',
    branch,
    '--draft',
  )
  if (!result.ok) console.error(`gh pr create: ${result.err}`)
  return result.out
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const modeLabel = PR_MODE
  ? '[PR mode]'
  : DRY_RUN
    ? '[dry run — set GH_TOKEN to enable PR creation]'
    : '[scheduled mode]'
console.log(`\nqueeromaha link checker ${modeLabel}\n`)

// Gather URLs to check

let urlsToCheck
let entriesByUrl // scheduled mode only

if (PR_MODE) {
  console.log('Gathering newly added links from diff...')
  urlsToCheck = gatherNewLinksFromDiff()
  if (urlsToCheck.length === 0) {
    console.log('No new links in this PR.')
    process.exit(0)
  }
  console.log(`  ${urlsToCheck.length} new URL(s)\n`)
} else {
  console.log('Gathering all links...')
  const entries = gatherAllLinks()
  const fileCount = new Set(entries.map((e) => e.file)).size
  console.log(`  ${entries.length} links across ${fileCount} files\n`)

  // Deduplicate URLs for fetching, keep entry map for result expansion
  entriesByUrl = new Map()
  for (const entry of entries) {
    if (!entriesByUrl.has(entry.url)) entriesByUrl.set(entry.url, [])
    entriesByUrl.get(entry.url).push(entry)
  }
  urlsToCheck = [...entriesByUrl.keys()]
}

// Check links

console.log('Checking links...')
const urlResults = await checkAll(urlsToCheck)

// Expand URL results → per-entry results (scheduled) or keep URL-level (PR)

let dead, shadow, skipped, ok

if (PR_MODE) {
  dead = urlResults.filter((r) => r.status === 'dead')
  shadow = urlResults.filter((r) => r.status === 'shadow')
  skipped = urlResults.filter((r) => r.status === 'skip')
  ok = urlResults.filter((r) => r.status === 'ok')
} else {
  const expanded = urlResults.flatMap((r) =>
    (entriesByUrl.get(r.url) ?? []).map((entry) => ({ ...entry, ...r })),
  )
  dead = expanded.filter((r) => r.status === 'dead')
  shadow = expanded.filter((r) => r.status === 'shadow')
  skipped = expanded.filter((r) => r.status === 'skip')
  ok = expanded.filter((r) => r.status === 'ok')
}

// Report

console.log(
  `\nResults: ${ok.length} ok  ${dead.length} dead  ${shadow.length} shadow  ${skipped.length} skipped\n`,
)

if (dead.length > 0) {
  console.log('Dead links:')
  for (const r of dead) {
    const loc = PR_MODE ? r.url : `[${r.file}] ${r.itemName} — ${r.url}`
    console.log(`  ✗ ${loc} (${r.reason ?? r.statusCode})`)
  }
}

if (shadow.length > 0) {
  console.log('\nShadow 404s (needs review):')
  for (const r of shadow) {
    const loc = PR_MODE ? r.url : `[${r.file}] ${r.itemName} — ${r.url}`
    console.log(`  ⚠ ${loc} (${r.reason})`)
  }
}

if (dead.length === 0 && shadow.length === 0) {
  console.log('All links OK.')
  process.exit(0)
}

// PR mode: exit 1 if dead links (shadow 404s are warnings, not hard failures)

if (PR_MODE) {
  if (dead.length > 0) {
    console.log('\nDead links found. Fix or remove them before merging.')
    process.exit(1)
  }
  process.exit(0)
}

// Scheduled dry run

if (DRY_RUN) {
  if (dead.length > 0) {
    console.log(
      '\n[dry run] would set public:false on affected items and create a draft PR',
    )
  } else {
    console.log('\n[dry run] shadow 404s noted above need manual review')
  }
  process.exit(0)
}

// Scheduled mode: mutate YAML, create PR

if (dead.length > 0) {
  const deadByFile = {}
  for (const r of dead) {
    deadByFile[r.file] ??= new Set()
    deadByFile[r.file].add(r.itemName)
  }

  console.log('\nHiding affected items in YAML...')
  const modifiedFiles = hideItemsInYaml(deadByFile)
  console.log(`  modified: ${modifiedFiles.join(', ')}`)

  if (modifiedFiles.length > 0) {
    console.log('\nCreating PR...')
    const prUrl = createPR(modifiedFiles, dead, shadow)
    console.log(`  ${prUrl}`)
  }
}

console.log('\nDone.')
