# BP Youth Summer Adventure 2026

Mobile-first schedule site for a 3-day youth camp at Potholes State Park, WA (June 18–20, 2026). Participants view the daily schedule; content is managed via Sanity CMS.

## Stack

- **Astro** — static site generation, zero client-side JS framework
- **Sanity** — content management (`studio/`)
- **Tailwind v4**

## Development

From the repo root:

```bash
bun dev          # Astro dev server at http://localhost:4321
bun run build    # production build → site/dist/
bun run preview  # preview production build
bun studio       # Sanity Studio at http://localhost:3333
```

## Content

Schedule content lives in Sanity Studio. Visit the deployed Studio at [bpsa26.sanity.studio](https://bpsa26.sanity.studio).

## Architecture

```
bpsa/
├── site/                        # Astro project (public-facing site)
│   ├── src/
│   │   ├── pages/               # Astro routing
│   │   │   ├── index.astro      # redirects to current camp day
│   │   │   └── schedule/[date].astro
│   │   ├── layouts/Layout.astro
│   │   └── components/
│   │       └── ScheduleDay.astro  # tab nav + entry list + NowIndicator
│   └── lib/
│       ├── sanity.ts            # Sanity client + GROQ queries
│       └── campTime.ts          # Pacific Time utilities
└── studio/                      # Sanity Studio (separate sub-project)
    └── schemaTypes/
        └── scheduleDay.ts       # content schema
```

Astro generates a fully static site at build time — all schedule data is fetched from Sanity via GROQ during `astro build`. No server runtime; `site/dist/` is pure static HTML/CSS/JS.

The NowIndicator in `ScheduleDay.astro` runs on the client: a vanilla `<script>` reads Pacific Time via `Intl.DateTimeFormat`, finds the last entry whose time ≤ now, and highlights it. Ticks every 60 seconds.

Sanity project ID: `ucdyt6y8`, dataset: `production`. Studio is deployed at [bpsa26.sanity.studio](https://bpsa26.sanity.studio).

## Deployment

Push to `main` deploys to Vercel automatically via Vercel's GitHub integration.
