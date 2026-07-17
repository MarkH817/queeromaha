import {
    getUpcomingEvents,
    type NextEvent,
    parseEvents,
} from '../utils/eventsPreview'

const PREVIEW_COUNT = 3

interface RowEls {
    time: HTMLElement
    title: HTMLElement
}

let cachedEvents: NextEvent[] | undefined
let inFlight: Promise<void> | null = null

function formatTime(event: NextEvent): string {
    // timeZone: 'UTC' reproduces the fake-UTC wall-clock values verbatim
    // instead of re-applying the visitor's real offset on top of them.
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
    }).format(event.start)
}

function render(rowEls: RowEls[], events: NextEvent[]) {
    rowEls.forEach(({ time, title }, i) => {
        const event = events[i]
        time.textContent = event ? formatTime(event) : ''
        title.textContent = event?.summary ?? ''
    })
}

async function loadUpcomingEvents(): Promise<NextEvent[]> {
    const [{ RRule }, res] = await Promise.all([
        import('rrule'),
        fetch('/events.ics'),
    ])
    if (!res.ok) throw new Error(`events.ics responded ${res.status}`)
    const icsText = await res.text()
    const events = parseEvents(icsText)
    return getUpcomingEvents(events, new Date(), RRule, PREVIEW_COUNT)
}

function init() {
    const details = document.querySelector<HTMLDetailsElement>('#calendarBox')
    const rowEls: RowEls[] = Array.from(
        details?.querySelectorAll<HTMLElement>('.calendar-preview-row') ?? [],
    )
        .map((row) => ({
            time: row.querySelector<HTMLElement>('.calendar-preview-row-time'),
            title: row.querySelector<HTMLElement>(
                '.calendar-preview-row-title',
            ),
        }))
        .filter((row): row is RowEls => Boolean(row.time && row.title))
    if (!details || rowEls.length === 0) return

    details.addEventListener('toggle', () => {
        if (!details.open) return

        if (cachedEvents !== undefined) {
            render(rowEls, cachedEvents)
            return
        }

        if (!inFlight) {
            inFlight = loadUpcomingEvents()
                .catch(() => [])
                .then((events) => {
                    cachedEvents = events
                    render(rowEls, events)
                })
        }
    })
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init)
else init()
