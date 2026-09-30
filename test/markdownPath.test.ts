import { describe, expect, test } from 'vitest'
import { markdownPathFor } from '../netlify/lib/markdownPath'

describe('markdownPathFor', () => {
    test('maps root to index.md, not the unservable /.md', () => {
        expect(markdownPathFor('/')).toBe('/index.md')
    })
    test('appends .md to category and item paths', () => {
        expect(markdownPathFor('/art')).toBe('/art.md')
        expect(markdownPathFor('/art/bemis-center')).toBe(
            '/art/bemis-center.md',
        )
    })
})
