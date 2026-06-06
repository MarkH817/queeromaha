export async function GET() {
  const body = `# Queer Omaha

> Community-maintained directory of queer-friendly spaces, events, and resources in Omaha, Nebraska. Anyone can contribute via GitHub.

## Pages

- [Queer Omaha Directory](https://queeromaha.net/): Full directory of queer groups, venues, cafes, music, art, and spiritual spaces in Omaha.
- [About](https://queeromaha.net/about): About the Queer Omaha project.
- [Contact](https://queeromaha.net/contact): Get in touch with the Queer Omaha project.
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
