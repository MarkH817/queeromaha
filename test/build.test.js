import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

describe('astro build', () => {
  test('exits with code 0 and produces dist/', { timeout: 120_000 }, () => {
    const result = spawnSync('bun', ['run', 'build'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 120_000,
    })

    expect(result.status).toBe(0)

    const distDir = join(ROOT, 'dist')
    expect(existsSync(distDir)).toBe(true)
    expect(readdirSync(distDir).length).toBeGreaterThan(0)
  })

  test('dist contains index and filter slug pages', () => {
    const distDir = join(ROOT, 'dist')
    for (const file of [
      'index.html',
      'art/index.html',
      'cafes/index.html',
      'music/index.html',
      'makers/index.html',
      'social/index.html',
      'spiritual/index.html',
      'about/index.html',
      'contact/index.html',
      'robots.txt',
      'sitemap-index.xml',
      'llms.txt',
      '_headers',
    ]) {
      expect(existsSync(join(distDir, file))).toBe(true, `missing: ${file}`)
    }
  })

  test('robots.txt sets content-signal and sitemap', () => {
    const robots = readFileSync(join(ROOT, 'dist', 'robots.txt'), 'utf8')
    expect(robots).toContain('GPTBot')
    expect(robots).toContain('Anthropic-AI')
    expect(robots).toContain('sitemap')
    expect(robots).toContain(
      'Content-Signal: ai-train=no, search=yes, ai-input=yes',
    )
  })

  test('llms.txt has appropriate fields', () => {
    const llms = readFileSync(join(ROOT, 'dist', 'llms.txt'), 'utf8')
    expect(llms).toContain('Queer Omaha Directory')
    expect(llms).toContain('queeromaha.net/about')
  })

  test('_header has appropriate fields', () => {
    const headers = readFileSync(join(ROOT, 'public', '_headers'), 'utf8')
    expect(headers).toContain('sitemap.xml')
    expect(headers).toContain('llms.txt')
    expect(headers).toContain('service-doc')
  })

  test('index.html contains filter pills and wa-card items', () => {
    const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8')
    expect(html).toContain('filter-pill')
    expect(html).toContain('wa-card')
    expect(html).toContain('data-category')
  })

  test('social/index.html has data-initial-categories="social"', () => {
    const html = readFileSync(
      join(ROOT, 'dist', 'social', 'index.html'),
      'utf8',
    )
    expect(html).toContain('data-initial-categories="social"')
  })

  test('dist contains events.ics', () => {
    expect(existsSync(join(ROOT, 'dist', 'events.ics'))).toBe(true)
  })

  test('events.ics is a valid VCALENDAR', () => {
    const ics = readFileSync(join(ROOT, 'dist', 'events.ics'), 'utf8')
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('X-WR-CALNAME:Queer Omaha Events')
  })

  test('events.ics contains seeded OmahaForUs recurring events', () => {
    const ics = readFileSync(join(ROOT, 'dist', 'events.ics'), 'utf8')
    expect(ics).toContain('RRULE:')
    expect(ics).toContain('Support Group')
    expect(ics).toContain('Game Night')
  })

  test('index.html contains footer calendar subscribe link', () => {
    const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8')
    expect(html).toContain('calendar.google.com')
    expect(html).toContain('footer-cal')
  })

  test('index.html has calendar autodiscovery link', () => {
    const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8')
    expect(html).toContain('rel="alternate"')
    expect(html).toContain('type="text/calendar"')
    expect(html).toContain('/events.ics')
  })
})
