import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  onPublish: () => void;
  publishing: boolean;
  error: string | null;
};

export function DraftBanner({ onPublish, publishing, error }: Props) {
  const [confirming, setConfirming] = useState(false);

  // Auto-revert confirm state after 5 seconds of inactivity
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  function handleFirstTap() {
    setConfirming(true);
  }

  function handleConfirm() {
    setConfirming(false);
    onPublish();
  }

  return (
    <div className="bg-warning-bg border-b border-warning-border px-4 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-warning-fg font-medium">You have unpublished changes</p>

        {publishing ? (
          <span className="flex items-center gap-1.5 text-sm text-warning-fg">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-warning-fg border-t-transparent" />
            Publishing…
          </span>
        ) : confirming ? (
          <span className="flex items-center gap-2">
            <Button
              size="sm"
              className="min-h-[44px] bg-warning-strong hover:bg-warning-fg text-white"
              onClick={handleConfirm}
            >
              Confirm publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] text-xs text-warning-strong underline underline-offset-2 hover:bg-transparent hover:text-warning-fg"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="min-h-[44px] border-warning-subtle text-warning-fg hover:bg-warning-bg"
            onClick={handleFirstTap}
          >
            Publish
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
