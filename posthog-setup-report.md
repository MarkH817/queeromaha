# PostHog post-wizard report

The wizard has completed a PostHog analytics integration for the Queer Omaha static Astro site. PostHog is initialized via a reusable inline snippet component (`src/components/posthog.astro`) wired into the root layout (`src/layouts/Base.astro`). Eight custom events are captured across four files, tracking the key user actions in this community directory: browsing by category and tag, expanding item details, clicking through to external resources, opening and submitting the suggestion box, and subscribing to the events calendar.

| Event | Description | File |
|---|---|---|
| `category_filter_applied` | User selects a category pill to filter the directory listing. | `src/scripts/filter.ts` |
| `tag_filter_applied` | User applies a tag filter pill to narrow directory results. | `src/scripts/filter.ts` |
| `tag_filter_cleared` | User clears one or all tag filters from the directory. | `src/scripts/filter.ts` |
| `item_expanded` | User taps a directory item card to expand its details. | `src/scripts/permalink.ts` |
| `item_link_clicked` | User clicks an external link on an expanded directory item card. | `src/scripts/permalink.ts` |
| `suggestion_box_opened` | User opens the footer suggestion box to submit a place to add. | `src/scripts/suggestionBox.ts` |
| `suggestion_submitted` | User successfully submits a suggestion via the footer form. | `src/scripts/suggestionBox.ts` |
| `calendar_subscribed` | User clicks the Gay Agenda calendar subscribe link in the footer. | `src/components/SiteFooter.astro` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/506544/dashboard/1829410)
- [Item expansions over time (wizard)](https://us.posthog.com/project/506544/insights/YBrkkPK8)
- [Top items clicked by link type (wizard)](https://us.posthog.com/project/506544/insights/Brm24OXL)
- [Expand-to-click conversion funnel (wizard)](https://us.posthog.com/project/506544/insights/MWw2f7cO)
- [Category filter usage by category (wizard)](https://us.posthog.com/project/506544/insights/kPs7MRx1)
- [Suggestions submitted over time (wizard)](https://us.posthog.com/project/506544/insights/jcdXpHJ8)

## Verify before merging

- [ ] Run a full production build (`bun run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite (`bun run test:unit`) — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
