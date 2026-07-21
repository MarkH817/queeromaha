export async function GET() {
    const body = `# Queer Omaha

> Community-maintained directory of queer-friendly spaces, events, and resources in Omaha, Nebraska. Anyone can contribute via GitHub.

## Pages

- [Queer Omaha Directory](https://queeromaha.net/): Full directory of queer groups, venues, cafes, music, art, and spiritual spaces in Omaha.
- [Privacy Policy](https://queeromaha.net/privacy): What data is collected (cookieless PostHog analytics, form submissions) and why.
- [Contact](https://queeromaha.net/contact): Get in touch directly, beyond the footer Suggestion Box.

## Suggesting an addition

A "Suggestion Box" form is present in the footer of every page (expand
it to submit a place, group, or event to add). For anything beyond a
single suggestion, use the GitHub repo:
[taraxvoid/queeromaha](https://github.com/taraxvoid/queeromaha).

This file is advertised via an HTTP \`Link: </llms.txt>; rel="service-doc"\` response header.
`
    return new Response(body, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
