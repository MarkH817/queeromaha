// @ts-check
import { parse, stringify } from 'yaml'

/**
 * Parses and re-serializes yaml source into its canonical form.
 * @param {string} src
 * @returns {{ canonical: string } | { error: string }}
 */
export function canonicalize(src) {
    try {
        const canonical = stringify(parse(src), { lineWidth: 0 })
        return { canonical }
    } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) }
    }
}
