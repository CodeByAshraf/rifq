import type { VerseProgress, VerseState } from "@/lib/store";
import { localDay } from "@/lib/dates";

/**
 * Lightweight spaced-repetition scheduler (SM-2 inspired, simplified for children).
 *  - "again": the verse was hard — come back tomorrow.
 *  - "good": recalled with small hesitation.
 *  - "easy": recalled fluently.
 */
export type Rating = "again" | "good" | "easy";

const iso = (d: Date) => localDay(d);
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

function stateFor(p: Pick<VerseProgress, "interval" | "reps" | "lapses">, rating: Rating): VerseState {
  if (rating === "again") return p.reps <= 1 ? "learning" : "needs_revision";
  if (p.interval >= 21 && p.reps >= 5) return "mastered";
  if (p.interval >= 3) return "good";
  return "learning";
}

export function nextReview(prev: VerseProgress | undefined, rating: Rating): VerseProgress {
  const t = iso(new Date());
  const base: VerseProgress = prev ?? {
    state: "learning",
    interval: 0,
    ease: 2.3,
    reps: 0,
    lapses: 0,
    due: t,
    lastReviewed: t,
    firstLearned: t,
  };

  let { interval, ease, reps, lapses } = base;
  if (rating === "again") {
    lapses += 1;
    reps = Math.max(1, reps);
    interval = 1;
    ease = Math.max(1.4, ease - 0.2);
  } else {
    reps += 1;
    const bonus = rating === "easy" ? 1.3 : 1;
    if (reps === 1) interval = rating === "easy" ? 2 : 1;
    else if (reps === 2) interval = rating === "easy" ? 4 : 3;
    else interval = Math.round(interval * ease * bonus);
    ease = Math.min(3, ease + (rating === "easy" ? 0.1 : 0));
  }
  interval = Math.min(interval, 120);
  const next = { ...base, interval, ease, reps, lapses, due: addDays(interval), lastReviewed: t };
  return { ...next, state: stateFor(next, rating) };
}

export function isDue(p: VerseProgress, on = iso(new Date())) {
  return p.due <= on;
}

export const STATE_LABEL: Record<VerseState, string> = {
  not_started: "لم يبدأ",
  learning: "قيد الحفظ",
  needs_revision: "يحتاج مراجعة",
  good: "جيد",
  mastered: "متقن",
};

export const STATE_COLOR: Record<VerseState, string> = {
  not_started: "bg-ink-300/30 text-ink-500",
  learning: "bg-sky-200 text-sky-500",
  needs_revision: "bg-coral-100 text-coral-500",
  good: "bg-mint-100 text-mint-600",
  mastered: "bg-sun-100 text-sun-600",
};
