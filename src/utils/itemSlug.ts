import { slugify } from './slugify'

export function autoSlug(name: string): string {
    return slugify(name)
}

function dedupe(slugs: string[]): string[] {
    const seen = new Map<string, number>()
    return slugs.map((slug) => {
        const count = seen.get(slug) ?? 0
        seen.set(slug, count + 1)
        return count === 0 ? slug : `${slug}-${count + 1}`
    })
}

export interface ItemSlugs {
    canonical: string
    auto: string
}

export function computeItemSlugs(
    items: { name: string; vanity_slug?: string }[],
): ItemSlugs[] {
    const auto = dedupe(items.map((item) => autoSlug(item.name)))
    const canonical = dedupe(
        items.map((item, i) =>
            item.vanity_slug ? slugify(item.vanity_slug) : auto[i],
        ),
    )
    return items.map((_, i) => ({ canonical: canonical[i], auto: auto[i] }))
}
