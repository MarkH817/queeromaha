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

  test('every value has emoji and label strings', () => {
    for (const [key, value] of Object.entries(data)) {
      expect(typeof value.emoji).toBe('string', `${key} missing emoji`)
      expect(value.emoji.length).toBeGreaterThan(0)
      expect(typeof value.label).toBe('string', `${key} missing label`)
      expect(value.label.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Directory YAML files
// ---------------------------------------------------------------------------

describe('directory yaml files', () => {
  const tagMap = JSON.parse(readFileSync(join(DATA_DIR, 'tagMap.json'), 'utf8'))
  const validTags = new Set(Object.keys(tagMap))

  const yamlFiles = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.yaml'))

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
    })
  }
})
