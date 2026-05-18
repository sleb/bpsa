---
name: project-camp-website
description: Youth camp website product — personas, v1 backlog, decisions, and resolved constraints
metadata:
  type: project
---

Summer youth camp website, primarily informational with a daily schedule as the core feature.

**Why:** Participants and parents need a quick way to see the current schedule without asking staff. Editors (camp leaders) need to push changes fast and recover from mistakes.

**Stack:** Firebase — Firestore for data, Firebase Hosting for delivery.

**Three personas (all defined):**
- Camp Participant / Parent — reads the schedule, no login, mobile-first
- Camp Leader / Editor — authenticated, edits/publishes schedule, needs version history with revert; account provisioned by admin
- Platform Admin — provisions and manages editor accounts before/during camp; prerequisite for any editor work

**V1 story list (all defined, none yet built):**
- STORY-01: View Today's Schedule (M) — participant
- STORY-02: View Full 3-Day Schedule (S) — participant
- STORY-03: Editor Authentication (S) — editor; depends on STORY-07
- STORY-04: Edit the Daily Schedule (M) — editor
- STORY-05: Publish Schedule Changes (S) — editor; SLA is 5 minutes (not 60 seconds)
- STORY-06: Revert to a Previous Version (M) — editor; depends on STORY-05 being live
- STORY-07: Provision Editor Accounts (S) — admin; must ship before STORY-03 can be tested

**Key dependency order:** STORY-07 → STORY-03 → STORY-04 → STORY-05 → STORY-06

**All open questions resolved as of 2026-05-18:**
1. Editor provisioning: Admin role via STORY-07; no self-service sign-up in v1
2. Camp dates: June 18–20, 2026 at Potholes State Park, WA (3 days)
3. Publish SLA: Firebase Hosting; SLA is 5 minutes (originally 60 seconds — relaxed)
4. Version retention: 20 versions per day stored in Firestore; trivial at free tier
5. Mobile-first: Hard constraint on ALL UI stories — design/test at 375px first, non-negotiable

**Artifacts on disk:**
- `/Users/scott/Code/bpsa/STORIES.md` — full story definitions with acceptance criteria
- `/Users/scott/Code/bpsa/ROADMAP.md` — phased roadmap with delivery order and rationale

**How to apply:** Use this context to evaluate scope additions, prioritization questions, and any new stories for this product.
