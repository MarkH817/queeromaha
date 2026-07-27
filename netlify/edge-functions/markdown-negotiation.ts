import type { Context } from '@netlify/edge-functions'

// Any request path ending in a real file extension (images, .xml, .txt,
// .ico, the .md files themselves, etc.) is served as-is — content
// negotiation only applies to the HTML directory/permalink pages, whose
// paths never contain a dot.
const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/

export default async (request: Request, context: Context) => {
    const accept = request.headers.get('accept') ?? ''
    const url = new URL(request.url)

    if (!accept.includes('text/markdown') || HAS_EXTENSION.test(url.pathname)) {
        return context.next()
    }

    // Every HTML page built by `src/pages/[...filters].astro` has a
    // markdown counterpart pre-built by `src/pages/[...filters].md.ts` at
    // the same path with `.md` appended (including the root page, which
    // Astro emits as `dist/.md`).
    const markdownUrl = new URL(`${url.pathname}.md`, url)
    return context.rewrite(markdownUrl)
}

export const config = { path: '/*' }
