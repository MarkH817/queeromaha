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
        loc.state && loc.zip ? `${loc.state} ${loc.zip}` : loc.state || loc.zip,
    ].filter(Boolean)
    const addrLine = addrParts.join(', ')
    return [addrLine, loc.neighborhood].filter(Boolean).join(' - ')
}

export interface MapLocationInput extends LocationInput {
    google_maps_url?: string
}

// Prefer the hand-picked link (it can pin the exact listing); otherwise build
// a keyless Google Maps search from the street address. Area-only locations
// (neighborhood without a street) get no link.
export function mapsUrl(loc?: MapLocationInput): string | undefined {
    if (!loc) return undefined
    if (loc.google_maps_url) return loc.google_maps_url
    if (!loc.street) return undefined
    const query = [
        loc.street,
        loc.city || 'Omaha',
        [loc.state || 'NE', loc.zip].filter(Boolean).join(' '),
    ].join(', ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
