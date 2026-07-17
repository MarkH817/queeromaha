import { describe, expect, test } from 'vitest'
import { slugify } from '../src/utils/slugify.ts'

describe('slugify', () => {
    test('lowercases and replaces spaces with hyphens', () => {
        expect(slugify('The Fox Den')).toBe('the-fox-den')
    })

    test('lowercases mixed case', () => {
        expect(slugify('BFF')).toBe('bff')
    })

    test('collapses multiple spaces to a single hyphen', () => {
        expect(slugify('Qwest       Center')).toBe('qwest-center')
    })

    test('strips special characters', () => {
        expect(slugify('89.7 The River')).toBe('897-the-river')
    })

    test('empty string stays empty', () => {
        expect(slugify('')).toBe('')
    })

    test('splits camelCase words at lowercase-to-uppercase boundaries', () => {
        expect(slugify('OmahaForUs')).toBe('omaha-for-us')
    })
})
