import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('astro:content', () => ({
    getCollection: vi.fn(),
}))

const { getCollection } = await import('astro:content')
const { GET } = await import('../../src/pages/[...filters].md.ts')

function mockDirectory() {
    vi.mocked(getCollection).mockResolvedValue([
        {
            id: 'friends',
            data: {
                items: [
                    {
                        name: 'OmahaForUs',
                        description: 'Hub of community, resources, and events',
                        links: [
                            {
                                label: 'Events Calendar',
                                url: 'https://omahafor.us/events-calendar',
                            },
                        ],
                    },
                    {
                        name: 'The Queer Collective',
                        description: 'Mutual aid and drag shows.',
                    },
                ],
            },
        },
    ] as never)
}

beforeEach(() => {
    vi.mocked(getCollection).mockReset()
    mockDirectory()
})

describe('GET /[...filters].md', () => {
    test('sets markdown content type', async () => {
        const res = await GET({ params: { filters: 'friends' } })
        expect(res.headers.get('Content-Type')).toBe(
            'text/markdown; charset=utf-8',
        )
    })

    test('category page lists visible items with links', async () => {
        const body = await (
            await GET({ params: { filters: 'friends' } })
        ).text()
        expect(body).toContain('### OmahaForUs')
        expect(body).toContain(
            '[Events Calendar](https://omahafor.us/events-calendar)',
        )
    })

    test('item permalink page renders only that item, not the whole category', async () => {
        const body = await (
            await GET({ params: { filters: 'friends/omaha-for-us' } })
        ).text()
        expect(body).toContain('# OmahaForUs | LGBTQ+ Groups & Community')
        expect(body).toContain('Hub of community, resources, and events')
        expect(body).not.toContain('The Queer Collective')
    })

    test('root page mirrors the friends category', async () => {
        const body = await (await GET({ params: { filters: '' } })).text()
        expect(body).toContain('### OmahaForUs')
        expect(body).toContain('The Queer Collective')
    })
})
