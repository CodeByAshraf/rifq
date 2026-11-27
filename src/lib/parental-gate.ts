/**
 * Parental gate: parents-only screens (account, family, settings, alarm setup, sharing) open
 * only after an adult answers a multiplication written in words. App-store kids rules require
 * such a gate before settings, external actions and account screens.
 * The unlock lives in memory for a few minutes; it is never stored.
 */
const UNLOCK_MS = 5 * 60_000;
let unlockedAt = -Infinity;

/** Routes behind the gate. */
export const PARENT_ROUTES = new Set(["/parents", "/family", "/login", "/app", "/fajr", "/adults-fajr", "/motivate"]);

export const isUnlocked = (now = Date.now()) => now - unlockedAt < UNLOCK_MS;
const unlock = (now = Date.now()) => {
  unlockedAt = now;
};

const ONES = ["", "واحد", "اثنين", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TEENS: Record<number, string> = {
  12: "اثنا عشر",
  13: "ثلاثة عشر",
  14: "أربعة عشر",
  15: "خمسة عشر",
  16: "ستة عشر",
  17: "سبعة عشر",
  18: "ثمانية عشر",
  19: "تسعة عشر",
};

/**
 * A question like «سبعة عشر × ستة» (12..19 × 3..9, answer 36..171) with its answer. Written in
 * words, two-digit by one-digit: beyond young readers, easy for an adult.
 */
export function gateQuestion(r: () => number = Math.random): { text: string; answer: number } {
  const a = 12 + Math.floor(r() * 8);
  const b = 3 + Math.floor(r() * 7);
  return { text: `${TEENS[a]} × ${ONES[b]}`, answer: a * b };
}

/** After MAX_FAILS wrong answers in a row, the gate refuses answers for LOCK_MS (stops guessing). */
const MAX_FAILS = 3;
const LOCK_MS = 60_000;
let fails = 0;
let lockedAt = -Infinity;

/** Milliseconds left before another answer is accepted (0 = open). */
export const lockRemaining = (now = Date.now()) => Math.max(0, lockedAt + LOCK_MS - now);

/** Records an answer; returns true if it passed. */
export function answerGate(ok: boolean, now = Date.now()): boolean {
  if (lockRemaining(now) > 0) return false;
  if (ok) {
    fails = 0;
    unlock(now);
    return true;
  }
  if (++fails >= MAX_FAILS) {
    fails = 0;
    lockedAt = now;
  }
  return false;
}
