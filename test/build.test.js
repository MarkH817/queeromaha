import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
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

  test('_site contains expected pages and discovery files', () => {
    const siteDir = join(ROOT, '_site')
    for (const file of [
      'index.html',
      'cafes/index.html',
      'music/index.html',
      'art/index.html',
      'makers/index.html',
      'robots.txt',
      'sitemap.xml',
      'llms.txt',
      '_headers',
    ]) {
      expect(existsSync(join(siteDir, file))).toBe(true, `missing: ${file}`)
    }
  })

  test('robots.txt lists AI bots and sitemap', () => {
    const robots = readFileSync(join(ROOT, '_site', 'robots.txt'), 'utf8')
    expect(robots).toContain('GPTBot')
    expect(robots).toContain('Anthropic-AI')
    expect(robots).toContain('sitemap.xml')
  })

  test('sitemap.xml contains all public pages', () => {
    const sitemap = readFileSync(join(ROOT, '_site', 'sitemap.xml'), 'utf8')
    expect(sitemap).toContain('<urlset')
    for (const path of ['/', '/cafes/', '/music/', '/art/', '/makers/']) {
      expect(sitemap).toContain(`queeromaha.net${path}`)
    }
  })

  test('llms.txt has site description and page listings', () => {
    const llms = readFileSync(join(ROOT, '_site', 'llms.txt'), 'utf8')
    expect(llms).toContain('# Queer Omaha')
    expect(llms).toContain('queeromaha.net')
    expect(llms).toContain('Cafes')
  })
})
