import { expect, test } from '@playwright/test'

const pages = [
  { path: '/', titleContains: 'Queer' },
  { path: '/about/', titleContains: 'About' },
  { path: '/music/', titleContains: 'Music' },
  { path: '/cafes/', titleContains: 'Cafe' },
  { path: '/art/', titleContains: 'Art' },
  { path: '/makers/', titleContains: 'Maker' },
  { path: '/contact/', titleContains: 'Contact' },
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
