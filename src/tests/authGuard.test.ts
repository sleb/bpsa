import { test, expect, beforeAll, afterAll, beforeEach, describe } from "bun:test";
import { doc, setDoc } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createTestEnv } from "./helpers/testEnv";
import { resolveUserRole } from "../lib/authService";

// Tests the guard logic: resolveUserRole drives the RequireEditor redirect decision.
// We test the underlying function exhaustively rather than a React render.

let testEnv: RulesTestEnvironment;

beforeAll(async () => { testEnv = await createTestEnv(); });
afterAll(async () => { await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

describe("RequireEditor guard logic (resolveUserRole)", () => {
  test("unauthenticated uid → redirect to /login (null result)", async () => {
    const db = testEnv.authenticatedContext("no-such-uid").firestore();
    const result = await resolveUserRole(db, "no-such-uid");
    expect(result).toBeNull();
  });

  test("active editor → allow access (non-null result)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "editor-uid"), {
        role: "editor", active: true, email: "e@example.com",
        displayName: "Editor", provisionedAt: new Date(), provisionedBy: "admin",
      });
    });
    const db = testEnv.authenticatedContext("editor-uid").firestore();
    const result = await resolveUserRole(db, "editor-uid");
    expect(result).not.toBeNull();
    expect(result!.role).toBe("editor");
  });

  test("active admin → allow access", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "admin-uid"), {
        role: "admin", active: true, email: "a@example.com",
        displayName: "Admin", provisionedAt: new Date(), provisionedBy: "admin-uid",
      });
    });
    const db = testEnv.authenticatedContext("admin-uid").firestore();
    const result = await resolveUserRole(db, "admin-uid");
    expect(result).not.toBeNull();
    expect(result!.role).toBe("admin");
  });

  test("inactive user → redirect to /login (null result)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "inactive-uid"), {
        role: "editor", active: false, email: "e@example.com",
        displayName: "Inactive", provisionedAt: new Date(), provisionedBy: "admin",
      });
    });
    const db = testEnv.authenticatedContext("inactive-uid").firestore();
    const result = await resolveUserRole(db, "inactive-uid");
    expect(result).toBeNull();
  });
});
