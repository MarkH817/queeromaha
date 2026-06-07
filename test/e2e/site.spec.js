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
  await expect(page.locator('footer')).toBeVisible()
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
