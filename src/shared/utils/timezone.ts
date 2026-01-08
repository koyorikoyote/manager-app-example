// Timezone utilities for consistent Asia/Tokyo handling across client and server-safe code

export const TOKYO_TZ = "Asia/Tokyo";

// Parse an HTML date input value (YYYY-MM-DD) as a Date representing Tokyo midnight for that day
export function parseISODateAsTokyo(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00+09:00`);
  return isNaN(d.getTime()) ? null : d;
}

// Parse an HTML date input value (YYYY-MM-DD) for database storage in JST
// Creates a Date that will be stored as midnight in the database's timezone
// When MySQL is configured with timezone=Asia/Tokyo, this ensures correct storage
export function parseISODateForStorage(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  // Create date without timezone offset - will be interpreted in server's local time
  // Since MySQL is configured with timezone=Asia/Tokyo, this will store as JST midnight
  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(year, month - 1, day, 0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

// Format any Date/string as YYYY-MM-DD for the day in Tokyo
export function toTokyoISODate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Human-readable long date in Tokyo, localized to en/ja
export function toTokyoDateLong(
  date: Date | string,
  locale: "en" | "ja" = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const loc = locale === "ja" ? "ja-JP" : "en-US";
  return new Intl.DateTimeFormat(loc, {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

// Human-readable date-time in Tokyo, localized to en/ja
export function toTokyoDateTime(
  date: Date | string,
  locale: "en" | "ja" = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const loc = locale === "ja" ? "ja-JP" : "en-US";
  return new Intl.DateTimeFormat(loc, {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

// Start/end of Tokyo day as actual instants (Date objects)
export function startOfTokyoDay(date: Date | string): Date {
  const ymd = toTokyoISODate(date);
  return new Date(`${ymd}T00:00:00+09:00`);
}

export function endOfTokyoDay(date: Date | string): Date {
  const ymd = toTokyoISODate(date);
  return new Date(`${ymd}T23:59:59.999+09:00`);
}

// Day-of-week number (0=Sunday..6=Saturday) for the day in Tokyo
export function getTokyoDayOfWeek(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return 0;
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TOKYO_TZ,
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

// Add days from a Tokyo-day anchor, returning a Date that represents Tokyo midnight of the resulting day
export function addTokyoDays(base: Date, days: number): Date {
  const anchor = startOfTokyoDay(base).getTime();
  return new Date(anchor + days * 24 * 60 * 60 * 1000);
}

// Difference in days between given date and now, measured by Tokyo day boundaries
export function calculateTokyoDaysPassed(from: Date | string): number {
  const start = startOfTokyoDay(from).getTime();
  const nowStart = startOfTokyoDay(new Date()).getTime();
  const diff = Math.abs(nowStart - start);
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
