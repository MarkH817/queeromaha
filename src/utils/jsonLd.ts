// Escape `<` so a stray "</script>" in any field can't break out of the tag.
export function toJsonLdScript(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c')
}
