# queeromaha.net

[![Netlify Status](https://api.netlify.com/api/v1/badges/eb46506c-ce32-4485-ae05-ae4872ac953c/deploy-status)](https://app.netlify.com/projects/queeromaha/deploys)

Directory of queer/trans groups, venues and spaces in Omaha.

## Dependencies

- A working \*nix shell
- [Bun](https://bun.sh/) as drop-in Node interpreter replacement, package manager and test runner
- (optional) [volta](https://volta.sh/) for node ver wrangling
- (optional) [Netlify CLI](https://docs.netlify.com/cli/get-started/) for managing live deployment


## Stack

- [Astro](https://astro.build/) — static site generator
- [Biome](https://biomejs.dev/) - lint

## Local Dev

Run Astro locally with hot-reloading

```
bun install --development
bun run serve # astro server at localhost:4321

# alternatively
bun run dev
```

### Deployment

PRs create a preview branch on Netlify.

The live site auto-deploys on pushes to `main`

Manual deployment

```
bun install -g netlify-cli
netlify login
netlify deploy
```

### Code Style

Husky requires lint to pass on pre-commit.

```
bun run lint # check formatting of staged files
bun run format # auto-fix formatting
```

### Tests

Husky requires tests to pass on pre-push. Please add tests for significant changes.

```
bun run test # unit tests + Playwright
```
