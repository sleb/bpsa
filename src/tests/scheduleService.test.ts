import { test, expect, describe } from "bun:test";
import type { Firestore } from "firebase/firestore";
import { setupEditorTest, TEST_DAY_ID, TEST_ENTRY_A, TEST_ENTRY_B, EDITOR_UID } from "./helpers/testEnv";
import { getSchedule, saveDraft, publishDraft, subscribeSchedule } from "../lib/scheduleService";
import type { ScheduleEntry } from "../lib/types";

const ctx = setupEditorTest();
const dayId = TEST_DAY_ID;

describe("getSchedule", () => {
  test("returns null for a non-existent day", async () => {
    const publicDb = ctx.testEnv.unauthenticatedContext().firestore();
    expect(await getSchedule(publicDb, "2026-06-19")).toBeNull();
  });

  test("returns the schedule doc for a seeded day", async () => {
    const publicDb = ctx.testEnv.unauthenticatedContext().firestore();
    const result = await getSchedule(publicDb, dayId);
    expect(result).not.toBeNull();
    expect(result!.draftEntries).toHaveLength(0);
  });
});

describe("saveDraft", () => {
  test("stores draftEntries without affecting published entries", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    const result = await getSchedule(ctx.db, dayId);
    expect(result!.draftEntries).toHaveLength(2);
    expect(result!.draftEntries[0]!.id).toBe("a");
  });

  test("does not change published entries", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    const result = await getSchedule(ctx.db, dayId);
    expect(result!.entries).toEqual([]);
  });
});

describe("publishDraft", () => {
  test("copies draftEntries to entries on publish", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    const result = await getSchedule(ctx.db, dayId);
    expect(result!.entries).toHaveLength(2);
    expect(result!.entries[0]!.id).toBe("a");
  });

  test("increments publishedVersion", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    expect((await getSchedule(ctx.db, dayId))!.publishedVersion).toBe(1);

    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    expect((await getSchedule(ctx.db, dayId))!.publishedVersion).toBe(2);
  });
});

describe("subscribeSchedule", () => {
  test("fires callback with updated data after saveDraft", async () => {
    const received: ScheduleEntry[][] = [];
    const unsub = subscribeSchedule(ctx.db, dayId, (s) => received.push(s.draftEntries));
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await new Promise((resolve) => setTimeout(resolve, 500));
    unsub();
    const last = received[received.length - 1]!;
    expect(last[0]!.id).toBe("a");
  });

  test("unauthenticated subscriber receives updated entries after publish", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    const publicDb = ctx.testEnv.unauthenticatedContext().firestore();
    const received: ScheduleEntry[][] = [];
    const unsub = subscribeSchedule(publicDb, dayId, (s) => received.push(s.entries));
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    await new Promise((resolve) => setTimeout(resolve, 500));
    unsub();
    const last = received[received.length - 1]!;
    expect(last).toHaveLength(1);
    expect(last[0]!.id).toBe("a");
  });
});
