/**
 * Validates progress data coming from untrusted places (localStorage, which any
 * browser extension or the user can edit, and Supabase pulls). Anything malformed is
 * dropped or clamped instead of crashing the app or being rendered/synced as-is.
 * Pure function: no browser APIs, unit-tested in scripts/test-validation.mjs.
 */
import { clampInt, isIsoDay, isSafeId, isValidTime, isVerseKey, sanitizeName } from "./validation";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isIsoTime = (v: unknown): v is string => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
// Local ids are "c…" (base36), ids pulled from the account are "r…" (uuid prefix).
const CHILD_ID = /^[cr][a-z0-9]{1,20}$/;
const MAX_CHILDREN = 10;

function strArray(v: unknown, ok: (x: unknown) => boolean, max: number): string[] {
  return Array.isArray(v) ? (v.filter(ok) as string[]).slice(0, max) : [];
}

function intList(v: unknown[], min: number, max: number): number[] {
  return [...new Set(v.filter((n): n is number => Number.isInteger(n) && (n as number) >= min && (n as number) <= max))];
}

function record<T>(v: unknown, keyOk: (k: string) => boolean, map: (x: unknown) => T | undefined, max: number): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObj(v)) return out;
  let n = 0;
  for (const [k, x] of Object.entries(v)) {
    if (n >= max) break;
    if (k === "__proto__" || k === "constructor" || k === "prototype" || !keyOk(k)) continue;
    const m = map(x);
    if (m !== undefined) {
      out[k] = m;
      n++;
    }
  }
  return out;
}

const STATES = new Set(["not_started", "learning", "needs_revision", "good", "mastered"]);
// Must match the activity_log.kind CHECK constraint in the database.
const ACTIVITY_KINDS = new Set(["memorize", "revise", "lesson", "game", "read"]);

function verse(v: unknown) {
  if (!isObj(v) || !STATES.has(v.state as string)) return undefined;
  return {
    state: v.state as string,
    interval: clampInt(v.interval, 0, 3650),
    ease: Math.min(5, Math.max(1.3, Number(v.ease) || 2.5)),
    reps: clampInt(v.reps, 0, 100000),
    lapses: clampInt(v.lapses, 0, 100000),
    due: isIsoDay(v.due) ? v.due : "1970-01-01",
    lastReviewed: isIsoTime(v.lastReviewed) ? (v.lastReviewed as string) : "",
    firstLearned: isIsoTime(v.firstLearned) ? (v.firstLearned as string) : "",
  };
}

function childData(v: unknown) {
  const d = isObj(v) ? v : {};
  const ch = isObj(d.challenges) ? d.challenges : {};
  return {
    stars: clampInt(d.stars, 0, 10_000_000),
    verses: record(d.verses, isVerseKey, verse, 7000),
    lessons: record(d.lessons, isSafeId, (x) => (isObj(x) ? { completed: isIsoTime(x.completed) ? (x.completed as string) : "", quizScore: clampInt(x.quizScore, 0, 100) } : undefined), 500),
    games: record(d.games, isSafeId, (x) => (isObj(x) ? { best: clampInt(x.best, 0, 1_000_000), plays: clampInt(x.plays, 0, 1_000_000) } : undefined), 200),
    badges: record(d.badges, isSafeId, (x) => (isIsoTime(x) ? (x as string) : undefined), 200),
    bookmarks: strArray(d.bookmarks, isVerseKey, 1000),
    activeDays: strArray(d.activeDays, isIsoDay, 4000),
    activity: Array.isArray(d.activity)
      ? d.activity
          .filter((a): a is Obj => isObj(a) && ACTIVITY_KINDS.has(a.kind as string) && isIsoTime(a.at))
          .slice(0, 40)
          .map((a) => ({ kind: a.kind, label: sanitizeName(a.label, 80), stars: clampInt(a.stars, 0, 1000), at: a.at }))
      : [],
    unlockedDecor: strArray(d.unlockedDecor, isSafeId, 200),
    stories: record(d.stories, isSafeId, (x) => (isIsoTime(x) ? (x as string) : undefined), 500),
    certificates: record(d.certificates, isSafeId, (x) => (isIsoTime(x) ? (x as string) : undefined), 500),
    pendingCerts: strArray(d.pendingCerts, isSafeId, 50),
    adhkar: record(d.adhkar, isIsoDay, (x) => (Array.isArray(x) ? strArray(x, isSafeId, 20) : undefined), 400),
    challenges: {
      // Friday (local ISO day) -> parts read (0..9)
      kahf: record(ch.kahf, isIsoDay, (x) => (Array.isArray(x) ? intList(x, 0, 9) : undefined), 2000),
      // Hijri year -> juz read (1..30)
      ramadan: record(ch.ramadan, (k) => /^\d{4}$/.test(k), (x) => (Array.isArray(x) ? intList(x, 1, 30) : undefined), 100),
      // Hijri year -> local ISO days completed
      dhul: record(ch.dhul, (k) => /^\d{4}$/.test(k), (x) => (Array.isArray(x) ? strArray(x, isIsoDay, 20) : undefined), 100),
    },
    recordings: clampInt(d.recordings, 0, 1_000_000),
  };
}

const HEADWEAR = new Set(["kufi", "hijab", "none"]);
const ACCESSORY = new Set(["none", "scarf", "crown", "satchel"]);

function child(v: unknown) {
  if (!isObj(v) || typeof v.id !== "string" || !CHILD_ID.test(v.id)) return undefined;
  const av = isObj(v.avatar) ? v.avatar : {};
  const name = sanitizeName(v.name, 20) || "صديقي";
  return {
    id: v.id,
    name,
    avatar: {
      skin: clampInt(av.skin, 0, 4, 1), // SKIN has 5 tones
      outfit: clampInt(av.outfit, 0, 5, 0), // OUTFIT has 6 colours
      headwear: HEADWEAR.has(av.headwear as string) ? av.headwear : "kufi",
      accessory: ACCESSORY.has(av.accessory as string) ? av.accessory : "none",
    },
    weeklyGoalMinutes: clampInt(v.weeklyGoalMinutes, 5, 2000, 60),
    ...(v.dailyVerses !== undefined && { dailyVerses: clampInt(v.dailyVerses, 1, 50, 3) }),
    ...(v.weeklyDaysGoal !== undefined && { weeklyDaysGoal: clampInt(v.weeklyDaysGoal, 1, 7, 5) }),
    ...(typeof v.remoteId === "string" && /^[0-9a-f-]{36}$/i.test(v.remoteId) && { remoteId: v.remoteId }),
    ...((v.gender === "m" || v.gender === "f") && { gender: v.gender }),
  };
}

const ROLES = new Set(["kid", "parent", "adult"]); // "adult" (older versions) is read as "parent"
const safeHref = (h: unknown) => typeof h === "string" && /^\/[a-z0-9/-]{0,40}$/.test(h);

/** Returns a clean state, or null if the input is not recognisable progress data at all. */
export function sanitizeState<T>(input: unknown): T | null {
  if (!isObj(input) || input.version !== 1) return null;
  const children = (Array.isArray(input.children) ? input.children : []).map(child).filter(Boolean).slice(0, MAX_CHILDREN) as NonNullable<ReturnType<typeof child>>[];
  // De-duplicate ids.
  const seen = new Set<string>();
  const uniq = children.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  if (uniq.length === 0) return null;
  const data: Record<string, ReturnType<typeof childData>> = {};
  const rawData = isObj(input.data) ? input.data : {};
  for (const c of uniq) data[c.id] = childData(Object.prototype.hasOwnProperty.call(rawData, c.id) ? rawData[c.id] : undefined);

  const activeChildId = typeof input.activeChildId === "string" && seen.has(input.activeChildId) ? input.activeChildId : uniq[0].id;
  const out: Obj = {
    version: 1,
    activeChildId,
    children: uniq,
    data,
  };
  const f = input.focus;
  if (isObj(f) && isVerseKey(`${f.surah}:${f.ayah}`)) out.focus = { surah: Number(f.surah), ayah: Number(f.ayah) };
  const o = input.onboarding;
  if (isObj(o) && ROLES.has(o.role as string) && safeHref(o.startHref))
    out.onboarding = { role: o.role === "kid" ? "kid" : "parent", goal: isSafeId(o.goal) ? o.goal : "quran", startHref: o.startHref, done: isIsoTime(o.done) ? o.done : new Date().toISOString() };
  const r = input.reminder;
  if (isObj(r) && isValidTime(r.time)) out.reminder = { time: r.time, enabled: r.enabled === true };
  if (input.magdyDuas !== undefined) out.magdyDuas = clampInt(input.magdyDuas, 0, 100_000_000);
  if (isSafeId(input.openCert)) out.openCert = input.openCert;
  return out as T;
}
