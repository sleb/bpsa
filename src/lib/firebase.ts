import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  memoryLocalCache,
  connectFirestoreEmulator,
} from "firebase/firestore";

const useEmulator = process.env.BUN_PUBLIC_USE_EMULATOR === "true";

const app = initializeApp({
  apiKey: process.env.BUN_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.BUN_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.BUN_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.BUN_PUBLIC_FIREBASE_APP_ID,
});

// memoryLocalCache in dev avoids the persistentLocalCache IndexedDB race that
// causes connectFirestoreEmulator to silently fail if already started.
export const db = initializeFirestore(app, {
  localCache: useEmulator ? memoryLocalCache() : persistentLocalCache(),
});

export const auth = getAuth(app);

if (useEmulator) {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
}
