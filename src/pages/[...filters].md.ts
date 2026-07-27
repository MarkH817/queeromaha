import type { z } from 'zod'
import type { itemSchema } from '../content.config'
import tagMap from '../data/tagMap.json'
import { formatLocationLine } from '../utils/location'
import {
    categoryMap,
    getFilterStaticPaths,
    resolveFilters,
} from '../utils/resolveFilters'

type Item = z.infer<typeof itemSchema>
type TagMap = Record<string, { icon: string; label: string; family?: string }>
const tags = tagMap as TagMap

export async function getStaticPaths() {
    const paths = await getFilterStaticPaths()
    return paths.map((filters) => ({ params: { filters } }))
}

function renderItemBody(item: Item): string[] {
    const lines: string[] = []
    if (item.description) lines.push('', item.description)
    if (item.tags && item.tags.length > 0) {
        const labels = item.tags.map((t) => tags[t]?.label ?? t)
        lines.push('', `Tags: ${labels.join(', ')}`)
    }
    const locLine = formatLocationLine(item.location)
    if (locLine) lines.push('', `Location: ${locLine}`)
    if (item.links && item.links.length > 0) {
        lines.push('', ...item.links.map((l) => `- [${l.label}](${l.url})`))
    }
    return lines
}

function renderItem(item: Item): string {
    return [`### ${item.name}`, ...renderItemBody(item)].join('\n')
}

export async function GET({ params }: { params: { filters?: string } }) {
    const { activeItem, entries, matchesInitial, pageTitle, pageDescription } =
        await resolveFilters(params.filters ?? '')

    const body = activeItem
        ? [`# ${pageTitle}`, ...renderItemBody(activeItem)]
        : [
              `# ${pageTitle}`,
              '',
              pageDescription,
              '',
              ...entries.flatMap((entry) => {
                  if (!matchesInitial(entry.id)) return []
                  const publicItems = (entry.data.items ?? []).filter(
                      (i) => i.public !== false,
                  )
                  if (publicItems.length === 0) return []
                  return [
                      `## ${categoryMap[entry.id]?.label ?? entry.id}`,
                      '',
                      ...publicItems.map(renderItem),
                      '',
                  ]
              }),
          ]

    return new Response(body.join('\n'), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
}
