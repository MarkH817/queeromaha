// Maps an HTML page path to its pre-built markdown counterpart. The root
// page can't use `${pathname}.md` (that's the dotfile `/.md`, which Netlify
// doesn't serve), so it gets an explicit `index.md`.
export function markdownPathFor(pathname: string): string {
    return pathname === '/' ? '/index.md' : `${pathname}.md`
}
