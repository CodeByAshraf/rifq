/**
 * Fajr times and the alarm's state machine. Everything here is pure (no storage, no plugins)
 * so it can be unit-tested: given the settings and "now", it says what the alarm should be
 * doing and which notifications should be pending.
 */
import { Coordinates, HighLatitudeRule, PrayerTimes } from "adhan";
import { localDay } from "../dates";
import { cityById, methodParams } from "./places";
import type { FajrSettings, Place } from "./settings";

const MIN = 60_000;
/** The alarm keeps ringing (re-notifying) for this long if nobody solves the challenge. */
const RING_WINDOW = 60 * MIN;
/** "Still awake?" check: asked this long after solving… */
const CHECK_AFTER = 5 * MIN;
/** …and must be answered within this window, otherwise the alarm rings again. */
const CHECK_WINDOW = 2 * MIN;
/** How long a re-ring after a missed check stays active. */
const RECHECK_WINDOW = 25 * MIN;
const TEST_WINDOW = 20 * MIN;

function coordsOf(place: Place): { lat: number; lng: number } | null {
  if (place.kind === "gps") return { lat: place.lat, lng: place.lng };
  const city = cityById(place.id);
  return city ? { lat: city.lat, lng: city.lng } : null;
}

/** Fajr adhan time for a local calendar date (only the date part of `day` is used). */
export function fajrTime(s: Pick<FajrSettings, "place" | "method">, day: Date): Date | null {
  if (!s.place) return null;
  const c = coordsOf(s.place);
  if (!c) return null;
  const coords = new Coordinates(c.lat, c.lng);
  const params = methodParams(s.method);
  params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  const date = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const t = new PrayerTimes(coords, date, params).fajr;
  return Number.isNaN(t.getTime()) ? null : t;
}

/** Alarm time for a local date, or null if the alarm is off that weekday. */
export function alarmTime(s: FajrSettings, day: Date): Date | null {
  if (!s.days[day.getDay()]) return null;
  const f = fajrTime(s, day);
  return f ? new Date(f.getTime() + s.offset * MIN) : null;
}

/** The next alarm strictly after `now` (looks up to 8 days ahead). */
export function nextAlarm(s: FajrSettings, now: Date): Date | null {
  if (!s.enabled) return null;
  for (let i = 0; i <= 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const at = alarmTime(s, d);
    if (at && at.getTime() > now.getTime()) return at;
  }
  return null;
}

export type Phase =
  | { kind: "idle" }
  /** The challenge must be solved now. `again` = the "still awake?" check was missed. */
  | { kind: "ringing"; day: string; at: number; test: boolean; again: boolean }
  /** Solved; the "still awake?" question comes at `checkAt`. */
  | { kind: "waiting"; day: string; checkAt: number }
  /** Tap within the window to confirm you are awake. */
  | { kind: "check"; day: string; until: number }
  | { kind: "done"; day: string };

/** What the alarm is doing at `now`. */
export function phase(s: FajrSettings, now: Date): Phase {
  const t = now.getTime();
  if (s.testAt !== null && t >= s.testAt && t < s.testAt + TEST_WINDOW) {
    return { kind: "ringing", day: "test", at: s.testAt, test: true, again: false };
  }
  if (!s.enabled) return { kind: "idle" };
  // The alarm of a local day can fall before midnight when the offset is negative, so look at
  // today's and tomorrow's alarm.
  for (const add of [0, 1]) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add);
    const at = alarmTime(s, d);
    if (!at || t < at.getTime()) continue;
    const day = localDay(d);
    const log = s.log[day] ?? {};
    if (!log.solvedAt) {
      if (t < at.getTime() + RING_WINDOW) return { kind: "ringing", day, at: at.getTime(), test: false, again: false };
      continue; // missed: nothing more to do for that day
    }
    if (!s.wakeCheck || log.confirmedAt) return { kind: "done", day };
    const since = t - log.solvedAt;
    if (since < CHECK_AFTER) return { kind: "waiting", day, checkAt: log.solvedAt + CHECK_AFTER };
    if (since < CHECK_AFTER + CHECK_WINDOW) return { kind: "check", day, until: log.solvedAt + CHECK_AFTER + CHECK_WINDOW };
    if (since < CHECK_AFTER + CHECK_WINDOW + RECHECK_WINDOW) return { kind: "ringing", day, at: log.solvedAt + CHECK_AFTER + CHECK_WINDOW, test: false, again: true };
    return { kind: "done", day };
  }
  return { kind: "idle" };
}

// ---------- notification plan ----------

export type Platform = "android" | "ios";

/**
 * iOS keeps at most 64 pending notifications per app, so iOS rings less often and plans fewer
 * days ahead; the plan is renewed every time the app opens.
 */
/** @public (tests) */
export const BURST: Record<Platform, { every: number; count: number; days: number; recheck: number }> = {
  android: { every: 30_000, count: 40, days: 7, recheck: 10 },
  ios: { every: 60_000, count: 14, days: 3, recheck: 5 },
};

type PlanKind = "ring" | "check" | "renew" | "test";
export interface Planned {
  id: number;
  at: number;
  kind: PlanKind;
  day: string;
}

const ID_BASE = 20000;
const ID_TEST = 29000;
const ID_RENEW = 29900;
export const isFajrId = (id: number) => id >= ID_BASE && id < 30000;

/** Stable 0..7 slot per calendar day, so notification ids never collide inside the plan window. */
const slot = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000) % 8;

/** Every Fajr notification that should be pending at `now`. */
export function plan(s: FajrSettings, now: Date, platform: Platform): Planned[] {
  const b = BURST[platform];
  const t = now.getTime();
  const out: Planned[] = [];
  const push = (p: Planned) => {
    if (p.at > t) out.push(p);
  };

  if (s.testAt !== null) {
    for (let i = 0; i < Math.min(b.count, 10); i++) push({ id: ID_TEST + i, at: s.testAt + i * b.every, kind: "test", day: "test" });
  }
  if (!s.enabled || !s.place) return out;

  // The next `b.days` alarms that are not over yet (today's may already be past).
  let last: Date | null = null;
  let taken = 0;
  for (let i = 0; i <= b.days + 7 && taken < b.days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const at = alarmTime(s, d);
    if (!at || at.getTime() + RING_WINDOW + RECHECK_WINDOW < t) continue;
    taken++;
    const day = localDay(d);
    const base = ID_BASE + slot(d) * 100;
    const log = s.log[day] ?? {};
    if (!log.solvedAt) {
      for (let k = 0; k < b.count; k++) push({ id: base + k, at: at.getTime() + k * b.every, kind: "ring", day });
    } else if (s.wakeCheck && !log.confirmedAt) {
      const checkAt = log.solvedAt + CHECK_AFTER;
      push({ id: base + 60, at: checkAt, kind: "check", day });
      const again = checkAt + CHECK_WINDOW;
      for (let k = 0; k < b.recheck; k++) push({ id: base + 61 + k, at: again + k * b.every, kind: "ring", day });
    }
    last = d;
  }
  // Ask the user to open the app on the evening before the plan runs out.
  if (last) {
    const renew = new Date(last.getFullYear(), last.getMonth(), last.getDate() - 1, 21, 0, 0);
    if (renew.getTime() > t) push({ id: ID_RENEW, at: renew.getTime(), kind: "renew", day: localDay(renew) });
  }
  return out.sort((a, b2) => a.at - b2.at);
}
