import { getCollection } from 'astro:content'
import type { APIRoute } from 'astro'
import { generateFeedICS, type RecurringEvent } from '#utils/ical.ts'
import { slugify } from '#utils/slugify.ts'

export const prerender = true

export const GET: APIRoute = async () => {
    const entries = await getCollection('directory')

    const events: Array<{
        uid: string
        event: RecurringEvent
    }> = []

    for (const entry of entries) {
        const items = (entry.data.items ?? []).filter((i) => i.public !== false)
        for (const item of items) {
            if (!item.recurring_events?.length) continue
            const itemSlug = slugify(item.name)
            item.recurring_events.forEach((evt, idx) => {
                events.push({
                    uid: `${entry.id}-${itemSlug}-${idx}`,
                    event: {
                        ...evt,
                        location: evt.location ?? item.name,
                    },
                })
            })
        }
    }

    return new Response(generateFeedICS(events), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="events.ics"',
        },
    })
}
