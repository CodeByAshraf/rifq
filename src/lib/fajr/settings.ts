/**
 * Fajr alarm settings and today's alarm state, kept on this device only (localStorage).
 * Everything read from storage is validated, so a tampered or corrupted value can never
 * break the alarm screen.
 */
import { useSyncExternalStore } from "react";
import { cityById, METHODS, type MethodId } from "./places";

export type Level = "kid" | "adult";
export type KidChallenge = "dua" | "count" | "colors";
export type AdultChallenge = "math" | "memory" | "photo";
export type ChallengeId = KidChallenge | AdultChallenge;

export const KID_CHALLENGES: KidChallenge[] = ["dua", "count", "colors"];
export const ADULT_CHALLENGES: AdultChallenge[] = ["math", "memory", "photo"];

export type Place = { kind: "city"; id: string } | { kind: "gps"; lat: number; lng: number };

/** One alarm day: when it was solved and whether the "still awake?" check was answered. */
export interface DayState {
  solvedAt?: number;
  confirmedAt?: number;
}

export interface FajrSettings {
  enabled: boolean;
  place: Place | null;
  method: MethodId;
  /** Minutes relative to the Fajr adhan (negative = before). */
  offset: number;
  level: Level;
  /** Selected challenges; one is picked at random each morning. */
  challenges: ChallengeId[];
  /** Adult maths difficulty, 1..3. */
  difficulty: 1 | 2 | 3;
  wakeCheck: boolean;
  /** Sunday..Saturday (Date.getDay order). */
  days: boolean[];
  /** Per local day (YYYY-MM-DD). Only the last two weeks are kept. */
  log: Record<string, DayState>;
  /** A one-off test alarm (epoch ms), if one is pending. */
  testAt: number | null;
}

/** @public (tests) */
export const DEFAULT_SETTINGS: FajrSettings = {
  enabled: false,
  place: null,
  method: "Egyptian",
  offset: 0,
  level: "adult",
  challenges: ["math", "memory"],
  difficulty: 2,
  wakeCheck: true,
  days: [true, true, true, true, true, true, true],
  log: {},
  testAt: null,
};

const KEY = "rifq.fajr.v1";
const METHOD_IDS = new Set(METHODS.map((m) => m.id));
const ALL_CHALLENGES = new Set<string>([...KID_CHALLENGES, ...ADULT_CHALLENGES]);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const finite = (v: unknown, lo: number, hi: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function sanitizePlace(v: unknown): Place | null {
  if (!isObj(v)) return null;
  if (v.kind === "city" && typeof v.id === "string" && cityById(v.id)) return { kind: "city", id: v.id };
  if (v.kind === "gps" && finite(v.lat, -66, 66) && finite(v.lng, -180, 180)) {
    return { kind: "gps", lat: Math.round(v.lat * 100) / 100, lng: Math.round(v.lng * 100) / 100 };
  }
  return null;
}

/** Accepts anything and returns valid settings (unknown keys and bad values are dropped). */
/** @public (tests) */
export function sanitizeSettings(raw: unknown): FajrSettings {
  const s: FajrSettings = { ...DEFAULT_SETTINGS, days: [...DEFAULT_SETTINGS.days], log: {} };
  if (!isObj(raw)) return s;
  if (typeof raw.enabled === "boolean") s.enabled = raw.enabled;
  s.place = sanitizePlace(raw.place);
  if (typeof raw.method === "string" && METHOD_IDS.has(raw.method as MethodId)) s.method = raw.method as MethodId;
  if (finite(raw.offset, -60, 60)) s.offset = Math.round(raw.offset);
  if (raw.level === "kid" || raw.level === "adult") s.level = raw.level;
  if (Array.isArray(raw.challenges)) {
    const allowed = new Set<string>(s.level === "kid" ? KID_CHALLENGES : ADULT_CHALLENGES);
    const list = [...new Set(raw.challenges.filter((x): x is ChallengeId => typeof x === "string" && ALL_CHALLENGES.has(x) && allowed.has(x)))];
    s.challenges = list.length ? list : defaultChallenges(s.level);
  } else s.challenges = defaultChallenges(s.level);
  if (raw.difficulty === 1 || raw.difficulty === 2 || raw.difficulty === 3) s.difficulty = raw.difficulty;
  if (typeof raw.wakeCheck === "boolean") s.wakeCheck = raw.wakeCheck;
  if (Array.isArray(raw.days) && raw.days.length === 7 && raw.days.every((d) => typeof d === "boolean")) s.days = [...raw.days];
  if (isObj(raw.log)) {
    const keys = Object.keys(raw.log).filter((k) => ISO_DAY.test(k)).sort().slice(-14);
    for (const k of keys) {
      const d = raw.log[k];
      if (!isObj(d)) continue;
      const day: DayState = {};
      if (finite(d.solvedAt, 0, 9e15)) day.solvedAt = d.solvedAt;
      if (finite(d.confirmedAt, 0, 9e15)) day.confirmedAt = d.confirmedAt;
      s.log[k] = day;
    }
  }
  if (finite(raw.testAt, 0, 9e15)) s.testAt = raw.testAt;
  return s;
}

export const defaultChallenges = (level: Level): ChallengeId[] => (level === "kid" ? ["dua", "count", "colors"] : ["math", "memory"]);

// ---------- tiny external store ----------

let state: FajrSettings | null = null;
const listeners = new Set<() => void>();

function load(): FajrSettings {
  if (state) return state;
  try {
    state = sanitizeSettings(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    state = sanitizeSettings(null);
  }
  return state;
}

export function getSettings(): FajrSettings {
  return load();
}

export function updateSettings(patch: Partial<FajrSettings> | ((s: FajrSettings) => Partial<FajrSettings>)): FajrSettings {
  const cur = load();
  const next = sanitizeSettings({ ...cur, ...(typeof patch === "function" ? patch(cur) : patch) });
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
  return next;
}

export function setDay(day: string, patch: DayState) {
  updateSettings((s) => ({ log: { ...s.log, [day]: { ...s.log[day], ...patch } } }));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useFajrSettings(): FajrSettings {
  return useSyncExternalStore(subscribe, load, () => DEFAULT_SETTINGS);
}
