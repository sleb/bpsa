import { test, expect, beforeAll, afterAll, beforeEach, describe } from "bun:test";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut, type Auth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createTestEnv, PROJECT_ID } from "./helpers/testEnv";
import { resolveUserRole } from "../lib/authService";

const AUTH_CLEAR_URL = `http://localhost:9099/emulator/v1/projects/${PROJECT_ID}/accounts`;
const AUTH_SIGNUP_URL = `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`;

let testEnv: RulesTestEnvironment;
let authApp: FirebaseApp;
let auth: Auth;

beforeAll(async () => { testEnv = await createTestEnv(); });
afterAll(async () => { await testEnv.cleanup(); if (authApp) await deleteApp(authApp); });

beforeEach(async () => {
  await testEnv.clearFirestore();
  await fetch(AUTH_CLEAR_URL, { method: "DELETE" });
  if (authApp) await deleteApp(authApp);
  authApp = initializeApp({ projectId: PROJECT_ID, apiKey: "fake-api-key" }, `auth-test-${Date.now()}`);
  auth = getAuth(authApp);
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
});

async function createEmulatorUser(email: string, password: string): Promise<string> {
  const res = await fetch(AUTH_SIGNUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = (await res.json()) as { localId: string };
  return data.localId;
}

describe("resolveUserRole", () => {
  test("returns null for a uid with no document", async () => {
    const db = testEnv.authenticatedContext("nonexistent-uid").firestore();
    expect(await resolveUserRole(db, "nonexistent-uid")).toBeNull();
  });

  test("returns null for an inactive user", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "inactive-uid"), {
        role: "editor", active: false, email: "e@example.com",
        displayName: "Editor", provisionedAt: new Date(), provisionedBy: "admin",
      });
    });
    const db = testEnv.authenticatedContext("inactive-uid").firestore();
    expect(await resolveUserRole(db, "inactive-uid")).toBeNull();
  });

  test("returns UserDoc for an active editor", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "active-uid"), {
        role: "editor", active: true, email: "editor@example.com",
        displayName: "Active Editor", provisionedAt: new Date(), provisionedBy: "admin",
      });
    });
    const db = testEnv.authenticatedContext("active-uid").firestore();
    const result = await resolveUserRole(db, "active-uid");
    expect(result).not.toBeNull();
    expect(result!.role).toBe("editor");
    expect(result!.displayName).toBe("Active Editor");
  });

  test("returns UserDoc for an active admin", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "admin-uid"), {
        role: "admin", active: true, email: "admin@example.com",
        displayName: "Camp Admin", provisionedAt: new Date(), provisionedBy: "admin-uid",
      });
    });
    const db = testEnv.authenticatedContext("admin-uid").firestore();
    const result = await resolveUserRole(db, "admin-uid");
    expect(result).not.toBeNull();
    expect(result!.role).toBe("admin");
  });
});

describe("sign-in → role resolution (end-to-end with auth emulator)", () => {
  test("provisioned editor can sign in and resolve their role", async () => {
    const uid = await createEmulatorUser("editor@camp.test", "password123");
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", uid), {
        role: "editor", active: true, email: "editor@camp.test",
        displayName: "Camp Editor", provisionedAt: new Date(), provisionedBy: "admin",
      });
    });

    const { user } = await signInWithEmailAndPassword(auth, "editor@camp.test", "password123");
    expect(user.uid).toBe(uid);

    const db = testEnv.authenticatedContext(user.uid).firestore();
    const userDoc = await resolveUserRole(db, user.uid);
    expect(userDoc).not.toBeNull();
    expect(userDoc!.role).toBe("editor");

    await signOut(auth);
  });

  test("unprovisioned Google account is rejected after sign-in", async () => {
    await createEmulatorUser("unknown@camp.test", "password123");
    const { user } = await signInWithEmailAndPassword(auth, "unknown@camp.test", "password123");

    const db = testEnv.authenticatedContext(user.uid).firestore();
    const userDoc = await resolveUserRole(db, user.uid);
    expect(userDoc).toBeNull();

    await signOut(auth);
  });

  test("deactivated editor is rejected after sign-in", async () => {
    const uid = await createEmulatorUser("deactivated@camp.test", "password123");
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", uid), {
        role: "editor", active: false, email: "deactivated@camp.test",
        displayName: "Old Editor", provisionedAt: new Date(), provisionedBy: "admin",
      });
    });

    const { user } = await signInWithEmailAndPassword(auth, "deactivated@camp.test", "password123");
    const db = testEnv.authenticatedContext(user.uid).firestore();
    const userDoc = await resolveUserRole(db, user.uid);
    expect(userDoc).toBeNull();

    await signOut(auth);
  });
});
