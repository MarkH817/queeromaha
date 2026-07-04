import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { parse as parseYaml } from 'yaml'
import footerMessages from '../src/data/footerMessages.json' with {
    type: 'json',
}
import tagMap from '../src/data/tagMap.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'src', 'content', 'pages')

// ---------------------------------------------------------------------------
// Data files
// ---------------------------------------------------------------------------

describe('footerMessages.json', () => {
    test('has a messages array', () => {
        expect(Array.isArray(footerMessages.messages)).toBe(true)
        expect(footerMessages.messages.length).toBeGreaterThan(0)
    })

    test('every entry has a text string', () => {
        for (const entry of footerMessages.messages) {
            expect(typeof entry.text).toBe('string')
            expect(entry.text.length).toBeGreaterThan(0)
        }
    })
})

describe('tagMap.json', () => {
    test('is a non-empty object', () => {
        expect(typeof tagMap).toBe('object')
        expect(tagMap).not.toBeNull()
        expect(Object.keys(tagMap).length).toBeGreaterThan(0)
    })

    test('every value has icon and label strings', () => {
        for (const [key, value] of Object.entries(tagMap)) {
            expect(typeof value.icon, `${key} missing icon`).toBe('string')
            expect(value.icon.length).toBeGreaterThan(0)
            expect(typeof value.label, `${key} missing label`).toBe('string')
            expect(value.label.length).toBeGreaterThan(0)
        }
    })
})

// ---------------------------------------------------------------------------
// Directory YAML files
// ---------------------------------------------------------------------------

describe('directory yaml files', () => {
    const validTags = new Set(Object.keys(tagMap))

    const yamlFiles = readdirSync(CONTENT_DIR).filter((f) =>
        f.endsWith('.yaml'),
    )

    test('there is at least one yaml file', () => {
        expect(yamlFiles.length).toBeGreaterThan(0)
    })

    for (const file of yamlFiles) {
        const data = parseYaml(readFileSync(join(CONTENT_DIR, file), 'utf8'))

        describe(file, () => {
            test('has a title', () => {
                expect(typeof data.title).toBe('string')
                expect(data.title.length).toBeGreaterThan(0)
            })

            if (!data.items) return

            test('all items have a name', () => {
                for (const item of data.items) {
                    expect(typeof item.name, 'item missing name').toBe('string')
                    expect(item.name.length).toBeGreaterThan(0)
                }
            })

            test('tags reference known tagMap keys', () => {
                for (const item of data.items) {
                    if (!item.tags) continue
                    for (const tag of item.tags) {
                        expect(
                            validTags.has(tag),
                            `"${item.name}" uses unknown tag: ${tag}`,
                        ).toBe(true)
                    }
                }
            })

            test('links have label and parseable url', () => {
                for (const item of data.items) {
                    if (!item.links) continue
                    for (const link of item.links) {
                        expect(
                            typeof link.label,
                            `link in "${item.name}" missing label`,
                        ).toBe('string')
                        expect(link.label.length).toBeGreaterThan(0)
                        expect(
                            typeof link.url,
                            `link in "${item.name}" missing url`,
                        ).toBe('string')
                        const resolvedUrl =
                            typeof link.url === 'string' &&
                            /^@[\w.]+$/.test(link.url)
                                ? `https://instagram.com/${link.url.slice(1)}`
                                : link.url
                        expect(() => new URL(resolvedUrl)).not.toThrow(
                            `"${item.name}" > "${link.label}" has unparseable URL: ${link.url}`,
                        )
                    }
                }
            })

            test('location google_maps_url is parseable when present', () => {
                for (const item of data.items) {
                    if (!item.location?.google_maps_url) continue
                    expect(
                        () => new URL(item.location.google_maps_url),
                    ).not.toThrow(
                        `"${item.name}" has unparseable google_maps_url: ${item.location.google_maps_url}`,
                    )
                }
            })

            test('location.neighborhood is a known value when present', () => {
                const VALID_NEIGHBORHOODS = new Set([
                    'Benson',
                    'Downtown',
                    'Midtown',
                    'North O',
                    'South O',
                    'West O',
                ])
                for (const item of data.items) {
                    const nbr = item.location?.neighborhood
                    if (!nbr) continue
                    expect(
                        VALID_NEIGHBORHOODS.has(nbr),
                        `"${item.name}" has unknown neighborhood: "${nbr}"`,
                    ).toBe(true)
                }
            })

            test('no duplicate item names', () => {
                const seen = new Set()
                for (const item of data.items) {
                    expect(
                        seen.has(item.name),
                        `duplicate item name: "${item.name}"`,
                    ).toBe(false)
                    seen.add(item.name)
                }
            })

            test('recurring_events have required fields and valid formats', () => {
                for (const item of data.items) {
                    if (!item.recurring_events) continue
                    for (const evt of item.recurring_events) {
                        const ctx = `"${item.name}" recurring event "${evt.summary}"`
                        expect(
                            typeof evt.summary,
                            `${ctx}: missing summary`,
                        ).toBe('string')
                        expect(evt.summary.length).toBeGreaterThan(0)
                        expect(typeof evt.rrule, `${ctx}: missing rrule`).toBe(
                            'string',
                        )
                        expect(evt.rrule.length).toBeGreaterThan(0)
                        expect(
                            typeof evt.dtstart,
                            `${ctx}: missing dtstart`,
                        ).toBe('string')
                        expect(
                            evt.dtstart,
                            `${ctx}: dtstart must be YYYYMMDD`,
                        ).toMatch(/^\d{8}$/)
                        expect(typeof evt.time, `${ctx}: missing time`).toBe(
                            'string',
                        )
                        expect(evt.time, `${ctx}: time must be HH:MM`).toMatch(
                            /^\d{1,2}:\d{2}$/,
                        )
                        if (evt.end_time !== undefined) {
                            expect(
                                evt.end_time,
                                `${ctx}: end_time must be HH:MM`,
                            ).toMatch(/^\d{1,2}:\d{2}$/)
                        }
                        if (evt.url !== undefined) {
                            expect(() => new URL(evt.url)).not.toThrow(
                                `${ctx}: unparseable url`,
                            )
                        }
                    }
                }
            })
        })
    }
})

// ---------------------------------------------------------------------------
// @insta shorthand normalization
// ---------------------------------------------------------------------------

describe('@handle shorthand normalization', () => {
    const normalize = (url: unknown) =>
        typeof url === 'string' && /^@[\w.]+$/.test(url)
            ? `https://instagram.com/${url.slice(1)}`
            : url

    test('expands @handle to instagram.com URL', () => {
        expect(normalize('@sobersocials')).toBe(
            'https://instagram.com/sobersocials',
        )
    })

    test('expands @handle with dots and underscores', () => {
        expect(normalize('@sober.socials_omaha')).toBe(
            'https://instagram.com/sober.socials_omaha',
        )
    })

    test('leaves full URLs unchanged', () => {
        expect(normalize('https://instagram.com/sobersocials')).toBe(
            'https://instagram.com/sobersocials',
        )
    })

    test('leaves other non-handle strings unchanged', () => {
        expect(normalize('https://example.com')).toBe('https://example.com')
        expect(normalize('@')).toBe('@')
    })
})
