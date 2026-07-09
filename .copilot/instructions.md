# Copilot Instructions for queeromaha

This project uses GitHub Copilot to assist with development. For detailed project guidance, architecture decisions, commands, and development practices, see **[CLAUDE.md](../CLAUDE.md)** at the repository root.

## Quick Reference

- **Build/Dev Commands**: See CLAUDE.md §Commands for Astro, Bun, and test runners
- **Architecture**: Static site with Astro, deployed to Netlify; see CLAUDE.md §Architecture
- **Content Model**: YAML-based directory pages; see CLAUDE.md §Content model
- **Frontend**: Vanilla JavaScript only, progressive enhancement; see CLAUDE.md §Frontend
- **Testing**: Vitest + Playwright e2e; see CLAUDE.md §Testing

When working on this project, reference CLAUDE.md for:
1. Exact command syntax and available scripts
2. Component structure and file organization
3. Data validation and testing requirements
4. Accessibility guidelines and progressive enhancement principles
5. Frontend best practices (vanilla JS, no frameworks)

## Key Principles

- **Vanilla JavaScript**: No frontend frameworks; Astro handles rendering
- **Progressive Enhancement**: Works without JavaScript; enhancements for modern browsers
- **Accessibility First**: WCAG 2.1 AA compliance, semantic HTML, keyboard navigation
- **Bun**: Primary package manager and runtime (not npm)

For full details, refer to **CLAUDE.md** in the repository root.
