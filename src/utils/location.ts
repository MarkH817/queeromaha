export interface LocationInput {
    street?: string
    city?: string
    state?: string
    zip?: string
    neighborhood?: string
}

export function formatLocationLine(loc?: LocationInput): string {
    if (!loc) return ''
    const addrParts = [
        loc.street,
        loc.city,
        loc.state && loc.zip
            ? `${loc.state} ${loc.zip}`
            : (loc.state ?? loc.zip),
    ].filter(Boolean)
    const addrLine = addrParts.join(', ')
    return [addrLine, loc.neighborhood].filter(Boolean).join(' - ')
}
