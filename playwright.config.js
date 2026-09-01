import { createServer } from 'node:net'
import { defineConfig, devices } from '@playwright/test'

// Multiple worktrees of this repo run tests concurrently, so a fixed port
// causes collisions (or worse, one worktree's Playwright run silently
// reusing another worktree's already-running preview server). Outside CI,
// where only one job ever binds the port, ask the OS for a free one instead.
async function getFreePort() {
    return new Promise((resolve, reject) => {
        const srv = createServer()
        srv.unref()
        srv.on('error', reject)
        srv.listen(0, () => {
            const { port } = srv.address()
            srv.close(() => resolve(port))
        })
    })
}

// Config is reloaded independently in the runner and in each worker
// process; without caching, each reload would race for its own free port
// and workers would end up pointed at a different port than the server.
if (!process.env.CI && !process.env.PLAYWRIGHT_TEST_PORT) {
    process.env.PLAYWRIGHT_TEST_PORT = String(await getFreePort())
}
const PORT = process.env.CI ? 4242 : process.env.PLAYWRIGHT_TEST_PORT
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
    testDir: './test/e2e',
    timeout: 30_000,
    fullyParallel: true,
    use: {
        baseURL,
        serviceWorkers: 'block',
    },
    webServer: {
        command: `bun run preview --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        // Astro auto-backgrounds `astro preview` when it detects an agentic
        // environment (e.g. Claude Code), which makes Playwright think the
        // server process exited early. Force foreground mode.
        env: { ASTRO_PREVIEW_BACKGROUND: 'false' },
    },
    projects: [
        {
            name: 'mobile-chrome',
            use: devices['Pixel 7'],
        },
        {
            name: 'desktop-chrome',
            use: devices['Desktop Chrome'],
        },
    ],
})
