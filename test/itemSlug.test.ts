import { describe, expect, test } from 'vitest'
import { computeItemSlugs } from '../src/utils/itemSlug.ts'

describe('computeItemSlugs', () => {
    test('auto-derives canonical from name when vanity_slug is unset', () => {
        const [result] = computeItemSlugs([{ name: 'Blue Line Coffee' }])
        expect(result).toEqual({
            canonical: 'blue-line-coffee',
            auto: 'blue-line-coffee',
        })
    })

    test('vanity_slug wins for canonical, but auto still reflects name', () => {
        const [result] = computeItemSlugs([
            { name: 'OmahaForUs', vanity_slug: 'o4us' },
        ])
        expect(result).toEqual({ canonical: 'o4us', auto: 'omaha-for-us' })
    })

    test('dedupes auto collisions with -2, -3 suffixes', () => {
        const results = computeItemSlugs([
            { name: 'Coven' },
            { name: 'Coven' },
            { name: 'Coven' },
        ])
        expect(results.map((r) => r.auto)).toEqual([
            'coven',
            'coven-2',
            'coven-3',
        ])
        expect(results.map((r) => r.canonical)).toEqual([
            'coven',
            'coven-2',
            'coven-3',
        ])
    })

    test('dedupes canonical collisions across pinned and auto-derived slugs', () => {
        const results = computeItemSlugs([
            { name: 'The Coven Bar', vanity_slug: 'coven' },
            { name: 'Coven' },
        ])
        expect(results.map((r) => r.canonical)).toEqual(['coven', 'coven-2'])
        expect(results.map((r) => r.auto)).toEqual(['the-coven-bar', 'coven'])
    })

    test('output is positionally aligned with input', () => {
        const items = [
            { name: 'Alpha' },
            { name: 'Beta', vanity_slug: 'b' },
            { name: 'Gamma' },
        ]
        const results = computeItemSlugs(items)
        expect(results).toHaveLength(items.length)
    })
})
