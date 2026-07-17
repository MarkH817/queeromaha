function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

function initTapToggle() {
    const cards = document.querySelectorAll<HTMLElement>(
        'wa-card.item[data-slug]',
    )
    if (cards.length === 0) return null

    let lastWrittenUrl: string | null = null
    let activeCard: HTMLElement | null = null

    function writeUrl(url: string) {
        if (url === lastWrittenUrl) return
        lastWrittenUrl = url
        history.replaceState({}, '', url)
    }

    function clearActive() {
        if (!activeCard) return
        activeCard.classList.remove('item-active')
        activeCard
            .querySelector('.item-tap-target')
            ?.setAttribute('aria-pressed', 'false')
        activeCard = null
    }

    function activate(card: HTMLElement, opts?: { scroll?: boolean }) {
        if (activeCard && activeCard !== card) clearActive()
        activeCard = card
        card.classList.add('item-active')
        card.querySelector('.item-tap-target')?.setAttribute(
            'aria-pressed',
            'true',
        )
        writeUrl(`/${card.dataset.category}/${card.dataset.slug}`)
        if (!opts?.scroll) {
            window.posthog?.capture('item_expanded', {
                item_slug: card.dataset.slug,
                item_category: card.dataset.category,
            })
        }

        if (opts?.scroll) {
            card.scrollIntoView({
                block: 'start',
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            })
        }
    }

    function deactivate() {
        clearActive()
        writeUrl(categoryUrl())
    }

    function toggle(card: HTMLElement) {
        if (card === activeCard) deactivate()
        else activate(card)
    }

    cards.forEach((card) => {
        // Delegated: the real activation target is `.item-tap-target`
        // (a native <button> so Enter/Space work for free), but a click
        // anywhere on the card except a real link (map/entry links) should
        // toggle it too, so this listens on the card itself.
        card.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('a')) return
            toggle(card)
        })
    })

    const backToTop = document.getElementById('backToTop')
    backToTop?.addEventListener('click', deactivate)

    // Filter-pill clicks already rewrite the URL via filter.ts's own
    // pushState; this only needs to clear the (now stale) active card's
    // visual state, not write a URL of its own.
    document.querySelectorAll<HTMLElement>('[data-filter]').forEach((el) => {
        el.addEventListener('click', clearActive)
    })

    return { activate }
}

function init() {
    const seed = initDeepLink()
    const controls = initTapToggle()
    if (!controls) return

    if (seed) {
        Promise.all([
            customElements.whenDefined('wa-card'),
            customElements.whenDefined('wa-button'),
            customElements.whenDefined('wa-icon'),
        ]).then(() => {
            const target = document.getElementById(
                `${seed.category}-${seed.slug}`,
            )
            if (target) controls.activate(target, { scroll: true })
        })
    }
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init)
else init()

export {}
