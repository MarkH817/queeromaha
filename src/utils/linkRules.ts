interface LinkRule {
    kind: string
    icon: { name: string; family: string }
    match: (url: string, label: string) => boolean
}

/**
 * Canonical, fixed footer display order: calendar/events/schedule, Instagram,
 * Discord, Website, FB. Everything else keeps its original YAML order,
 * appended after (see canonicalRank / resolveLink below).
 */
const linkRules: LinkRule[] = [
    {
        kind: 'calendar',
        icon: { name: 'calendar', family: 'classic' },
        match: (_u, l) =>
            l.includes('event') ||
            l.includes('calendar') ||
            l.includes('show') ||
            l.includes('flyer') ||
            l.includes('schedule'),
    },
    {
        kind: 'instagram',
        icon: { name: 'instagram', family: 'brands' },
        match: (u) => u.includes('instagram.com'),
    },
    {
        kind: 'discord',
        icon: { name: 'discord', family: 'brands' },
        match: (u) => u.includes('discord.com') || u.includes('discord.gg'),
    },
    {
        kind: 'website',
        icon: { name: 'earth-africa', family: 'classic' },
        match: (_u, l) => l.includes('website'),
    },
    {
        kind: 'facebook',
        icon: { name: 'facebook', family: 'brands' },
        match: (u) => u.includes('facebook.com'),
    },
    {
        kind: 'other',
        icon: { name: 'rectangle-list', family: 'classic' },
        match: (u) => u.includes('carrd.co'),
    },
    {
        kind: 'other',
        icon: { name: 'spa', family: 'classic' },
        match: (_u, l) => l.includes('zen'),
    },
    {
        kind: 'other',
        icon: { name: 'linktree', family: 'brands' },
        match: (_u, l) => l.includes('linktree'),
    },
    {
        kind: 'underground',
        icon: { name: 'music', family: 'classic' },
        match: (_u, l) => l.includes('underground'),
    },
    {
        kind: 'other',
        icon: { name: 'square-check', family: 'classic' },
        match: (u, l) =>
            l.includes('register') ||
            l.includes('signup') ||
            u.includes('docs.google.com/forms') ||
            u.includes('forms.gle'),
    },
    {
        kind: 'other',
        icon: { name: 'person-half-dress', family: 'classic' },
        match: (_u, l) => l.includes('clothes') || l.includes('closet'),
    },
    {
        kind: 'other',
        icon: { name: 'jar', family: 'classic' },
        match: (_u, l) => l.includes('pantry') || l.includes('food'),
    },
    {
        kind: 'other',
        icon: { name: 'child-reaching', family: 'classic' },
        match: (_u, l) => l.includes('youth') || l.includes('teen'),
    },
    {
        kind: 'other',
        icon: { name: 'people-group', family: 'classic' },
        match: (_u, l) => l.includes('support') || l.includes('mental'),
    },
    {
        kind: 'other',
        icon: { name: 'user-group', family: 'classic' },
        match: (u) => u.includes('meetup.com'),
    },
    {
        kind: 'other',
        icon: { name: 'shirt', family: 'classic' },
        match: (u, l) =>
            u.includes('threadless.com') || l.includes('threadless'),
    },
    {
        kind: 'other',
        icon: { name: 'palette', family: 'classic' },
        match: (u, l) => u.includes('redbubble.com') || l.includes('workshop'),
    },
    {
        kind: 'other',
        icon: { name: 'shop', family: 'classic' },
        match: (u) => u.includes('inprnt.com'),
    },
    {
        kind: 'other',
        icon: { name: 'bluesky', family: 'brands' },
        match: (u, l) => u.includes('bsky.app') || l.includes('bluesky'),
    },
    {
        kind: 'other',
        icon: { name: 'bandcamp', family: 'brands' },
        match: (u) => u.includes('bandcamp.com'),
    },
    {
        kind: 'other',
        icon: { name: 'substack', family: 'brands' },
        match: (u) => u.includes('substack.com'),
    },
]

export function matchRule(url: string, label: string) {
    return linkRules.find((r) => r.match(url, label)) ?? null
}

const canonicalRank: Record<string, number> = {
    calendar: 0,
    instagram: 1,
    discord: 2,
    website: 3,
    facebook: 4,
}

export function resolveLink(link: { url: string; label: string }) {
    const url = link.url.toLowerCase()
    const label = link.label.toLowerCase()
    const rule = matchRule(url, label)
    const kind = rule?.kind ?? 'other'
    return { icon: rule?.icon ?? null, rank: canonicalRank[kind] ?? 5 }
}
