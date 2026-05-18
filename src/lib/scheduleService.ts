import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import type { DayId, ScheduleDoc, ScheduleEntry, VersionDoc } from "./types";

function docToSchedule(data: Record<string, unknown>): ScheduleDoc {
  return {
    entries: (data["entries"] as ScheduleEntry[]) ?? [],
    draftEntries: (data["draftEntries"] as ScheduleEntry[]) ?? [],
    hasDraft: (data["hasDraft"] as boolean) ?? false,
    publishedVersion: (data["publishedVersion"] as number) ?? 0,
    publishedAt: data["publishedAt"]
      ? ((data["publishedAt"] as { toDate(): Date }).toDate())
      : null,
    publishedBy: (data["publishedBy"] as string) ?? null,
    draftLastEditedAt: data["draftLastEditedAt"]
      ? ((data["draftLastEditedAt"] as { toDate(): Date }).toDate())
      : null,
    draftLastEditedBy: (data["draftLastEditedBy"] as string) ?? null,
  };
}

export async function getSchedule(
  db: Firestore,
  dayId: DayId
): Promise<ScheduleDoc | null> {
  const snap = await getDoc(doc(db, "schedules", dayId));
  if (!snap.exists()) return null;
  return docToSchedule(snap.data() as Record<string, unknown>);
}

const EMPTY_SCHEDULE: ScheduleDoc = {
  entries: [],
  draftEntries: [],
  hasDraft: false,
  publishedVersion: 0,
  publishedAt: null,
  publishedBy: null,
  draftLastEditedAt: null,
  draftLastEditedBy: null,
};

export function subscribeSchedule(
  db: Firestore,
  dayId: DayId,
  callback: (schedule: ScheduleDoc) => void
): Unsubscribe {
  return onSnapshot(doc(db, "schedules", dayId), (snap) => {
    callback(snap.exists() ? docToSchedule(snap.data() as Record<string, unknown>) : EMPTY_SCHEDULE);
  });
}

function entriesEqual(a: ScheduleEntry[], b: ScheduleEntry[]): boolean {
  if (a.length !== b.length) return false;
  const sortById = (arr: ScheduleEntry[]) => [...arr].sort((x, y) => x.id.localeCompare(y.id));
  const sa = sortById(a);
  const sb = sortById(b);
  return sa.every((entry, i) =>
    entry.id === sb[i]!.id &&
    entry.time === sb[i]!.time &&
    entry.activity === sb[i]!.activity &&
    entry.location === sb[i]!.location
  );
}

export async function saveDraft(
  db: Firestore,
  dayId: DayId,
  entries: ScheduleEntry[],
  uid: string,
  displayName: string | undefined
): Promise<void> {
  const ref = doc(db, "schedules", dayId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const published = snap.exists()
      ? ((snap.data() as Record<string, unknown>)["entries"] as ScheduleEntry[]) ?? []
      : [];
    tx.set(ref, {
      draftEntries: entries,
      hasDraft: !entriesEqual(entries, published),
      draftLastEditedAt: serverTimestamp(),
      draftLastEditedBy: uid,
      draftLastEditedByName: displayName ?? null,
    }, { merge: true });
  });
}

function versionSlotId(version: number): string {
  const slot = ((version - 1) % 20) + 1;
  return "v" + String(slot).padStart(4, "0");
}

export async function publishDraft(
  db: Firestore,
  dayId: DayId,
  uid: string,
  displayName: string | undefined
): Promise<void> {
  const ref = doc(db, "schedules", dayId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists()
      ? (snap.data() as Record<string, unknown>)
      : ({} as Record<string, unknown>);
    const draft = (data["draftEntries"] as ScheduleEntry[]) ?? [];
    const version = ((data["publishedVersion"] as number) ?? 0) + 1;
    tx.set(ref, {
      ...data,
      entries: draft,
      draftEntries: draft,
      hasDraft: false,
      publishedVersion: version,
      publishedAt: serverTimestamp(),
      publishedBy: uid,
      publishedByName: displayName ?? null,
    });
    const versionRef = doc(db, "schedules", dayId, "versions", versionSlotId(version));
    tx.set(versionRef, {
      versionNumber: version,
      publishedAt: serverTimestamp(),
      publishedBy: uid,
      publisherDisplayName: displayName ?? null,
      entries: draft,
    });
  });
}

export async function getVersions(
  db: Firestore,
  dayId: DayId
): Promise<VersionDoc[]> {
  const snap = await getDocs(collection(db, "schedules", dayId, "versions"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        versionNumber: data["versionNumber"] as number,
        publishedAt: (data["publishedAt"] as { toDate(): Date }).toDate(),
        publishedBy: data["publishedBy"] as string,
        publisherDisplayName: data["publisherDisplayName"] as string,
        entries: (data["entries"] as ScheduleEntry[]) ?? [],
      };
    })
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function restoreVersion(
  db: Firestore,
  dayId: DayId,
  versionId: string,
  uid: string,
  displayName: string
): Promise<void> {
  const snap = await getDoc(doc(db, "schedules", dayId, "versions", versionId));
  if (!snap.exists()) throw new Error(`Version ${versionId} not found`);
  const entries = (snap.data() as { entries: ScheduleEntry[] }).entries;
  await saveDraft(db, dayId, entries, uid, displayName);
}
