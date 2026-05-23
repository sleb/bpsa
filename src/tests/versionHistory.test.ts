import { test, expect, describe } from "bun:test";
import { setupEditorTest, TEST_DAY_ID, TEST_ENTRY_A, TEST_ENTRY_B, EDITOR_UID } from "./helpers/testEnv";
import { saveDraft, publishDraft, getVersions, restoreVersion, getSchedule } from "../lib/scheduleService";

const ctx = setupEditorTest();
const dayId = TEST_DAY_ID;

describe("publishDraft — version snapshots", () => {
  test("first publish creates v0001 with correct fields", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");

    const versions = await getVersions(ctx.testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe("v0001");
    expect(versions[0]!.versionNumber).toBe(1);
    expect(versions[0]!.publisherDisplayName).toBe("Test Editor");
    expect(versions[0]!.entries).toHaveLength(1);
    expect(versions[0]!.entries[0]!.id).toBe("a");
  });

  test("second publish creates v0002 alongside v0001", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");

    const versions = await getVersions(ctx.testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions).toHaveLength(2);
    expect(versions[0]!.versionNumber).toBe(2);
    expect(versions[0]!.id).toBe("v0002");
    expect(versions[1]!.versionNumber).toBe(1);
    expect(versions[1]!.id).toBe("v0001");
  });

  test("getVersions returns most recent first", async () => {
    for (const entries of [[TEST_ENTRY_A], [TEST_ENTRY_B], [TEST_ENTRY_A, TEST_ENTRY_B]]) {
      await saveDraft(ctx.db, dayId, entries, EDITOR_UID, "Test Editor");
      await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    }
    const versions = await getVersions(ctx.testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions[0]!.versionNumber).toBe(3);
    expect(versions[1]!.versionNumber).toBe(2);
    expect(versions[2]!.versionNumber).toBe(1);
  });

  test("21st publish overwrites v0001 slot (circular buffer)", async () => {
    for (let i = 0; i < 21; i++) {
      await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
      await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    }
    const versions = await getVersions(ctx.testEnv.unauthenticatedContext().firestore(), dayId);
    expect(versions).toHaveLength(20);
    expect(versions[0]!.versionNumber).toBe(21);
    expect(versions[0]!.id).toBe("v0001");
  });
});

describe("restoreVersion", () => {
  test("loads version entries as draft without publishing", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A, TEST_ENTRY_B], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");

    await restoreVersion(ctx.db, dayId, "v0001", EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(ctx.db, dayId);
    expect(schedule!.draftEntries).toHaveLength(1);
    expect(schedule!.draftEntries[0]!.id).toBe("a");
    expect(schedule!.entries).toHaveLength(2);
  });

  test("restoring current published version leaves draft matching published", async () => {
    await saveDraft(ctx.db, dayId, [TEST_ENTRY_A], EDITOR_UID, "Test Editor");
    await publishDraft(ctx.db, dayId, EDITOR_UID, "Test Editor");

    await restoreVersion(ctx.db, dayId, "v0001", EDITOR_UID, "Test Editor");
    const schedule = await getSchedule(ctx.db, dayId);
    expect(schedule!.draftEntries).toEqual(schedule!.entries);
  });
});
