# Copilot Instructions for queeromaha.com

## Project Overview

**queeromaha.com** is a static site + dynamic API platform for the queer community in Omaha. It's built with Eleventy (static site generator) for the frontend and Netlify Functions for the backend API, with a PostgreSQL database (Neon) managed via Drizzle ORM.

### Core Architecture

- **Frontend**: Eleventy static site generator (Nunjucks templates in `src/_includes/layouts/`, Markdown pages in `src/`)
- **Backend**: Netlify serverless functions in `netlify/functions/`
- **Database**: PostgreSQL on Neon, managed via Drizzle ORM with schema in `db/schema.ts` and migrations in `migrations/`
- **Build**: `bun run build` generates the static site to `_site/`
- **Dev server**: `bun run serve` runs Eleventy with live reload

## Build, Test, and Lint Commands

```bash
# Build the static site
bun run build

# Run dev server with live reload (http://localhost:8080)
bun run serve

# Local Netlify dev environment (includes function preview)
netlify dev

# Database operations
bun run db:generate    # Generate migrations from schema changes
bun run db:migrate     # Apply migrations
bun run db:studio      # Open Drizzle Studio UI (requires NETLIFY_DATABASE_URL)
bun run db:seed        # Seed database with test data

# Admin operations
bun run approve        # CLI helper for approving makers (uses approve-maker.mjs)
```

## Key Architecture & Data Flow

### Makers Moderation System

The "makers" feature is a curated list of queer businesses/individuals. New submissions go through an approval workflow:

1. **User submits form** → Netlify form submission captures all fields
2. **Backend insertion** → `netlify/functions/submission-created.mjs` (triggered on form submission) inserts to `makers` table with `approved = false`
3. **Admin approval** → Either:
   - API endpoint: `POST /api/makers/approve` with `X-Admin-Token` header (JSON body: `{ id: 123, approved: true }`)
   - CLI helper: `bun run approve <id>` (locally or via `netlify dev:exec`)
4. **Public API** → `GET /api/makers` returns only `approved = true` entries, cached for 5 minutes

### Database Schema (Drizzle ORM)

**Key tables:**
- `posts`: Blog posts (id, title, content)
- `makers`: Queer makers/businesses (id, humanName, bizName, email, instagram, facebook, website, description, approved)

**Important**: Never edit migrations directly. Always modify `db/schema.ts` first, then run `bun run db:generate` to create migrations, and `bun run db:migrate` to apply them.

### Netlify Configuration

- Static output: `_site/` (built via Eleventy)
- Functions directory: `netlify/functions/`
- Environment variables required: `MAKERS_ADMIN_TOKEN` (for approval endpoint)
- Root redirect: `/` → `/community` (301 redirect)

## Key Conventions

### File Organization

- **`src/`**: Source files for static site (Markdown pages, Nunjucks layouts, CSS)
- **`netlify/functions/`**: Serverless functions (Node.js, auto-routed by filename)
  - `makers.mjs` → `GET /api/makers`
  - `makers-approve.mjs` → `POST|GET /api/makers/approve`
- **`db/`**: Database schema and utilities
- **`migrations/`**: Auto-generated SQL migrations (never edit directly)
- **`scripts/`**: Utility scripts (Node.js)

### Function Patterns

- Functions use the Neon client: `import { neon } from '@netlify/neon'` → `const sql = neon()`
- Auth: Check `x-admin-token` header against `MAKERS_ADMIN_TOKEN` environment variable
- Response format: JSON with `Content-Type: application/json` header
- Error handling: Use appropriate HTTP status codes and console.error() for debugging

### Database Operations

- All raw SQL queries use tagged template literals: ``await sql`SELECT * FROM makers` ``
- Schema uses Drizzle's camelCase property names but database columns use snake_case
- Queries should order results consistently (e.g., `ORDER BY COALESCE(biz_name, human_name)`)

### Environment Setup

- **Local preview**: Uses `netlify dev` (requires `.netlify/state.json` and environment variables)
- **Pull request previews**: GitHub Actions creates temporary Neon branches (2-week expiration) via `neondatabase/create-branch-action`
- **env variables**: Set via `netlify env:set KEY value` or in Netlify dashboard

## Common Tasks

### Add a new API endpoint
1. Create `netlify/functions/endpoint-name.mjs`
2. Export async default function and config: `export const config = { path: '/api/endpoint-name' }`
3. Use Neon client for database queries
4. Test locally with `netlify dev`

### Modify the makers table schema
1. Edit `db/schema.ts`
2. Run `bun run db:generate` (creates a new migration file)
3. Run `bun run db:migrate` to apply
4. Update the corresponding API function if needed

### Add a new static page
1. Create `.md` file in `src/` (e.g., `src/new-page.md`)
2. Eleventy will auto-generate HTML in `_site/new-page/index.html`
3. Add navigation link in `src/_includes/layouts/base.njk`

### Approve a maker (local dev)
```bash
# List unapproved makers
netlify dev:exec -- node scripts/approve-maker.mjs list

# Approve by ID (or curl the API endpoint locally)
netlify dev:exec -- node scripts/approve-maker.mjs 123
```

## Environment Variables

### Required in Netlify Dashboard
- **`NETLIFY_DATABASE_URL`** - PostgreSQL connection string from Neon (auto-configured for production)
- **`MAKERS_ADMIN_TOKEN`** - Secret token for the `/api/makers/approve` endpoint (set via `netlify env:set MAKERS_ADMIN_TOKEN "your-token"`)

### Local Development
Environment variables are loaded from Netlify config when running `netlify dev`. For isolated testing, create a `.env.local` file (not committed) with:
```
NETLIFY_DATABASE_URL=<your-database-url>
MAKERS_ADMIN_TOKEN=<your-admin-token>
```

## MCP Servers Configuration

### Netlify MCP Server
The Netlify MCP server is pre-configured in the `copilot-setup-steps.yml` workflow. This provides:
- Access to Netlify CLI for managing deployments and environment variables
- Ability to inspect function logs and deployment history
- Direct access to form submissions and build status

**Local setup**: Install Netlify CLI globally:
```bash
npm install -g netlify-cli
netlify login
```

## Form Handling & Submissions

The site uses **Netlify Forms** for the "Add a Maker" form (`src/makers.md` and `src/creation.md`):

1. **Form captures**: All form data is automatically stored in Netlify Forms dashboard
2. **Backend processing**: `netlify/functions/submission-created.mjs` is triggered by the `submission-created` event
3. **Database insertion**: Submission data is inserted into the `makers` table with `approved = false`
4. **User feedback**: After submit, users see a success message at `/makers/?submitted=1` redirected from form action

**Adding new form fields**:
1. Add the HTML input to the form (name attribute = database field name in snake_case)
2. Update `db/schema.ts` to add the new column
3. Update `netlify/functions/submission-created.mjs` to handle the new field
4. Run `bun run db:generate && bun run db:migrate` to apply schema changes

## CSS & Styling

The site uses a **custom CSS approach** (no framework) with a purple/violet color scheme:

**Color palette** (in `src/css/theme.css`):
- Primary purple: `#6e4da7` (header nav)
- Accent purple: `#6d28d9` (footer)
- Light background: `#f6f0fa`
- Interactive hover: `#a855f7`

**Key patterns**:
- Cards/boxes use `box-shadow: 4px 4px 0 #color` for a playful offset effect (see `.maker-card` in `src/makers.md`)
- Emoji tooltips handled via `span[title]` with CSS-generated popups (see `base.njk` emoji mapping logic)
- Responsive breakpoints: `768px` (tablet) and `480px` (mobile)
- Links use `border-bottom: 2px solid` instead of underline for better control
- Navigation uses `flex: 1` for equal-width buttons

**Adding inline styles**:
Pages like `src/makers.md` use `<style>` blocks for card layouts. Keep these scoped to avoid conflicts. For global styles, edit `src/css/theme.css`.

## Troubleshooting

### Database connection issues
- **Error**: "Failed to fetch makers" in API
- **Solution**: Check `NETLIFY_DATABASE_URL` is set correctly in Netlify env or `.env.local`
- **Local test**: `netlify dev` and check the Netlify CLI output for connection errors

### Migrations not applying
- **Error**: "migration file not found" or schema mismatches
- **Solution**: 
  1. Always run `bun run db:generate` BEFORE `bun run db:migrate`
  2. Never edit files in `migrations/` directly
  3. If stuck, use `bun run db:studio` to inspect current schema in Drizzle Studio

### Build failing locally
- **Error**: `eleventy` or `bun` not found
- **Solution**: 
  1. Check Node version matches `.nvmrc` (currently v20+)
  2. Install bun: `curl -fsSL https://bun.sh/install | bash`
  3. Reinstall dependencies: `rm -rf node_modules bun.lock && bun install`

### Functions not available during `netlify dev`
- **Error**: 404 on `/api/makers`
- **Solution**: 
  1. Stop and restart `netlify dev`
  2. Check function filenames match route expectations (e.g., `makers.mjs` → `/api/makers`)
  3. Verify `export const config = { path: '/api/...' }` is present in function

### Admin approval endpoint returns 401
- **Error**: "Unauthorized" when calling `/api/makers/approve`
- **Solution**:
  1. Check the `x-admin-token` header matches `MAKERS_ADMIN_TOKEN`
  2. Ensure token is set: `netlify env:get MAKERS_ADMIN_TOKEN`
  3. Use lowercase header: `x-admin-token` (not `X-Admin-Token`)

### Pull request preview database issues
- **Context**: GitHub Actions creates temporary Neon branches for PRs
- **If migrations fail**: Check that `db:migrate` is enabled in the workflow (currently commented out)
- **Branch cleanup**: Neon branches expire after 14 days automatically

## Performance & Caching

- **API caching**: `GET /api/makers` has `Cache-Control: public, max-age=300` (5-minute browser cache)
- **Static output**: All HTML is pre-built to `_site/` and served as static files (fastest)
- **Netlify Edge**: Consider adding edge functions if content needs real-time personalization
