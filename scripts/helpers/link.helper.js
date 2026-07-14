// @ts-check
/**
 * @param {string} url
 */
export function getHost(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return ''
    }
}

/**
 * Domains that block crawlers regardless of page status - skip dead-link
 * classification to avoid false positives
 */
export const SKIP_DOMAINS = [
    'facebook.com',
    'synthomaha.net',
    'soundryomaha.org',
    'm.facebook.com',
    'fb.com',
    'linkedin.com',
    'fifthhouseomaha.com',
]

/**
 * @param {string} url
 */
export function isSkipDomain(url) {
    const h = getHost(url)
    return SKIP_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`))
}

/**
 * Detects when a URL with a real path redirected to its bare domain root,
 * e.g. instagram.com/someuser → instagram.com/ (profile was deleted)
 * @param {string} originalUrl
 * @param {string} finalUrl
 */
export function isSuspiciousRedirect(originalUrl, finalUrl) {
    try {
        const o = new URL(originalUrl)
        const f = new URL(finalUrl)
        if (o.hostname !== f.hostname) return false
        const origPath = o.pathname.replace(/\/$/, '')
        const finalPath = f.pathname.replace(/\/$/, '')
        return origPath.length > 1 && finalPath === ''
    } catch {
        return false
    }
}
