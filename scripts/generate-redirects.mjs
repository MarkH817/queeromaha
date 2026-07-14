#!/usr/bin/env bun
// Appends 301 redirects from an item's auto-derived slug to its pinned
// vanity_slug (when the two differ) to dist/_redirects, so a link shared
// before an item's name changed — or before an editor pinned vanity_slug —
// keeps working instead of 404ing.

import { appendFileSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { computeItemSlugs } from '../src/utils/itemSlug.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'src', 'content', 'pages')
const REDIRECTS_FILE = join(ROOT, 'dist', '_redirects')

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.yaml'))

const lines = []

for (const file of files) {
    const category = file.replace(/\.yaml$/, '')
    const doc = parse(readFileSync(join(CONTENT_DIR, file), 'utf8'))
    const publicItems = (doc.items ?? []).filter((i) => i.public !== false)

    for (const { auto, canonical } of computeItemSlugs(publicItems)) {
        if (auto !== canonical) {
            lines.push(`/${category}/${auto}  /${category}/${canonical}  301`)
        }
    }
}

if (lines.length > 0) {
    appendFileSync(REDIRECTS_FILE, `\n${lines.join('\n')}\n`)
    console.log(
        `Appended ${lines.length} item-slug redirect(s) to dist/_redirects`,
    )
}
