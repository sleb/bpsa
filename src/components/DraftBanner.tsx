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

  // Clear confirm state once publish completes
  useEffect(() => {
    if (!publishing) setConfirming(false);
  }, [publishing]);

  function handleFirstTap() {
    setConfirming(true);
  }

  function handleConfirm() {
    setConfirming(false);
    onPublish();
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-amber-800 font-medium">You have unpublished changes</p>

        {publishing ? (
          <span className="flex items-center gap-1.5 text-sm text-amber-800">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
            Publishing…
          </span>
        ) : confirming ? (
          <span className="flex items-center gap-2">
            <Button
              size="sm"
              className="min-h-[44px] bg-amber-700 hover:bg-amber-800 text-white"
              onClick={handleConfirm}
            >
              Confirm publish
            </Button>
            <button
              className="text-xs text-amber-700 underline underline-offset-2 min-h-[44px]"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="min-h-[44px] border-amber-400 text-amber-900 hover:bg-amber-100"
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
