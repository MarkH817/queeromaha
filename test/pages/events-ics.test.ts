import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('astro:content', () => ({
    getCollection: vi.fn(),
}))

const { getCollection } = await import('astro:content')
const { GET } = await import('../../src/pages/events.ics.ts')

function mockCollection(entries: unknown[]) {
    vi.mocked(getCollection).mockResolvedValue(entries as never)
}

beforeEach(() => {
    vi.mocked(getCollection).mockReset()
})

describe('GET /events.ics', () => {
    test('sets calendar content headers', async () => {
        mockCollection([])
        const res = await GET({} as never)
        expect(res.headers.get('Content-Type')).toBe(
            'text/calendar; charset=utf-8',
        )
        expect(res.headers.get('Content-Disposition')).toBe(
            'inline; filename="events.ics"',
        )
    })

    test('emits a UID per recurring event, scoped by entry and item slug', async () => {
        mockCollection([
            {
                id: 'social',
                data: {
                    items: [
                        {
                            name: 'Game Night',
                            recurring_events: [
                                {
                                    summary: 'Game Night',
                                    rrule: 'FREQ=WEEKLY',
                                    dtstart: '20260101',
                                    time: '18:00',
                                },
                            ],
                        },
                    ],
                },
            },
        ])
        const res = await GET({} as never)
        const body = await res.text()
        expect(body).toContain('BEGIN:VCALENDAR')
        expect(body).toContain('UID:social-game-night-0@queeromaha.net')
        expect(body).toContain('SUMMARY:Game Night')
        expect(body).toContain('RRULE:FREQ=WEEKLY')
    })

    test('skips items marked private and items without recurring events', async () => {
        mockCollection([
            {
                id: 'social',
                data: {
                    items: [
                        {
                            name: 'Hidden',
                            public: false,
                            recurring_events: [
                                {
                                    summary: 'Hidden Event',
                                    rrule: 'FREQ=WEEKLY',
                                    dtstart: '20260101',
                                    time: '18:00',
                                },
                            ],
                        },
                        { name: 'No Events' },
                    ],
                },
            },
        ])
        const res = await GET({} as never)
        const body = await res.text()
        expect(body).not.toContain('Hidden Event')
    })

    test('defaults event location to the item name when unset', async () => {
        mockCollection([
            {
                id: 'social',
                data: {
                    items: [
                        {
                            name: 'Support Group',
                            recurring_events: [
                                {
                                    summary: 'Support Group',
                                    rrule: 'FREQ=WEEKLY',
                                    dtstart: '20260101',
                                    time: '18:00',
                                },
                            ],
                        },
                    ],
                },
            },
        ])
        const res = await GET({} as never)
        const body = await res.text()
        expect(body).toContain('LOCATION:Support Group')
    })
})
