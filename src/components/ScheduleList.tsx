import { ScheduleEntry } from "@/components/ScheduleEntry";
import { NowBadge, useActiveEntryId } from "@/components/NowIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScheduleEntry as Entry } from "@/lib/types";

type Props = {
  entries: Entry[];
  loading?: boolean;
};

export function ScheduleList({ entries, loading }: Props) {
  const activeId = useActiveEntryId(entries);
  const sorted = [...entries].sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading) {
    return (
      <div className="space-y-3 px-4 py-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No activities scheduled for this day yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {sorted.map((entry) => (
        <div key={entry.id}>
          {entry.id === activeId && <NowBadge />}
          <ScheduleEntry entry={entry} isActive={entry.id === activeId} />
        </div>
      ))}
    </div>
  );
}
