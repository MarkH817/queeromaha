import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src', 'data')
const CONTENT_DIR = join(ROOT, 'src', 'content', 'pages')

// ---------------------------------------------------------------------------
// Data files
// ---------------------------------------------------------------------------

describe('footerMessages.json', () => {
    const data = JSON.parse(
        readFileSync(join(DATA_DIR, 'footerMessages.json'), 'utf8'),
    )

    test('has a messages array', () => {
        expect(Array.isArray(data.messages)).toBe(true)
        expect(data.messages.length).toBeGreaterThan(0)
    })

    test('every entry has a text string', () => {
        for (const entry of data.messages) {
            expect(typeof entry.text).toBe('string')
            expect(entry.text.length).toBeGreaterThan(0)
        }
    })
})

describe('tagMap.json', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'tagMap.json'), 'utf8'))

    test('is a non-empty object', () => {
        expect(typeof data).toBe('object')
        expect(data).not.toBeNull()
        expect(Object.keys(data).length).toBeGreaterThan(0)
    })

    test('every value has icon and label strings', () => {
        for (const [key, value] of Object.entries(data)) {
            expect(typeof value.icon).toBe('string', `${key} missing icon`)
            expect(value.icon.length).toBeGreaterThan(0)
            expect(typeof value.label).toBe('string', `${key} missing label`)
            expect(value.label.length).toBeGreaterThan(0)
        }
    })
})

// ---------------------------------------------------------------------------
// Directory YAML files
// ---------------------------------------------------------------------------

describe('directory yaml files', () => {
    const tagMap = JSON.parse(
        readFileSync(join(DATA_DIR, 'tagMap.json'), 'utf8'),
    )
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
                    expect(typeof item.name).toBe('string', 'item missing name')
                    expect(item.name.length).toBeGreaterThan(0)
                }
            })

            test('tags reference known tagMap keys', () => {
                for (const item of data.items) {
                    if (!item.tags) continue
                    for (const tag of item.tags) {
                        expect(validTags.has(tag)).toBe(
                            true,
                            `"${item.name}" uses unknown tag: ${tag}`,
                        )
                    }
                }
            })

            test('links have label and parseable url', () => {
                for (const item of data.items) {
                    if (!item.links) continue
                    for (const link of item.links) {
                        expect(typeof link.label).toBe(
                            'string',
                            `link in "${item.name}" missing label`,
                        )
                        expect(link.label.length).toBeGreaterThan(0)
                        expect(typeof link.url).toBe(
                            'string',
                            `link in "${item.name}" missing url`,
                        )
                        expect(() => new URL(link.url)).not.toThrow(
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

            test('no duplicate item names', () => {
                const seen = new Set()
                for (const item of data.items) {
                    expect(seen.has(item.name)).toBe(
                        false,
                        `duplicate item name: "${item.name}"`,
                    )
                    seen.add(item.name)
                }
            })

            test('recurring_events have required fields and valid formats', () => {
                for (const item of data.items) {
                    if (!item.recurring_events) continue
                    for (const evt of item.recurring_events) {
                        const ctx = `"${item.name}" recurring event "${evt.summary}"`
                        expect(typeof evt.summary).toBe(
                            'string',
                            `${ctx}: missing summary`,
                        )
                        expect(evt.summary.length).toBeGreaterThan(0)
                        expect(typeof evt.rrule).toBe(
                            'string',
                            `${ctx}: missing rrule`,
                        )
                        expect(evt.rrule.length).toBeGreaterThan(0)
                        expect(typeof evt.dtstart).toBe(
                            'string',
                            `${ctx}: missing dtstart`,
                        )
                        expect(evt.dtstart).toMatch(
                            /^\d{8}$/,
                            `${ctx}: dtstart must be YYYYMMDD`,
                        )
                        expect(typeof evt.time).toBe(
                            'string',
                            `${ctx}: missing time`,
                        )
                        expect(evt.time).toMatch(
                            /^\d{1,2}:\d{2}$/,
                            `${ctx}: time must be HH:MM`,
                        )
                        if (evt.end_time !== undefined) {
                            expect(evt.end_time).toMatch(
                                /^\d{1,2}:\d{2}$/,
                                `${ctx}: end_time must be HH:MM`,
                            )
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
