/// <reference types='vitest/config' />
import { getViteConfig } from 'astro/config'
import site from './src/data/site.json' with { type: 'json' }

export default getViteConfig(
    { test: { exclude: ['**/node_modules/**', '**/.git/**', '**/e2e/**'] } },
    { site: site.url },
)
