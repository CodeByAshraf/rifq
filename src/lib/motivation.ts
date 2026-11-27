/**
 * Motivation beyond certificates:
 * - «اقرأ وارتقِ»: a ladder of real milestones (verses learned), each with a title.
 * - «هدية من بابا وماما»: a real-world reward the parent promises for a goal.
 * - Daily goal days: days on which all of the day's missions were done.
 * Pure functions (tested in scripts/test-validation.mjs). Voice messages: src/lib/messages.ts.
 */
import { dailyMissions, learnedTotal } from "@/lib/learning";
import { surahMeta, toArabicDigits } from "@/lib/quran";
import { surahProgress, type ChildData } from "@/lib/store";

/** Abu Dawud (1464), at-Tirmidhi (2914, «حسن صحيح»); wording of Abu Dawud. */
export const IRTAQI_HADITH = {
  text: "يُقالُ لصاحبِ القرآنِ: اقرأْ وارتقِ، ورتِّلْ كما كنتَ ترتِّلُ في الدنيا، فإنَّ منزلَكَ عندَ آخرِ آيةٍ تقرؤُها",
  source: "رواه أبو داود والترمذي، وقال: حديث حسن صحيح",
};

/** Ladder milestones: verses learned → title. Titles describe the count only, never a claim about a surah. */
export const STEPS: { at: number; title: string }[] = [
  { at: 1, title: "أول درجة" },
  { at: 10, title: "صديق القرآن" },
  { at: 25, title: "حامل النور" },
  { at: 50, title: "المرتّل الصغير" },
  { at: 100, title: "صاحب المئة آية" },
  { at: 200, title: "نجم الحلقة" },
  { at: 300, title: "المثابر" },
  { at: 500, title: "صاحب الخمسمئة آية" },
  { at: 750, title: "الماهر بالقرآن" },
  { at: 1000, title: "صاحب الألف آية" },
  { at: 1500, title: "رفيق الحفّاظ" },
  { at: 2000, title: "صاحب الألفين" },
  { at: 3000, title: "نصف الطريق" },
  { at: 4000, title: "قريبٌ من القمّة" },
  { at: 5000, title: "صاحب الخمسة آلاف" },
  { at: 6236, title: "حافظ القرآن كاملًا" },
];

/** Where the learner stands on the ladder. */
export function ladder(learned: number) {
  let level = -1;
  for (let i = 0; i < STEPS.length; i++) if (learned >= STEPS[i].at) level = i;
  const next = STEPS[level + 1];
  const from = level >= 0 ? STEPS[level].at : 0;
  return {
    learned,
    level, // index in STEPS, -1 before the first verse
    title: level >= 0 ? STEPS[level].title : "على باب الرحلة",
    next: next ?? null,
    toNext: next ? next.at - learned : 0,
    pct: next ? (learned - from) / (next.at - from) : 1,
  };
}

export type RewardKind = "verses" | "surah" | "days";

export interface Reward {
  text: string;
  kind: RewardKind;
  /** verses: new verses to learn; surah: surah number; days: daily-goal days. */
  n: number;
  /** Count when the reward was set (verses learned, or goal days), so only new work counts. */
  base: number;
  set: string;
  reached?: string;
  given?: string;
}

/** Progress toward the reward: current, target, done, and a short label for the child. */
export function rewardProgress(d: ChildData, r: Reward) {
  if (r.kind === "surah") {
    const m = surahMeta(r.n);
    const p = surahProgress(d.verses, r.n, m.verses);
    return { cur: p.learned, target: p.total, done: p.learned >= p.total, goal: `ختم سورة ${m.name}` };
  }
  if (r.kind === "days") {
    const cur = Math.max(0, (d.goalDays?.length ?? 0) - r.base);
    return { cur: Math.min(cur, r.n), target: r.n, done: cur >= r.n, goal: `إتمام مهمّة اليوم ${toArabicDigits(r.n)} ${r.n >= 3 && r.n <= 10 ? "أيام" : r.n > 10 ? "يومًا" : "يوم"}` };
  }
  const cur = Math.max(0, learnedTotal(d.verses) - r.base);
  return { cur: Math.min(cur, r.n), target: r.n, done: cur >= r.n, goal: `حفظ ${toArabicDigits(r.n)} ${r.n <= 10 && r.n > 2 ? "آيات جديدة" : "آية جديدة"}` };
}

/** The base count to store when a parent sets a reward now. */
export const rewardBase = (d: ChildData, kind: RewardKind) => (kind === "days" ? (d.goalDays?.length ?? 0) : kind === "verses" ? learnedTotal(d.verses) : 0);

/** Updates goal days and the reward after any change to a child's data. */
export function trackMotivation(d: ChildData, day: string, nowIso: string): ChildData {
  let next = d;
  if (dailyMissions(next).every((m) => m.done) && !(next.goalDays ?? []).includes(day)) {
    next = { ...next, goalDays: [...(next.goalDays ?? []), day].slice(-400) };
  }
  const r = next.reward;
  if (r && !r.reached && rewardProgress(next, r).done) next = { ...next, reward: { ...r, reached: nowIso } };
  return next;
}

/** What to celebrate now, most important first (one at a time). */
export function nextCelebration(d: ChildData, day: string): { kind: "reward" | "ladder" | "goal"; level?: number } | null {
  const seen = d.seen ?? {};
  if (d.reward?.reached && !d.reward.given && seen.reward !== d.reward.reached) return { kind: "reward" };
  const lv = ladder(learnedTotal(d.verses)).level;
  if (lv >= 0 && lv > (seen.ladder ?? -1)) return { kind: "ladder", level: lv };
  if ((d.goalDays ?? []).includes(day) && seen.goal !== day) return { kind: "goal" };
  return null;
}
