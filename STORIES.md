# User Stories — BPSA Youth Camp Website

Camp: June 18–20, 2026 | Potholes State Park, WA

**Hard constraint:** All participant-facing and editor-facing UI is mobile-first. Design and test at 375px width before any desktop styling is considered. This is non-negotiable.

**Stack:** Firebase (Firestore for data, Firebase Hosting for delivery).

---

## Persona: Camp Participant / Parent

The primary reader. No login. Likely on a phone, possibly with spotty cell service at Potholes State Park. Needs to know what is happening right now and what is coming up.

---

### STORY-01: View Today's Schedule

**Story:** As a participant or parent, I want to see today's schedule when I open the site so that I know what is happening without having to ask a staff member.

**Acceptance Criteria:**
- [ ] The homepage displays the schedule for the current camp day by default (June 18, 19, or 20)
- [ ] Each schedule entry shows: time, activity name, and location
- [ ] The current or next upcoming activity is visually prominent (e.g., highlighted or pinned)
- [ ] If today is not a camp day (before June 18 or after June 20), a clear message is shown (e.g., "Camp begins June 18 at Potholes State Park")
- [ ] Page loads and is readable on a 375px-wide mobile screen without horizontal scrolling (mobile-first)
- [ ] No login is required

**Out of Scope:** Editing, push notifications, weather, or packing lists.

**Size:** M

---

### STORY-02: View the Full 3-Day Schedule

**Story:** As a participant or parent, I want to browse the schedule for all three days so that I can plan ahead for the whole camp.

**Acceptance Criteria:**
- [ ] A navigation element (tabs or links) lets the user switch between June 18, 19, and 20
- [ ] Each day's schedule shows all entries with time, activity name, and location
- [ ] The active day tab is clearly indicated
- [ ] Navigation works via tap on mobile without requiring a mouse hover (mobile-first)
- [ ] No login is required

**Out of Scope:** Adding or editing days beyond the three defined camp days.

**Size:** S

---

## Persona: Platform Admin

Responsible for provisioning and managing editor accounts before and during camp. Acts before editors can do anything. Not a day-to-day user — likely the technical owner or camp lead.

---

### STORY-07: Provision Editor Accounts

**Story:** As a platform admin, I want to seed editor accounts so that camp leaders can log in and manage the schedule without needing self-service sign-up.

**Acceptance Criteria:**
- [ ] Admin can create one or more editor accounts by providing a username and initial password
- [ ] Provisioned accounts are immediately usable for login (STORY-03)
- [ ] Admin can deactivate an account so the editor can no longer log in
- [ ] Provisioning does not require editing source code or redeploying the app
- [ ] Provisioning mechanism is documented (e.g., a seed script, Firebase console steps, or a protected admin screen)

**Out of Scope:** Self-service sign-up by editors, role hierarchies beyond admin/editor, email-based invites in v1.

**Size:** S

---

## Persona: Camp Leader / Editor

Authenticated. Updates the schedule before and during camp. Needs to move fast — campers are waiting. Must be able to undo a bad publish. Account is pre-provisioned by the Platform Admin.

---

### STORY-03: Editor Authentication

**Story:** As a camp leader, I want to log in with my credentials so that I can access the schedule editing tools.

**Acceptance Criteria:**
- [ ] A login page accepts a username and password
- [ ] Successful login redirects to the schedule editor
- [ ] Failed login shows a clear error message without revealing which field is wrong
- [ ] Session persists for at least 8 hours without re-authentication
- [ ] Accounts are pre-provisioned by a Platform Admin (STORY-07); no self-service sign-up
- [ ] A logged-in editor can log out explicitly

**Out of Scope:** Password reset via email, OAuth/SSO, self-service account creation.

**Size:** S

---

### STORY-04: Edit the Daily Schedule

**Story:** As a camp leader, I want to add, edit, and remove schedule entries for any of the three camp days so that I can keep the schedule accurate as plans change.

**Acceptance Criteria:**
- [ ] Authenticated editor can select any of the three days (June 18, 19, 20) to edit
- [ ] Editor can add a new entry with: time, activity name, and location
- [ ] Editor can modify any field on an existing entry
- [ ] Editor can delete an existing entry (with a confirmation prompt)
- [ ] Changes are saved as a draft and do not affect what participants see until published
- [ ] A "draft" indicator is visible so the editor knows unpublished changes exist
- [ ] Draft state persists if the editor closes and reopens the browser (not lost on refresh)
- [ ] Editor UI is usable on a 375px-wide mobile screen (mobile-first)

**Out of Scope:** Rich text, image uploads, attendee RSVP, or adding days beyond June 18–20.

**Size:** M

---

### STORY-05: Publish Schedule Changes

**Story:** As a camp leader, I want to publish my drafted changes in a single action so that participants see the updated schedule quickly.

**Acceptance Criteria:**
- [ ] A "Publish" button is clearly visible when a draft exists
- [ ] Clicking Publish triggers a confirmation step (one-tap confirm, not a modal form)
- [ ] The updated schedule is live and visible to participants within 5 minutes of confirmation
- [ ] After publishing, the draft indicator clears and the editor sees the now-live schedule
- [ ] If publish fails, the editor sees an error message and the draft is preserved

**Out of Scope:** Scheduled/future publishing, per-entry publish, publish notifications to participants.

**Size:** S

---

### STORY-06: Revert to a Previous Version

**Story:** As a camp leader, I want to restore a previously published schedule so that I can recover quickly from a bad update.

**Acceptance Criteria:**
- [ ] The editor can view a list of past published versions, showing: version number, timestamp, and the editor who published it
- [ ] The editor can preview any past version before restoring it
- [ ] Selecting "Restore" loads that version as the current draft (does not auto-publish)
- [ ] The editor must explicitly publish the restored draft for it to go live
- [ ] At least the last 20 published versions are retained per day
- [ ] No login is required to read; only authenticated editors can restore

**Out of Scope:** Diff views between versions, restoring across days (e.g., June 19 version onto June 18).

**Size:** M
