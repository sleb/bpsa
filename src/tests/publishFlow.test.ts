import { test, expect, beforeAll, afterAll, beforeEach, describe } from "bun:test";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createTestEnv, EDITOR_UID, EDITOR_USER } from "./helpers/testEnv";
import { saveDraft, publishDraft, getSchedule, subscribeSchedule } from "../lib/scheduleService";
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

describe("publishDraft", () => {
  test("copies draftEntries to entries and clears hasDraft", async () => {
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.hasDraft).toBe(false);
    expect(schedule!.entries).toHaveLength(2);
    expect(schedule!.entries[0]!.id).toBe("a");
    expect(schedule!.entries[1]!.id).toBe("b");
  });

  test("increments publishedVersion on each publish", async () => {
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    expect((await getSchedule(db, dayId))!.publishedVersion).toBe(2);
  });

  test("participant subscriber receives updated entries after publish", async () => {
    await saveDraft(db, dayId, [entryA], EDITOR_UID, "Test Editor");
    const publicDb = testEnv.unauthenticatedContext().firestore();
    const received: ScheduleEntry[][] = [];
    const unsub = subscribeSchedule(publicDb, dayId, (s) => received.push(s.entries));
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    await new Promise((resolve) => setTimeout(resolve, 500));
    unsub();
    const last = received[received.length - 1]!;
    expect(last).toHaveLength(1);
    expect(last[0]!.id).toBe("a");
  });

  test("draftEntries and entries match after publish", async () => {
    await saveDraft(db, dayId, [entryA, entryB], EDITOR_UID, "Test Editor");
    await publishDraft(db, dayId, EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(db, dayId);
    expect(schedule!.draftEntries).toEqual(schedule!.entries);
  });
});
