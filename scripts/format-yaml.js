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

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.yaml'))

let changed = []

for (const file of files) {
    const path = join(CONTENT_DIR, file)
    const src = readFileSync(path, 'utf8')
    const canonical = stringify(parse(src), { lineWidth: 0 })

    if (canonical === src) continue

    changed.push(file)
    if (!CHECK_MODE) writeFileSync(path, canonical)
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
