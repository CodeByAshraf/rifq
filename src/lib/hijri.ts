import { localDay } from "@/lib/dates";
/** Hijri calendar helpers based on the browser's Umm al-Qura calendar (Intl). */

const MONTHS = ["محرّم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوّال", "ذو القعدة", "ذو الحجّة"];

export interface HijriDate {
  day: number;
  month: number; // 1..12
  year: number;
  monthName: string;
}

export function toHijri(date = new Date()): HijriDate {
  for (const cal of ["islamic-umalqura", "islamic"]) {
    try {
      const parts = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(date);
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      const day = get("day");
      const month = get("month");
      const year = get("year");
      if (day && month && year) return { day, month, year, monthName: MONTHS[month - 1] };
    } catch {
      /* try next calendar */
    }
  }
  return { day: 1, month: 1, year: 1448, monthName: MONTHS[0] };
}

const ar = (n: number | string) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

export function formatHijri(date = new Date()) {
  const h = toHijri(date);
  return `${ar(h.day)} ${h.monthName} ${ar(h.year)} هـ`;
}

export function formatGregorian(date = new Date()) {
  try {
    return date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) + " م";
  } catch {
    return localDay(date);
  }
}

/** Approximate days until the next 1st of a Hijri month (month 1..12). */
export function daysUntilHijriMonth(month: number, from = new Date()) {
  const h = toHijri(from);
  let m = month - h.month;
  if (m < 0 || (m === 0 && h.day > 1)) m += 12;
  return Math.max(0, Math.round(m * 29.53 - (h.day - 1)));
}

/** Local ISO date (yyyy-mm-dd) of this week's Friday if today is Friday, otherwise null. */
export function fridayKey(d = new Date()) {
  return d.getDay() === 5 ? localDay(d) : null;
}
