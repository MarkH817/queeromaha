export interface RecurringEvent {
  summary: string
  rrule: string
  dtstart: string
  time: string
  end_time?: string
  duration?: string
  location?: string
  description?: string
  url?: string
}

function stamp(): string {
  return `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return `${h.padStart(2, '0')}${m.padStart(2, '0')}00`
}

function buildRecurringVEvent(event: RecurringEvent, uid: string): string {
  const dtstart = `${event.dtstart}T${formatTime(event.time)}`
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}@queeromaha.net`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;TZID=America/Chicago:${dtstart}`,
    `RRULE:${event.rrule}`,
  ]

  if (event.end_time) {
    lines.push(
      `DTEND;TZID=America/Chicago:${event.dtstart}T${formatTime(event.end_time)}`,
    )
  } else if (event.duration) {
    lines.push(`DURATION:${event.duration}`)
  } else {
    lines.push('DURATION:PT2H')
  }

  lines.push(`SUMMARY:${event.summary}`)
  if (event.description)
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`)
  if (event.location) lines.push(`LOCATION:${event.location}`)
  if (event.url) lines.push(`URL:${event.url}`)
  lines.push('STATUS:CONFIRMED', 'SEQUENCE:0', 'END:VEVENT')

  return lines.join('\r\n')
}

export function generateFeedICS(
  events: Array<{ uid: string; event: RecurringEvent }>,
): string {
  const vevents = events
    .map(({ uid, event }) => buildRecurringVEvent(event, uid))
    .join('\r\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QueerOmaha//Queer Omaha Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Queer Omaha Events',
    'X-WR-TIMEZONE:America/Chicago',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n')
}
