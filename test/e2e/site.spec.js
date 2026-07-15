import { expect, test } from '@playwright/test'

const pages = [
    { path: '/friends/', titleContains: 'Queer' },
    // filter slug pages all share the directory title
    { path: '/music/', titleContains: 'Queer' },
    { path: '/cafes/', titleContains: 'Queer' },
    { path: '/art/', titleContains: 'Queer' },
    { path: '/spiritual/', titleContains: 'Queer' },
    { path: '/makers/', titleContains: 'Queer' },
]

for (const { path, titleContains } of pages) {
    test(`${path} loads and has expected title`, async ({ page }) => {
        const response = await page.goto(path)
        expect(response.status()).toBe(200)
        await expect(page).toHaveTitle(new RegExp(titleContains, 'i'))
    })
}

test('home page has navigation links', async ({ page }) => {
    await page.goto('/friends/')
    const nav = page.locator('nav.main-nav')
    await expect(nav).toBeVisible()
    const buttons = nav.locator('wa-button')
    expect(await buttons.count()).toBeGreaterThan(0)
})

test('no console errors on home page', async ({ page }) => {
    const errors = []
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/friends/')
    expect(errors).toHaveLength(0)
})

test('skip-to-main link is present', async ({ page }) => {
    await page.goto('/friends/')
    const skipLink = page.locator('a.skip-link')
    await expect(skipLink).toHaveAttribute('href', '#main')
})

test('content pages render wa-card items', async ({ page }) => {
    for (const path of ['/cafes/', '/music/', '/art/', '/makers/']) {
        await page.goto(path)
        const cards = page.locator('wa-card.item')
        expect(await cards.count(), `no cards on ${path}`).toBeGreaterThan(0)
    }
})

test('external links have rel=noopener noreferrer', async ({ page }) => {
    await page.goto('/cafes/')
    const links = page.locator('wa-card .entry-links a[href^="http"]')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
        const rel = await links.nth(i).getAttribute('rel')
        expect(rel).toContain('noopener')
        expect(rel).toContain('noreferrer')
    }
})

test('footer is present', async ({ page }) => {
    await page.goto('/friends/')
    await expect(page.getByRole('contentinfo')).toBeVisible()
})

test('filter pills are present on home page', async ({ page }) => {
    await page.goto('/friends/')
    const pills = page.locator('.filter-pill')
    expect(await pills.count()).toBeGreaterThan(0)
})

test('/spiritual pre-activates the spiritual filter pill', async ({ page }) => {
    await page.goto('/spiritual/')
    const pill = page.locator('[data-filter="spiritual"]')
    await expect(pill).toHaveClass(/active/)
})

test('switching top-level category clears active tags', async ({ page }) => {
    await page.goto('/art/')
    const tag = page.locator('[data-filter="neutral-bathrooms"]')

    await tag.click()
    await expect(tag).toHaveClass(/active/)

    await page.locator('[data-filter="cafes"]').click()
    await expect(page).toHaveURL(/\/cafes\/?$/)
    await expect(tag).not.toHaveClass(/active/)
})

test('footer elements render correctly', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto('/friends/')

    // rotating message is dropped entirely below 480px, not just clipped
    await expect(page.locator('.footer-text')).toBeHidden()

    // calendar box and suggestion box remain visible regardless
    await expect(page.locator('.calendar-box summary')).toBeVisible()
    await expect(page.locator('#suggestionBox summary')).toBeVisible()
})

test('calendar and suggestion box stay on the same row on mobile', async ({
    page,
}) => {
    await page.setViewportSize({ width: 412, height: 839 })
    await page.goto('/friends/')

    const calBox = await page.locator('.calendar-box summary').boundingBox()
    const navBox = await page.locator('#suggestionBox summary').boundingBox()

    expect(calBox.y).toBeCloseTo(navBox.y, 0)
})

test('footer message stays hidden on mobile even if a stale JS toggle unhides it', async ({
    page,
}) => {
    await page.setViewportSize({ width: 412, height: 839 })
    await page.goto('/friends/')

    await page.evaluate(() => {
        document.querySelector('.footer-text').hidden = false
    })

    // the media query hides it unconditionally at this breakpoint,
    // regardless of the `hidden` IDL property checkFooterFit() manages
    await expect(page.locator('.footer-text')).toBeHidden()
})

test('footer message is visible and unclipped on wide screens', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await page.goto('/friends/')
    const footerText = page.locator('.footer-text')
    const footerMessage = page.locator('.footer-message')

    await expect(footerText).toBeVisible()
    const overflowing = await footerMessage.evaluate(
        (el) => el.scrollWidth > el.clientWidth,
    )
    expect(overflowing).toBe(false)
})

test('tag filter pills use wa-icon elements', async ({ page }) => {
    await page.goto('/friends/')
    const pills = page.locator('.filter-pill')
    const count = await pills.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
        await expect(pills.nth(i).locator('wa-icon')).toHaveCount(1)
    }
})

test('item cards with a location show a location-dot icon', async ({
    page,
}) => {
    await page.goto('/cafes/')
    const locations = page.locator('.item-location')
    const count = await locations.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
        await expect(
            locations.nth(i).locator('wa-icon[name="location-dot"]'),
        ).toHaveCount(1)
    }
})

test('suggestion box expands in place without navigating', async ({ page }) => {
    await page.goto('/friends/')
    const startUrl = page.url()

    await page.locator('#suggestionBox summary').click()

    await expect(page.locator('#suggestionMessage')).toBeVisible()
    expect(page.url()).toBe(startUrl)
})

test('opening the suggestion box hides the other footer buttons and re-tapping closes it', async ({
    page,
}) => {
    await page.goto('/friends/')

    await expect(page.locator('.calendar-box')).toBeVisible()
    await expect(page.locator('.footer-nav')).toBeVisible()
    const closedBox = await page.locator('#suggestionBox summary').boundingBox()

    await page.locator('#suggestionBox summary').click()

    await expect(page.locator('.calendar-box')).toBeHidden()
    await expect(page.locator('.footer-nav')).toBeHidden()
    await expect(page.locator('#suggestionBox')).toHaveAttribute('open', '')

    await page.locator('#suggestionBox summary').click()

    await expect(page.locator('.calendar-box')).toBeVisible()
    await expect(page.locator('.footer-nav')).toBeVisible()
    await expect(page.locator('#suggestionBox')).not.toHaveAttribute('open', '')
    await expect
        .poll(async () => {
            const box = await page
                .locator('#suggestionBox summary')
                .boundingBox()
            return box.x
        })
        .toBeCloseTo(closedBox.x, 0)
})

test('calendar box expands in place, offers Google and webcal links, and re-tapping closes it', async ({
    page,
}) => {
    await page.goto('/friends/')
    const startUrl = page.url()

    await expect(page.locator('.suggestion-box')).toBeVisible()
    await expect(page.locator('.footer-nav')).toBeVisible()

    await page.locator('.calendar-box summary').click()

    const google = page.locator('.calendar-option').nth(0)
    const ics = page.locator('.calendar-option').nth(1)
    await expect(google).toBeVisible()
    await expect(ics).toBeVisible()
    await expect(google).toHaveAttribute('href', /calendar\.google\.com/)
    await expect(ics).toHaveAttribute(
        'href',
        'webcal://queeromaha.net/events.ics',
    )
    await expect(google).toHaveAccessibleName(/Google Calendar/)
    await expect(ics).toHaveAccessibleName(/Apple Calendar/)
    expect(page.url()).toBe(startUrl)

    // opening the calendar box hides the suggestion box in turn (the one
    // direction the DOM-order-only ~ combinator can't reach, handled by
    // the :has() rule instead)
    await expect(page.locator('.suggestion-box')).toBeHidden()
    await expect(page.locator('.footer-nav')).toBeHidden()
    await expect(page.locator('#calendarBox')).toHaveAttribute('open', '')

    await page.locator('.calendar-box summary').click()

    await expect(page.locator('.suggestion-box')).toBeVisible()
    await expect(page.locator('.footer-nav')).toBeVisible()
    await expect(page.locator('#calendarBox')).not.toHaveAttribute('open', '')
})

test('opening the suggestion box also hides the back-to-top button', async ({
    page,
}) => {
    await page.goto('/friends/')
    await page.evaluate(() => window.scrollTo(0, 2000))
    await expect(page.locator('#backToTop')).toBeVisible()

    await page.locator('#suggestionBox summary').click()
    await expect(page.locator('#backToTop')).toBeHidden()

    await page.locator('#suggestionBox summary').click()
    await expect(page.locator('#backToTop')).toBeVisible()
})

test('suggestion form shows inline confirmation without navigating', async ({
    page,
}) => {
    await page.goto('/friends/')
    await page.locator('#suggestionBox summary').click()

    // Netlify intercepts the real POST; mock it so the test is self-contained
    await page.route('/', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 200 })
        } else {
            await route.continue()
        }
    })

    await page.fill('#suggestionMessage', 'Test suggestion')
    await page.click('.suggestion-submit')

    // Should stay on the same page
    expect(page.url()).toContain('/friends')

    // Form replaced by confirmation message
    await expect(page.locator('.suggestion-thanks')).toBeVisible()
    await expect(page.locator('form[name="suggest"]')).not.toBeAttached()
    // Send lives outside the form (associated via the form= attribute)
    // so it needs its own explicit removal on success
    await expect(page.locator('.suggestion-submit')).not.toBeAttached()
})

test('suggestion form shows an error message on a failed submission', async ({
    page,
}) => {
    await page.goto('/friends/')
    await page.locator('#suggestionBox summary').click()

    await page.route('/', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 500 })
        } else {
            await route.continue()
        }
    })

    await page.fill('#suggestionMessage', 'Test suggestion')
    await page.click('.suggestion-submit')

    await expect(page.locator('.suggestion-error')).toBeVisible()
    await expect(page.locator('.suggestion-error')).toContainText('Try again')
    await expect(page.locator('form[name="suggest"]')).toBeAttached()
})

test('suggestion form shows a connection error message on a network failure', async ({
    page,
}) => {
    await page.goto('/friends/')
    await page.locator('#suggestionBox summary').click()

    await page.route('/', async (route) => {
        if (route.request().method() === 'POST') {
            await route.abort()
        } else {
            await route.continue()
        }
    })

    await page.fill('#suggestionMessage', 'Test suggestion')
    await page.click('.suggestion-submit')

    await expect(page.locator('.suggestion-error')).toBeVisible()
    await expect(page.locator('.suggestion-error')).toContainText('connection')
})

test('suggestion box character counter updates as the user types', async ({
    page,
}) => {
    await page.goto('/friends/')
    await page.locator('#suggestionBox summary').click()

    await page.fill('#suggestionMessage', 'a'.repeat(10))
    await expect(page.locator('#suggestionHint')).toContainText('130')
})

test('/events.ics returns a valid calendar feed', async ({ request }) => {
    const response = await request.get('/events.ics')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/calendar')

    const body = await response.text()
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('BEGIN:VEVENT')
    expect(body).toContain('SUMMARY:')
})

test('/llms.txt returns plain text with expected content', async ({
    request,
}) => {
    const response = await request.get('/llms.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
    expect(await response.text()).toContain('# Queer Omaha')
})

test('/robots.txt returns plain text with sitemap and content signals', async ({
    request,
}) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
    const body = await response.text()
    expect(body).toContain('Sitemap:')
    expect(body).toContain('Content-Signal:')
})

test('item cards emit valid Organization JSON-LD', async ({ page }) => {
    await page.goto('/cafes/')
    // ItemCard.astro emits the <script> as a preceding sibling of its
    // <wa-card>, not a child, so scope by adjacency rather than nesting.
    const scripts = page.locator(
        'script[type="application/ld+json"]:has(+ wa-card.item)',
    )
    const count = await scripts.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
        const raw = await scripts.nth(i).innerHTML()
        const data = JSON.parse(raw)
        expect(data['@type']).toBe('Organization')
        expect(typeof data.name).toBe('string')
        expect(data.name.length).toBeGreaterThan(0)
    }
})

test('links are ordered calendar > instagram > discord > website > facebook', async ({
    page,
}) => {
    // Search a few card-heavy categories for an entry with both an
    // instagram and a facebook link, rather than hardcoding a specific
    // business — content changes independently of this test.
    let found = false
    for (const path of ['/music/', '/makers/', '/friends/', '/cafes/']) {
        await page.goto(path)
        const lists = page.locator('ul.entry-links')
        const listCount = await lists.count()
        for (let i = 0; i < listCount; i++) {
            const list = lists.nth(i)
            const instaIndex = await list
                .locator('li:has(wa-icon[name="instagram"])')
                .count()
            const fbIndex = await list
                .locator('li:has(wa-icon[name="facebook"])')
                .count()
            if (instaIndex === 0 || fbIndex === 0) continue

            const iconNames = await list
                .locator('li wa-icon')
                .evaluateAll((els) => els.map((el) => el.getAttribute('name')))
            const instaPos = iconNames.indexOf('instagram')
            const fbPos = iconNames.indexOf('facebook')
            expect(instaPos).toBeGreaterThanOrEqual(0)
            expect(fbPos).toBeGreaterThan(instaPos)
            found = true
            break
        }
        if (found) break
    }
    expect(
        found,
        'no card with both an instagram and a facebook link was found to test ordering against',
    ).toBe(true)
})

test('an unavailable tag pill is disabled and marked unavailable', async ({
    page,
}) => {
    await page.goto('/art/')

    const visibleCards = page.locator('wa-card.item:not([hidden])')
    const cardCount = await visibleCards.count()
    expect(cardCount).toBeGreaterThan(0)

    const presentTags = new Set()
    for (let i = 0; i < cardCount; i++) {
        const tags = (await visibleCards.nth(i).getAttribute('data-tags')) || ''
        for (const t of tags.split(' ').filter(Boolean)) presentTags.add(t)
    }

    const tagPills = page.locator('.filter-pill[data-filter-type="tag"]')
    const pillCount = await tagPills.count()
    let unavailableSlug = null
    for (let i = 0; i < pillCount; i++) {
        const slug = await tagPills.nth(i).getAttribute('data-filter')
        if (slug && !presentTags.has(slug)) {
            unavailableSlug = slug
            break
        }
    }
    expect(
        unavailableSlug,
        'no absent tag found on /art/ to test unavailability against',
    ).not.toBeNull()

    const pill = page.locator(`[data-filter="${unavailableSlug}"]`)
    await expect(pill).toHaveClass(/unavailable/)
    await expect(pill).toBeDisabled()
})

test('re-clicking the active category pill is a no-op', async ({ page }) => {
    await page.goto('/spiritual/')
    const tag = page.locator('[data-filter="neutral-bathrooms"]')
    await tag.click()
    await expect(tag).toHaveClass(/active/)

    await page.locator('[data-filter="spiritual"]').click()

    await expect(page).toHaveURL(/\/spiritual\/?$/)
    await expect(tag).toHaveClass(/active/)
})

test('back-to-top button appears on scroll and returns to the top', async ({
    page,
}) => {
    await page.goto('/friends/')
    const button = page.locator('#backToTop')

    await page.evaluate(() => window.scrollTo(0, 2000))
    await expect(button).toHaveClass(/show/)

    await button.click()
    await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeLessThan(50)
})

test('tapping a card rewrites the URL to its permalink and marks it active', async ({
    page,
}) => {
    await page.goto('/friends/')
    const card = page.locator('#friends-o4us')
    await card.locator('.item-tap-target').click()

    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends/o4us')
    await expect(card).toHaveClass(/item-active/)
    await expect(card.locator('.item-tap-target')).toHaveAttribute(
        'aria-pressed',
        'true',
    )
})

test('tapping an active card again reverts to the category URL', async ({
    page,
}) => {
    await page.goto('/friends/')
    const card = page.locator('#friends-o4us')
    await card.locator('.item-tap-target').click()
    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends/o4us')

    await card.locator('.item-tap-target').click()

    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends')
    await expect(card).not.toHaveClass(/item-active/)
    await expect(card.locator('.item-tap-target')).toHaveAttribute(
        'aria-pressed',
        'false',
    )
})

test('clicking a link inside a card navigates instead of toggling it', async ({
    page,
    context,
}) => {
    await page.goto('/friends/')
    const card = page.locator('#friends-o4us')
    const link = card.getByRole('link', { name: /Events Calendar/ })

    const [popup] = await Promise.all([
        context.waitForEvent('page'),
        link.click(),
    ])
    await popup.close()

    await expect(page).toHaveURL(/\/friends\/?$/)
    await expect(card).not.toHaveClass(/item-active/)
})

test('activating a card via keyboard (Enter) toggles it the same as a click', async ({
    page,
}) => {
    await page.goto('/friends/')
    const card = page.locator('#friends-o4us')
    const tapTarget = card.locator('.item-tap-target')
    await tapTarget.focus()
    await tapTarget.press('Enter')

    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends/o4us')
    await expect(card).toHaveClass(/item-active/)

    await tapTarget.press(' ')

    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends')
    await expect(card).not.toHaveClass(/item-active/)
})

test('clicking a different card while one is active switches directly', async ({
    page,
}) => {
    await page.goto('/friends/')
    const first = page.locator('#friends-o4us')
    await first.locator('.item-tap-target').click()
    await expect(first).toHaveClass(/item-active/)

    const other = page
        .locator('wa-card.item[data-category="friends"]:not(#friends-o4us)')
        .first()
    await other.locator('.item-tap-target').click()

    await expect(first).not.toHaveClass(/item-active/)
    await expect(other).toHaveClass(/item-active/)
    const otherSlug = await other.getAttribute('data-slug')
    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe(`/friends/${otherSlug}`)
})

test('back-to-top reverts an active card permalink to the category URL', async ({
    page,
}) => {
    await page.goto('/friends/')
    await page.locator('#friends-o4us').locator('.item-tap-target').click()
    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends/o4us')

    // Scroll deep so #backToTop clears its visibility threshold (see the
    // pre-existing "back-to-top button appears on scroll" test).
    await page.evaluate(() => window.scrollTo(0, 2000))
    const button = page.locator('#backToTop')
    await expect(button).toHaveClass(/show/)
    await button.click()

    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends')
    await expect(page.locator('#friends-o4us')).not.toHaveClass(/item-active/)
})

test('landing directly on an item permalink scrolls it into view and marks it active', async ({
    page,
}) => {
    await page.goto('/friends/o4us/')
    const card = page.locator('#friends-o4us')

    await expect(card).toHaveClass(/item-active/)
    await expect(card.locator('.item-tap-target')).toHaveAttribute(
        'aria-pressed',
        'true',
    )
    await expect
        .poll(async () => {
            const box = await card.boundingBox()
            return box?.y ?? Number.NaN
        })
        .toBeGreaterThanOrEqual(0)
})

test('item permalink active state still applies under prefers-reduced-motion', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/friends/o4us/')
    const card = page.locator('#friends-o4us')

    await expect(card).toHaveClass(/item-active/)
})

test('switching category while a card is active clears its active state', async ({
    page,
}) => {
    await page.goto('/friends/')
    const card = page.locator('#friends-o4us')
    await card.locator('.item-tap-target').click()
    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/friends/o4us')

    await page.locator('[data-filter="cafes"]').click()

    await expect
        .poll(() => page.evaluate(() => location.pathname))
        .toBe('/cafes')
    await expect(card).not.toHaveClass(/item-active/)
})
