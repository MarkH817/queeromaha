const HIGHLIGHT_MS = 2000
// Height of the observed "line" just below the header. Not a literal 1px
// line — scroll-landing positions (from scrollIntoView, touch momentum,
// device pixel ratio rounding) can miss a 1px target by several px, so the
// strip needs enough tolerance to reliably catch a card passing through it.
const LINE_HEIGHT = 24

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function highlight(el: HTMLElement) {
    el.classList.add('item-highlight')
    setTimeout(() => el.classList.remove('item-highlight'), HIGHLIGHT_MS)
}

function categoryUrl() {
    const category = document.body.dataset.initialCategories?.split(' ')[0]
    return category ? `/${category}` : '/'
}

function initDeepLink(): { category: string; slug: string } | null {
    const slug = document.body.dataset.initialItemSlug
    const category = document.body.dataset.initialCategories?.split(' ')[0]
    if (!slug || !category) return null

    const target = document.getElementById(`${category}-${slug}`)
    if (!target) return null

    return { category, slug }
}

function scrollToDeepLink(seed: { category: string; slug: string }) {
    const target = document.getElementById(`${seed.category}-${seed.slug}`)
    if (!target) return
    target.scrollIntoView({
        block: 'start',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
    highlight(target)
}

function initScrollObserver(
    seed: { category: string; slug: string } | null,
    headerEl: HTMLElement,
) {
    const cards = document.querySelectorAll<HTMLElement>(
        'wa-card.item[data-slug]',
    )
    if (cards.length === 0) return

    let lastWrittenUrl = seed ? location.pathname : null
    let currentSlug = seed?.slug ?? null

    function writeUrl(url: string) {
        if (url === lastWrittenUrl) return
        lastWrittenUrl = url
        history.replaceState({}, '', url)
    }

    let observer: IntersectionObserver

    // The observed "line" is a thin strip just below the header, built from
    // the header's live measured height rather than the async
    // --header-height CSS var (SiteHeader.astro's own ResizeObserver hasn't
    // necessarily fired yet by the time this runs, e.g. before the
    // wa-button/wa-icon custom elements upgrade and grow the header).
    function buildObserver(top: number) {
        const bottomMargin = Math.max(window.innerHeight - top - LINE_HEIGHT, 0)
        return new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const card = entry.target as HTMLElement
                    const slug = card.dataset.slug
                    if (!slug) continue

                    if (entry.isIntersecting) {
                        currentSlug = slug
                        writeUrl(`/${card.dataset.category}/${slug}`)
                        continue
                    }

                    // Only revert when the currently active card left the
                    // line by moving back below it (user scrolled up past
                    // it) — not when it exits above the line as normal
                    // forward scroll progress hands off to the next card.
                    if (
                        slug === currentSlug &&
                        entry.boundingClientRect.top > top + LINE_HEIGHT
                    ) {
                        currentSlug = null
                        writeUrl(categoryUrl())
                    }
                }
            },
            {
                rootMargin: `-${top}px 0px -${bottomMargin}px 0px`,
                threshold: 0,
            },
        )
    }

    function rebuild(top: number) {
        observer?.disconnect()
        observer = buildObserver(top)
        cards.forEach((card) => {
            observer.observe(card)
        })
    }

    rebuild(headerEl.getBoundingClientRect().height)

    // Re-derive the line whenever the header's actual rendered height
    // changes — custom-element upgrade, nav pills wrapping, or a viewport
    // resize/rotation all resize the header directly.
    new ResizeObserver(() => {
        rebuild(headerEl.getBoundingClientRect().height)
    }).observe(headerEl)

    const backToTop = document.getElementById('backToTop')
    backToTop?.addEventListener('click', () => {
        currentSlug = null
        writeUrl(categoryUrl())
    })
}

function init() {
    const headerEl = document.querySelector<HTMLElement>('header')
    if (!headerEl) return

    const seed = initDeepLink()

    Promise.all([
        customElements.whenDefined('wa-card'),
        customElements.whenDefined('wa-button'),
        customElements.whenDefined('wa-icon'),
    ]).then(() => {
        if (seed) scrollToDeepLink(seed)
    })

    initScrollObserver(seed, headerEl)
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init)
else init()

export {}
