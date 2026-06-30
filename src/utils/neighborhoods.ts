import type { CollectionEntry } from 'astro:content'
import { slugify } from './slugify'

export const NEIGHBORHOOD_ORDER = [
    'benson',
    'dundee',
    'midtown',
    'aksarben',
    'downtown',
    'north-o',
    'south-o',
    'west-o',
]

export function buildNeighborhoods(
    entries: CollectionEntry<'directory'>[],
): { slug: string; label: string }[] {
    const seen = new Set<string>()
    const list: { slug: string; label: string }[] = []
    for (const entry of entries) {
        for (const item of entry.data.items ?? []) {
            if (item.public !== false && item.location?.neighborhood) {
                const slug = slugify(item.location.neighborhood)
                if (!slug || seen.has(slug)) continue
                seen.add(slug)
                list.push({ slug, label: item.location.neighborhood })
            }
        }
    }
    list.sort((a, b) => {
        const ai = NEIGHBORHOOD_ORDER.indexOf(a.slug)
        const bi = NEIGHBORHOOD_ORDER.indexOf(b.slug)
        if (ai === -1 && bi === -1) return 0
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
    })
    return list
}
