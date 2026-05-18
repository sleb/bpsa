import type { ScheduleEntry } from "./types";
import { parseTimeToMinutes } from "./campTime";

export function newEntry(): ScheduleEntry {
  return {
    id: crypto.randomUUID(),
    time: "",
    activity: "",
    location: "",
    sortOrder: Date.now(),
  };
}

export function sortEntries(entries: ScheduleEntry[]): ScheduleEntry[] {
  return [...entries].sort((a, b) => {
    const orderDiff = a.sortOrder - b.sortOrder;
    if (orderDiff !== 0) return orderDiff;
    return parseTimeToMinutes(a.time || "00:00") - parseTimeToMinutes(b.time || "00:00");
  });
}

export function reorderEntries(
  entries: ScheduleEntry[],
  fromIndex: number,
  toIndex: number
): ScheduleEntry[] {
  const sorted = sortEntries(entries);
  const result = [...sorted];
  const [moved] = result.splice(fromIndex, 1);
  if (!moved) return sorted;
  result.splice(toIndex, 0, moved);

  // Reassign sortOrder to reflect new positions
  return result.map((entry, i) => ({ ...entry, sortOrder: (i + 1) * 1000 }));
}
