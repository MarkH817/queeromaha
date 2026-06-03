import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4242',
  },
  webServer: {
    command: 'bunx serve _site -l 4242 -n',
    url: 'http://localhost:4242',
    reuseExistingServer: false,
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
