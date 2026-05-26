import { describe, expect, test } from "bun:test";
import {
  formatTime12h,
  getCurrentTimeMinutes,
  getRedirectDay,
  getTodayCampDay,
  parseTimeToMinutes,
} from "../lib/campTime";

// June 18 2026 noon Pacific = June 18 2026 19:00 UTC
const jun18PT = new Date("2026-06-18T19:00:00Z");
const jun19PT = new Date("2026-06-19T19:00:00Z");
const jun20PT = new Date("2026-06-20T19:00:00Z");
const jun17PT = new Date("2026-06-17T19:00:00Z");
const jun21PT = new Date("2026-06-21T19:00:00Z");

describe("getTodayCampDay", () => {
  test("returns 2026-06-18 on June 18 PT", () => {
    expect(getTodayCampDay(jun18PT)).toBe("2026-06-18");
  });

  test("returns 2026-06-19 on June 19 PT", () => {
    expect(getTodayCampDay(jun19PT)).toBe("2026-06-19");
  });

  test("returns 2026-06-20 on June 20 PT", () => {
    expect(getTodayCampDay(jun20PT)).toBe("2026-06-20");
  });

  test("returns null before camp (June 17)", () => {
    expect(getTodayCampDay(jun17PT)).toBeNull();
  });

  test("returns null after camp (June 21)", () => {
    expect(getTodayCampDay(jun21PT)).toBeNull();
  });
});

describe("parseTimeToMinutes", () => {
  test("09:30 = 570", () => {
    expect(parseTimeToMinutes("09:30")).toBe(570);
  });

  test("00:00 = 0", () => {
    expect(parseTimeToMinutes("00:00")).toBe(0);
  });

  test("23:59 = 1439", () => {
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });

  test("12:00 = 720", () => {
    expect(parseTimeToMinutes("12:00")).toBe(720);
  });
});

describe("formatTime12h", () => {
  test("09:00 → 9:00 AM", () => {
    expect(formatTime12h("09:00")).toBe("9:00 AM");
  });

  test("13:30 → 1:30 PM", () => {
    expect(formatTime12h("13:30")).toBe("1:30 PM");
  });

  test("12:00 → 12:00 PM", () => {
    expect(formatTime12h("12:00")).toBe("12:00 PM");
  });

  test("00:00 → 12:00 AM", () => {
    expect(formatTime12h("00:00")).toBe("12:00 AM");
  });
});

describe("getRedirectDay", () => {
  test("returns the camp day on a camp day", () => {
    expect(getRedirectDay(jun19PT)).toBe("2026-06-19");
  });

  test("falls back to June 18 before camp", () => {
    expect(getRedirectDay(jun17PT)).toBe("2026-06-18");
  });

  test("falls back to June 18 after camp", () => {
    expect(getRedirectDay(jun21PT)).toBe("2026-06-18");
  });
});

describe("getCurrentTimeMinutes", () => {
  test("noon UTC = 12:00 PT in summer (PDT = UTC-7), so 12:00 UTC = 5:00 AM PT = 300 min", () => {
    const noonUTC = new Date("2026-06-18T12:00:00Z");
    expect(getCurrentTimeMinutes(noonUTC)).toBe(5 * 60); // PDT is UTC-7
  });
});
