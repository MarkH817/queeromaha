const REDIRECT_SECONDS = 8
const REDIRECT_URL = '/friends'

window.posthog?.capture('page_not_found', {
    path: window.location.pathname,
})

const countdownEl = document.querySelector<HTMLElement>(
    '[data-notfound-countdown]',
)
const secondsEl = document.querySelector<HTMLElement>('[data-notfound-seconds]')
const link = document.querySelector<HTMLAnchorElement>('[data-notfound-link]')

if (countdownEl && secondsEl) {
    let remaining = REDIRECT_SECONDS
    countdownEl.hidden = false

    const interval = setInterval(() => {
        remaining -= 1
        secondsEl.textContent = String(Math.max(remaining, 0))
        if (remaining <= 0) {
            clearInterval(interval)
            window.location.href = REDIRECT_URL
        }
    }, 1000)

    const cancel = () => {
        clearInterval(interval)
        countdownEl.hidden = true
    }

    link?.addEventListener('click', cancel)
    window.addEventListener('keydown', cancel, { once: true })
    window.addEventListener('pointerdown', cancel, { once: true })
    window.addEventListener('wheel', cancel, { once: true, passive: true })
}
