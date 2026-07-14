// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest'

// filter.ts runs `initFilters()` immediately on import (DOM-ready listener),
// so the DOM fixture must exist before each dynamic import, and modules must
// be reset between tests so it re-runs against the fresh fixture.
async function loadFilters() {
    vi.resetModules()
    await import('../src/scripts/filter.ts')
}

function setBody(html: string) {
    document.body.innerHTML = html
}

const CATEGORY_PILLS = `
  <wa-button data-filter="art" data-filter-type="category" aria-pressed="false">Art</wa-button>
  <wa-button data-filter="cafes" data-filter-type="category" aria-pressed="false">Cafes</wa-button>
`

const TAG_PILLS = `
  <button id="filterClear" disabled>Clear</button>
  <button class="filter-pill" data-filter="wifi" data-filter-type="tag" aria-pressed="false">WiFi</button>
  <button class="filter-pill" data-filter="seating" data-filter-type="tag" aria-pressed="false">Seating</button>
`

function cards() {
    return `
      <h2 data-category-heading="art">Art</h2>
      <wa-card data-category="art" data-tags="wifi"></wa-card>
      <wa-card data-category="art" data-tags="seating"></wa-card>
      <h2 data-category-heading="cafes">Cafes</h2>
      <wa-card data-category="cafes" data-tags="wifi seating"></wa-card>
    `
}

describe('initFilters', () => {
    beforeEach(() => {
        setBody(`${CATEGORY_PILLS}${TAG_PILLS}${cards()}`)
    })

    test('does nothing when there are no cards on the page', async () => {
        setBody(CATEGORY_PILLS + TAG_PILLS)
        await loadFilters()
        // No throw, and pills are left untouched.
        const pill = document.querySelector(
            '[data-filter="wifi"]',
        ) as HTMLElement
        expect(pill.classList.contains('active')).toBe(false)
    })

    test('clicking a tag pill hides cards that lack the tag', async () => {
        await loadFilters()
        const wifiPill = document.querySelector(
            '[data-filter="wifi"]',
        ) as HTMLElement
        wifiPill.click()

        const cardEls = document.querySelectorAll('wa-card')
        expect((cardEls[0] as HTMLElement).hidden).toBe(false) // art, wifi
        expect((cardEls[1] as HTMLElement).hidden).toBe(true) // art, seating only
        expect((cardEls[2] as HTMLElement).hidden).toBe(false) // cafes, wifi+seating
    })

    test('tag pills AND-match: two active tags only match cards with both', async () => {
        await loadFilters()
        ;(document.querySelector('[data-filter="wifi"]') as HTMLElement).click()
        ;(
            document.querySelector('[data-filter="seating"]') as HTMLElement
        ).click()

        const cardEls = document.querySelectorAll('wa-card')
        expect((cardEls[0] as HTMLElement).hidden).toBe(true) // wifi only
        expect((cardEls[1] as HTMLElement).hidden).toBe(true) // seating only
        expect((cardEls[2] as HTMLElement).hidden).toBe(false) // wifi+seating
    })

    test('clicking category pill filters by category and clears active tags', async () => {
        await loadFilters()
        ;(document.querySelector('[data-filter="wifi"]') as HTMLElement).click()
        const cafesPill = document.querySelector(
            '[data-filter="cafes"]',
        ) as HTMLElement
        cafesPill.click()

        const cardEls = document.querySelectorAll('wa-card')
        expect((cardEls[0] as HTMLElement).hidden).toBe(true) // art
        expect((cardEls[1] as HTMLElement).hidden).toBe(true) // art
        expect((cardEls[2] as HTMLElement).hidden).toBe(false) // cafes

        const wifiPill = document.querySelector(
            '[data-filter="wifi"]',
        ) as HTMLElement
        expect(wifiPill.classList.contains('active')).toBe(false)
    })

    test('clicking the already-active category pill is a no-op', async () => {
        await loadFilters()
        const artPill = document.querySelector(
            '[data-filter="art"]',
        ) as HTMLElement
        artPill.click()
        expect(artPill.classList.contains('active')).toBe(true)

        artPill.click()
        // Still active; category set unchanged (still only "art" active).
        expect(artPill.classList.contains('active')).toBe(true)
        const cardEls = document.querySelectorAll('wa-card')
        expect((cardEls[2] as HTMLElement).hidden).toBe(true) // cafes still hidden
    })

    test('clear button disabled state tracks active tag count', async () => {
        await loadFilters()
        const clearBtn = document.getElementById(
            'filterClear',
        ) as HTMLButtonElement
        expect(clearBtn.disabled).toBe(true)

        ;(document.querySelector('[data-filter="wifi"]') as HTMLElement).click()
        expect(clearBtn.disabled).toBe(false)

        clearBtn.click()
        expect(clearBtn.disabled).toBe(true)
    })

    test('clear button only clears tags, not category', async () => {
        await loadFilters()
        ;(
            document.querySelector('[data-filter="cafes"]') as HTMLElement
        ).click()
        ;(document.querySelector('[data-filter="wifi"]') as HTMLElement).click()

        const clearBtn = document.getElementById(
            'filterClear',
        ) as HTMLButtonElement
        clearBtn.click()

        const cafesPill = document.querySelector(
            '[data-filter="cafes"]',
        ) as HTMLElement
        expect(cafesPill.classList.contains('active')).toBe(true)
        const wifiPill = document.querySelector(
            '[data-filter="wifi"]',
        ) as HTMLElement
        expect(wifiPill.classList.contains('active')).toBe(false)
    })

    test('tag pill becomes disabled/unavailable when it would produce zero results', async () => {
        setBody(
            `${TAG_PILLS}<wa-card data-category="art" data-tags="wifi"></wa-card>`,
        )
        await loadFilters()
        ;(document.querySelector('[data-filter="wifi"]') as HTMLElement).click()

        const seatingPill = document.querySelector(
            '[data-filter="seating"]',
        ) as HTMLElement & { disabled: boolean }
        expect(seatingPill.disabled).toBe(true)
        expect(seatingPill.classList.contains('unavailable')).toBe(true)
    })

    test('category pills are never disabled, even with zero matches', async () => {
        setBody(
            `${CATEGORY_PILLS}<wa-card data-category="art" data-tags="wifi"></wa-card>`,
        )
        await loadFilters()
        const cafesPill = document.querySelector(
            '[data-filter="cafes"]',
        ) as HTMLElement & { disabled: boolean }
        expect(cafesPill.disabled).toBe(false)
    })

    test('category heading hides when no visible card remains in that category', async () => {
        await loadFilters()
        const cafesPill = document.querySelector(
            '[data-filter="cafes"]',
        ) as HTMLElement
        cafesPill.click()

        const artHeading = document.querySelector(
            '[data-category-heading="art"]',
        ) as HTMLElement
        const cafesHeading = document.querySelector(
            '[data-category-heading="cafes"]',
        ) as HTMLElement
        expect(artHeading.hidden).toBe(true)
        expect(cafesHeading.hidden).toBe(false)
    })

    test('data-initial-categories and data-initial-tags on body activate filters on load', async () => {
        document.body.dataset.initialCategories = 'cafes'
        document.body.dataset.initialTags = 'wifi'
        await loadFilters()

        const cafesPill = document.querySelector(
            '[data-filter="cafes"]',
        ) as HTMLElement
        const wifiPill = document.querySelector(
            '[data-filter="wifi"]',
        ) as HTMLElement
        expect(cafesPill.classList.contains('active')).toBe(true)
        expect(wifiPill.classList.contains('active')).toBe(true)

        const cardEls = document.querySelectorAll('wa-card')
        expect((cardEls[2] as HTMLElement).hidden).toBe(false) // cafes + wifi
        expect((cardEls[0] as HTMLElement).hidden).toBe(true) // art
    })
})
