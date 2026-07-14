function initFilters() {
    const cards = document.querySelectorAll<HTMLElement>('[data-category]')
    const pills = document.querySelectorAll<
        HTMLElement & { disabled: boolean }
    >('[data-filter]')
    const clearBtn = document.getElementById(
        'filterClear',
    ) as HTMLButtonElement | null

    if (cards.length === 0) return
    const activeTags = new Set<string>()
    const activeCategories = new Set<string>()

    function updateClearBtn() {
        if (clearBtn) clearBtn.disabled = activeTags.size === 0
    }

    function cardMatches(
        card: HTMLElement,
        cats: Set<string>,
        tags: Set<string>,
    ) {
        const cardTags = (card.dataset.tags || '').split(' ').filter(Boolean)
        const cardCat = card.dataset.category || ''
        const tagMatch =
            tags.size === 0 || [...tags].every((t) => cardTags.includes(t))
        const catMatch = cats.size === 0 || cats.has(cardCat)
        return tagMatch && catMatch
    }

    function applyFilters() {
        cards.forEach((card) => {
            card.hidden = !cardMatches(card, activeCategories, activeTags)
        })
        document
            .querySelectorAll<HTMLElement>('[data-category-heading]')
            .forEach((heading) => {
                const cat = heading.dataset.categoryHeading || ''
                heading.hidden = ![...cards].some(
                    (c) => c.dataset.category === cat && !c.hidden,
                )
            })
        updatePillAvailability()
    }

    function wouldHaveResults(slug: string, type: string) {
        // Build the hypothetical filter state if `slug` were chosen, rather
        // than relying on card.hidden (which reflects the *current* selection
        // and would wrongly veto switching category when the current
        // combination has zero matches).
        const testCats = new Set(activeCategories)
        const testTags = new Set(activeTags)
        if (type === 'category') {
            // Switching category also clears tags (see setCategory), so
            // availability shouldn't be constrained by them.
            testCats.clear()
            testCats.add(slug)
            testTags.clear()
        } else if (type === 'tag') {
            testTags.add(slug)
        }
        return [...cards].some((card) => cardMatches(card, testCats, testTags))
    }

    function updatePillAvailability() {
        pills.forEach((pill) => {
            // Category pills are client-side toggles over the full card DOM
            // every route ships, so they're never limited by the current
            // selection and should never be disabled.
            if (pill.dataset.filterType === 'category') {
                pill.disabled = false
                pill.classList.remove('unavailable')
                return
            }
            if (pill.classList.contains('active')) {
                pill.disabled = false
                pill.classList.remove('unavailable')
                return
            }
            const slug = pill.dataset.filter || ''
            const type = pill.dataset.filterType || ''
            const available = wouldHaveResults(slug, type)
            pill.disabled = !available
            pill.classList.toggle('unavailable', !available)
        })
    }

    function activateFilter(slug: string) {
        const pill = document.querySelector<HTMLElement>(
            `[data-filter="${slug}"]`,
        )
        if (!pill) return
        if (pill.dataset.filterType === 'category') activeCategories.add(slug)
        else if (pill.dataset.filterType === 'tag') activeTags.add(slug)
        pill.classList.add('active')
        pill.setAttribute('aria-pressed', 'true')
        applyFilters()
        updateClearBtn()
    }

    function deactivateFilter(slug: string) {
        const pill = document.querySelector<HTMLElement>(
            `[data-filter="${slug}"]`,
        )
        if (!pill) return
        if (pill.dataset.filterType === 'category')
            activeCategories.delete(slug)
        else if (pill.dataset.filterType === 'tag') activeTags.delete(slug)
        pill.classList.remove('active')
        pill.setAttribute('aria-pressed', 'false')
        applyFilters()
        updateClearBtn()
    }

    function buildUrl() {
        const parts = [...activeCategories]
        return parts.length === 0 ? '/friends' : `/${parts.join('/')}`
    }

    function clearType(type: string, activeSet: Set<string>) {
        activeSet.clear()
        pills.forEach((p) => {
            if (p.dataset.filterType === type) {
                p.classList.remove('active')
                p.setAttribute('aria-pressed', 'false')
            }
        })
    }

    function scrollToTop() {
        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches
        window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
    }

    function setCategory(slug: string) {
        clearType('category', activeCategories)
        // Switching category also resets tags, since a filter combo from the
        // old category may not make sense in the new one.
        clearType('tag', activeTags)
        activateFilter(slug)
        scrollToTop()
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearType('tag', activeTags)
            applyFilters()
            updateClearBtn()
            history.pushState({}, '', buildUrl())
            window.posthog?.capture('filter_cleared')
        })
    }

    pills.forEach((pill) => {
        pill.addEventListener('click', (e) => {
            const slug = pill.dataset.filter || ''
            const type = pill.dataset.filterType || ''
            const isActive = pill.classList.contains('active')

            e.preventDefault()

            if (type === 'category') {
                // Tapping the already-active category is a no-op.
                if (isActive) return
                // Every static route already ships the full card DOM, so
                // switching category is a local hidden-toggle (instant, no
                // fetch) — the pill's real href is only a JS-off fallback.
                setCategory(slug)
                history.pushState({}, '', buildUrl())
                return
            }

            // Tag pills.
            if (isActive) deactivateFilter(slug)
            else activateFilter(slug)
            history.pushState({}, '', buildUrl())
            if (!isActive) {
                window.posthog?.capture('filter_applied', {
                    filter_slug: slug,
                    filter_type: type,
                })
            }
        })
    })

    // Activate filters from URL on load
    const initCats = (document.body.dataset.initialCategories || '')
        .split(' ')
        .filter(Boolean)
    const initTags = (document.body.dataset.initialTags || '')
        .split(' ')
        .filter(Boolean)
    if (initCats.length > 0) setCategory(initCats[0])
    initTags.forEach(activateFilter)
    // Astro renders `hidden={false}` on custom elements like <wa-card> as
    // the literal attribute hidden="false", which the HTML boolean-attribute
    // spec (and our `[hidden]` CSS) treats as truthy regardless of value.
    // Setting `.hidden` via the JS property below is what actually clears
    // it. The calls above only do this for cards touched by an active
    // category/tag; this unconditional call covers any card that ends up with
    // no active filter touching it at all.
    applyFilters()
}

// Category and tag pills both filter client-side in place — there's no soft
// navigation — so init once on normal page load.
if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initFilters)
else initFilters()

export {}
