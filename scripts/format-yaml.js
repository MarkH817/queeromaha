#!/usr/bin/env bun
// Canonicalizes src/content/pages/*.yaml formatting.
//
// Decap CMS re-serializes the whole file through its own YAML dumper on
// every save (line-wraps long scalars, (un)quotes strings, etc), with no
// config to control it. Keeping our committed files in that same canonical
// shape means a CMS edit's diff only shows the real change.
//
// Check mode: bun scripts/format-yaml.js --check
//   Exits 1 and lists files that would change, without writing.
// Write mode: bun scripts/format-yaml.js
//   Rewrites any file that isn't already canonical.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'src', 'content', 'pages')

const CHECK_MODE = process.argv.includes('--check')

const INSTAGRAM_PATH_SKIP = new Set([
    'p',
    'reel',
    'reels',
    'explore',
    'stories',
    'tv',
])

function normalizeInstagramUrl(url) {
    if (!url) return url
    let username
    if (url.startsWith('@')) {
        // @handle or @handle/path?junk — extract just the username
        username = url.slice(1).split(/[/?#]/)[0]
    } else {
        try {
            const u = new URL(url.includes('://') ? url : `https://${url}`)
            if (u.hostname.replace(/^www\./, '') !== 'instagram.com') return url
            ;[username] = u.pathname.split('/').filter(Boolean)
        } catch {
            return url
        }
    }
    if (!username || INSTAGRAM_PATH_SKIP.has(username)) return url
    return `https://www.instagram.com/${username}/`
}

function normalizeLinks(data) {
    for (const item of data?.items ?? []) {
        for (const link of item?.links ?? []) {
            if (link?.url) link.url = normalizeInstagramUrl(link.url)
        }
    }
}

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.yaml'))

const errors = []
const changed = []

for (const file of files) {
    const path = join(CONTENT_DIR, file)
    const src = readFileSync(path, 'utf8')
    let canonical
    try {
        // @ is reserved in YAML — quote bare @... values so the parser accepts them.
        // normalizeInstagramUrl then handles the @handle form after parsing.
        const preprocessed = src.replace(
            /^(\s+(?:-\s+)?url:\s*)(@\S*)$/gm,
            (_, prefix, value) => `${prefix}'${value.replace(/'/g, "''")}'`,
        )
        const parsed = parse(preprocessed)
        normalizeLinks(parsed)
        canonical = stringify(parsed, { lineWidth: 0 })
    } catch (err) {
        errors.push(`  ${file}: ${err.message}`)
        continue
    }

    if (canonical === src) continue

    changed.push(file)
    if (!CHECK_MODE) writeFileSync(path, canonical)
}

if (errors.length > 0) {
    console.error('YAML parse error(s) — fix before committing:')
    for (const msg of errors) console.error(msg)
    process.exit(1)
}

if (changed.length === 0) {
    process.exit(0)
}

if (CHECK_MODE) {
    console.error('Not canonically formatted:')
    for (const file of changed) console.error(`  ${file}`)
    console.error('Run `bun run format` to fix.')
    process.exit(1)
}

console.log('Formatted:')
for (const file of changed) console.log(`  ${file}`)
