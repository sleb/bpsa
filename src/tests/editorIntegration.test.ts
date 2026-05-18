import { test, expect, beforeAll, afterAll, beforeEach, describe } from "bun:test";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createTestEnv, EDITOR_UID, EDITOR_USER } from "./helpers/testEnv";
import { saveDraft, publishDraft, getSchedule } from "../lib/scheduleService";
import type { ScheduleEntry } from "../lib/types";

let testEnv: RulesTestEnvironment;
let db: Firestore;

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
  db = testEnv.authenticatedContext(EDITOR_UID).firestore();
});

describe("saveDraft (editor flow)", () => {
  test("saving two entries sets hasDraft and preserves published entries", async () => {
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.hasDraft).toBe(true);
    expect(schedule!.draftEntries).toHaveLength(2);
    expect(schedule!.entries).toEqual([]);
  });

  test("saving again with one entry removed updates draftEntries", async () => {
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.draftEntries).toHaveLength(1);
    expect(schedule!.draftEntries[0]!.id).toBe("a");
  });

  test("deleting all entries back to empty matches published — hasDraft clears", async () => {
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await saveDraft(db, dayId, [], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.draftEntries).toHaveLength(0);
    expect(schedule!.hasDraft).toBe(false);
  });

  test("hasDraft stays true when draft differs from published", async () => {
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.hasDraft).toBe(true);
  });

  test("editing an entry updates it in draftEntries", async () => {
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await saveDraft(db, dayId, [{ ...entryA, activity: "Updated Assembly" }], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.draftEntries[0]!.activity).toBe("Updated Assembly");
  });
});
