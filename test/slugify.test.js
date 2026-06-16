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
    expect(slugify('Dundee  Park')).toBe('dundee-park')
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
    expect(slugify('West O')).toBe(slugify('west o!'))
    expect(slugify('Mid-City')).toBe(slugify('Mid City'))
  })
})
