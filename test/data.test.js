import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src', '_data')
const SRC_DIR = join(ROOT, 'src')

function parseFrontMatter(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  return parseYaml(match[1])
}

// ---------------------------------------------------------------------------
// Data files
// ---------------------------------------------------------------------------

describe('footerMessages.json', () => {
  const raw = readFileSync(join(DATA_DIR, 'footerMessages.json'), 'utf8')
  const data = JSON.parse(raw)

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
  const raw = readFileSync(join(DATA_DIR, 'tagMap.json'), 'utf8')
  const data = JSON.parse(raw)

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
// Front matter — top-level .md files
// ---------------------------------------------------------------------------

describe('markdown front matter', () => {
  const mdFiles = readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'))

  test('there is at least one markdown file', () => {
    expect(mdFiles.length).toBeGreaterThan(0)
  })

  for (const file of mdFiles) {
    test(`${file} has a title`, () => {
      const data = parseFrontMatter(join(SRC_DIR, file))
      expect(data).not.toBeNull()
      expect(typeof data.title).toBe('string')
      expect(data.title.length).toBeGreaterThan(0)
    })
  }
})

// ---------------------------------------------------------------------------
// Content item validation — all .md files with an items array
// ---------------------------------------------------------------------------

describe('content items', () => {
  const tagMapRaw = readFileSync(join(DATA_DIR, 'tagMap.json'), 'utf8')
  const tagMap = JSON.parse(tagMapRaw)
  const validTags = new Set(Object.keys(tagMap))

  const mdFiles = readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'))

  for (const file of mdFiles) {
    const data = parseFrontMatter(join(SRC_DIR, file))
    if (!data?.items) continue

    describe(file, () => {
      test('sections have label and id', () => {
        for (const item of data.items) {
          if (item.type !== 'section') continue
          expect(typeof item.label).toBe('string', `section missing label`)
          expect(item.label.length).toBeGreaterThan(0)
          expect(typeof item.id).toBe('string', `section missing id`)
          expect(item.id.length).toBeGreaterThan(0)
        }
      })

      test('items have a name', () => {
        for (const item of data.items) {
          if (item.type !== 'item') continue
          expect(typeof item.name).toBe('string', `item missing name`)
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

      test('links have label and url', () => {
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
            expect(link.url.length).toBeGreaterThan(0)
          }
        }
      })

      test('link URLs are parseable', () => {
        for (const item of data.items) {
          if (!item.links) continue
          for (const link of item.links) {
            if (!link.url) continue
            expect(
              () => new URL(link.url),
              `"${item.name}" > "${link.label}" has unparseable URL: ${link.url}`,
            ).not.toThrow()
          }
        }
      })

      test('no duplicate item names', () => {
        const names = data.items
          .filter((i) => i.type === 'item' && i.name)
          .map((i) => i.name)
        const seen = new Set()
        for (const name of names) {
          expect(seen.has(name)).toBe(false, `duplicate item name: "${name}"`)
          seen.add(name)
        }
      })
    })
  }
})
