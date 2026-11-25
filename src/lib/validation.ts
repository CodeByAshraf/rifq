/**
 * Input validation and sanitisation shared by every form and by the sync layer.
 * Pure functions with no browser dependencies so they can be unit-tested in Node.
 * The database re-checks everything with CHECK constraints (supabase/migrations/0002),
 * so these are the first of two layers, never the only one.
 */

// Control chars, zero-width chars and bidi overrides that can be used to spoof text.
const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
const HTML_CHARS = /[<>`"\\{}]/g;

/** Cleans a free-text display name: strips unsafe/markup chars, collapses spaces, limits length. */
export function sanitizeName(input: unknown, max = 20): string {
  if (typeof input !== "string") return "";
  return Array.from(input.normalize("NFC").replace(/\s+/g, " ").replace(UNSAFE_CHARS, "").replace(HTML_CHARS, "").replace(/ {2,}/g, " ").trim())
    .slice(0, max)
    .join("")
    .trim();
}

/** A name is valid if, after cleaning, it has at least one letter (Arabic or Latin) and fits. */
export function isValidName(input: unknown, max = 20): boolean {
  const s = sanitizeName(input, max + 1);
  return s.length >= 1 && s.length <= max && /[\p{L}]/u.test(s);
}

export const EMAIL_MAX = 254;
// Pragmatic RFC 5322 subset: local@domain.tld, no spaces, no consecutive dots.
const EMAIL_RE = /^(?!.*\.\.)[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function normalizeEmail(input: unknown): string {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

export function isValidEmail(input: unknown): boolean {
  const e = normalizeEmail(input);
  if (!e || e.length > EMAIL_MAX) return false;
  if (!EMAIL_RE.test(e)) return false;
  const tld = e.split(".").pop()!;
  return /^[a-z]{2,24}$/.test(tld);
}

const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 72; // bcrypt (used by Supabase Auth) ignores bytes beyond 72.

const COMMON = new Set([
  "password", "password1", "password123", "passw0rd", "qwerty", "qwerty123", "qwertyuiop", "1q2w3e4r",
  "123456", "1234567", "12345678", "123456789", "1234567890", "0123456789", "111111", "000000",
  "abc123", "abcd1234", "iloveyou", "letmein", "welcome", "welcome1", "admin", "admin123", "monkey",
  "dragon", "football", "baseball", "sunshine", "princess", "master", "superman", "islam", "allah",
  "muhammad", "mohamed", "mohammed", "ahmed", "quran", "quran123", "rifq", "rifq123", "magdy", "egypt",
]);

export type PasswordCheck = { ok: boolean; problems: string[] };

/** Strength policy: length, letters + digits, not common, not derived from the email. */
export function checkPassword(pw: unknown, email = ""): PasswordCheck {
  const problems: string[] = [];
  const p = typeof pw === "string" ? pw : "";
  if (p.length < PASSWORD_MIN) problems.push(`${PASSWORD_MIN} أحرف على الأقل`);
  if (new TextEncoder().encode(p).length > PASSWORD_MAX) problems.push(`لا تزيد عن ${PASSWORD_MAX} حرفًا`);
  if (!/\p{L}/u.test(p)) problems.push("حرف واحد على الأقل");
  if (!/\d/.test(p)) problems.push("رقم واحد على الأقل");
  if (/^(.)\1+$/.test(p)) problems.push("لا تكرّر الحرف نفسه");
  const lower = p.toLowerCase();
  const stripped = lower.replace(/[\d\W_]+$/u, "");
  if (COMMON.has(lower) || COMMON.has(stripped)) problems.push("كلمة شائعة يسهل تخمينها");
  const local = normalizeEmail(email).split("@")[0];
  if (local && local.length >= 4 && lower.includes(local)) problems.push("لا تستخدم بريدك فيها");
  return { ok: problems.length === 0, problems };
}

/** 0–4 meter for the UI. */
export function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= PASSWORD_MIN) s++;
  if (pw.length >= 14) s++;
  if (/\p{L}/u.test(pw) && /\d/.test(pw)) s++;
  if (/[^\p{L}\d]/u.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) s++;
  return s;
}

/** "HH:MM" 24h. */
export function isValidTime(t: unknown): t is string {
  return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

/** Identifiers we store (lesson ids, badge ids, game ids…). Mirrors the DB CHECK. */
export function isSafeId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9_:-]{1,40}$/.test(id);
}

export function clampInt(v: unknown, min: number, max: number, fallback = min): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function isVerseKey(k: unknown): k is string {
  if (typeof k !== "string") return false;
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(k);
  if (!m) return false;
  const s = +m[1];
  const a = +m[2];
  return s >= 1 && s <= 114 && a >= 1 && a <= 286;
}

/** ISO date "YYYY-MM-DD". */
export function isIsoDay(d: unknown): d is string {
  return typeof d === "string" && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(d);
}

/**
 * Client-side login throttle (defence in depth; the real limit is Supabase Auth's
 * server-side rate limit + CAPTCHA). Exponential lock-out after repeated failures.
 */
export type Throttle = { fails: number; until: number };

export function nextThrottle(t: Throttle, now: number): Throttle {
  const fails = t.fails + 1;
  // Free attempts: 3. Then 30s, 60s, 120s … capped at 15 minutes.
  const wait = fails <= 3 ? 0 : Math.min(15 * 60_000, 30_000 * 2 ** (fails - 4));
  return { fails, until: now + wait };
}

export function lockRemaining(t: Throttle, now: number): number {
  return Math.max(0, t.until - now);
}
