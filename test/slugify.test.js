import { describe, expect, test } from 'bun:test'

const { slugify } = await import('../src/utils/slugify.ts')

describe('slugify', () => {
    test('lowercases and replaces spaces with hyphens', () => {
        expect(slugify('West O')).toBe('west-o')
    })

    test('lowercases mixed case', () => {
        expect(slugify('BENSON')).toBe('benson')
    })

    test('collapses multiple spaces to a single hyphen', () => {
        expect(slugify('Benson  Park')).toBe('benson-park')
    })

    test('strips special characters', () => {
        expect(slugify('West O!')).toBe('west-o')
    })

    test('empty string stays empty', () => {
        expect(slugify('')).toBe('')
    })

    test('intentionally collides differently-styled labels', () => {
        // Documents expected behavior: slugify is lossy, so labels that differ
        // only by case or punctuation are treated as the same neighborhood.
        expect(slugify('West O')).toBe(slugify('West O!'))
        expect(slugify('Mid-Town')).toBe(slugify('Mid Town'))
    })
})
