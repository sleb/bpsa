import { useState } from "react";
import { History, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { sortEntries } from "@/lib/entryUtils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { DayId, VersionDoc } from "@/lib/types";

type Props = {
  versions: VersionDoc[];
  onRestore: (versionId: string) => Promise<void>;
  dayId: DayId;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(date);
}

function VersionCard({
  version,
  onRestore,
}: {
  version: VersionDoc;
  onRestore: (versionId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      await onRestore(version.id);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">Version {version.versionNumber}</p>
          <p className="text-xs text-muted-foreground truncate">
            {formatDate(version.publishedAt)} · {version.publisherDisplayName}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 min-h-[36px] flex items-center gap-1"
          disabled={restoring}
          onClick={handleRestore}
        >
          <RotateCcw className="h-3 w-3" />
          {restoring ? "Restoring…" : "Restore"}
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent gap-1"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {version.entries.length} {version.entries.length === 1 ? "entry" : "entries"}
      </Button>

      {expanded && (
        <ul className="text-xs space-y-1 pl-2 border-l-2 border-muted">
          {version.entries.length === 0 ? (
            <li className="text-muted-foreground italic">Empty schedule</li>
          ) : (
            sortEntries(version.entries)
              .map((e) => (
                <li key={e.id} className="text-muted-foreground">
                  {e.time} · {e.activity} · {e.location}
                </li>
              ))
          )}
        </ul>
      )}
    </div>
  );
}

export function VersionHistorySheet({ versions, onRestore }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-[44px] flex items-center gap-1">
          <History className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">History</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published versions yet.</p>
          ) : (
            versions.map((v) => (
              <VersionCard key={v.id} version={v} onRestore={onRestore} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
