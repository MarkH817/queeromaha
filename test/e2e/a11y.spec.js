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
