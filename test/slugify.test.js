import { describe, expect, test } from 'bun:test'

const { slugify } = await import('../src/utils/slugify.ts')

describe('slugify', () => {
    test('lowercases and replaces spaces with hyphens', () => {
        expect(slugify('West Omaha')).toBe('west-omaha')
    })

    test('lowercases mixed case', () => {
        expect(slugify('BENSON')).toBe('benson')
    })

    test('collapses multiple spaces to a single hyphen', () => {
        expect(slugify('Benson  Park')).toBe('benson-park')
    })

    test('strips special characters', () => {
        expect(slugify('West Omaha!')).toBe('west-omaha')
    })

    test('empty string stays empty', () => {
        expect(slugify('')).toBe('')
    })

    test('intentionally collides differently-styled labels', () => {
        // Documents expected behavior: slugify is lossy, so labels that differ
        // only by case or punctuation are treated as the same neighborhood.
        expect(slugify('West Omaha')).toBe(slugify('west omaha!'))
        expect(slugify('Mid-Town')).toBe(slugify('Mid Town'))
    })
})
