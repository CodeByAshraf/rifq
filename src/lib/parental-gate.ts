/**
 * Parental gate: parents-only screens (account, family, settings, alarm setup, sharing) open
 * only after an adult answers a multiplication written in words. App-store kids rules require
 * such a gate before settings, external actions and account screens.
 * The unlock lives in memory for a few minutes; it is never stored.
 */
const UNLOCK_MS = 5 * 60_000;
let unlockedAt = -Infinity;

/** Routes behind the gate. */
export const PARENT_ROUTES = new Set(["/parents", "/family", "/login", "/app", "/fajr", "/adults-fajr"]);

export const isUnlocked = (now = Date.now()) => now - unlockedAt < UNLOCK_MS;
export const unlock = (now = Date.now()) => {
  unlockedAt = now;
};

const WORDS = ["", "واحد", "اثنين", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];

/** A question like «سبعة × ثمانية» (both 3..9) with its answer. */
export function gateQuestion(r: () => number = Math.random): { text: string; answer: number } {
  const a = 3 + Math.floor(r() * 7);
  const b = 3 + Math.floor(r() * 7);
  return { text: `${WORDS[a]} × ${WORDS[b]}`, answer: a * b };
}
