import { describe, expect, test } from 'vitest'
import { GET } from '../../src/pages/llms.txt.ts'

describe('GET /llms.txt', () => {
    test('sets plain text content type', async () => {
        const res = await GET()
        expect(res.headers.get('Content-Type')).toBe(
            'text/plain; charset=utf-8',
        )
    })

    test('includes site title, directory link, and GitHub repo link', async () => {
        const body = await (await GET()).text()
        expect(body).toContain('# Queer Omaha')
        expect(body).toContain('https://queeromaha.net/')
        expect(body).toContain('https://github.com/taraxvoid/queeromaha')
    })

    test('documents the service-doc Link header convention', async () => {
        const body = await (await GET()).text()
        expect(body).toContain('rel="service-doc"')
    })
})
