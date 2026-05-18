/**
 * Provisions or updates a user document in Firestore, bypassing security rules.
 * Works against both the local emulator and production (when GOOGLE_APPLICATION_CREDENTIALS is set).
 *
 * Usage:
 *   bun run scripts/seed-admin.ts <uid>
 *
 * For the emulator, find the UID at http://localhost:4000 → Authentication tab.
 * For production, set GOOGLE_APPLICATION_CREDENTIALS to your service account key path.
 *
 * Example:
 *   bun run scripts/seed-admin.ts abc123def456
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const [uid] = process.argv.slice(2);

if (!uid) {
  console.error("Usage: bun run scripts/seed-admin.ts <uid>");
  process.exit(1);
}

const isEmulator = !process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (isEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
} else {
  console.error(
    "failing instead of running this on production. Make sure to only run this on the emulator",
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ projectId: "bpsa26-5a752" });
}

const db = getFirestore();

await db.doc(`users/${uid}`).set(
  {
    role: "editor",
    active: true,
    provisionedAt: new Date(),
    provisionedBy: "seed-script",
  },
  { merge: true },
);

console.log(`✓ Provisioned uid ${uid} as editor`);
process.exit(0);
