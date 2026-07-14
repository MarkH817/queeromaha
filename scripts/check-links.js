#!/usr/bin/env bun
// Dead link checker for queeromaha
// Scheduled mode: bun scripts/check-links.js
//   Checks all non-hidden links. Exits 1 if dead links found.
// PR mode: bun scripts/check-links.js --pr
//   Checks only newly added URLs in the diff vs GITHUB_BASE_REF.
//   Exits 1 if dead links found (blocks merge).

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'
import {
    getHost,
    isSkipDomain,
    isSuspiciousRedirect,
} from './helpers/link.helper'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'src', 'content', 'pages')

const PR_MODE = process.argv.includes('--pr')

const CONCURRENCY = 10
const TIMEOUT_MS = 12_000

// Sec-Fetch-* and Accept headers distinguish real browser navigations from
// headless clients — many bot detectors check for these specifically
const FETCH_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
}

// Platform-specific "not found" body text — returned as HTTP 200
const SHADOW_PATTERNS = [
    { host: 'instagram.com', needle: "Sorry, this page isn't available" },
    { host: 'x.com', needle: "this page doesn't exist" },
    { host: 'twitter.com', needle: "this page doesn't exist" },
    { host: 'x.com', needle: 'account suspended' },
    { host: 'twitter.com', needle: 'account suspended' },
]

// ---------------------------------------------------------------------------
// Link checking
// ---------------------------------------------------------------------------

/** @param {string} url */
async function checkLink(url) {
    if (isSkipDomain(url)) {
        return { status: 'skip', reason: 'known bot-blocking domain' }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: FETCH_HEADERS,
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
            err?.name === 'AbortError'
                ? 'timeout'
                : (err?.message ?? String(err))
        return { status: 'dead', reason }
    }
}

// Classic worker-pool — workers share an index, JS single-thread ensures no
// race on idx++
/** @param {string[]} urls */
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
// Main
// ---------------------------------------------------------------------------

console.log(`\nqueeromaha link checker${PR_MODE ? ' [PR mode]' : ''}\n`)

let urlsToCheck
let entriesByUrl

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

    entriesByUrl = new Map()
    for (const entry of entries) {
        if (!entriesByUrl.has(entry.url)) entriesByUrl.set(entry.url, [])
        entriesByUrl.get(entry.url).push(entry)
    }
    urlsToCheck = [...entriesByUrl.keys()]
}

console.log('Checking links...')
const urlResults = await checkAll(urlsToCheck)

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

if (dead.length > 0) {
    if (PR_MODE)
        console.log('\nDead links found. Fix or remove them before merging.')
    process.exit(1)
}
