import { test, expect, beforeAll, afterAll, beforeEach, describe } from "bun:test";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createTestEnv, PROJECT_ID, EDITOR_UID, EDITOR_USER } from "./helpers/testEnv";
import { getSchedule, saveDraft, publishDraft, subscribeSchedule } from "../lib/scheduleService";
import type { ScheduleEntry } from "../lib/types";

let testEnv: RulesTestEnvironment;
let db: Firestore; // authenticated as editor

const dayId = "2026-06-18" as const;
const entry1: ScheduleEntry = { id: "e1", time: "09:00", activity: "Morning Assembly", location: "Main Pavilion", sortOrder: 1 };
const entry2: ScheduleEntry = { id: "e2", time: "10:00", activity: "Swimming", location: "Lake", sortOrder: 2 };

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

describe("getSchedule", () => {
  test("returns null for a non-existent day", async () => {
    // Public read — use unauthenticated context
    const publicDb = testEnv.unauthenticatedContext().firestore();
    expect(await getSchedule(publicDb, "2026-06-19")).toBeNull();
  });

  test("returns the schedule doc for a seeded day", async () => {
    const publicDb = testEnv.unauthenticatedContext().firestore();
    const result = await getSchedule(publicDb, dayId);
    expect(result).not.toBeNull();
    expect(result!.hasDraft).toBe(false);
  });
});

describe("saveDraft", () => {
  test("sets hasDraft to true and stores draftEntries", async () => {
    await saveDraft(db, dayId, [entry1, entry2], EDITOR_UID, "Test Editor");
    const result = await getSchedule(db, dayId);
    expect(result!.hasDraft).toBe(true);
    expect(result!.draftEntries).toHaveLength(2);
    expect(result!.draftEntries[0]!.id).toBe("e1");
  });

  test("does not change published entries", async () => {
    await saveDraft(db, dayId, [entry1], EDITOR_UID, "Test Editor");
    const result = await getSchedule(db, dayId);
    expect(result!.entries).toEqual([]);
  });
});

describe("publishDraft", () => {
  test("copies draftEntries to entries and clears hasDraft", async () => {
    await saveDraft(db, dayId, [entry1, entry2], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    const result = await getSchedule(db, dayId);
    expect(result!.hasDraft).toBe(false);
    expect(result!.entries).toHaveLength(2);
    expect(result!.entries[0]!.id).toBe("e1");
  });

  test("increments publishedVersion", async () => {
    await saveDraft(db, dayId, [entry1], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    expect((await getSchedule(db, dayId))!.publishedVersion).toBe(1);

    await saveDraft(db, dayId, [entry1, entry2], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    expect((await getSchedule(db, dayId))!.publishedVersion).toBe(2);
  });
});

describe("subscribeSchedule", () => {
  test("fires callback with updated data after saveDraft", async () => {
    const received: ScheduleEntry[][] = [];
    const unsub = subscribeSchedule(db, dayId, (s) => received.push(s.draftEntries));
    await saveDraft(db, dayId, [entry1], EDITOR_UID, "Test Editor");
    await new Promise((resolve) => setTimeout(resolve, 500));
    unsub();
    const last = received[received.length - 1]!;
    expect(last[0]!.id).toBe("e1");
  });
});
