import { useEffect, useState } from "react";
import { getCurrentTimeMinutes, findActiveIndex } from "@/lib/campTime";
import { sortEntries } from "@/lib/entryUtils";
import type { ScheduleEntry } from "@/lib/types";

export function useActiveEntryId(entries: ScheduleEntry[]): string | null {
  const [nowMinutes, setNowMinutes] = useState(() => getCurrentTimeMinutes());

  useEffect(() => {
    const id = setInterval(() => setNowMinutes(getCurrentTimeMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sorted = sortEntries(entries);
  const idx = findActiveIndex(sorted, nowMinutes);
  return idx >= 0 ? (sorted[idx]?.id ?? null) : null;
}
