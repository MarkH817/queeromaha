import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const pages = [
    '/',
    '/about/',
    '/music/',
    '/cafes/',
    '/art/',
    '/spiritual/',
    '/makers/',
]

for (const path of pages) {
    test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path)
        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations).toEqual([])
    })
}

test('an activated item card has no axe violations', async ({ page }) => {
    await page.goto('/friends/')
    await page.locator('#friends-o4us .item-tap-target').click()
    await expect(page.locator('#friends-o4us')).toHaveClass(/item-active/)

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
})
