import { useSyncExternalStore } from "react";
import { BADGES, type BadgeId } from "@/data/badges";
import { earnedCertificates } from "@/data/certificates";
import { nextReview, type Rating } from "@/lib/srs";
import { sanitizeState } from "@/lib/state-guard";
import { clampInt, isValidName, isValidTime, sanitizeName } from "@/lib/validation";
import { localDay } from "@/lib/dates";
import { rewardBase, trackMotivation, type Reward, type RewardKind } from "@/lib/motivation";

/** Memorization states tracked per verse. */
export type VerseState = "not_started" | "learning" | "needs_revision" | "good" | "mastered";

export interface VerseProgress {
  state: VerseState;
  /** Spaced-repetition interval in days. */
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  /** ISO date (yyyy-mm-dd) when the verse is next due. */
  due: string;
  lastReviewed: string;
  firstLearned: string;
}

export interface Avatar {
  skin: number;
  outfit: number;
  headwear: "kufi" | "hijab" | "none";
  accessory: "none" | "scarf" | "crown" | "satchel";
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: Avatar;
  weeklyGoalMinutes: number;
  /** Memorization plan: new verses per day. */
  dailyVerses?: number;
  /** Weekly goal: number of active learning days. */
  weeklyDaysGoal?: number;
  /** Supabase `children.id` once synced. */
  remoteId?: string;
  /** Used for Arabic grammar on certificates ("أتمّ" / "أتمّت"). */
  gender?: "m" | "f";
}

export interface ActivityEntry {
  at: string;
  kind: "memorize" | "revise" | "lesson" | "game" | "read";
  label: string;
  stars: number;
}

export interface ProgressState {
  version: 1;
  activeChildId: string;
  children: ChildProfile[];
  /** Verse the learner chose to work on next (memorization center). */
  focus?: { surah: number; ayah: number };
  /** Answers from the welcome tour with Noor. */
  onboarding?: { role: "kid" | "parent"; goal: string; startHref: string; done: string };
  /** Data per child id. */
  data: Record<string, ChildData>;
  /** Daily reminder preference. */
  reminder?: { time: string; enabled: boolean };
  /** How many times this device prayed for Baba Magdy. */
  magdyDuas?: number;
  /** Certificate to open when the certificates page loads. */
  openCert?: string;
}

export interface ChildData {
  stars: number;
  verses: Record<string, VerseProgress>; // key: "surah:ayah"
  lessons: Record<string, { completed: string; quizScore: number }>;
  games: Record<string, { best: number; plays: number }>;
  badges: Partial<Record<BadgeId, string>>;
  bookmarks: string[];
  activeDays: string[]; // ISO dates
  activity: ActivityEntry[];
  unlockedDecor: string[];
  /** Completed stories: id -> ISO date. Optional for older saved data. */
  stories?: Record<string, string>;
  /** Earned certificates: id -> ISO date. */
  certificates?: Record<string, string>;
  /** Newly earned certificates waiting to be announced. */
  pendingCerts?: string[];
  /** Adhkar sections completed per day: ISO date -> section ids. */
  adhkar?: Record<string, string[]>;
  /** Seasonal challenges progress. */
  challenges?: {
    kahf?: Record<string, number[]>; // Friday ISO date -> parts read (0..9)
    ramadan?: Record<string, number[]>; // Hijri year -> juz read (1..30)
    dhul?: Record<string, string[]>; // Hijri year -> ISO dates completed
  };
  /** Number of recitations the learner recorded. */
  recordings?: number;
  /** Local ISO days on which all of the day's missions were done. */
  goalDays?: string[];
  /** «هدية من بابا وماما»: the reward a parent promised. */
  reward?: Reward;
  /** Celebrations already shown: goal = ISO day, ladder = step index, reward = its `reached` time. */
  seen?: { goal?: string; ladder?: number; reward?: string };
}

const KEY = "rifq.progress.v1";

export const today = () => localDay();
export const verseKey = (s: number, a: number) => `${s}:${a}`;

const defaultAvatar: Avatar = { skin: 1, outfit: 0, headwear: "kufi", accessory: "none" };

function emptyChild(): ChildData {
  return { stars: 0, verses: {}, lessons: {}, games: {}, badges: {}, bookmarks: [], activeDays: [], activity: [], unlockedDecor: [] };
}

function initial(): ProgressState {
  return {
    version: 1,
    activeChildId: "c1",
    children: [{ id: "c1", name: "صديقي", avatar: defaultAvatar, weeklyGoalMinutes: 60 }],
    data: { c1: emptyChild() },
  };
}

let state: ProgressState = initial();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      // localStorage is user-editable: validate before trusting it.
      const parsed = sanitizeState<ProgressState>(JSON.parse(raw));
      if (parsed) state = catchUpCertificates(parsed);
    }
  } catch {
    // Storage may be unavailable (private mode, sandboxed frames). Keep in-memory state.
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(updater: (s: ProgressState) => ProgressState) {
  load();
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSnapshot = initial();

export function useProgress<T>(selector: (s: ProgressState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return selector(state);
    },
    () => selector(serverSnapshot),
  );
}

export const getState = () => {
  load();
  return state;
};

export function useChild() {
  const child = useProgress((s) => s.children.find((c) => c.id === s.activeChildId) ?? s.children[0]);
  const data = useProgress((s) => s.data[s.activeChildId] ?? EMPTY);
  return { child, data };
}
const EMPTY = emptyChild();

// ---------- mutations ----------

function updateChild(fn: (d: ChildData) => ChildData) {
  set((s) => {
    const id = s.activeChildId;
    const d = s.data[id] ?? emptyChild();
    const t = today();
    const withDay = d.activeDays.includes(t) ? d : { ...d, activeDays: [...d.activeDays, t].slice(-120) };
    const next = trackMotivation(awardCertificates(awardBadges(fn(withDay))), t, new Date().toISOString());
    return { ...s, data: { ...s.data, [id]: next } };
  });
}

export const actions = {
  finishOnboarding(o: { role: "kid" | "parent"; goal: string; startHref: string; dailyVerses?: number }) {
    set((s) => ({
      ...s,
      onboarding: { role: o.role, goal: o.goal, startHref: o.startHref, done: today() },
      children: o.dailyVerses ? s.children.map((c) => (c.id === s.activeChildId ? { ...c, dailyVerses: o.dailyVerses } : c)) : s.children,
    }));
  },
  setFocus(surah: number, ayah: number) {
    set((s) => ({ ...s, focus: { surah, ayah } }));
  },
  setActiveChild(id: string) {
    set((s) => ({ ...s, activeChildId: id }));
  },
  addChild(rawName: string) {
    const name = sanitizeName(rawName, 20);
    if (!isValidName(name, 20)) return;
    const id = `c${Date.now().toString(36)}`;
    set((s) => s.children.length >= 10 ? s : ({
      ...s,
      children: [...s.children, { id, name, avatar: { ...defaultAvatar, outfit: s.children.length % 5 }, weeklyGoalMinutes: 60 }],
      data: { ...s.data, [id]: emptyChild() },
    }));
  },
  updateChildProfile(id: string, raw: Partial<ChildProfile>) {
    const patch: Partial<ChildProfile> = {};
    if (raw.name !== undefined) {
      const n = sanitizeName(raw.name, 20);
      if (isValidName(n, 20)) patch.name = n;
    }
    if (raw.gender === "m" || raw.gender === "f") patch.gender = raw.gender;
    if (raw.dailyVerses !== undefined) patch.dailyVerses = clampInt(raw.dailyVerses, 1, 50, 3);
    if (raw.weeklyDaysGoal !== undefined) patch.weeklyDaysGoal = clampInt(raw.weeklyDaysGoal, 1, 7, 5);
    if (raw.weeklyGoalMinutes !== undefined) patch.weeklyGoalMinutes = clampInt(raw.weeklyGoalMinutes, 5, 2000, 60);
    if (typeof raw.remoteId === "string" && /^[0-9a-f-]{36}$/i.test(raw.remoteId)) patch.remoteId = raw.remoteId;
    if (Object.keys(patch).length === 0) return;
    set((s) => ({ ...s, children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  },
  addStars(n: number, entry?: Omit<ActivityEntry, "at" | "stars">) {
    updateChild((d) => ({
      ...d,
      stars: d.stars + n,
      activity: entry ? [{ ...entry, stars: n, at: new Date().toISOString() }, ...d.activity].slice(0, 40) : d.activity,
    }));
  },
  /** Record a memorization or revision result for one verse. */
  rateVerse(s: number, a: number, rating: Rating) {
    updateChild((d) => {
      const k = verseKey(s, a);
      const prev = d.verses[k];
      return { ...d, verses: { ...d.verses, [k]: nextReview(prev, rating) } };
    });
  },
  toggleBookmark(s: number, a: number) {
    updateChild((d) => {
      const k = verseKey(s, a);
      const has = d.bookmarks.includes(k);
      return { ...d, bookmarks: has ? d.bookmarks.filter((b) => b !== k) : [...d.bookmarks, k] };
    });
  },
  completeLesson(id: string, quizScore: number, label: string) {
    updateChild((d) => ({
      ...d,
      stars: d.stars + 5,
      lessons: { ...d.lessons, [id]: { completed: today(), quizScore: Math.max(quizScore, d.lessons[id]?.quizScore ?? 0) } },
      activity: [{ kind: "lesson" as const, label, stars: 5, at: new Date().toISOString() }, ...d.activity].slice(0, 40),
    }));
  },
  recordGame(id: string, score: number, label: string) {
    updateChild((d) => {
      const g = d.games[id] ?? { best: 0, plays: 0 };
      const stars = Math.max(1, Math.round(score / 2));
      return {
        ...d,
        stars: d.stars + stars,
        games: { ...d.games, [id]: { best: Math.max(g.best, score), plays: g.plays + 1 } },
        activity: [{ kind: "game" as const, label, stars, at: new Date().toISOString() }, ...d.activity].slice(0, 40),
      };
    });
  },
  completeStory(id: string, title: string, quizScore: number) {
    updateChild((d) => {
      const first = !d.stories?.[id];
      const stars = first ? 3 + quizScore : 1;
      return {
        ...d,
        stars: d.stars + stars,
        stories: { ...(d.stories ?? {}), [id]: today() },
        activity: [{ kind: "read" as const, label: `قصة ${title}`, stars, at: new Date().toISOString() }, ...d.activity].slice(0, 40),
      };
    });
  },
  dismissCert(id: string) {
    updateChild((d) => ({ ...d, pendingCerts: (d.pendingCerts ?? []).filter((x) => x !== id) }));
  },
  setOpenCert(id?: string) {
    set((s) => ({ ...s, openCert: id }));
  },
  completeAdhkar(section: string, label: string) {
    updateChild((d) => {
      const t = today();
      const doneToday = d.adhkar?.[t] ?? [];
      if (doneToday.includes(section)) return d;
      return {
        ...d,
        stars: d.stars + 3,
        adhkar: { ...(d.adhkar ?? {}), [t]: [...doneToday, section] },
        activity: [{ kind: "read" as const, label, stars: 3, at: new Date().toISOString() }, ...d.activity].slice(0, 40),
      };
    });
  },
  toggleChallenge(kind: "kahf" | "ramadan", key: string, part: number) {
    updateChild((d) => {
      const ch = d.challenges ?? {};
      const map = { ...(ch[kind] ?? {}) };
      const cur = map[key] ?? [];
      const has = cur.includes(part);
      map[key] = has ? cur.filter((x) => x !== part) : [...cur, part];
      return { ...d, stars: d.stars + (has ? 0 : 1), challenges: { ...ch, [kind]: map } };
    });
  },
  markDhulDay(year: string) {
    updateChild((d) => {
      const ch = d.challenges ?? {};
      const map = { ...(ch.dhul ?? {}) };
      const t = today();
      if ((map[year] ?? []).includes(t)) return d;
      map[year] = [...(map[year] ?? []), t];
      return { ...d, stars: d.stars + 2, challenges: { ...ch, dhul: map } };
    });
  },
  addRecording(label: string) {
    updateChild((d) => ({
      ...d,
      stars: d.stars + 2,
      recordings: (d.recordings ?? 0) + 1,
      activity: [{ kind: "read" as const, label, stars: 2, at: new Date().toISOString() }, ...d.activity].slice(0, 40),
    }));
  },
  /** Parent sets (or replaces) a child's reward. `n`: verses, surah number or days. */
  setReward(childId: string, raw: { text: string; kind: RewardKind; n: number }) {
    const text = sanitizeName(raw.text, 60);
    if (!isValidName(text, 60)) return;
    const kind: RewardKind = raw.kind === "surah" || raw.kind === "days" ? raw.kind : "verses";
    const n = kind === "surah" ? clampInt(raw.n, 1, 114, 78) : kind === "days" ? clampInt(raw.n, 1, 365, 7) : clampInt(raw.n, 1, 6236, 20);
    set((s) => {
      const d = s.data[childId];
      if (!d) return s;
      const reward: Reward = { text, kind, n, base: rewardBase(d, kind), set: new Date().toISOString() };
      return { ...s, data: { ...s.data, [childId]: trackMotivation({ ...d, reward }, today(), new Date().toISOString()) } };
    });
  },
  /** The parent gave the reward (or cancelled it): it is removed. */
  clearReward(childId: string) {
    set((s) => {
      const d = s.data[childId];
      if (!d?.reward) return s;
      const { reward: _r, ...rest } = d;
      return { ...s, data: { ...s.data, [childId]: rest } };
    });
  },
  /** A celebration was shown to the active child. */
  markSeen(patch: { goal?: string; ladder?: number; reward?: string }) {
    set((s) => {
      const id = s.activeChildId;
      const d = s.data[id];
      if (!d) return s;
      return { ...s, data: { ...s.data, [id]: { ...d, seen: { ...(d.seen ?? {}), ...patch } } } };
    });
  },
  setReminder(r: { time: string; enabled: boolean }) {
    if (!isValidTime(r.time)) return;
    set((s) => ({ ...s, reminder: { time: r.time, enabled: r.enabled === true } }));
  },
  prayForMagdy() {
    set((s) => ({ ...s, magdyDuas: (s.magdyDuas ?? 0) + 1 }));
  },
  setAvatar(patch: Partial<Avatar>) {
    set((s) => ({
      ...s,
      children: s.children.map((c) => (c.id === s.activeChildId ? { ...c, avatar: { ...c.avatar, ...patch } } : c)),
    }));
  },
  resetAll() {
    set(() => initial());
  },
  /** Replace local state (used when pulling from Supabase). */
  hydrate(next: ProgressState) {
    const clean = sanitizeState<ProgressState>(next);
    if (clean) set(() => catchUpCertificates(clean));
  },
};

// ---------- derived ----------

export function streak(days: string[]): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  // A streak still counts if today has not been started yet.
  if (!set.has(localDay(d))) d.setDate(d.getDate() - 1);
  while (set.has(localDay(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function surahProgress(verses: Record<string, VerseProgress>, surah: number, total: number) {
  let learned = 0;
  let mastered = 0;
  for (let a = 1; a <= total; a++) {
    const v = verses[verseKey(surah, a)];
    if (v && v.state !== "not_started") learned++;
    if (v && (v.state === "good" || v.state === "mastered")) mastered++;
  }
  return { learned, mastered, total, pct: total ? learned / total : 0 };
}

/** Award certificates already earned before this feature existed; announce only the newest one. */
function catchUpCertificates(s: ProgressState): ProgressState {
  const data = { ...s.data };
  for (const [id, d] of Object.entries(data)) {
    const have = d.certificates ?? {};
    const fresh = earnedCertificates(d, streak(d.activeDays)).filter((c) => !have[c]);
    if (!fresh.length) continue;
    const t = today();
    data[id] = {
      ...d,
      certificates: { ...have, ...Object.fromEntries(fresh.map((c) => [c, t])) },
      pendingCerts: [...(d.pendingCerts ?? []), fresh[fresh.length - 1]],
    };
  }
  return { ...s, data };
}

function awardCertificates(d: ChildData): ChildData {
  const have = d.certificates ?? {};
  const fresh = earnedCertificates(d, streak(d.activeDays)).filter((id) => !have[id]);
  if (!fresh.length) return d;
  const t = today();
  return {
    ...d,
    certificates: { ...have, ...Object.fromEntries(fresh.map((id) => [id, t])) },
    pendingCerts: [...(d.pendingCerts ?? []), ...fresh].slice(-10),
  };
}

function awardBadges(d: ChildData): ChildData {
  const earned = { ...d.badges };
  const t = today();
  for (const b of BADGES) {
    if (!earned[b.id] && b.check(d, streak(d.activeDays))) earned[b.id] = t;
  }
  return earned === d.badges ? d : { ...d, badges: earned };
}
