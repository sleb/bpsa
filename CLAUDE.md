# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**BP Youth Summer Adventure 2026** — a mobile-first informational website for a 3-day youth camp (June 18–20, 2026, Potholes State Park, WA). Participants view a daily schedule; authenticated editors manage it via a draft/publish/revert workflow backed by Firestore.

User stories are in `STORIES.md`. The phased build plan is in `ROADMAP.md`.

## Commands

```bash
bun dev              # dev server with HMR at http://localhost:3000
bun run build        # production build → dist/ (used by CI)
bun test             # run all tests
bun test <file>      # run a single test file

firebase emulators:start          # local Firestore on port 8080
firebase deploy --only hosting    # deploy dist/ to Firebase Hosting
firebase deploy --only firestore  # deploy security rules + indexes
firebase deploy                   # deploy everything
```

Use `bun` everywhere — not `npm`, `npx`, or `node`. Use `bunx` instead of `npx`.

## Architecture

### Dev vs. Production serving

In **development**, `src/index.ts` runs a `Bun.serve()` server that serves `src/index.html` as a catch-all SPA route with HMR enabled. Bun's built-in bundler (not Vite) transpiles TypeScript/TSX and bundles CSS/Tailwind on the fly.

In **production**, `bun run build.ts` bundles everything from `src/**/*.html` entrypoints into `dist/`, and Firebase Hosting serves `dist/` with an SPA rewrite (`**` → `/index.html`).

### Entry points

- `src/index.ts` — Bun server (dev only)
- `src/index.html` — single HTML entrypoint; loads `src/frontend.tsx`
- `src/frontend.tsx` — React root render; this is where `RouterProvider` will be mounted

`src/App.tsx` and `src/APITester.tsx` are starter-template artifacts — delete them once the router is wired up.

### Path aliases

`@/` maps to `src/` (configured in `tsconfig.json`). Use `@/components/...`, `@/lib/...`, `@/hooks/...` etc.

### Env vars

Browser-visible env vars must be prefixed `BUN_PUBLIC_`. Bun loads `.env` automatically — do not use `dotenv`. Firebase config vars live in `.env` as `BUN_PUBLIC_FIREBASE_API_KEY`, `BUN_PUBLIC_FIREBASE_AUTH_DOMAIN`, `BUN_PUBLIC_FIREBASE_PROJECT_ID`, `BUN_PUBLIC_FIREBASE_APP_ID`.

### UI / styling

- **shadcn/ui** "new-york" style, neutral base color, CSS variables, `lucide-react` icons
- Add components via `bunx shadcn@latest add <component>`
- Global CSS vars are in `styles/globals.css` (Tailwind v4 + shadcn tokens)
- `src/lib/utils.ts` exports `cn()` for class merging

### Firebase / Firestore

Firebase project: `bpsa26-5a752` (`.firebaserc`).

**Firestore data model:**

```
schedules/{dayId}               dayId = "2026-06-18" | "2026-06-19" | "2026-06-20"
  entries: ScheduleEntry[]      live (what participants see)
  draftEntries: ScheduleEntry[] editor working copy
  hasDraft: boolean
  publishedVersion: number
  publishedAt, publishedBy, draftLastEditedAt, draftLastEditedBy

schedules/{dayId}/versions/{versionId}   versionId = zero-padded "v0001"…"v0020"
  versionNumber, publishedAt, publishedBy, publisherDisplayName, entries

users/{uid}                     only editors and admins have documents here
  role: "editor" | "admin"
  active: boolean
  email, displayName, provisionedAt, provisionedBy
```

`ScheduleEntry`: `{ id: string, time: string, activity: string, location: string, sortOrder: number }`

Auth is **Google Auth only** via Firebase Authentication. Role is resolved by reading `users/{uid}` after sign-in. Public participants are unauthenticated and never write to Firestore.

**Firestore security rules** (`firestore.rules`) currently use a wide-open placeholder that expires **2026-06-17**. Real rules must be deployed before June 14.

### CI/CD

Push to `main` → GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`) → `bun run build` → deploy to Firebase Hosting live channel. PRs get a preview channel deploy via `firebase-hosting-pull-request.yml`.

## Development principles

**Test-driven development.** Write the test first, then the implementation. Tests should be lean and purposeful — test real behavior and business logic, not implementation details or trivial pass-throughs. Integration tests must hit the Firestore emulator; do not mock the database.

**Fearless refactoring.** When something changes, change it completely. Delete the old code. No backward-compatibility shims, no `_old` or `_v2` variants, no deprecated re-exports, no `// removed` comments. If it's gone, it's gone.

**No bloat, no duplication.** Three similar lines is fine; a shared abstraction is only warranted when the use case is proven. Don't copy-paste test setup — use helpers. Don't add error handling for things that can't fail.

**Keep docs in sync.** At the end of any design, planning, or implementation phase, update `STORIES.md`, `ROADMAP.md`, and `CLAUDE.md` to reflect decisions made during that phase. The docs are the source of truth for future sessions — if the code and the docs disagree, fix the docs immediately.

## Key constraints

- **Mobile-first is non-negotiable.** All UI (participant and editor) must be designed and tested at 375px before any desktop styling.
- **Not yet installed:** React Router v7 and the Firebase SDK. Use `bun add react-router firebase` to add them. Use React Router v7 in **library mode** (`createBrowserRouter` from `react-router-dom`) — not framework mode, since this is a static SPA with no server-side runtime.
- Use the modular Firebase v9+ SDK (tree-shakeable imports): `import { getFirestore } from "firebase/firestore"`. Only import `firebase/auth` and `firebase/firestore`.
- Enable Firestore offline persistence (`initializeFirestore` with persistence settings) so the schedule works without cell service at camp.
- Times in schedule entries are stored as plain `"HH:MM"` strings (24h). The `NowIndicator` must compare against Pacific Time (`America/Los_Angeles`) using `Intl.DateTimeFormat`, not the device's local time zone.
