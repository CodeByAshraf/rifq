/**
 * Calendar-day helpers in the user's LOCAL time zone.
 * Never use `toISOString().slice(0, 10)` for day keys: it gives the UTC date, which is
 * yesterday between midnight and 02:00 in Cairo (03:00 in Makkah) and breaks streaks,
 * Friday/Kahf, daily adhkar and Ramadan tracking.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" of a date in local time. */
export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local day key "n" days from today (negative = past). */
export function dayOffset(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return localDay(d);
}

/** Local day of a stored value: full timestamps are converted, plain day keys pass through. */
export function dayOf(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : localDay(d);
}
