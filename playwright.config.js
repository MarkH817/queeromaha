import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './test/e2e',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:4242',
    },
    webServer: {
        command: 'bunx serve dist -l 4242 -n',
        url: 'http://localhost:4242',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
})
