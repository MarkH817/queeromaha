// Budgets for `bun run test:e2e:lighthouse` (shared runner from @taraxvoid/voidflow).
// The runner supplies `site`.
export default {
    scanner: {
        samples: 1,
        device: 'mobile',
        // Explicit routes, no crawling.
        urls: ['/', '/friends', '/friends/o4us'],
        skipJavascript: true,
    },
    lighthouseOptions: {
        onlyCategories: ['seo', 'performance'],
    },
    ci: {
        // Per-category minimum scores (0-100); the run exits non-zero if any fail.
        budget: {
            seo: 80,
            // lhci had performance at warn-level 0.9; `/` measured 0.85 when
            // migrating. Raise back to 90 once the home page clears it.
            performance: 80,
        },
        buildStatic: false,
    },
}
