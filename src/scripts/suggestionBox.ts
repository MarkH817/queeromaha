function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initFocusOnOpen(details: HTMLDetailsElement, input: HTMLInputElement) {
    details.addEventListener('toggle', () => {
        if (!details.open) return
        details.scrollIntoView({
            block: 'nearest',
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        })
        input.focus()
    })
}

function initCharacterCounter(input: HTMLInputElement, hint: HTMLElement) {
    const max = Number(input.maxLength)
    const defaultHint = hint.textContent ?? ''
    input.addEventListener('input', () => {
        const remaining = max - input.value.length
        hint.textContent = `${remaining} character${remaining === 1 ? '' : 's'} left`
    })
    input.addEventListener('blur', () => {
        if (input.value.length === 0) hint.textContent = defaultHint
    })
}

function initSubmitHandler(
    form: HTMLFormElement,
    sendButton: HTMLButtonElement,
) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const data = new URLSearchParams(
            new FormData(form) as unknown as Record<string, string>,
        )
        data.set('form-name', 'suggest')
        try {
            const res = await fetch('/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data.toString(),
            })
            if (res.ok) {
                window.posthog?.capture('suggestion_submitted')
                const thanks = document.createElement('p')
                thanks.className = 'suggestion-thanks'
                thanks.textContent = 'Thanks! We got your suggestion.'
                form.replaceWith(thanks)
                // Send lives outside the form (associated via the `form`
                // attribute) so it doesn't get removed by the swap above.
                sendButton.remove()
            } else {
                showError(
                    'Something went wrong. Try again or email us directly.',
                )
            }
        } catch {
            showError(
                'Something went wrong. Check your connection and try again.',
            )
        }

        function showError(msg: string) {
            const existing =
                form.parentElement?.querySelector('.suggestion-error')
            if (existing) existing.remove()
            const err = document.createElement('p')
            err.className = 'suggestion-error'
            err.textContent = msg
            form.insertAdjacentElement('beforebegin', err)
        }
    })
}

function init() {
    const details = document.querySelector<HTMLDetailsElement>('#suggestionBox')
    const form = details?.querySelector<HTMLFormElement>('form[name="suggest"]')
    const input = details?.querySelector<HTMLInputElement>('#suggestionMessage')
    const hint = details?.querySelector<HTMLElement>('#suggestionHint')
    const sendButton =
        details?.querySelector<HTMLButtonElement>('.suggestion-submit')
    if (!details || !form || !input || !hint || !sendButton) return

    initFocusOnOpen(details, input)
    initCharacterCounter(input, hint)
    initSubmitHandler(form, sendButton)
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init)
else init()

export {}
