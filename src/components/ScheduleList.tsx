import { ScheduleEntry } from "@/components/ScheduleEntry";
import { useActiveEntryId } from "@/hooks/useActiveEntryId";
import { Skeleton } from "@/components/ui/skeleton";
import { sortEntries } from "@/lib/entryUtils";
import type { ScheduleEntry as Entry } from "@/lib/types";

type Props = {
  entries: Entry[];
  loading?: boolean;
};

export function ScheduleList({ entries, loading }: Props) {
  const activeId = useActiveEntryId(entries);
  const sorted = sortEntries(entries);

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
        <ScheduleEntry key={entry.id} entry={entry} isActive={entry.id === activeId} />
      ))}
    </div>
  );
}
