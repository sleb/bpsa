import { test, expect, beforeAll, afterAll, beforeEach, describe } from "bun:test";
import { doc, setDoc } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createTestEnv, EDITOR_UID, EDITOR_USER } from "./helpers/testEnv";
import { saveDraft, publishDraft, getVersions, restoreVersion, getSchedule } from "../lib/scheduleService";
import type { ScheduleEntry } from "../lib/types";

let testEnv: RulesTestEnvironment;

const dayId = "2026-06-18" as const;
const entryA: ScheduleEntry = { id: "a", time: "09:00", activity: "Assembly", location: "Pavilion", sortOrder: 1 };
const entryB: ScheduleEntry = { id: "b", time: "10:00", activity: "Swimming", location: "Lake", sortOrder: 2 };

beforeAll(async () => { testEnv = await createTestEnv(); });
afterAll(async () => { await testEnv.cleanup(); });

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const adminDb = ctx.firestore();
    await setDoc(doc(adminDb, "users", EDITOR_UID), EDITOR_USER);
    await setDoc(doc(adminDb, "schedules", dayId), {
      entries: [], draftEntries: [], hasDraft: false,
      publishedVersion: 0, publishedAt: null, publishedBy: null,
      draftLastEditedAt: null, draftLastEditedBy: null,
    });
  });
});

describe("publishDraft — version snapshots", () => {
  test("first publish creates v0001 with correct fields", async () => {
    const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");

    const versions = await getVersions(testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe("v0001");
    expect(versions[0]!.versionNumber).toBe(1);
    expect(versions[0]!.publisherDisplayName).toBe("Test Editor");
    expect(versions[0]!.entries).toHaveLength(1);
    expect(versions[0]!.entries[0]!.id).toBe("a");
  });

  test("second publish creates v0002 alongside v0001", async () => {
    const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");

    const versions = await getVersions(testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions).toHaveLength(2);
    expect(versions[0]!.versionNumber).toBe(2);
    expect(versions[0]!.id).toBe("v0002");
    expect(versions[1]!.versionNumber).toBe(1);
    expect(versions[1]!.id).toBe("v0001");
  });

  test("getVersions returns most recent first", async () => {
    const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
    for (const entries of [[entryA], [entryB], [entryA, entryB]]) {
      await saveDraft(db, dayId, entries, EDITOR_UID, "Test Editor");
      await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    }
    const versions = await getVersions(testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions[0]!.versionNumber).toBe(3);
    expect(versions[1]!.versionNumber).toBe(2);
    expect(versions[2]!.versionNumber).toBe(1);
  });

  test("21st publish overwrites v0001 slot (circular buffer)", async () => {
    const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
    for (let i = 0; i < 21; i++) {
      await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
      await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    }
    const versions = await getVersions(testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions).toHaveLength(20);
    expect(versions[0]!.versionNumber).toBe(21);
    expect(versions[0]!.id).toBe("v0001");
  });
});

describe("restoreVersion", () => {
  test("loads version entries as draft without publishing", async () => {
    const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");

    // Restore version 1 (entryA only)
    await restoreVersion(db, dayId, "v0001", EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.draftEntries).toHaveLength(1);
    expect(schedule!.draftEntries[0]!.id).toBe("a");
    // entries (published) still has v2 content
    expect(schedule!.entries).toHaveLength(2);
    // hasDraft because restored draft differs from current published
    expect(schedule!.hasDraft).toBe(true);
  });

  test("restoring current published version clears hasDraft", async () => {
    const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");

    await restoreVersion(db, dayId, "v0001", EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.hasDraft).toBe(false);
  });
});
