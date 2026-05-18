# Provisioning Guide — BP Youth Summer Adventure 2026

Editor and admin accounts are provisioned manually via the Firebase Console. No self-service sign-up exists by design.

---

## One-time: Bootstrap the first admin

This only needs to be done once, before any editors can be added.

1. Have the admin sign in to the app at least once (or sign in via the Firebase Console → Authentication → Users → Add user by email). This creates their Firebase Auth account and assigns a UID.
2. Copy their **UID** from the Firebase Console → Authentication → Users table.
3. Go to Firebase Console → Firestore Database → Start collection (or use the existing `users` collection).
4. Create a document at path `users/{uid}` (paste the UID as the document ID) with these fields:

   | Field | Type | Value |
   |---|---|---|
   | `role` | string | `admin` |
   | `active` | boolean | `true` |
   | `email` | string | admin's Google email |
   | `displayName` | string | admin's name |
   | `provisionedAt` | timestamp | now |
   | `provisionedBy` | string | (same UID — self-bootstrap) |

5. The admin can now sign in and will have full access.

---

## Provision an editor

1. Ask the editor to sign in to the app once with their Google account (this registers their Auth record and generates a UID), **or** add them manually via Firebase Console → Authentication → Users.
2. Copy their **UID** from the Firebase Console → Authentication → Users table.
3. In Firestore, create a document at `users/{uid}` with:

   | Field | Type | Value |
   |---|---|---|
   | `role` | string | `editor` |
   | `active` | boolean | `true` |
   | `email` | string | editor's Google email |
   | `displayName` | string | editor's name |
   | `provisionedAt` | timestamp | now |
   | `provisionedBy` | string | your (admin) UID |

4. The editor can now sign in at `/login` and access the schedule editor.

---

## Deactivate an editor

In Firestore, find the editor's document at `users/{uid}` and set `active` to `false`. The editor will be rejected on their next sign-in attempt and signed out immediately if already active.

---

## Re-activate an editor

Set `active` back to `true` on their `users/{uid}` document.

---

## Deploy rules reminder

**Before June 14:** run `firebase deploy --only firestore` to deploy the production security rules. The current placeholder rules expire June 17 — if not replaced, all client reads will be denied on camp day.

---

## Testing provisioning locally

Use the Firestore Emulator UI at `http://localhost:4000` to create `users/` documents for local testing. The emulator is started with `firebase emulators:start`.
