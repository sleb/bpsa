# Roadmap — BPSA Youth Camp Website

Camp: June 18–20, 2026 | Potholes State Park, WA

Target: site is live and editor-ready by June 14, 2026 (4 days before camp opens).

**Stack:** Astro (SSG) + Sanity CMS + Vercel.

**Hard constraint:** Mobile-first across all participant-facing UI. Design and test at 375px before any desktop work. Non-negotiable.

---

## Phase 1 — Foundation ✓ Complete

**Goal:** Participants can view the schedule. Editors can manage content via Sanity Studio.

**Completed:**
- Sanity schema (`scheduleDay`) deployed and all 3 days seeded with content
- Astro SSG — builds 4 static pages (`/` redirect + 3 schedule days) from Sanity at build time
- `ScheduleDay.astro` with vanilla JS NowIndicator (Pacific Time, 1-minute tick), tab nav, and entry highlighting — no React
- Monorepo restructured: `site/` and `studio/` are siblings; root `package.json` has convenience scripts
- Firebase fully removed

**Remaining (STORY-01):** "Not a camp day" message not yet shown — index falls back to Day 1 silently. Low priority.

---

## Phase 2 — Deployment: Vercel CI/CD

**Goal:** Pushes to `main` automatically build and deploy to Vercel.

**Tasks:**
1. Connect repo to Vercel and confirm first manual deploy works
2. Update `.github/workflows/firebase-hosting-merge.yml` → Vercel deploy on push to `main`
3. Update `.github/workflows/firebase-hosting-pull-request.yml` → Vercel preview deploy on PRs (or delete if not needed)
4. Set `SANITY_PROJECT_ID` / `SANITY_DATASET` env vars in Vercel dashboard (currently baked into `src/lib/sanity.ts` — move to env vars if needed)

**Target:** Complete before June 14.

---

## Phase 3 — Pre-camp Polish (optional, before June 18)

| Item | Notes |
| ---- | ----- |
| "Not a camp day" landing message | STORY-01 remaining criterion; show a message before June 18 and after June 20 instead of silently falling back to Day 1 |
| Verify mobile layout at 375px | Manual QA pass on a real device |
| Confirm NowIndicator accuracy | Test on Pacific Time device or emulate PT timezone |

---

## Phase 4 — Post-camp / future consideration (not committed)

Revisit after the June 2026 camp as a retrospective input.

| Item | Why deferred |
|------|-------------|
| Push notifications to participants | No validated demand; adds significant complexity |
| Weather widget | Nice-to-have; cell service at Potholes State Park may be limited |
| Multi-camp / multi-year support | Out of scope until a second camp is planned |
| Participant RSVP or headcount | Not a stated need |

---

## Architecture decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Vercel | Best Astro-first support; Sanity docs default |
| CMS | Sanity | Draft/publish/revert built in; no custom editor UI needed |
| Editor auth | Sanity project access | Eliminates custom user/role system |
| Version history | Sanity built-in | Replaces custom Firestore versions collection |
| Offline support | Deferred | Standard CDN/HTTP caching is sufficient for a 3-day camp |
| Static vs. server | Static (SSG) | Schedule content changes infrequently; no server runtime needed |
