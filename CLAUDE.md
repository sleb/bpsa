# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**BP Youth Summer Adventure 2026** — a mobile-first schedule site for a 3-day youth camp (June 18–20, 2026, Potholes State Park, WA). Participants view a daily schedule; content is managed by editors via Sanity Studio.

User stories are in `STORIES.md`. The phased build plan is in `ROADMAP.md`.

## Commands

From the repo root:

```bash
bun dev              # Astro dev server at http://localhost:4321
bun run build        # production build → site/dist/
bun run preview      # preview production build
bun studio           # Sanity Studio at http://localhost:3333
```

From `site/`:

```bash
bun test             # run all tests
bun test <file>      # run a single test file
```

From `studio/`:

```bash
bunx sanity@latest schema deploy   # push schema changes to Sanity
```

Use `bun` everywhere — not `npm`, `npx`, or `node`. Use `bunx` instead of `npx`.

## Architecture

## Structure

```
bpsa/
├── site/                        # Astro project (public-facing site)
│   ├── src/
│   │   ├── pages/               # Astro routing
│   │   │   └── index.astro      # fetches all days, renders Schedule
│   │   ├── layouts/Layout.astro # HTML shell
│   │   ├── components/
│   │   │   └── Schedule.astro   # tab nav + all days' entries + NowIndicator
│   │   └── lib/
│   │       ├── sanity.ts        # Sanity client + GROQ queries
│   │       └── campTime.ts      # Pacific Time utilities
│   ├── styles/globals.css       # Tailwind v4 + CSS vars
│   ├── astro.config.mjs
│   └── package.json
└── studio/                      # Sanity Studio (separate sub-project)
    ├── schemaTypes/
    │   └── scheduleDay.ts       # content schema
    ├── sanity.config.ts
    └── package.json
```

`site/` and `studio/` are independent projects — separate `package.json`, `node_modules`, and `bun.lock`. They share no code. Studio is deployed separately to `bpsa26.sanity.studio`.

### Static site generation

Astro generates a fully static site at build time. All schedule data is fetched from Sanity during `astro build` via GROQ queries. There is no server-side runtime — `site/dist/` is pure static HTML/CSS/JS.

### Sanity CMS

- Project ID: `ucdyt6y8`, dataset: `production`
- Client: `site/src/lib/sanity.ts` — build-time fetching via `useCdn: true`
- Schema: `studio/schemaTypes/scheduleDay.ts` — `scheduleDay` document type with `date`, `title`, and `entries[]`
- Editors use Sanity Studio directly for draft/publish/revert workflows — no custom editor UI needed

### Tab navigation

`Schedule.astro` renders all three days as static HTML at build time. A vanilla `<script>` block runs on the client: on load it calls `getRedirectDay()` to show the correct day and activate the right tab; tab clicks switch days in-place without navigation.

### Path aliases

`@/` maps to `site/src/` (configured in `site/tsconfig.json`). Use `@/components/...`, `@/lib/...` etc.

### UI / styling

- Tailwind v4 via `@tailwindcss/vite`; global CSS vars in `site/styles/globals.css`

### Time handling

`src/lib/campTime.ts` handles all time logic:

- `getRedirectDay()` — returns today's camp day date string, or the first day if not during camp
- `formatTime12h()` — formats `"HH:MM"` for display

All comparisons use `Intl.DateTimeFormat` with `America/Los_Angeles`. Never use the device's local timezone.

### CI/CD

**Target:** Push to `main` → GitHub Actions → `bun run build` → deploy to Vercel.

**Current state:** CI workflows (`.github/workflows/`) still reference Firebase Hosting and need to be updated for Vercel (Step 4 of migration).

## Development principles

**Test-driven development.** Write the test first, then the implementation. Tests should be lean and purposeful — test real behavior and business logic, not implementation details or trivial pass-throughs.

**Fearless refactoring.** When something changes, change it completely. Delete the old code. No backward-compatibility shims, no `_old` or `_v2` variants, no deprecated re-exports, no `// removed` comments. If it's gone, it's gone.

**No bloat, no duplication.** Three similar lines is fine; a shared abstraction is only warranted when the use case is proven. Don't add error handling for things that can't fail.

**Keep docs in sync.** At the end of any design, planning, or implementation phase, update `STORIES.md`, `ROADMAP.md`, and `CLAUDE.md` to reflect decisions made during that phase. The docs are the source of truth for future sessions — if the code and the docs disagree, fix the docs immediately.

## Key constraints

- **Mobile-first is non-negotiable.** All participant-facing UI must be designed and tested at 375px before any desktop styling.
- Times in schedule entries are stored as plain `"HH:MM"` strings (24h). The NowIndicator must compare against Pacific Time (`America/Los_Angeles`) using `Intl.DateTimeFormat`, not the device's local timezone.
