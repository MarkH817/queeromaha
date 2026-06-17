import { getCollection } from 'astro:content'
import type { APIRoute } from 'astro'
import { generateFeedICS } from '../utils/ical'

export const prerender = true

export const GET: APIRoute = async () => {
    const entries = await getCollection('directory')

    const events: Array<{
        uid: string
        event: import('../utils/ical').RecurringEvent
    }> = []

    for (const entry of entries) {
        const items = (entry.data.items ?? []).filter((i) => i.public !== false)
        for (const item of items) {
            if (!item.recurring_events?.length) continue
            const itemSlug = item.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
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
