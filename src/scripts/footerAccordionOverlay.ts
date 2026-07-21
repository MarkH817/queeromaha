function init() {
    const accordions = Array.from(
        document.querySelectorAll<HTMLDetailsElement>(
            'details[name="footer-accordion"]',
        ),
    )
    if (accordions.length === 0) return

    accordions.forEach((details) => {
        details.addEventListener('toggle', () => {
            if (!details.open) return
            window.posthog?.capture('footer_section_opened', {
                section: details.id,
            })
        })
    })

    document.addEventListener('click', (e) => {
        const open = accordions.find((d) => d.open)
        if (!open || open.contains(e.target as Node)) return
        open.open = false
    })

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return
        const open = accordions.find((d) => d.open)
        if (!open) return
        open.open = false
        open.querySelector('summary')?.focus()
    })
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init)
else init()

export {}
