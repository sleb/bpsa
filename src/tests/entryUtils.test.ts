import { test, expect, describe } from "bun:test";
import { newEntry, sortEntries, reorderEntries } from "../lib/entryUtils";
import type { ScheduleEntry } from "../lib/types";

function entry(overrides: Partial<ScheduleEntry>): ScheduleEntry {
  return { id: "x", time: "09:00", activity: "", location: "", sortOrder: 0, ...overrides };
}

describe("newEntry", () => {
  test("returns unique ids on each call", () => {
    const a = newEntry();
    const b = newEntry();
    expect(a.id).not.toBe(b.id);
  });

  test("returns blank activity, location, and time", () => {
    const e = newEntry();
    expect(e.activity).toBe("");
    expect(e.location).toBe("");
    expect(e.time).toBe("");
  });
});

describe("sortEntries", () => {
  test("sorts by sortOrder ascending", () => {
    const entries = [
      entry({ id: "c", sortOrder: 3 }),
      entry({ id: "a", sortOrder: 1 }),
      entry({ id: "b", sortOrder: 2 }),
    ];
    const sorted = sortEntries(entries);
    expect(sorted.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  test("uses time as tiebreaker when sortOrder is equal", () => {
    const entries = [
      entry({ id: "late", sortOrder: 1, time: "14:00" }),
      entry({ id: "early", sortOrder: 1, time: "08:00" }),
    ];
    const sorted = sortEntries(entries);
    expect(sorted[0]!.id).toBe("early");
    expect(sorted[1]!.id).toBe("late");
  });

  test("does not mutate the original array", () => {
    const entries = [entry({ id: "b", sortOrder: 2 }), entry({ id: "a", sortOrder: 1 })];
    sortEntries(entries);
    expect(entries[0]!.id).toBe("b");
  });
});

describe("reorderEntries", () => {
  test("moves an entry from one index to another", () => {
    const entries = [
      entry({ id: "a", sortOrder: 1000 }),
      entry({ id: "b", sortOrder: 2000 }),
      entry({ id: "c", sortOrder: 3000 }),
    ];
    const result = reorderEntries(entries, 0, 2);
    expect(result.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  test("reassigns stable sortOrder values after reorder", () => {
    const entries = [
      entry({ id: "a", sortOrder: 1000 }),
      entry({ id: "b", sortOrder: 2000 }),
      entry({ id: "c", sortOrder: 3000 }),
    ];
    const result = reorderEntries(entries, 2, 0);
    expect(result[0]!.sortOrder).toBeLessThan(result[1]!.sortOrder);
    expect(result[1]!.sortOrder).toBeLessThan(result[2]!.sortOrder);
  });

  test("returns sorted original if fromIndex is out of bounds", () => {
    const entries = [entry({ id: "a", sortOrder: 1 })];
    const result = reorderEntries(entries, 5, 0);
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });
});
