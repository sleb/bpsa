import { describe, expect, test } from "bun:test";
import { formatTime12h, getRedirectDay } from "../lib/campTime";

const jun18PT = new Date("2026-06-18T19:00:00Z");
const jun19PT = new Date("2026-06-19T19:00:00Z");
const jun17PT = new Date("2026-06-17T19:00:00Z");
const jun21PT = new Date("2026-06-21T19:00:00Z");

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

  test("returns June 18 on June 18 PT", () => {
    expect(getRedirectDay(jun18PT)).toBe("2026-06-18");
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
