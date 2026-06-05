# queeromaha.net

[![Netlify Status](https://api.netlify.com/api/v1/badges/eb46506c-ce32-4485-ae05-ae4872ac953c/deploy-status)](https://app.netlify.com/projects/queeromaha/deploys)

Directory of queer/trans groups, venues and spaces in Omaha.

## Dependencies

- A working \*nix shell
- [Bun](https://bun.sh/) as drop-in Node interpreter replacement, package manager and test runner

## Stack

- [11ty](https://www.11ty.dev/) — static site generator
- [Decap CMS](https://decapcms.org/) — content management
- (optional) [Netlify CLI](https://docs.netlify.com/cli/get-started/) for managing live deployment

## Local Dev

Run locally with hot-reloading

```
bun install --development
bun run build # 11ty output to _site
bun run serve # local 11ty server at localhost:8080
bun run serve:cms # local decapCMS at /admin
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

Husky requires tests to pass on pre/push. Please add tests for significant changes.

```
bun run test # unit tests + Playwright
```

### CMS

DecapCMS is backed by [DecapBridge](https://decapbridge.com/) as Netlify Identity is deprecated. This is attached to @taraxvoid 's Google account currently. 

Users can be invited via email (inclusion Google SSO) to edit content at [the CMS admin panel](https://queeromaha.net/admin)
