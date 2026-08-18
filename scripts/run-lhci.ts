#!/usr/bin/env bun
/*
 * Opt-in Lighthouse CI smoke test.
 *
 * Runs Lighthouse (SEO category) against a few representative built pages and
 * asserts the SEO best-practice audits pass. Uses the Chromium that Playwright
 * already installed (no extra Chrome download required).
 *
 * NOTE: Lighthouse's `structured-data` audit is `scoreDisplayMode: "manual"`,
 * so it is NOT asserted here — it cannot pass/fail programmatically. For real
 * Rich-Results/structured-data validation, see the JSON-LD unit test in
 * test/structured-data.test.ts and Google's Rich Results Test (external).
 *
 * Usage:  bun run test:e2e:lighthouse
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const CONFIG = join(ROOT, '.lighthouserc.json')
const DIST = join(ROOT, 'dist')

if (!existsSync(DIST)) {
    console.error('✖ dist/ not found — run `bun run build` first.')
    process.exit(2)
}

// Reuse Playwright's Chromium so we don't pull a second Chrome.
function findPlaywrightChromium(): string | null {
    const base = join(homedir(), '.cache', 'ms-playwright')
    if (!existsSync(base)) return null
    for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        for (const rel of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
            const candidate = join(base, entry.name, rel)
            if (existsSync(candidate)) return candidate
        }
    }
    return null
}

const chrome = findPlaywrightChromium()
const env: Record<string, string | undefined> = { ...process.env }
if (chrome) {
    env.CHROME_PATH = chrome
    env.PUPPETEER_EXECUTABLE_PATH = chrome
    console.log(`▸ Using Chromium: ${chrome}`)
} else {
    console.log(
        '▸ No Playwright Chromium found; relying on system Chrome lookup.',
    )
}

function runLhci(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn('bunx', ['lhci', ...args, '--config', CONFIG], {
            cwd: ROOT,
            env,
            stdio: 'inherit',
        })
        child.on('error', reject)
        child.on('close', (code) =>
            code === 0
                ? resolve()
                : reject(
                      new Error(
                          `lhci ${args.join(' ')} exited with code ${code}`,
                      ),
                  ),
        )
    })
}

;(async () => {
    try {
        await runLhci(['collect'])
        // assert reads the reports just written to .lighthouseci/
        await runLhci(['assert', '--includePassedAssertions'])
        console.log('\n✅ Lighthouse CI checks passed')
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('\n✖ Lighthouse CI failed:', msg)
        process.exit(1)
    }
})()
