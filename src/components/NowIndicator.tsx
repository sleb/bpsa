import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getCurrentTimeMinutes, parseTimeToMinutes } from "@/lib/campTime";
import type { ScheduleEntry } from "@/lib/types";

type Props = {
  entries: ScheduleEntry[];
};

function findActiveIndex(entries: ScheduleEntry[], nowMinutes: number): number {
  const sorted = [...entries].sort((a, b) => a.sortOrder - b.sortOrder);
  let active = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (parseTimeToMinutes(sorted[i]!.time) <= nowMinutes) {
      active = i;
    }
  }
  return active;
}

export function useActiveEntryId(entries: ScheduleEntry[]): string | null {
  const [nowMinutes, setNowMinutes] = useState(() => getCurrentTimeMinutes());

  useEffect(() => {
    const id = setInterval(() => setNowMinutes(getCurrentTimeMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...entries].sort((a, b) => a.sortOrder - b.sortOrder);
  const idx = findActiveIndex(sorted, nowMinutes);
  return idx >= 0 ? (sorted[idx]?.id ?? null) : null;
}

export function NowBadge() {
  return (
    <div className="px-4 py-1">
      <Badge variant="default" className="text-xs">
        Now
      </Badge>
    </div>
  );
}

// Re-export for convenience
export { findActiveIndex };
