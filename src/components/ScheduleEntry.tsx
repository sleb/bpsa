import { cn } from "@/lib/utils";
import { formatTime12h } from "@/lib/campTime";
import { Badge } from "@/components/ui/badge";
import type { ScheduleEntry as Entry } from "@/lib/types";

type Props = {
  entry: Entry;
  isActive: boolean;
};

export function ScheduleEntry({ entry, isActive }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-l-4 transition-colors",
        isActive
          ? "border-l-primary bg-primary/5"
          : "border-l-transparent"
      )}
    >
      <div className="w-16 shrink-0 pt-0.5 flex flex-col items-start gap-1">
        <span className="text-sm font-mono text-muted-foreground">
          {formatTime12h(entry.time)}
        </span>
        {isActive && <Badge className="text-[10px] px-1.5 py-0 leading-4">NOW</Badge>}
      </div>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium leading-snug", isActive && "text-primary")}>
          {entry.activity}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{entry.location}</p>
      </div>
    </div>
  );
}
