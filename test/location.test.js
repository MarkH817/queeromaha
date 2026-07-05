import { describe, expect, test } from 'bun:test'

const { formatLocationLine } = await import('../src/utils/location.ts')

describe('formatLocationLine', () => {
    test('street and neighborhood join with a hyphen', () => {
        expect(
            formatLocationLine({
                street: '120th and Blondo',
                neighborhood: 'West O',
            }),
        ).toBe('120th and Blondo - West O')
    })

    test('neighborhood only, no address, has no hyphen', () => {
        expect(formatLocationLine({ neighborhood: 'Benson' })).toBe('Benson')
    })

    test('street only, no neighborhood, has no trailing hyphen', () => {
        expect(formatLocationLine({ street: '50th and Dodge' })).toBe(
            '50th and Dodge',
        )
    })

    test('full address joins with commas, then hyphenates the neighborhood', () => {
        expect(
            formatLocationLine({
                street: '123 Main St',
                city: 'Omaha',
                state: 'NE',
                zip: '68102',
                neighborhood: 'Downtown',
            }),
        ).toBe('123 Main St, Omaha, NE 68102 - Downtown')
    })

    test('state without zip is included on its own', () => {
        expect(formatLocationLine({ city: 'Omaha', state: 'NE' })).toBe(
            'Omaha, NE',
        )
    })

    test('zip without state is included on its own', () => {
        expect(formatLocationLine({ city: 'Omaha', zip: '68102' })).toBe(
            'Omaha, 68102',
        )
    })

    test('no location fields returns an empty string', () => {
        expect(formatLocationLine({})).toBe('')
    })

    test('undefined location returns an empty string', () => {
        expect(formatLocationLine(undefined)).toBe('')
    })
})
