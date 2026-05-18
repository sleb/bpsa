export type ScheduleEntry = {
  id: string;
  time: string; // "HH:MM" 24h
  activity: string;
  location: string;
  sortOrder: number;
};

export type DayId = "2026-06-18" | "2026-06-19" | "2026-06-20";
export const DAY_IDS: DayId[] = ["2026-06-18", "2026-06-19", "2026-06-20"];

export type ScheduleDoc = {
  entries: ScheduleEntry[];
  draftEntries: ScheduleEntry[];
  hasDraft: boolean;
  publishedVersion: number;
  publishedAt: Date | null;
  publishedBy: string | null;
  draftLastEditedAt: Date | null;
  draftLastEditedBy: string | null;
};

export type VersionDoc = {
  id: string; // "v0001"…"v0020" — the Firestore document ID
  versionNumber: number;
  publishedAt: Date;
  publishedBy: string;
  publisherDisplayName: string;
  entries: ScheduleEntry[];
};

export type UserDoc = {
  role: "editor" | "admin";
  active: boolean;
  email: string;
  displayName: string;
  provisionedAt: Date;
  provisionedBy: string;
};
