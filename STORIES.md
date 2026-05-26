# User Stories — BPSA Youth Camp Website

Camp: June 18–20, 2026 | Potholes State Park, WA

**Hard constraint:** All participant-facing UI is mobile-first. Design and test at 375px width before any desktop styling is considered. This is non-negotiable.

**Stack:** Astro (SSG) + Sanity CMS + Vercel.

---

## Persona: Camp Participant / Parent

The primary reader. No login. Likely on a phone, possibly with spotty cell service at Potholes State Park. Needs to know what is happening right now and what is coming up.

---

### STORY-01: View Today's Schedule

**Story:** As a participant or parent, I want to see today's schedule when I open the site so that I know what is happening without having to ask a staff member.

**Acceptance Criteria:**
- [x] The homepage displays the schedule for the current camp day by default (June 18, 19, or 20)
- [x] Each schedule entry shows: time, activity name, and location
- [x] The current or most recently started activity is visually highlighted
- [ ] If today is not a camp day (before June 18 or after June 20), a clear message is shown (e.g., "Camp begins June 18 at Potholes State Park")
- [x] Page loads and is readable on a 375px-wide mobile screen without horizontal scrolling
- [x] No login is required

**Status:** Mostly done. The "not a camp day" message is not yet implemented — the site falls back to Day 1 silently.

**Size:** M

---

### STORY-02: View the Full 3-Day Schedule

**Story:** As a participant or parent, I want to browse the schedule for all three days so that I can plan ahead for the whole camp.

**Acceptance Criteria:**
- [x] A navigation element (tabs) lets the user switch between June 18, 19, and 20
- [x] Each day's schedule shows all entries with time, activity name, and location
- [x] The active day tab is clearly indicated
- [x] Navigation works via tap on mobile
- [x] No login is required

**Status:** Done.

**Size:** S

---

## Persona: Camp Leader / Editor

Authenticated via Sanity. Updates the schedule before and during camp using Sanity Studio. No custom editor UI is needed — Sanity's draft/publish/revert workflow covers all editing needs.

---

### STORY-03: Editor Authentication

**Status:** Done via Sanity — editors log in to Sanity Studio with their Sanity account. Access is managed by the project owner in the Sanity dashboard.

---

### STORY-04: Edit the Daily Schedule

**Status:** Done via Sanity Studio — editors add, edit, and delete entries in the `scheduleDay` documents. Changes are saved as drafts until published.

---

### STORY-05: Publish Schedule Changes

**Status:** Done via Sanity — editors publish drafts from Studio. Published content is fetched at the next Vercel build (triggered on push to `main`, or manually).

**Note:** Publish-to-live requires a new build. This means schedule changes are not instant — a Vercel deploy takes ~1–2 minutes. This is acceptable for a 3-day camp.

---

### STORY-06: Revert to a Previous Version

**Status:** Done via Sanity — version history is built into Sanity Studio. Editors can browse and restore previous published versions.

---

### STORY-07: Provision Editor Accounts

**Status:** Done via Sanity project management — the project owner invites editors in the Sanity dashboard. No provisioning scripts needed.
