import { describe, expect, test } from 'vitest'
import { generateFeedICS } from '../src/utils/ical.ts'

const baseEvent = {
    summary: 'Test Event',
    rrule: 'FREQ=WEEKLY;BYDAY=WE',
    dtstart: '20250101',
    time: '18:00',
    location: 'Test Location',
}

describe('generateFeedICS', () => {
    test('empty events produces valid VCALENDAR wrapper', () => {
        const ics = generateFeedICS([])
        expect(ics).toContain('BEGIN:VCALENDAR')
        expect(ics).toContain('END:VCALENDAR')
        expect(ics).toContain('VERSION:2.0')
        expect(ics).toContain('X-WR-CALNAME:Queer Omaha Events')
        expect(ics).toContain('X-WR-TIMEZONE:America/Chicago')
    })

    test('event appears as VEVENT with correct fields', () => {
        const ics = generateFeedICS([{ uid: 'test-0', event: baseEvent }])
        expect(ics).toContain('BEGIN:VEVENT')
        expect(ics).toContain('END:VEVENT')
        expect(ics).toContain('UID:test-0@queeromaha.net')
        expect(ics).toContain('DTSTART;TZID=America/Chicago:20250101T180000')
        expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=WE')
        expect(ics).toContain('SUMMARY:Test Event')
        expect(ics).toContain('LOCATION:Test Location')
        expect(ics).toContain('STATUS:CONFIRMED')
    })

    test('end_time produces DTEND on same date as dtstart', () => {
        const ics = generateFeedICS([
            { uid: 'u', event: { ...baseEvent, end_time: '19:30' } },
        ])
        expect(ics).toContain('DTEND;TZID=America/Chicago:20250101T193000')
        expect(ics).not.toContain('DURATION')
    })

    test('duration used when no end_time', () => {
        const ics = generateFeedICS([
            { uid: 'u', event: { ...baseEvent, duration: 'PT1H30M' } },
        ])
        expect(ics).toContain('DURATION:PT1H30M')
        expect(ics).not.toContain('DTEND')
    })

    test('defaults to PT2H when neither end_time nor duration', () => {
        const ics = generateFeedICS([{ uid: 'u', event: baseEvent }])
        expect(ics).toContain('DURATION:PT2H')
    })

    test('optional url is included when present', () => {
        const ics = generateFeedICS([
            { uid: 'u', event: { ...baseEvent, url: 'https://example.com' } },
        ])
        expect(ics).toContain('URL:https://example.com')
    })

    test('optional description is included and newlines escaped', () => {
        const ics = generateFeedICS([
            {
                uid: 'u',
                event: { ...baseEvent, description: 'Line one\nLine two' },
            },
        ])
        expect(ics).toContain('DESCRIPTION:Line one\\nLine two')
    })

    test('multiple events each get a VEVENT block', () => {
        const ics = generateFeedICS([
            { uid: 'a', event: { ...baseEvent, summary: 'Event A' } },
            { uid: 'b', event: { ...baseEvent, summary: 'Event B' } },
        ])
        expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
        expect(ics).toContain('SUMMARY:Event A')
        expect(ics).toContain('SUMMARY:Event B')
    })

    test('time is zero-padded', () => {
        const ics = generateFeedICS([
            { uid: 'u', event: { ...baseEvent, time: '9:05' } },
        ])
        expect(ics).toContain('T090500')
    })

    test('CRLF line endings throughout', () => {
        const ics = generateFeedICS([{ uid: 'u', event: baseEvent }])
        expect(ics).toContain('\r\n')
        // No bare LF without preceding CR
        expect(ics.replace(/\r\n/g, '')).not.toContain('\n')
    })
})
