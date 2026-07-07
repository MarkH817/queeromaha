import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './test/e2e',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:4242',
        serviceWorkers: 'block',
    },
    webServer: {
        command: 'bun run preview --port 4242',
        url: 'http://localhost:4242',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
    projects: [
        {
            name: 'chromium',
            use: devices['Desktop Chrome'],
        },
    ],
})
