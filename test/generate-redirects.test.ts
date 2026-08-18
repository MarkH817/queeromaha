import { describe, expect, test } from 'vitest'
import {
    dedupeRedirects,
    formatRedirectLine,
    generateRedirects,
    parseRedirectLine,
    validateRedirects,
} from '../scripts/generate-redirects.ts'

describe('parseRedirectLine', () => {
    test('parses a well-formed redirect line', () => {
        expect(parseRedirectLine('/old  /new  301')).toEqual([
            '/old',
            '/new',
            '301',
        ])
    })

    test('normalizes arbitrary whitespace', () => {
        expect(parseRedirectLine('/old\t/new  302')).toEqual([
            '/old',
            '/new',
            '302',
        ])
    })

    test('returns null for empty lines', () => {
        expect(parseRedirectLine('')).toBeNull()
        expect(parseRedirectLine('   ')).toBeNull()
    })

    test('returns null for comment lines', () => {
        expect(parseRedirectLine('# this is a comment')).toBeNull()
    })

    test('returns null for malformed lines (missing status)', () => {
        expect(parseRedirectLine('/old  /new')).toBeNull()
    })

    test('returns null for malformed lines (missing destination)', () => {
        expect(parseRedirectLine('/old  301')).toBeNull()
    })

    test('returns null for non-path source', () => {
        expect(parseRedirectLine('not-a-path  /new  301')).toBeNull()
    })

    test('returns null for non-path destination', () => {
        expect(parseRedirectLine('/old  not-a-path  301')).toBeNull()
    })

    test('accepts absolute URLs as destination', () => {
        expect(parseRedirectLine('/old  https://example.com  302')).toEqual([
            '/old',
            'https://example.com',
            '302',
        ])
    })
})

describe('formatRedirectLine', () => {
    test('produces canonical 2-space-separated format', () => {
        expect(formatRedirectLine('/old', '/new', '301')).toBe(
            '/old  /new  301',
        )
    })
})

describe('validateRedirects', () => {
    test('returns empty array for all-valid content', () => {
        expect(validateRedirects('/old  /new  301\n/a  /b  302\n')).toEqual([])
    })

    test('flags malformed lines', () => {
        const content = '/old  /new  301\nbad line\n/a  /b  302\n'
        expect(validateRedirects(content)).toEqual(['bad line'])
    })

    test('ignores comments and blank lines', () => {
        const content = '# comment\n\n/old  /new  301\n'
        expect(validateRedirects(content)).toEqual([])
    })
})

describe('dedupeRedirects', () => {
    test('removes exact duplicates', () => {
        const lines: [string, string, string][] = [
            ['/a', '/b', '301'],
            ['/a', '/b', '301'],
        ]
        expect(dedupeRedirects(lines)).toEqual([['/a', '/b', '301']])
    })

    test('keeps first occurrence when source collides', () => {
        const lines: [string, string, string][] = [
            ['/a', '/b', '301'],
            ['/a', '/c', '302'],
        ]
        expect(dedupeRedirects(lines)).toEqual([['/a', '/b', '301']])
    })

    test('preserves non-colliding entries', () => {
        const lines: [string, string, string][] = [
            ['/a', '/b', '301'],
            ['/c', '/d', '302'],
        ]
        expect(dedupeRedirects(lines)).toEqual([
            ['/a', '/b', '301'],
            ['/c', '/d', '302'],
        ])
    })
})

describe('generateRedirects', () => {
    test('merges static and computed redirects', () => {
        const staticContent = '/about  /  301\n'
        const computed: [string, string, string][] = [
            ['/art/old-slug', '/art/new-slug', '301'],
        ]
        const result = generateRedirects(staticContent, computed)
        expect(result).toContain('/about  /  301')
        expect(result).toContain('/art/old-slug  /art/new-slug  301')
    })

    test('dedupes when static and computed overlap', () => {
        const staticContent = '/about  /  301\n'
        const computed: [string, string, string][] = [['/about', '/', '301']]
        const result = generateRedirects(staticContent, computed)
        expect(result.split('/about').length - 1).toBe(1)
    })

    test('normalizes whitespace from static entries', () => {
        const staticContent = '/   /friends  301\n'
        const result = generateRedirects(staticContent, [])
        expect(result).toBe('/  /friends  301\n')
    })

    test('ends with a trailing newline', () => {
        const result = generateRedirects('', [])
        expect(result.endsWith('\n')).toBe(true)
    })

    test('returns empty string with trailing newline when no redirects', () => {
        const result = generateRedirects('', [])
        expect(result).toBe('\n')
    })
})
