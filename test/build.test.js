import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

describe('eleventy build', () => {
  test('exits with code 0 and produces _site/', { timeout: 120_000 }, () => {
    const result = spawnSync('bunx', ['@11ty/eleventy'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 120_000,
    })

    expect(result.status).toBe(0)

    const siteDir = join(ROOT, '_site')
    expect(existsSync(siteDir)).toBe(true)
    expect(readdirSync(siteDir).length).toBeGreaterThan(0)
  })

  test('_site contains expected pages', () => {
    const siteDir = join(ROOT, '_site')
    for (const page of [
      'index.html',
      'cafes/index.html',
      'music/index.html',
      'art/index.html',
      'makers/index.html',
    ]) {
      expect(existsSync(join(siteDir, page))).toBe(true, `missing: ${page}`)
    }
  })
})
