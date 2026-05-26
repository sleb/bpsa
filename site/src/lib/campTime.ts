const TZ = "America/Los_Angeles";

const DAY_IDS = ["2026-06-18", "2026-06-19", "2026-06-20"] as const;
type DayId = (typeof DAY_IDS)[number];

function toISODate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, dateStyle: "short" }).format(date);
}

export function getTodayCampDay(now: Date = new Date()): DayId | null {
  const today = toISODate(now);
  return DAY_IDS.find((d) => d === today) ?? null;
}

export function getCurrentTimeMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const h = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const m = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  return h * 60 + m;
}

export function parseTimeToMinutes(time: string): number {
  return parseInt(time, 10) * 60 + parseInt(time.slice(3), 10);
}

export function getRedirectDay(now: Date = new Date()): DayId {
  return getTodayCampDay(now) ?? DAY_IDS[0]
}

export function formatTime12h(time: string): string {
  const h = parseInt(time, 10);
  const m = parseInt(time.slice(3), 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
