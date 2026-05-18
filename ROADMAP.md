# Roadmap — BPSA Youth Camp Website

Camp: June 18–20, 2026 | Potholes State Park, WA

Target: site is live and editor-ready by June 14, 2026 (4 days before camp opens).

**Stack:** Firebase — Firestore for data storage, Firebase Hosting for delivery.

**Hard constraint:** Mobile-first across all UI. Design and test at 375px before any desktop work. Non-negotiable.

---

## Phase 1 — Foundation: Admin can provision editors, editors can manage the schedule, participants can see it

**Goal:** A participant opening the URL on their phone can see the current day's schedule. A camp leader can log in (using an admin-provisioned account), edit, and publish changes.

**Stories included:**

- STORY-07: Provision Editor Accounts
- STORY-03: Editor Authentication
- STORY-04: Edit the Daily Schedule
- STORY-05: Publish Schedule Changes
- STORY-01: View Today's Schedule
- STORY-02: View the Full 3-Day Schedule

**Delivery order:**

1. STORY-07 must ship first — no editor account means STORY-03 cannot be tested end-to-end.
2. STORY-03 must follow before STORY-04 or STORY-05 can be validated.
3. STORY-01 and STORY-02 (read-only views) can be built in parallel with editor work, but require at least one published schedule to be meaningful — coordinate with STORY-05.

**Resolved decisions:**

- Editor accounts are provisioned by an admin role (STORY-07). No self-service sign-up in v1.
- Firebase (Firestore + Firebase Hosting) is the confirmed stack. Publish SLA is 5 minutes — well within Firebase Hosting's propagation window.
- Mobile-first is a hard constraint on all UI stories (01, 02, 03, 04, 05, 07).

---

## Phase 2 — Operational safety: Editors can recover from mistakes

**Goal:** A camp leader who publishes a bad update can restore a prior version without calling anyone for help.

**Stories included:**

- STORY-06: Revert to a Previous Version

**Why this is Phase 2, not MVP:** Revert is a safety net, not a launch blocker. You cannot revert if you have never published — Phase 1 must ship first and accumulate at least a few versions before this feature is meaningful. Build it before camp opens, not before the site goes live.

**Target:** Complete before June 18 (camp day 1). Hard deadline — if revert is not ready, editors have no recovery path during camp.

**Resolved decisions:**

- Firestore snapshots will store published versions. 20 versions per day is the retention target — trivial at Firestore's free tier for this scale.
- STORY-06 depends on STORY-05 being live and stable. Do not start STORY-06 UI work until the publish flow is confirmed working.

---

## Phase 3 — Post-camp / future consideration (not committed)

Revisit after the June 2026 camp as a retrospective input.

| Item                               | Why deferred                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Password reset via email           | No self-service signup in v1; manual provisioning is acceptable at this scale                |
| Push notifications to participants | No validated demand; adds significant complexity                                             |
| Weather widget                     | Nice-to-have; Potholes State Park is remote and cell service may limit real-time data anyway |
| Multi-camp / multi-year support    | Out of scope until a second camp is planned                                                  |
| Participant RSVP or headcount      | Not a stated need; add only if camp ops request it                                           |

---

## Open Questions

All questions resolved as of 2026-05-18.

| #   | Question                                    | Blocks                       | Status                                                     |
| --- | ------------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| 1   | Who provisions editor accounts, and how?    | STORY-03                     | RESOLVED: Admin role via STORY-07; no self-service sign-up |
| 2   | Camp dates / day count                      | STORY-01, STORY-02           | RESOLVED: June 18–20, 2026 at Potholes State Park, WA      |
| 3   | Can the hosting stack meet the publish SLA? | STORY-05                     | RESOLVED: Firebase Hosting; SLA relaxed to 5 minutes       |
| 4   | Version history retention limit             | STORY-06                     | RESOLVED: 20 versions per day; stored in Firestore         |
| 5   | Mobile-first hard constraint?               | STORY-01, STORY-02, STORY-04 | RESOLVED: Yes, non-negotiable across all UI                |
