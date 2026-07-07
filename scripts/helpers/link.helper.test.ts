import { describe, expect, test } from 'vitest'
import { normalizeUrl } from './link.helper'

// ---------------------------------------------------------------------------
// @insta shorthand normalization
// ---------------------------------------------------------------------------

describe('@handle shorthand normalization', () => {
    test('expands @handle to instagram.com URL', () => {
        expect(normalizeUrl('@sobersocials')).toBe(
            'https://instagram.com/sobersocials',
        )
    })

    test('expands @handle with dots and underscores', () => {
        expect(normalizeUrl('@sober.socials_omaha')).toBe(
            'https://instagram.com/sober.socials_omaha',
        )
    })

    test('leaves full URLs unchanged', () => {
        expect(normalizeUrl('https://instagram.com/sobersocials')).toBe(
            'https://instagram.com/sobersocials',
        )
    })

    test('leaves other non-handle strings unchanged', () => {
        expect(normalizeUrl('https://example.com')).toBe('https://example.com')
        expect(normalizeUrl('@')).toBe('@')
    })
})
