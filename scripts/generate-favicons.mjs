import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { favicons } from 'favicons'

const source = readFileSync('./public/favicon.svg')
const dest = './public'

const response = await favicons(source, {
    path: '/',
    appName: 'Queer Omaha',
    appShortName: 'Queer Omaha',
    appDescription:
        'Community-maintained directory of queer groups, spaces, and resources in Omaha, Nebraska.',
    background: '#f6f0fa',
    theme_color: '#4c3170',
    icons: {
        android: true,
        appleIcon: true,
        appleStartup: false,
        favicons: true,
        windows: false,
        yandex: false,
    },
})

for (const image of response.images) {
    writeFileSync(join(dest, image.name), image.contents)
    console.log('wrote', image.name)
}
for (const file of response.files) {
    writeFileSync(join(dest, file.name), file.contents)
    console.log('wrote', file.name)
}
console.log('\nRecommended <head> tags:')
for (const tag of response.html) console.log(tag)
