import { useEffect, useState } from "react";
import { DayTabs } from "@/components/DayTabs";
import { EntryRow } from "@/components/EntryRow";
import { EntryForm } from "@/components/EntryForm";
import { DraftBanner } from "@/components/DraftBanner";
import { LastWriteWinsNote } from "@/components/LastWriteWinsNote";
import { VersionHistorySheet } from "@/components/VersionHistorySheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { subscribeSchedule, saveDraft, publishDraft, getVersions, restoreVersion, entriesEqual } from "@/lib/scheduleService";
import { toast } from "sonner";
import { sortEntries, newEntry } from "@/lib/entryUtils";
import { signOut } from "@/lib/authService";
import { db, auth } from "@/lib/firebase";
import { useAuthState } from "@/hooks/useAuthState";
import type { DayId, ScheduleEntry, VersionDoc } from "@/lib/types";

export function EditorPage() {
  const { user, userDoc } = useAuthState();
  const [selectedDay, setSelectedDay] = useState<DayId>("2026-06-18");
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [publishedEntries, setPublishedEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionDoc[]>([]);

  useEffect(() => {
    setLoading(true);
    setAddingNew(false);
    const unsub = subscribeSchedule(db, selectedDay, (schedule) => {
      setEntries(schedule.draftEntries);
      setPublishedEntries(schedule.entries);
      setLoading(false);
    });
    return unsub;
  }, [selectedDay]);

  useEffect(() => {
    getVersions(db, selectedDay).then(setVersions);
  }, [selectedDay]);

  async function handleSave(updated: ScheduleEntry) {
    const prev = entries;
    const next = entries.map((e) => (e.id === updated.id ? updated : e));
    setEntries(next);
    try {
      await saveDraft(db, selectedDay, next, user!.uid, editorName);
    } catch {
      setEntries(prev);
      toast.error("Save failed — check your connection and try again.");
    }
  }

  async function handleDelete(id: string) {
    const prev = entries;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    try {
      await saveDraft(db, selectedDay, next, user!.uid, editorName);
    } catch {
      setEntries(prev);
      toast.error("Save failed — check your connection and try again.");
    }
  }

  async function handleAddNew(entry: ScheduleEntry) {
    const prev = entries;
    const next = [...entries, entry];
    setEntries(next);
    setAddingNew(false);
    try {
      await saveDraft(db, selectedDay, next, user!.uid, editorName);
    } catch {
      setEntries(prev);
      setAddingNew(true);
      toast.error("Save failed — check your connection and try again.");
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      await publishDraft(db, selectedDay, user!.uid, editorName);
      getVersions(db, selectedDay).then(setVersions).catch(() => {});
    } catch {
      setPublishError("Publish failed — your draft is still saved. Try again.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleRestoreVersion(versionId: string) {
    try {
      await restoreVersion(db, selectedDay, versionId, user!.uid, editorName);
    } catch {
      toast.error("Restore failed — check your connection and try again.");
    }
  }

  async function handleRestore(entry: ScheduleEntry) {
    const prev = entries;
    const next = [...entries, entry];
    setEntries(next);
    try {
      await saveDraft(db, selectedDay, next, user!.uid, editorName);
    } catch {
      setEntries(prev);
      toast.error("Save failed — check your connection and try again.");
    }
  }

  const editorName = userDoc?.displayName ?? user?.displayName;
  const hasDraft = !entriesEqual(entries, publishedEntries);
  const sorted = sortEntries(entries);
  const draftIds = new Set(entries.map((e) => e.id));
  const publishedIds = new Set(publishedEntries.map((e) => e.id));
  const pendingDeletions = publishedEntries.filter((e) => !draftIds.has(e.id));

  return (
    <div className="max-w-lg mx-auto w-full min-h-screen">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold leading-tight">Schedule Editor</h1>
            <p className="text-xs text-muted-foreground">{userDoc?.displayName}</p>
          </div>
          <div className="flex items-center gap-1">
            <VersionHistorySheet
              versions={versions}
              onRestore={handleRestoreVersion}
              dayId={selectedDay}
            />
            <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={() => signOut(auth)}>
              Sign out
            </Button>
          </div>
        </div>
        <DayTabs selectedDay={selectedDay} onDayChange={setSelectedDay} />
      </header>

      {hasDraft && (
        <DraftBanner onPublish={handlePublish} publishing={publishing} error={publishError} />
      )}

      <LastWriteWinsNote />

      <main className="px-4 pb-8">
        {loading ? (
          <div className="space-y-3 py-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border mt-2">
              {sortEntries([...sorted, ...pendingDeletions])
                .map((entry) => ({ entry, deleted: !draftIds.has(entry.id) }))
                .map(({ entry, deleted }) =>
                  deleted ? (
                    <EntryRow key={entry.id} entry={entry} deleted onRestore={handleRestore} />
                  ) : (
                    <EntryRow key={entry.id} entry={entry} isPublished={publishedIds.has(entry.id)} onSave={handleSave} onDelete={handleDelete} />
                  )
                )}
            </div>

            {addingNew ? (
              <div className="mt-2">
                <EntryForm
                  entry={newEntry()}
                  onSave={handleAddNew}
                  onCancel={() => setAddingNew(false)}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full mt-4 min-h-[44px]"
                onClick={() => setAddingNew(true)}
              >
                + Add entry
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
