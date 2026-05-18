# BP Youth Summer Adventure 2026 — MVP Implementation Plan

Camp: June 18–20, 2026 | Potholes State Park, WA
Target: site live and editor-ready by June 14, 2026

**MVP scope:** STORY-07, STORY-03, STORY-01, STORY-02, STORY-04, STORY-05
**Excluded from MVP:** STORY-06 (version history/revert) — Phase 2

---

## Prerequisites

Before starting Phase 0, verify:

- Bun is installed: `bun --version`
- Firebase CLI is installed: `firebase --version`
- Java is available (required by Firestore emulator): `java --version`
- You are logged in to Firebase: `firebase projects:list` should show `bpsa26-5a752`
- A `.env` file exists at the repo root with all four `BUN_PUBLIC_FIREBASE_*` vars populated

---

## Phase 0 — Install dependencies and wire up React Router

**Goal:** Replace the starter-template `App.tsx` with a working `RouterProvider` shell so that `bun dev` renders a real route at `http://localhost:3000` and `bun run build` produces a working `dist/`.

### Steps

1. Install React Router and Firebase SDK:
   ```
   bun add react-router firebase
   ```

2. Delete starter artifacts: `src/App.tsx`, `src/APITester.tsx`, `src/logo.svg`, `src/react.svg`.

3. Create `src/lib/firebase.ts` — initialize the Firebase app and export `db` (Firestore) and `auth` (Firebase Auth). Use `initializeFirestore` with `localCache: persistentLocalCache()` for offline support. Connect to emulator when `import.meta.env.DEV` is true.

4. Create `src/router.tsx` — define `createBrowserRouter` with placeholder routes:
   - `/` → `<SchedulePage />` (participant view, stub for now)
   - `/login` → `<LoginPage />` (editor auth, stub for now)
   - `/editor` → `<EditorPage />` (schedule editor, stub for now)

5. Rewrite `src/frontend.tsx` to mount `RouterProvider` from `react-router-dom` using the router from `src/router.tsx`. Remove the import of `App`. Keep the HMR-compatible `createRoot` pattern unchanged.

### Tests

- **Manual browser check:** `bun dev` → visit `http://localhost:3000` → page renders without a JS console error.
- **Manual browser check:** visit `http://localhost:3000/login` → renders the login stub without a 404.
- **Build check:** `bun run build` exits with code 0 and `dist/index.html` exists.

### Checkpoint

`bun dev` runs without errors, all three stub routes render in the browser, and `bun run build` produces `dist/`.

---

## Phase 1 — Firestore data layer and emulator test harness

**Goal:** Establish the Firestore data layer with typed models, a service module, and passing integration tests against the emulator so every later phase can rely on a tested data contract.

### Steps

1. Create `src/lib/types.ts` exporting:
   ```ts
   export type ScheduleEntry = {
     id: string;
     time: string;        // "HH:MM" 24h
     activity: string;
     location: string;
     sortOrder: number;
   };

   export type DayId = "2026-06-18" | "2026-06-19" | "2026-06-20";
   export const DAY_IDS: DayId[] = ["2026-06-18", "2026-06-19", "2026-06-20"];

   export type ScheduleDoc = {
     entries: ScheduleEntry[];
     draftEntries: ScheduleEntry[];
     hasDraft: boolean;
     publishedVersion: number;
     publishedAt: Date | null;
     publishedBy: string | null;
     draftLastEditedAt: Date | null;
     draftLastEditedBy: string | null;
   };

   export type UserDoc = {
     role: "editor" | "admin";
     active: boolean;
     email: string;
     displayName: string;
     provisionedAt: Date;
     provisionedBy: string;
   };
   ```

2. Create `src/lib/scheduleService.ts` exporting (all functions take `db: Firestore` as first arg for testability):
   - `getSchedule(db, dayId: DayId): Promise<ScheduleDoc | null>`
   - `subscribeSchedule(db, dayId: DayId, onSnapshot: (doc: ScheduleDoc) => void): Unsubscribe`
   - `saveDraft(db, dayId, entries, uid, displayName): Promise<void>`
   - `publishDraft(db, dayId, uid, displayName): Promise<void>` — Firestore transaction: copies `draftEntries` to `entries`, sets `hasDraft: false`, increments `publishedVersion`, writes timestamps. Does NOT write version subcollection (that is Phase 2 / STORY-06).

3. Create `src/tests/scheduleService.test.ts`:
   - Connect to Firestore emulator on port 8080.
   - `beforeEach`: clear emulator data via `DELETE` to the emulator REST endpoint.
   - Test `saveDraft`: call it, then `getSchedule`, assert `hasDraft === true` and `draftEntries` matches.
   - Test `publishDraft`: save a draft, publish, assert `entries` matches former draft, `hasDraft === false`, `publishedVersion === 1`.
   - Test `subscribeSchedule`: subscribe, call `saveDraft`, assert the callback fires with updated data.

### Tests

- **Integration tests (`bun test src/tests/scheduleService.test.ts`)** with Firestore emulator running. Zero mocks.

### Checkpoint

`bun test src/tests/scheduleService.test.ts` passes with the emulator running.

---

## Phase 2 — Participant schedule view (STORY-01 + STORY-02)

**Goal:** A participant opening the site on a 375px phone sees today's schedule with the current activity highlighted and can tap between all three camp days.

### Steps

1. Create `src/lib/campTime.ts` exporting:
   - `getTodayCampDay(now?: Date): DayId | null` — returns the `DayId` for the given date in `America/Los_Angeles` tz if within June 18–20 2026, else `null`. Accepts optional `now` for testability.
   - `getCurrentTimeMinutes(): number` — minutes since midnight in Pacific time.
   - `parseTimeToMinutes(time: string): number` — converts `"HH:MM"` to minutes since midnight.

2. Create `src/tests/campTime.test.ts` (no emulator needed):
   - `getTodayCampDay` returns `"2026-06-18"` when now is June 18 PT.
   - `getTodayCampDay` returns `null` when now is June 17 or June 21.
   - `parseTimeToMinutes("09:30") === 570`.

3. Add shadcn `tabs` component: `bunx shadcn@latest add tabs`

4. Create `src/components/ScheduleEntry.tsx` — renders one entry row: time (12h display from 24h storage), activity, location. `isActive: boolean` prop adds highlight styling.

5. Create `src/components/NowIndicator.tsx` — "Now" pill placed before the active entry. Uses `getCurrentTimeMinutes()` to find the current slot. Updates every 60 seconds.

6. Create `src/components/ScheduleList.tsx` — takes `entries: ScheduleEntry[]`, renders sorted by `sortOrder`, inserts `NowIndicator` at the correct position.

7. Create `src/components/DayTabs.tsx` — three tabs for June 18/19/20 with human-readable labels. Controlled via `selectedDay` + `onDayChange` props. Uses shadcn `Tabs`. Min 44px touch targets.

8. Create `src/pages/SchedulePage.tsx`:
   - Default selected day to `getTodayCampDay()` or `"2026-06-18"` if outside camp dates.
   - Subscribe to selected day's `entries` via `subscribeSchedule`. Show loading skeleton on first load.
   - Off-season message when outside June 18–20.
   - Composes `DayTabs` + `ScheduleList`. Full-width, no horizontal scroll at 375px.

9. Wire `<SchedulePage />` into `src/router.tsx` as the `/` route.

### Tests

- **Unit tests (`bun test src/tests/campTime.test.ts`)** — pass without emulator.
- **Manual browser check at 375px:** entries appear for a seeded day; day tabs switch content; off-season message renders outside camp dates; no horizontal scroll.

### Checkpoint

On a 375px viewport, the schedule page shows entries, `NowIndicator` appears, and all three day tabs switch content.

---

## Phase 3 — STORY-07: Admin provisioning documentation

**Goal:** An admin can create editor accounts using only the Firestore Console, fully documented with no code changes required.

### Steps

1. Create `PROVISIONING.md` at the repo root documenting:
   - **Bootstrap (first admin):** Create the first `users/{uid}` document in Firestore Console with `role: "admin"`, `active: true`. Includes how to find the UID from the Firebase Auth console after the account's first Google sign-in.
   - **Provision an editor:** Create a `users/{uid}` document with `role: "editor"`, `active: true`, `email`, `displayName`, `provisionedAt`, `provisionedBy`.
   - **Deactivate an editor:** Set `active: false`.
   - **Re-activate:** Set `active: true`.

2. Create `src/lib/authService.ts` exporting:
   - `signInWithGoogle(auth: Auth): Promise<void>`
   - `signOut(auth: Auth): Promise<void>`
   - `resolveUserRole(db: Firestore, uid: string): Promise<UserDoc | null>` — reads `users/{uid}`, returns `null` if not found or `active === false`.

3. Create `src/hooks/useAuthState.ts` — wraps `onAuthStateChanged`, calls `resolveUserRole` after auth resolves. Returns `{ user, userDoc, loading }`.

4. Create `src/tests/authService.test.ts` against emulator:
   - `resolveUserRole` returns `null` for a UID with no document.
   - `resolveUserRole` returns `null` for `active: false`.
   - `resolveUserRole` returns the full `UserDoc` for an active editor.

### Tests

- **Integration tests (`bun test src/tests/authService.test.ts`)** — all pass against emulator.

### Checkpoint

Tests pass. `PROVISIONING.md` exists and documents all three admin actions. A reviewer can follow the doc to seed a test editor in the emulator UI at `http://localhost:4000`.

---

## Phase 4 — STORY-03: Editor authentication

**Goal:** An editor can sign in with Google, be redirected to the editor dashboard, and sign out. Inactive or unprovisioned accounts are rejected with a clear error.

### Steps

1. Add shadcn `alert` component: `bunx shadcn@latest add alert`

2. Create `src/pages/LoginPage.tsx`:
   - "Sign in with Google" button, full-width at 375px.
   - On success: call `resolveUserRole`. If `null` or `active === false`: sign out immediately, show "Access denied. Contact your camp administrator." using shadcn `Alert variant="destructive"`.
   - If already authenticated with a valid role on mount: redirect to `/editor`.

3. Create `src/components/RequireEditor.tsx` — route guard. Reads `useAuthState`. Shows spinner while loading. Redirects to `/login` if `userDoc` is null. Otherwise renders `<Outlet />`.

4. Update `src/router.tsx` — wire `<LoginPage />`, wrap `/editor` with `<RequireEditor />` as a layout route.

5. Create `src/tests/authGuard.test.ts` — unit tests:
   - Unauthenticated state → `RequireEditor` redirects to `/login`.
   - Authenticated editor state → `RequireEditor` renders `<Outlet />`.

### Tests

- **Unit tests (`bun test src/tests/authGuard.test.ts`)** — pass.
- **Manual browser check:** unsigned-in user visiting `/editor` lands on `/login`; valid editor signs in and reaches the editor stub; unprovisioned Google account is rejected.

### Checkpoint

A signed-in editor navigates to `/editor`. An unauthenticated user visiting `/editor` is redirected to `/login`. An unprovisioned Google account sees the access-denied message.

---

## Phase 5 — STORY-04: Schedule editor (draft editing)

**Goal:** An authenticated editor can add, edit, and delete entries as a draft without affecting what participants see.

### Steps

1. Add shadcn components: `bunx shadcn@latest add dialog alert-dialog`

2. Create `src/lib/entryUtils.ts` exporting:
   - `newEntry(): ScheduleEntry` — UUID id, blank fields, `sortOrder: Date.now()`.
   - `sortEntries(entries: ScheduleEntry[]): ScheduleEntry[]` — sort by `sortOrder`, then `parseTimeToMinutes` as tiebreaker.
   - `reorderEntries(entries: ScheduleEntry[], fromIndex: number, toIndex: number): ScheduleEntry[]` — returns new array with recalculated `sortOrder` values.

3. Create `src/tests/entryUtils.test.ts` (no emulator):
   - `sortEntries` sorts correctly.
   - `newEntry` returns unique `id` on each call.
   - `reorderEntries` produces stable sort orders.

4. Create `src/components/EntryForm.tsx` — inline form for one `ScheduleEntry`. Fields: time (`HH:MM`), activity, location. Validates time format before enabling Save.

5. Create `src/components/EntryRow.tsx` — editor row with Edit (pencil) and Delete (trash) icon buttons. Edit opens `EntryForm` inline. Delete opens `AlertDialog` confirm.

6. Create `src/components/DraftBanner.tsx` — sticky banner when `hasDraft === true`: "You have unpublished changes." Includes Publish button (wired in Phase 6).

7. Create `src/components/LastWriteWinsNote.tsx` — dismissible info note: "Note: if two editors save at the same time, the last save wins." Dismissed state stored in `localStorage`.

8. Create `src/pages/EditorPage.tsx`:
   - Header: camp name, signed-in user display name, Sign out button.
   - Reuses `DayTabs` component from Phase 2.
   - Subscribes to `draftEntries` via `subscribeSchedule`. Loading skeleton on first load.
   - Shows `DraftBanner` when `hasDraft === true`.
   - Shows `LastWriteWinsNote` once.
   - Renders `EntryRow` per entry (sorted via `sortEntries`).
   - "Add entry" button calls `saveDraft` with a new blank entry appended.
   - All save/delete actions call `saveDraft(db, dayId, updatedEntries, uid, displayName)`.
   - All layout at 375px; 44px min touch targets.

9. Wire `<EditorPage />` into `src/router.tsx` as the `/editor` child route under `<RequireEditor />`.

10. Create `src/tests/editorIntegration.test.ts` against emulator:
    - Seed a schedule. Call `saveDraft` with two entries. `getSchedule` returns `hasDraft: true`, `draftEntries` matches, published `entries` unchanged.
    - Call `saveDraft` with one entry removed. `getSchedule` returns updated `draftEntries`.

### Tests

- **Unit tests (`bun test src/tests/entryUtils.test.ts`)** — pass without emulator.
- **Integration tests (`bun test src/tests/editorIntegration.test.ts`)** — pass against emulator.
- **Manual browser check at 375px:** add/edit/delete entries; draft banner appears; draft persists after refresh.

### Checkpoint

An editor on 375px can add, edit, and delete entries. Changes persist in `draftEntries`. Published `entries` are unchanged. All unit and integration tests pass.

---

## Phase 6 — STORY-05: Publish schedule changes

**Goal:** An editor publishes the draft in two taps, participants see the update live, and a failed publish shows an error without losing the draft.

### Steps

1. Update `DraftBanner.tsx` publish flow:
   - First tap: button changes to "Confirm publish?" with a Cancel link inline.
   - Auto-reverts to initial state after 5 seconds of inactivity.
   - On confirm: calls `publishDraft(db, dayId, uid, displayName)`.
   - During publish: spinner inside button, editor interactions disabled.
   - On success: banner disappears (driven by `hasDraft: false` in Firestore snapshot).
   - On failure: inline error using shadcn `Alert variant="destructive"`: "Publish failed — your draft is still saved. Try again."

2. Create `src/tests/publishFlow.test.ts` against emulator:
   - Seed a schedule with a draft. Call `publishDraft`. Assert `entries` = former `draftEntries`, `hasDraft === false`, `publishedVersion` incremented.
   - Set up a `subscribeSchedule` listener before publishing, assert it fires with the updated `entries` after publish.

### Tests

- **Integration tests (`bun test src/tests/publishFlow.test.ts`)** — all pass against emulator.
- **Manual browser check:** open `/` and `/editor` in two tabs; publish in editor tab; participant tab updates within seconds; simulated failure shows error and preserves draft.

### Checkpoint

Editor publishes in two taps. Participant view updates live. Simulated failure shows error without data loss. Integration tests pass.

---

## Phase 7 — Firestore security rules

**Goal:** Replace the wide-open placeholder rules with production-safe rules before the June 14 deploy deadline.

### Steps

1. Rewrite `firestore.rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       function isActiveEditor() {
         return request.auth != null
           && exists(/databases/$(database)/documents/users/$(request.auth.uid))
           && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.active == true
           && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['editor', 'admin'];
       }

       match /schedules/{dayId} {
         allow read: if true;
         allow write: if isActiveEditor();
       }

       match /users/{uid} {
         allow read: if request.auth != null && request.auth.uid == uid;
         allow write: if false;
       }
     }
   }
   ```

2. Create `src/tests/securityRules.test.ts` using `@firebase/rules-unit-testing`:
   - Unauthenticated read of `schedules/2026-06-18` → allowed.
   - Unauthenticated write → denied.
   - Authenticated write with no `users/` doc → denied.
   - Authenticated write with `active: false` → denied.
   - Authenticated write with `active: true`, `role: "editor"` → allowed.
   - Read of `users/{uid}` by the same UID → allowed.
   - Read of `users/{uid}` by a different UID → denied.
   - Write of `users/{uid}` by anyone → denied.

3. Update `PROVISIONING.md`: add reminder to deploy rules before June 14 via `firebase deploy --only firestore`.

### Tests

- **Integration tests (`bun test src/tests/securityRules.test.ts`)** — all pass against emulator.
- **Manual check:** unauthenticated Firestore write from browser console is denied.

### Checkpoint

All security rule tests pass. `firebase deploy --only firestore` succeeds. Participant view loads; editor save fails when signed out and succeeds when signed in as an active editor.

---

## Phase 8 — End-to-end smoke test and production deploy

**Goal:** Full flow works in production on a real device; site is live before June 14.

### Steps

1. Create `.env.example` listing all required `BUN_PUBLIC_FIREBASE_*` vars with empty values.

2. Run full test suite: `bun test` — all tests pass.

3. Run production build: `bun run build` — no errors.

4. Deploy: `firebase deploy`.

5. Smoke test on a real phone:
   - Participant schedule loads at live URL.
   - Day tabs switch correctly.
   - Sign in at `/login` with a provisioned Google account → redirected to editor.
   - Add entry, save draft, publish → participant view updates within 5 minutes.
   - Sign out.

### Checkpoint

Live URL accessible on a real phone. Full sign-in → draft → publish → sign-out flow completes without errors. Site is ready for camp operations.

---

## Appendix A — File map

```
src/
  lib/
    firebase.ts               Phase 0 — Firebase init, db/auth exports
    types.ts                  Phase 1 — ScheduleEntry, DayId, ScheduleDoc, UserDoc
    scheduleService.ts        Phase 1 — getSchedule, subscribeSchedule, saveDraft, publishDraft
    campTime.ts               Phase 2 — getTodayCampDay, getCurrentTimeMinutes, parseTimeToMinutes
    authService.ts            Phase 3 — signInWithGoogle, signOut, resolveUserRole
    entryUtils.ts             Phase 5 — newEntry, sortEntries, reorderEntries
    utils.ts                  (existing) — cn(), keep as-is
  hooks/
    useAuthState.ts           Phase 3 — auth state + role resolution hook
  components/
    ScheduleEntry.tsx         Phase 2
    NowIndicator.tsx          Phase 2
    ScheduleList.tsx          Phase 2
    DayTabs.tsx               Phase 2 (shared with Phase 5)
    EntryForm.tsx             Phase 5
    EntryRow.tsx              Phase 5
    DraftBanner.tsx           Phase 5 + 6
    LastWriteWinsNote.tsx     Phase 5
    RequireEditor.tsx         Phase 4
    ui/                       (existing shadcn components + new additions)
  pages/
    SchedulePage.tsx          Phase 2
    LoginPage.tsx             Phase 4
    EditorPage.tsx            Phase 5
  tests/
    scheduleService.test.ts   Phase 1 — emulator integration
    campTime.test.ts          Phase 2 — unit
    authService.test.ts       Phase 3 — emulator integration
    authGuard.test.ts         Phase 4 — unit
    entryUtils.test.ts        Phase 5 — unit
    editorIntegration.test.ts Phase 5 — emulator integration
    publishFlow.test.ts       Phase 6 — emulator integration
    securityRules.test.ts     Phase 7 — rules integration
  router.tsx                  Phase 0
  frontend.tsx                Phase 0 (rewrite)

firestore.rules               Phase 7 (rewrite)
PROVISIONING.md               Phase 3
.env.example                  Phase 8
```

---

## Appendix B — Commands reference

```bash
# Dev
bun dev
firebase emulators:start

# Tests
bun test
bun test src/tests/<file>.test.ts

# Install (run as needed per phase)
bun add react-router firebase
bunx shadcn@latest add tabs
bunx shadcn@latest add alert
bunx shadcn@latest add dialog alert-dialog

# Deploy
bun run build
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy
```

---

## Appendix C — Decisions log

| Decision | Rationale |
|---|---|
| Admin provisioning is manual Firestore Console steps | No editor UI needed at this scale; documented in PROVISIONING.md |
| First admin bootstrapped via Firestore Console | One-time step; documents in PROVISIONING.md |
| Last-write-wins for concurrent edits | Acceptable at camp scale; UI note reduces confusion |
| No version subcollection writes in `publishDraft` | STORY-06 is Phase 2; keeping it out avoids coupling Phase 1 tests to Phase 2 data |
| `persistentLocalCache` in Firestore init | Offline required — Potholes State Park has spotty cell coverage |
| Pacific Time for `NowIndicator` | Camp is in WA; device time zone may differ for out-of-state families |
| `publishDraft` uses a Firestore transaction | Atomic: no partial state where `entries` and `hasDraft` are out of sync |
| `users` write rule is `false` | Provisioning is intentionally out-of-band; no client can elevate its own role |
