import { expect, test } from '@playwright/test'

const pages = [
    { path: '/', titleContains: 'Queer' },
    { path: '/about/', titleContains: 'About' },
    { path: '/contact/', titleContains: 'About' },
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
    await page.goto('/')
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
    await page.goto('/')
    expect(errors).toHaveLength(0)
})

test('skip-to-main link is present', async ({ page }) => {
    await page.goto('/')
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
    await page.goto('/')
    await expect(page.getByRole('contentinfo')).toBeVisible()
})

test('filter pills are present on home page', async ({ page }) => {
    await page.goto('/')
    const pills = page.locator('.filter-pill')
    expect(await pills.count()).toBeGreaterThan(0)
})

test('/spiritual pre-activates the spiritual filter pill', async ({ page }) => {
    await page.goto('/spiritual/')
    const pill = page.locator('[data-filter="spiritual"]')
    await expect(pill).toHaveClass(/active/)
})

test('neighborhood filter pills render on the home page', async ({ page }) => {
    await page.goto('/')
    const pills = page.locator('[data-filter-type="neighborhood"]')
    expect(await pills.count()).toBeGreaterThan(0)
})

test('/west-o pre-activates the west-o neighborhood pill', async ({ page }) => {
    await page.goto('/west-o/')
    const pill = page.locator('[data-filter="west-o"]')
    await expect(pill).toHaveClass(/active/)
})

test('clicking a neighborhood pill filters cards by data-neighborhood', async ({
    page,
}) => {
    await page.goto('/cafes/')
    const cards = page.locator('wa-card.item[data-category="cafes"]')
    const totalCount = await cards.count()
    expect(totalCount).toBeGreaterThan(0)

    await page.locator('[data-filter="west-o"]').click()

    const visibleCards = cards.filter({
        hasNot: page.locator(':scope[hidden]'),
    })
    const visibleCount = await visibleCards.count()
    expect(visibleCount).toBeGreaterThan(0)
    expect(visibleCount).toBeLessThan(totalCount)
    for (let i = 0; i < visibleCount; i++) {
        expect(
            await visibleCards.nth(i).getAttribute('data-neighborhood'),
        ).toBe('west-o')
    }
})

test('combining category and neighborhood pills narrows results', async ({
    page,
}) => {
    await page.goto('/')
    await page.locator('[data-filter="cafes"]').click()
    await page.locator('[data-filter="west-o"]').click()

    const visibleCards = page.locator('wa-card.item:not([hidden])')
    const count = await visibleCards.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
        const card = visibleCards.nth(i)
        expect(await card.getAttribute('data-category')).toBe('cafes')
        expect(await card.getAttribute('data-neighborhood')).toBe('west-o')
    }
})

test('location bar renders as a single-select segmented bar', async ({
    page,
}) => {
    await page.goto('/')
    const bar = page.locator('.location-bar')
    await expect(bar).toBeVisible()
    const segments = bar.locator('.location-segment')
    expect(await segments.count()).toBeGreaterThan(0)
})

test('clicking a different location segment switches directly without deactivating the first', async ({
    page,
}) => {
    await page.goto('/cafes/')
    const westO = page.locator('[data-filter="west-o"]')
    const midtown = page.locator('[data-filter="midtown"]')

    await westO.click()
    await expect(westO).toHaveClass(/active/)
    await expect(page).toHaveURL(/\/cafes\/west-o\/?$/)

    await midtown.click()
    await expect(midtown).toHaveClass(/active/)
    await expect(westO).not.toHaveClass(/active/)
    await expect(page).toHaveURL(/\/cafes\/midtown\/?$/)
})

test('tapping the active location segment again deselects it back to all locations', async ({
    page,
}) => {
    await page.goto('/cafes/')
    const westO = page.locator('[data-filter="west-o"]')

    await westO.click()
    await expect(westO).toHaveClass(/active/)

    await westO.click()
    await expect(westO).not.toHaveClass(/active/)
    await expect(page).toHaveURL(/\/cafes\/?$/)
})

test('an unavailable location segment is disabled and not clickable', async ({
    page,
}) => {
    await page.goto('/art/')
    const westO = page.locator('[data-filter="west-o"]')
    await expect(westO).toBeDisabled()
    await expect(westO).toHaveClass(/unavailable/)
})

test('switching top-level category clears the active location and tags', async ({
    page,
}) => {
    await page.goto('/art/')
    const benson = page.locator('[data-filter="benson"]')
    const tag = page.locator('[data-filter="neutral-bathrooms"]')

    await benson.click()
    await tag.click()
    await expect(benson).toHaveClass(/active/)
    await expect(tag).toHaveClass(/active/)

    await page.locator('[data-filter="cafes"]').click()
    await expect(page).toHaveURL(/\/cafes\/?$/)
    await expect(benson).not.toHaveClass(/active/)
    await expect(tag).not.toHaveClass(/active/)
})

test('clear button only clears tags, leaving the active location untouched', async ({
    page,
}) => {
    await page.goto('/cafes/')
    const westO = page.locator('[data-filter="west-o"]')
    const tag = page.locator('[data-filter="neutral-bathrooms"]')
    const clearBtn = page.locator('#filterClear')

    await westO.click()
    await tag.click()
    await expect(clearBtn).toBeEnabled()

    await clearBtn.click()
    await expect(tag).not.toHaveClass(/active/)
    await expect(westO).toHaveClass(/active/)
    await expect(clearBtn).toBeDisabled()
})

test('footer elements render correctly', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto('/')
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
    await page.goto('/')
    const footerText = page.locator('.footer-text')
    const footerMessage = page.locator('.footer-message')

    await expect(footerText).toBeVisible()
    const overflowing = await footerMessage.evaluate(
        (el) => el.scrollWidth > el.clientWidth,
    )
    expect(overflowing).toBe(false)
})

test('tag filter pills use wa-icon elements', async ({ page }) => {
    await page.goto('/')
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

test('location with street and neighborhood renders hyphen-separated on one line', async ({
    page,
}) => {
    await page.goto('/cafes/')
    // Roast Coffeehouse has street "120th and Blondo" + neighborhood "West O"
    const loc = page
        .locator('.item-location')
        .filter({ hasText: '120th and Blondo' })
    await expect(loc).toContainText('120th and Blondo - West O')
})

test('neighborhood segment order is stable after switching categories', async ({
    page,
}) => {
    await page.goto('/')
    const getOrder = () =>
        page
            .locator('.location-segment')
            .evaluateAll((els) => els.map((el) => el.dataset.filter))
    const initialOrder = await getOrder()
    expect(initialOrder.length).toBeGreaterThan(0)

    await page.locator('[data-filter="cafes"]').click()
    expect(await getOrder()).toEqual(initialOrder)

    await page.locator('[data-filter="art"]').click()
    expect(await getOrder()).toEqual(initialOrder)
})
