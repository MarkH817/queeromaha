import { describe, expect, test } from 'vitest'
import { GET } from '../../src/pages/robots.txt.ts'

describe('GET /robots.txt', () => {
    test('sets plain text content type', async () => {
        const res = await GET()
        expect(res.headers.get('Content-Type')).toBe(
            'text/plain; charset=utf-8',
        )
    })

    test('allows AI/search bot user agents', async () => {
        const body = await (await GET()).text()
        for (const agent of [
            'GPTBot',
            'Claude-Web',
            'Anthropic-AI',
            'PerplexityBot',
            'CCBot',
            'ChatGPT-User',
            'Google-Extended',
            'Bytespider',
            'DuckAssistBot',
        ]) {
            expect(body).toContain(`User-agent: ${agent}\nAllow: /`)
        }
    })

    test('declares content signals and points to the sitemap', async () => {
        const body = await (await GET()).text()
        expect(body).toContain(
            'Content-Signal: ai-train=no, search=yes, ai-input=yes',
        )
        expect(body).toContain(
            'Sitemap: https://queeromaha.net/sitemap-index.xml',
        )
    })
})
