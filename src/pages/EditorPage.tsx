import { useEffect, useState } from "react";
import { DayTabs } from "@/components/DayTabs";
import { EntryRow } from "@/components/EntryRow";
import { EntryForm } from "@/components/EntryForm";
import { DraftBanner } from "@/components/DraftBanner";
import { LastWriteWinsNote } from "@/components/LastWriteWinsNote";
import { VersionHistorySheet } from "@/components/VersionHistorySheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { subscribeSchedule, saveDraft, publishDraft, getVersions, restoreVersion } from "@/lib/scheduleService";
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
  const [hasDraft, setHasDraft] = useState(false);
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
      setHasDraft(schedule.hasDraft);
      setLoading(false);
    });
    return unsub;
  }, [selectedDay]);

  useEffect(() => {
    getVersions(db, selectedDay).then(setVersions);
  }, [selectedDay]);

  function handleSave(updated: ScheduleEntry) {
    const next = entries.map((e) => (e.id === updated.id ? updated : e));
    setEntries(next);
    setHasDraft(true);
    saveDraft(db, selectedDay, next, user!.uid, editorName);
  }

  function handleDelete(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    setHasDraft(true);
    saveDraft(db, selectedDay, next, user!.uid, editorName);
  }

  function handleAddNew(entry: ScheduleEntry) {
    const next = [...entries, entry];
    setEntries(next);
    setAddingNew(false);
    setHasDraft(true);
    saveDraft(db, selectedDay, next, user!.uid, editorName);
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      await publishDraft(db, selectedDay, user!.uid, editorName);
      getVersions(db, selectedDay).then(setVersions);
    } catch {
      setPublishError("Publish failed — your draft is still saved. Try again.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleRestoreVersion(versionId: string) {
    await restoreVersion(db, selectedDay, versionId, user!.uid, editorName);
    setHasDraft(true);
  }

  function handleRestore(entry: ScheduleEntry) {
    const next = [...entries, entry];
    setEntries(next);
    saveDraft(db, selectedDay, next, user!.uid, editorName);
  }

  const editorName = userDoc?.displayName ?? user?.displayName ?? undefined;
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
              {[
                ...sorted.map((e) => ({ entry: e, deleted: false as const })),
                ...pendingDeletions.map((e) => ({ entry: e, deleted: true as const })),
              ]
                .sort((a, b) => a.entry.sortOrder - b.entry.sortOrder)
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
