function initSubmitHandler(form: HTMLFormElement) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const data = new URLSearchParams(
            new FormData(form) as unknown as Record<string, string>,
        )
        data.set('form-name', 'contact')
        try {
            const res = await fetch('/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data.toString(),
            })
            if (res.ok) {
                window.posthog?.capture('contact_form_submitted')
                const thanks = document.createElement('p')
                thanks.className = 'contact-thanks'
                thanks.textContent = 'Thanks! We got your message.'
                form.replaceWith(thanks)
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
            const existing = form.parentElement?.querySelector('.contact-error')
            if (existing) existing.remove()
            const err = document.createElement('p')
            err.className = 'contact-error'
            err.textContent = msg
            form.insertAdjacentElement('beforebegin', err)
        }
    })
}

function init() {
    const form = document.querySelector<HTMLFormElement>('form[name="contact"]')
    if (!form) return
    initSubmitHandler(form)
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init)
else init()

export {}
