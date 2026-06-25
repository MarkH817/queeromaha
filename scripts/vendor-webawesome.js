#!/usr/bin/env bun
// Downloads and flattens WebAwesome CSS into a single self-hosted file.
// Run with: bun scripts/vendor-webawesome.js
// Output: public/vendor/webawesome.css

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = 'https://ka-f.webawesome.com/webawesome@3.7.0'
const OUT_DIR = join(import.meta.dir, '../public/vendor')
const OUT_FILE = join(OUT_DIR, 'webawesome.css')

const fetched = new Set()

async function fetchCSS(url) {
    if (fetched.has(url)) return ''
    fetched.add(url)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
    const text = await res.text()
    return resolveImports(text, url)
}

async function resolveImports(css, baseUrl) {
    const importRe = /@import\s+url\(['"]?([^'")\s]+)['"]?\)\s*;/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = importRe.exec(css)) !== null) {
        parts.push(css.slice(lastIndex, match.index))
        const importUrl = new URL(match[1], baseUrl).href
        process.stdout.write(`  fetching ${importUrl}\n`)
        parts.push(await fetchCSS(importUrl))
        lastIndex = importRe.lastIndex
    }
    parts.push(css.slice(lastIndex))
    return parts.join('')
}

console.log(`Vendoring WebAwesome CSS from ${BASE}/styles/webawesome.css`)
await mkdir(OUT_DIR, { recursive: true })
const css = await fetchCSS(`${BASE}/styles/webawesome.css`)
const banner = `/* Vendored from ${BASE}/styles/webawesome.css — do not edit manually.\n   Re-run: bun scripts/vendor-webawesome.js */\n`
await writeFile(OUT_FILE, banner + css)
console.log(`Written to ${OUT_FILE} (${(css.length / 1024).toFixed(1)} KB)`)
