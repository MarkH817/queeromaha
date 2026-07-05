import { navigate } from 'astro:transitions/client'

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
    const activeNeighborhoods = new Set<string>()

    function updateClearBtn() {
        if (clearBtn) clearBtn.disabled = activeTags.size === 0
    }

    function cardMatches(
        card: HTMLElement,
        cats: Set<string>,
        nbrs: Set<string>,
        tags: Set<string>,
    ) {
        const cardTags = (card.dataset.tags || '').split(' ').filter(Boolean)
        const cardCat = card.dataset.category || ''
        const cardNbr = card.dataset.neighborhood || ''
        const tagMatch =
            tags.size === 0 || [...tags].every((t) => cardTags.includes(t))
        const catMatch = cats.size === 0 || cats.has(cardCat)
        const nbrMatch = nbrs.size === 0 || nbrs.has(cardNbr)
        return tagMatch && catMatch && nbrMatch
    }

    function applyFilters() {
        cards.forEach((card) => {
            card.hidden = !cardMatches(
                card,
                activeCategories,
                activeNeighborhoods,
                activeTags,
            )
        })
        document
            .querySelectorAll<HTMLElement>('[data-category-heading]')
            .forEach((heading) => {
                const cat = heading.dataset.categoryHeading || ''
                heading.hidden =
                    cat === 'recommended'
                        ? ![...cards].some((c) => !c.hidden)
                        : ![...cards].some(
                              (c) => c.dataset.category === cat && !c.hidden,
                          )
            })
        updatePillAvailability()
        updateImpliedCategoryState()
    }

    function updateImpliedCategoryState() {
        const allCategoriesImplied =
            activeNeighborhoods.size > 0 && activeCategories.size === 0
        pills.forEach((pill) => {
            if (pill.dataset.filterType !== 'category') return
            pill.classList.toggle('implied', allCategoriesImplied)
        })
    }

    function wouldHaveResults(slug: string, type: string) {
        // Build the hypothetical filter state if `slug` were chosen, rather
        // than relying on card.hidden (which reflects the *current*
        // selection and would wrongly veto switching category/location
        // when the current combination has zero matches).
        const testCats = new Set(activeCategories)
        const testNbrs = new Set(activeNeighborhoods)
        const testTags = new Set(activeTags)
        if (type === 'category') {
            // Switching category also clears location/tags (see
            // setCategory), so availability shouldn't be constrained by them.
            testCats.clear()
            testCats.add(slug)
            testNbrs.clear()
            testTags.clear()
        } else if (type === 'neighborhood') {
            testNbrs.clear()
            testNbrs.add(slug)
        } else if (type === 'tag') {
            testTags.add(slug)
        }
        return [...cards].some((card) =>
            cardMatches(card, testCats, testNbrs, testTags),
        )
    }

    function updatePillAvailability() {
        pills.forEach((pill) => {
            // Category pills are real navigations now (see the click
            // handler below), not client-side toggles limited to whatever
            // cards happen to already be in the current page's DOM (e.g.
            // the homepage only has recommended-item cards, which would
            // otherwise make every other category look "unavailable" even
            // though visiting it works fine). They should never be disabled.
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
        else if (pill.dataset.filterType === 'neighborhood')
            activeNeighborhoods.add(slug)
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
        else if (pill.dataset.filterType === 'neighborhood')
            activeNeighborhoods.delete(slug)
        pill.classList.remove('active')
        pill.setAttribute('aria-pressed', 'false')
        applyFilters()
        updateClearBtn()
    }

    function buildUrl() {
        const parts = [...activeCategories, ...activeNeighborhoods]
        return parts.length === 0 ? '/' : `/${parts.join('/')}`
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
        // Switching category also resets location and tags, since a
        // filter combo from the old category may not make sense in the
        // new one.
        clearType('neighborhood', activeNeighborhoods)
        clearType('tag', activeTags)
        activateFilter(slug)
        scrollToTop()
    }

    function setNeighborhood(slug: string) {
        clearType('neighborhood', activeNeighborhoods)
        activateFilter(slug)
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearType('tag', activeTags)
            applyFilters()
            updateClearBtn()
            history.pushState({}, '', buildUrl())
        })
    }

    pills.forEach((pill) => {
        pill.addEventListener('click', (e) => {
            const slug = pill.dataset.filter || ''
            const type = pill.dataset.filterType || ''
            const isActive = pill.classList.contains('active')

            if (type === 'category') {
                if (isActive) {
                    e.preventDefault()
                    navigate('/')
                }
                // else: not active — let the pill's real href navigate
                // (e.g. "/art"), intercepted by ClientRouter for a soft
                // transition, so the target route's own SSR output (full
                // category, not just recommended items) is what loads.
                return
            }

            e.preventDefault()
            if (type === 'neighborhood') {
                if (isActive) deactivateFilter(slug)
                else setNeighborhood(slug)
            } else {
                if (isActive) deactivateFilter(slug)
                else activateFilter(slug)
            }
            history.pushState({}, '', buildUrl())
        })
    })

    // Activate filters from URL on load
    const initCats = (document.body.dataset.initialCategories || '')
        .split(' ')
        .filter(Boolean)
    const initNbrs = (document.body.dataset.initialNeighborhoods || '')
        .split(' ')
        .filter(Boolean)
    const initTags = (document.body.dataset.initialTags || '')
        .split(' ')
        .filter(Boolean)
    if (initCats.length > 0) setCategory(initCats[0])
    initNbrs.forEach(activateFilter)
    initTags.forEach(activateFilter)
    // Astro renders `hidden={false}` on custom elements like <wa-card> as
    // the literal attribute hidden="false", which the HTML boolean-attribute
    // spec (and our `[hidden]` CSS) treats as truthy regardless of value.
    // Setting `.hidden` via the JS property below is what actually clears
    // it. The calls above only do this for cards touched by an active
    // category/neighborhood/tag; this unconditional call covers routes
    // (like the bare "/" homepage) with no initial filter at all.
    applyFilters()
}

// Runs on first load and again after every ClientRouter soft navigation,
// since the DOM (and therefore all queried cards/pills) is replaced.
document.addEventListener('astro:page-load', initFilters)
