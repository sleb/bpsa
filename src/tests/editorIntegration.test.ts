import { test, expect, describe } from "bun:test";
import { setupEditorTest, TEST_DAY_ID, TEST_ENTRY_A, TEST_ENTRY_B, EDITOR_UID } from "./helpers/testEnv";
import { saveDraft, publishDraft, getSchedule } from "../lib/scheduleService";

const ctx = setupEditorTest();
const dayId = TEST_DAY_ID;

describe("saveDraft (editor flow)", () => {
  test("saving two entries updates draftEntries and preserves published entries", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(ctx.db, dayId);
    expect(schedule!.draftEntries).toHaveLength(2);
    expect(schedule!.entries).toEqual([]);
  });

  test("saving again with one entry removed updates draftEntries", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(ctx.db, dayId);
    expect(schedule!.draftEntries).toHaveLength(1);
    expect(schedule!.draftEntries[0]!.id).toBe("a");
  });

  test("deleting all entries back to empty clears draftEntries", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await saveDraft(ctx.db, dayId, [], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(ctx.db, dayId);
    expect(schedule!.draftEntries).toHaveLength(0);
  });

  test("draft differs from published when entry added after publish", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(ctx.db, dayId);
    expect(schedule!.draftEntries).toHaveLength(2);
    expect(schedule!.entries).toHaveLength(1);
  });

  test("editing an entry updates it in draftEntries", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await saveDraft(ctx.db, dayId, [{ ...TEST_ENTRY_A, activity: "Updated Assembly" }], EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(ctx.db, dayId);
    expect(schedule!.draftEntries[0]!.activity).toBe("Updated Assembly");
  });
});
