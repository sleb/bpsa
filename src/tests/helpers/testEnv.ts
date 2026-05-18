import { beforeAll, afterAll, beforeEach } from "bun:test";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { readFileSync } from "fs";
import type { ScheduleEntry } from "../../lib/types";

export const PROJECT_ID = "bpsa26-5a752";
export const EDITOR_UID = "test-editor-uid";
export const EDITOR_USER = {
  role: "editor" as const,
  active: true,
  email: "editor@test.com",
  displayName: "Test Editor",
  provisionedAt: new Date(),
  provisionedBy: "admin",
};

export const TEST_DAY_ID = "2026-06-18" as const;

export const TEST_ENTRY_A: ScheduleEntry = { id: "a", time: "09:00", activity: "Assembly", location: "Pavilion", sortOrder: 1 };
export const TEST_ENTRY_B: ScheduleEntry = { id: "b", time: "10:00", activity: "Swimming", location: "Lake", sortOrder: 2 };

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
}

export function setupEditorTest() {
  let testEnv!: RulesTestEnvironment;
  let db!: Firestore;

  beforeAll(async () => { testEnv = await createTestEnv(); });
  afterAll(async () => { await testEnv.cleanup(); });
  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, "users", EDITOR_UID), EDITOR_USER);
      await setDoc(doc(adminDb, "schedules", TEST_DAY_ID), {
        entries: [], draftEntries: [],
        publishedVersion: 0, publishedAt: null, publishedBy: null,
        draftLastEditedAt: null, draftLastEditedBy: null,
      });
    });
    db = testEnv.authenticatedContext(EDITOR_UID).firestore();
  });

  return {
    get testEnv() { return testEnv; },
    get db() { return db; },
  };
}
