import { expect, test } from '@playwright/test'

const pages = [
    { path: '/friends/', titleContains: 'Queer' },
    { path: '/about/', titleContains: 'About' },
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

test('clear button clears active tags', async ({ page }) => {
    await page.goto('/cafes/')
    const tag = page.locator('[data-filter="neutral-bathrooms"]')
    const clearBtn = page.locator('#filterClear')

    await tag.click()
    await expect(clearBtn).toBeEnabled()

    await clearBtn.click()
    await expect(tag).not.toHaveClass(/active/)
    await expect(clearBtn).toBeDisabled()
})

test('footer elements render correctly', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto('/friends/')
    const footerText = page.locator('.footer-text')
    const footerMessage = page.locator('.footer-message')

    // message is hidden when it would overflow on narrow screens
    await expect(async () => {
        const hidden = await footerText.isHidden()
        if (!hidden) {
            const overflowing = await footerMessage.evaluate(
                (el) => el.scrollWidth > el.clientWidth,
            )
            expect(overflowing).toBe(false)
        }
    }).toPass()

    // calendar link and footer nav remain visible regardless
    await expect(page.locator('.footer-cal a')).toBeVisible()
    await expect(
        page.locator('.footer-nav a[href="/about#suggest"]'),
    ).toBeVisible()
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

test('suggestion form shows inline confirmation without navigating', async ({
    page,
}) => {
    await page.goto('/about/')

    // Netlify intercepts the real POST; mock it so the test is self-contained
    await page.route('/', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 200 })
        } else {
            await route.continue()
        }
    })

    await page.fill('textarea[name="message"]', 'Test suggestion')
    await page.click('button[type="submit"]')

    // Should stay on the about page
    expect(page.url()).toContain('/about')

    // Form replaced by confirmation message
    await expect(page.locator('#suggest-thanks')).toBeVisible()
    await expect(page.locator('form[name="suggest"]')).not.toBeAttached()
})

test('suggestion form shows an error message on a failed submission', async ({
    page,
}) => {
    await page.goto('/about/')

    await page.route('/', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 500 })
        } else {
            await route.continue()
        }
    })

    await page.fill('textarea[name="message"]', 'Test suggestion')
    await page.click('button[type="submit"]')

    await expect(page.locator('#suggest-error')).toBeVisible()
    await expect(page.locator('#suggest-error')).toContainText('Try again')
    await expect(page.locator('form[name="suggest"]')).toBeAttached()
})

test('suggestion form shows a connection error message on a network failure', async ({
    page,
}) => {
    await page.goto('/about/')

    await page.route('/', async (route) => {
        if (route.request().method() === 'POST') {
            await route.abort()
        } else {
            await route.continue()
        }
    })

    await page.fill('textarea[name="message"]', 'Test suggestion')
    await page.click('button[type="submit"]')

    await expect(page.locator('#suggest-error')).toBeVisible()
    await expect(page.locator('#suggest-error')).toContainText('connection')
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

test('landing directly on /about/#suggest scrolls the section under the sticky header', async ({
    page,
}) => {
    await page.goto('/about/#suggest')
    await page.evaluate(() =>
        Promise.all([
            customElements.whenDefined('wa-button'),
            customElements.whenDefined('wa-icon'),
        ]),
    )

    const headerHeight = await page.evaluate(() =>
        Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
                '--header-height',
            ),
        ),
    )

    await expect
        .poll(async () => {
            const box = await page.locator('#suggest').boundingBox()
            return box?.y ?? Number.NaN
        })
        .toBeLessThan(headerHeight + 50)
})
