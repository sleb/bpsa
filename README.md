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

## Deployment

Push to `main` deploys to Vercel automatically via GitHub Actions.
