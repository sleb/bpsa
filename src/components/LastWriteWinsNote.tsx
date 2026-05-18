import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bpsa-lww-dismissed";

export function LastWriteWinsNote() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mx-4 mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <span className="flex-1">
        Note: if two editors save at the same time, the last save wins. Coordinate with your team.
      </span>
      <Button variant="ghost" size="icon" className="shrink-0 h-5 w-5 mt-0.5" onClick={dismiss} aria-label="Dismiss">
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
