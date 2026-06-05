# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run serve          # dev server at localhost:8080 with hot-reload
bun run serve:cms      # Decap CMS local proxy at /admin
bun run build          # build static site to _site/

bun run lint           # check formatting (staged files only)
bun run format         # auto-fix formatting

bun test               # all tests: unit + Playwright e2e
bun run test:unit      # unit tests only (data + build)
bun run test:data      # data validation only (fastest, no build)
bun run test:e2e       # Playwright e2e only (requires built _site/)
```

Husky hooks: lint must pass on pre-commit; all tests must pass on pre-push.

## Architecture

Static site built with **11ty** (Eleventy), deployed to Netlify. Content is managed via **Decap CMS** (headless CMS that edits the YAML front matter). The single layout (`src/_includes/layouts/base.njk`) renders everything.

### Content model

All directory pages (`src/*.md`) store their data as YAML front matter `items` arrays. Two entry types:

- `type: section` — heading divider with `label` (display text) and `id` (anchor)
- `type: item` — a directory card with:
  - `name` (required string)
  - `public: false` — hides the entry from builds (never appears in `_site`)
  - `description` — rendered as markdown
  - `tags` — array of keys from `src/_data/tagMap.json`; each maps to an emoji + accessible label
  - `links` — array of `{ label, url }`

`src/src.11tydata.cjs` applies globally: items with `public: false` are excluded from 11ty collections and get no permalink.

### Data files

- `src/_data/tagMap.json` — canonical tag registry (emoji + label); all `tags` in content must reference a key here
- `src/_data/footerMessages.json` — rotating footer messages
- `src/_data/site.json` — site-wide config (URL, title)

### Tests

- `test/data.test.js` — validates front matter structure and tag references against `tagMap.json` without a build
- `test/build.test.js` — runs `eleventy` and checks `_site/` output exists and contains expected files
- `test/e2e/site.spec.js` — Playwright tests that serve `_site/` on port 4242 and verify page loads, nav, and link attributes
