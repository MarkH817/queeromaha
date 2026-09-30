import { GET as filtersGET } from './[...filters].md'

// Astro emits the empty-param route of `[...filters].md.ts` as the dotfile
// `dist/.md`, which Netlify won't serve. This gives the root a real
// `dist/index.md` for the markdown-negotiation edge function to rewrite to.
export const GET = () => filtersGET({ params: {} })
