# queeromaha.net

[![Netlify Status](https://api.netlify.com/api/v1/badges/eb46506c-ce32-4485-ae05-ae4872ac953c/deploy-status)](https://app.netlify.com/projects/queeromaha/deploys)

The place for queer spaces in Omaha.

## Stack

- [11ty](https://www.11ty.dev/) — static site generator
- [Decap CMS](https://decapcms.org/) — content management
- [Netlify](https://netlify.com/) — hosting and deploys
- [Bun](https://bun.sh/) — package manager and test runner

## Development

```sh
bun install
bun run serve        # local dev server with live reload
bun run serve:cms    # run local Decap CMS proxy (for local content editing)
```

Or use the [Netlify CLI](https://docs.netlify.com/cli/get-started/) to emulate the full Netlify environment locally (redirects, headers, etc.):

```sh
bun install -g netlify-cli
netlify login
netlify dev
```

## Testing

```sh
bun test             # unit tests + Playwright e2e tests
```

## Build

```sh
bun run build        # output to _site/
```

## Code Style

```sh
bun run lint         # check formatting
bun run fix          # auto-fix formatting
```
