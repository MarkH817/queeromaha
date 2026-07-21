import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

describe('astro build', () => {
    test('produces dist/', () => {
        const distDir = join(ROOT, 'dist')
        expect(
            existsSync(distDir),
            'dist/ not found — run `bun run build` before this test',
        ).toBe(true)
        expect(readdirSync(distDir).length).toBeGreaterThan(0)
    })

    test('dist contains index and filter slug pages', () => {
        const distDir = join(ROOT, 'dist')
        for (const file of [
            'art/index.html',
            'cafes/index.html',
            'music/index.html',
            'makers/index.html',
            'friends/index.html',
            'spiritual/index.html',
            'robots.txt',
            'sitemap-index.xml',
            'llms.txt',
            '_headers',
            '404.html',
            'privacy/index.html',
            'contact/index.html',
        ]) {
            expect(existsSync(join(distDir, file)), `missing: ${file}`).toBe(
                true,
            )
        }
    })

    test('dist does not contain an about page', () => {
        const distDir = join(ROOT, 'dist')
        expect(existsSync(join(distDir, 'about', 'index.html'))).toBe(false)
    })

    test('404.html contains a link back to the directory', () => {
        const html = readFileSync(join(ROOT, 'dist', '404.html'), 'utf8')
        expect(html).toContain('data-notfound-link')
        expect(html).toContain('href="/friends"')
    })

    test('_redirects sends /social and / to /friends', () => {
        const redirects = readFileSync(
            join(ROOT, 'public', '_redirects'),
            'utf8',
        )
        expect(redirects).toMatch(/\/social\s+\/friends/)
        expect(redirects).toMatch(/^\/\s+\/friends/m)
    })

    test('_redirects sends /about to / but leaves /contact alone', () => {
        const redirects = readFileSync(
            join(ROOT, 'public', '_redirects'),
            'utf8',
        )
        expect(redirects).toMatch(/^\/about\s+\/\s+301/m)
        expect(redirects).not.toMatch(/^\/contact\s/m)
    })

    test('privacy/index.html has a back-to-directory link', () => {
        const html = readFileSync(
            join(ROOT, 'dist', 'privacy', 'index.html'),
            'utf8',
        )
        expect(html).toContain('back-link')
        expect(html).toContain('href="/friends"')
    })

    test('contact/index.html has a Netlify form and a back-to-directory link', () => {
        const html = readFileSync(
            join(ROOT, 'dist', 'contact', 'index.html'),
            'utf8',
        )
        expect(html).toContain('name="contact"')
        expect(html).toContain('data-netlify="true"')
        expect(html).toContain('back-link')
        expect(html).toContain('href="/friends"')
    })

    test('llms.txt lists the privacy and contact pages', () => {
        const llmsTxt = readFileSync(join(ROOT, 'dist', 'llms.txt'), 'utf8')
        expect(llmsTxt).toContain('/privacy')
        expect(llmsTxt).toContain('/contact')
    })

    test('dist/_redirects redirects the OmahaForUs auto-slug to its vanity_slug', () => {
        const redirects = readFileSync(join(ROOT, 'dist', '_redirects'), 'utf8')
        expect(redirects).toMatch(
            /\/friends\/omaha-for-us\s+\/friends\/o4us\s+301/,
        )
    })

    test('dist contains the OmahaForUs item permalink page', () => {
        const itemPage = join(ROOT, 'dist', 'friends', 'o4us', 'index.html')
        expect(existsSync(itemPage)).toBe(true)
        const html = readFileSync(itemPage, 'utf8')
        expect(html).toContain('data-initial-item-slug="o4us"')
        expect(html).toContain('id="friends-o4us"')
    })

    // robots.txt / llms.txt content details (bot allowlist, content-signal,
    // title/URL fields) are unit tested directly against their route
    // handlers in test/pages/robots-txt.test.ts and llms-txt.test.ts; this
    // file only needs to confirm the build actually emits them (above).

    test('_header has appropriate fields', () => {
        const headers = readFileSync(join(ROOT, 'public', '_headers'), 'utf8')
        expect(headers).toContain('sitemap.xml')
        expect(headers).toContain('llms.txt')
        expect(headers).toContain('service-doc')
    })

    test('friends/index.html contains filter pills and wa-card items', () => {
        const html = readFileSync(
            join(ROOT, 'dist', 'friends', 'index.html'),
            'utf8',
        )
        expect(html).toContain('filter-pill')
        expect(html).toContain('wa-card')
        expect(html).toContain('data-category')
    })

    test('friends/index.html has data-initial-categories="friends"', () => {
        const html = readFileSync(
            join(ROOT, 'dist', 'friends', 'index.html'),
            'utf8',
        )
        expect(html).toContain('data-initial-categories="friends"')
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

    test('friends/index.html contains footer calendar subscribe link', () => {
        const html = readFileSync(
            join(ROOT, 'dist', 'friends', 'index.html'),
            'utf8',
        )
        expect(html).toContain('calendar.google.com')
        expect(html).toContain('calendar-box')
        expect(html).toContain('webcal://queeromaha.net/events.ics')
    })

    test('friends/index.html has calendar autodiscovery link', () => {
        const html = readFileSync(
            join(ROOT, 'dist', 'friends', 'index.html'),
            'utf8',
        )
        expect(html).toContain('rel="alternate"')
        expect(html).toContain('type="text/calendar"')
        expect(html).toContain('/events.ics')
    })
})
