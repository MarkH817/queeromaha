import { describe, expect, test } from 'vitest'
import { formatLocationLine, mapsUrl } from '#utils/location.ts'

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

    test('empty-string state falls through to zip', () => {
        expect(
            formatLocationLine({ city: 'Omaha', state: '', zip: '68102' }),
        ).toBe('Omaha, 68102')
    })
})

describe('mapsUrl', () => {
    test('prefers an explicit google_maps_url', () => {
        expect(
            mapsUrl({
                street: '123 Main St',
                google_maps_url: 'https://maps.app.goo.gl/abc',
            }),
        ).toBe('https://maps.app.goo.gl/abc')
    })

    test('derives a search url from street, defaulting city and state', () => {
        expect(mapsUrl({ street: '3101 S 20th St' })).toBe(
            'https://www.google.com/maps/search/?api=1&query=3101%20S%2020th%20St%2C%20Omaha%2C%20NE',
        )
    })

    test('uses city, state and zip when given', () => {
        expect(
            mapsUrl({
                street: '1 A St',
                city: 'Lincoln',
                state: 'NE',
                zip: '68508',
            }),
        ).toBe(
            'https://www.google.com/maps/search/?api=1&query=1%20A%20St%2C%20Lincoln%2C%20NE%2068508',
        )
    })

    test('area-only locations get no link', () => {
        expect(mapsUrl({ neighborhood: 'Benson' })).toBeUndefined()
        expect(mapsUrl(undefined)).toBeUndefined()
    })
})
