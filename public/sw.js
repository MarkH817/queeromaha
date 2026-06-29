const CACHE = 'qo-v1'
const PRECACHE = ['/', '/about', '/contact', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
    self.skipWaiting()
})

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== CACHE)
                        .map((k) => caches.delete(k)),
                ),
            ),
    )
    self.clients.claim()
})

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url)
    // Cache-first for hashed Astro assets (safe to cache forever)
    if (url.pathname.startsWith('/_astro/')) {
        e.respondWith(
            caches.match(e.request).then(
                (r) =>
                    r ??
                    fetch(e.request).then((res) => {
                        caches
                            .open(CACHE)
                            .then((c) => c.put(e.request, res.clone()))
                        return res
                    }),
            ),
        )
        return
    }
    // Network-first with cache fallback for everything else
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
                return res
            })
            .catch(() => caches.match(e.request)),
    )
})
