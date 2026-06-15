export async function GET() {
  const body = `# Queer Omaha

> Community-maintained directory of queer-friendly spaces, events, and resources in Omaha, Nebraska. Anyone can contribute via GitHub.

## Pages

- [Queer Omaha Directory](https://queeromaha.net/): Full directory of queer groups, venues, cafes, music, art, and spiritual spaces in Omaha.
- [About](https://queeromaha.net/about): About the project and how to get in touch / contact admins and site owners.

This file is advertised via an HTTP \`Link: </llms.txt>; rel="service-doc"\` response header.
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
