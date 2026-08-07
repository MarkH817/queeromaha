import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')

// Matches <script type="application/ld+json" ...>...</script> including inline Astro output.
const LDJSON_RE =
    /<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi

function* ldJsonBlocks(
    html: string,
): Generator<{ raw: string; data: unknown }> {
    // Reset index
    LDJSON_RE.lastIndex = 0
    for (let m = LDJSON_RE.exec(html); m !== null; m = LDJSON_RE.exec(html)) {
        const raw = m[1].trim()
        try {
            yield { raw, data: JSON.parse(raw) }
        } catch (e) {
            yield {
                raw,
                data: new SyntaxError(
                    `invalid JSON-LD: ${(e as Error).message}`,
                ),
            }
        }
    }
}

function walkHtml(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name)
        if (entry.isDirectory()) out.push(...walkHtml(p))
        else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p)
    }
    return out
}

describe('structured data (JSON-LD)', () => {
    // Mirrors test/build.test.ts convention: this suite only makes sense
    // against built output, so fail fast with an actionable message.
    test('produces dist/ (run `bun run build` before this test)', () => {
        expect(
            existsSync(DIST),
            'dist/ not found — run `bun run build` before this test',
        ).toBe(true)
    })

    if (!existsSync(DIST)) {
        // dist/ is absent: stop registering per-page tests; the guard above
        // already explains what to do. (Vitest skips the rest of this file.)
        return
    }

    const pages = walkHtml(DIST)
    test('dist has built HTML pages to inspect', () => {
        expect(pages.length).toBeGreaterThan(0)
    })

    for (const file of pages) {
        // eslint-disable-next-line no-loop-func
        test(`JSON-LD in ${file.replace(DIST, '') || 'index.html'} is well-formed`, () => {
            const rel = file.replace(DIST, '') || 'index.html'
            const html = readFileSync(file, 'utf8')
            const blocks: string[] = []
            for (const b of ldJsonBlocks(html)) {
                blocks.push(b.raw)
                // Must parse as JSON
                expect(
                    b.data,
                    `JSON-LD block failed to parse:\n${b.raw}`,
                ).not.toBeInstanceOf(SyntaxError)
                // Must carry the required schema.org markers
                if (
                    b.data &&
                    typeof b.data === 'object' &&
                    !(b.data instanceof SyntaxError)
                ) {
                    expect(
                        b.data as Record<string, unknown>,
                        rel,
                    ).toHaveProperty('@context')
                    expect(
                        b.data as Record<string, unknown>,
                        rel,
                    ).toHaveProperty('@type')
                }
            }
            // Sanity: the homepage at least emits structured data
            if (rel === '/index.html' || rel === 'index.html') {
                expect(blocks.length).toBeGreaterThan(0)
            }
        })
    }
})
