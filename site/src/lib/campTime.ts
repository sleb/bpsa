const TZ = "America/Los_Angeles";

const DAY_IDS = ["2026-06-18", "2026-06-19", "2026-06-20"] as const;
type DayId = (typeof DAY_IDS)[number];

function toISODate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, dateStyle: "short" }).format(date);
}

export function getTodayCampDay(now: Date = new Date()): DayId | null {
  const today = toISODate(now);
  return (DAY_IDS as readonly string[]).includes(today) ? (today as DayId) : null;
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
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

export function findActiveIndex(sorted: { time: string }[], nowMinutes: number): number {
  let active = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (parseTimeToMinutes(sorted[i]!.time) <= nowMinutes) {
      active = i;
    }
  }
  return active;
}

export function getRedirectDay(now: Date = new Date()): DayId {
  return getTodayCampDay(now) ?? DAY_IDS[0]
}

export function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h! >= 12 ? "PM" : "AM";
  const hour = h! % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
