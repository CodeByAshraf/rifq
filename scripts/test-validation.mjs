// Unit tests for src/lib/validation.ts and src/lib/state-guard.ts (bundled with esbuild).
import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "rifq-test-"));
const out = join(dir, "bundle.mjs");
await build({
  stdin: { contents: 'export * from "./src/lib/validation.ts"; export { sanitizeState } from "./src/lib/state-guard.ts"; export * from "./src/lib/dates.ts"; export { fridayKey } from "./src/lib/hijri.ts"; export { mergeIntoState } from "./src/lib/sync-merge.ts";', resolveDir: process.cwd(), loader: "ts" },
  bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "silent",
});
const V = await import(out);
rmSync(dir, { recursive: true, force: true });

let n = 0;
const t = (name, fn) => { fn(); n++; };

t("sanitizeName strips markup, bidi, control, zero-width", () => {
  assert.equal(V.sanitizeName("  <script>alert(1)</script> ", 40), "scriptalert(1)/script");
  assert.equal(V.sanitizeName("أحمد‮دمحأ"), "أحمددمحأ");
  assert.equal(V.sanitizeName("سا​رة\u0000"), "سارة");
  assert.equal(V.sanitizeName("a   b\n\tc"), "a b c");
  assert.equal(V.sanitizeName("ع".repeat(50)).length, 20);
  assert.equal(V.sanitizeName(123), "");
  assert.equal(V.sanitizeName({ toString: () => "x" }), "");
});
t("isValidName", () => {
  assert.ok(V.isValidName("مريم"));
  assert.ok(!V.isValidName("   "));
  assert.ok(!V.isValidName("12345"));
  assert.ok(!V.isValidName("<>\"`"));
});
t("email", () => {
  for (const e of ["a@b.co", "Parent.Name+kid@mail.example.com", " x@y.org "]) assert.ok(V.isValidEmail(e), e);
  for (const e of ["", "a@b", "a@@b.com", "a b@c.com", "a..b@c.com", "a@-b.com", "a@b.c", "x".repeat(250) + "@a.com", "a@b.com'--", "a@b.com<script>", null])
    assert.ok(!V.isValidEmail(e), String(e));
  assert.equal(V.normalizeEmail("  A@B.COM "), "a@b.com");
});
t("password policy", () => {
  assert.ok(V.checkPassword("Rifq-Journey-2026").ok);
  assert.ok(V.checkPassword("نورالقرآن2026x").ok);
  for (const p of ["short1", "onlyletterslong", "1234567890", "password123", "Quran123!!", "aaaaaaaaaaaa", "x".repeat(80) + "1"]) assert.ok(!V.checkPassword(p).ok, p);
  assert.ok(!V.checkPassword("omar.family99", "omar.family@x.com").ok);
});
t("time / ids / verse keys / days", () => {
  assert.ok(V.isValidTime("07:30") && V.isValidTime("23:59"));
  assert.ok(!V.isValidTime("24:00") && !V.isValidTime("7:30") && !V.isValidTime("07:30;drop"));
  assert.ok(V.isSafeId("surah:112") && !V.isSafeId("a b") && !V.isSafeId("x'; drop table--") && !V.isSafeId("A"));
  assert.ok(V.isVerseKey("1:7") && V.isVerseKey("114:6") && !V.isVerseKey("115:1") && !V.isVerseKey("0:1") && !V.isVerseKey("2:287"));
  assert.ok(V.isIsoDay("2026-11-21") && !V.isIsoDay("2026-13-01"));
});
t("throttle backs off exponentially and caps", () => {
  let th = { fails: 0, until: 0 };
  const now = 1_000_000;
  for (let i = 0; i < 3; i++) th = V.nextThrottle(th, now);
  assert.equal(V.lockRemaining(th, now), 0);
  th = V.nextThrottle(th, now); assert.equal(V.lockRemaining(th, now), 30_000);
  th = V.nextThrottle(th, now); assert.equal(V.lockRemaining(th, now), 60_000);
  for (let i = 0; i < 20; i++) th = V.nextThrottle(th, now);
  assert.equal(V.lockRemaining(th, now), 15 * 60_000);
});
t("sanitizeState rejects garbage", () => {
  assert.equal(V.sanitizeState(null), null);
  assert.equal(V.sanitizeState({ version: 2 }), null);
  assert.equal(V.sanitizeState({ version: 1, children: [] }), null);
  assert.equal(V.sanitizeState({ version: 1, children: [{ id: "../../x", name: "a" }] }), null);
});
t("sanitizeState cleans a hostile state and keeps valid data", () => {
  const evil = JSON.parse(`{
    "version": 1, "mode": "root", "activeChildId": "nope",
    "children": [
      {"id":"c1","name":"<img src=x onerror=alert(1)>سارة","avatar":{"skin":999,"outfit":-4,"headwear":"<b>","accessory":"crown"},"weeklyGoalMinutes":1e12,"remoteId":"'; drop table children;--"},
      {"id":"c1","name":"dup"},
      {"id":"r0a1b2c3d4e5f","name":"عمر","avatar":{}}
    ],
    "data": {
      "c1": {"stars": -50, "verses": {"1:1": {"state":"good","interval":3,"ease":2.5,"reps":1,"lapses":0,"due":"2026-11-22","lastReviewed":"2026-11-19T10:00:00.000Z","firstLearned":"2026-11-19T10:00:00.000Z"},
                                      "999:1": {"state":"good"}, "__proto__": {"state":"good"}, "1:2": {"state":"hacked"}},
             "bookmarks": ["2:255","x"], "activeDays": ["2026-11-20","bad"],
             "activity": [{"kind":"read","label":"<script>","stars":5,"at":"2026-11-20T10:00:00Z"},{"kind":"eval","at":"2026-11-20T10:00:00Z"}],
             "lessons": {"noon_sakinah": {"completed":"2026-11-20T10:00:00Z","quizScore": 9000}, "bad id": {}}},
      "evil": {"stars": 1}
    },
    "reminder": {"time": "javascript:alert(1)", "enabled": true},
    "onboarding": {"role":"kid","goal":"hifz","startHref":"https://evil.example","done":"2026-11-20T10:00:00Z"},
    "focus": {"surah": 2, "ayah": 255}
  }`);
  const s = V.sanitizeState(evil);
  assert.ok(!("mode" in s), "unknown keys such as an old mode are dropped");
  assert.equal(s.children.length, 2);
  assert.equal(s.activeChildId, "c1");
  const c = s.children[0];
  assert.ok(!/[<>]/.test(c.name));
  assert.equal(c.avatar.skin, 4); assert.equal(c.avatar.outfit, 0); assert.equal(c.avatar.headwear, "kufi");
  assert.equal(c.weeklyGoalMinutes, 2000);
  assert.equal(c.remoteId, undefined);
  const d = s.data.c1;
  assert.equal(d.stars, 0);
  assert.deepEqual(Object.keys(d.verses), ["1:1"]);
  assert.equal(d.verses["1:1"].firstLearned, "2026-11-19T10:00:00.000Z");
  assert.deepEqual(d.bookmarks, ["2:255"]);
  assert.deepEqual(d.activeDays, ["2026-11-20"]);
  assert.equal(d.activity.length, 1); assert.ok(!/[<>]/.test(d.activity[0].label));
  assert.equal(d.lessons.noon_sakinah.quizScore, 100); assert.equal(d.lessons["bad id"], undefined);
  assert.equal(s.data.evil, undefined);
  assert.ok(s.data.r0a1b2c3d4e5f);
  assert.equal(s.reminder, undefined);
  assert.equal(s.onboarding, undefined);
  assert.deepEqual(s.focus, { surah: 2, ayah: 255 });
  assert.equal(Object.getPrototypeOf(d.verses), Object.prototype);
});
t("pull merges the account into the device without losing local data", () => {
  const v = (lastReviewed, state) => ({ state, interval: 1, ease: 2.5, reps: 1, lapses: 0, due: "2026-12-01", lastReviewed, firstLearned: "2026-11-01T00:00:00Z" });
  const base = { stars: 0, verses: {}, lessons: {}, games: {}, badges: {}, bookmarks: [], activeDays: [], activity: [], unlockedDecor: [] };
  const local = {
    version: 1, activeChildId: "c1",
    children: [{ id: "c1", remoteId: "R1", name: "سارة", weeklyGoalMinutes: 90 }, { id: "c2", name: "جديد" }],
    data: {
      c1: { ...base, stars: 50, verses: { "1:1": v("2026-11-25T00:00:00Z", "mastered") }, bookmarks: ["2:255"], stories: { s1: "2026-11-10" }, activeDays: ["2026-11-25"] },
      c2: { ...base, stars: 3 },
    },
  };
  const remote = {
    children: [{ id: "rx", remoteId: "R1", name: "سارة أحمد", weeklyGoalMinutes: 60 }, { id: "ry", remoteId: "R2", name: "عمر", weeklyGoalMinutes: 60 }],
    data: {
      rx: { ...base, stars: 40, verses: { "1:1": v("2026-11-20T00:00:00Z", "learning"), "1:2": v("2026-11-21T00:00:00Z", "good") }, bookmarks: ["3:1"], activeDays: ["2026-11-20"] },
      ry: { ...base, stars: 7 },
    },
  };
  const m = V.mergeIntoState(local, remote);
  assert.deepEqual(m.children.map((c) => c.id), ["c1", "c2", "ry"], "local-only child kept, new account child added");
  assert.equal(m.activeChildId, "c1");
  assert.equal(m.children[0].name, "سارة أحمد");
  assert.equal(m.children[0].weeklyGoalMinutes, 90, "device-only setting kept");
  const d = m.data.c1;
  assert.equal(d.stars, 50);
  assert.equal(d.verses["1:1"].state, "mastered", "newer review wins");
  assert.equal(d.verses["1:2"].state, "good");
  assert.deepEqual(d.bookmarks.sort(), ["2:255", "3:1"]);
  assert.deepEqual(d.stories, { s1: "2026-11-10" }, "fields the server does not store are kept");
  assert.deepEqual(d.activeDays, ["2026-11-20", "2026-11-25"]);
  assert.equal(m.data.c2.stars, 3);
});
t("sanitizeState drops the OLDEST entries when a list is over its cap", () => {
  const adhkar = {};
  for (let i = 0; i < 450; i++) adhkar[new Date(Date.UTC(2025, 0, 1) + i * 864e5).toISOString().slice(0, 10)] = ["morning"];
  const days = Object.keys(adhkar);
  const s = V.sanitizeState({ version: 1, activeChildId: "c1", children: [{ id: "c1", name: "سارة" }], data: { c1: { adhkar, activeDays: days.concat(days, days, days, days, days, days, days, days, days) } } });
  const kept = Object.keys(s.data.c1.adhkar);
  assert.equal(kept.length, 400);
  assert.ok(kept.includes(days.at(-1)) && !kept.includes(days[0]), "newest day kept, oldest dropped");
  assert.equal(s.data.c1.activeDays.at(-1), days.at(-1));
});
t("sanitizeState keeps every real progress shape (challenges, adhkar, stories, certificates)", () => {
  const real = {
    version: 1, mode: "kids", activeChildId: "c1",
    children: [{ id: "c1", name: "سارة", avatar: { skin: 1, outfit: 0, headwear: "hijab", accessory: "none" }, weeklyGoalMinutes: 60, gender: "f", dailyVerses: 3 }],
    data: { c1: {
      stars: 120, verses: {}, lessons: {}, games: { match: { best: 9, plays: 3 } }, badges: { first_step: "2026-11-20T10:00:00.000Z" },
      bookmarks: [], activeDays: ["2026-11-20", "2026-11-21"], activity: [], unlockedDecor: [],
      stories: { yunus: "2026-11-20T10:00:00.000Z" }, certificates: { "surah:112": "2026-11-20" }, pendingCerts: ["surah:112"],
      adhkar: { "2026-11-21": ["morning", "evening"] },
      challenges: { kahf: { "2026-11-20": [0, 1, 2, 9] }, ramadan: { "1447": [1, 2, 30] }, dhul: { "1447": ["2026-05-18", "2026-05-19"] } },
      recordings: 4,
    } },
  };
  const s = V.sanitizeState(real);
  const d = s.data.c1;
  assert.deepEqual(d.challenges, real.data.c1.challenges);
  assert.deepEqual(d.adhkar, real.data.c1.adhkar);
  assert.deepEqual(d.stories, real.data.c1.stories);
  assert.deepEqual(d.certificates, real.data.c1.certificates);
  assert.deepEqual(d.pendingCerts, ["surah:112"]);
  assert.deepEqual(d.games, real.data.c1.games);
  assert.deepEqual(d.badges, real.data.c1.badges);
  assert.equal(d.recordings, 4);
  assert.equal(s.children[0].gender, "f");
  assert.equal(s.children[0].avatar.headwear, "hijab");
  // hostile values inside challenges are dropped
  const bad = V.sanitizeState({ ...real, data: { c1: { challenges: { kahf: { "2026-11-20": [0, 99, "x"], "nope": [1] }, dhul: { "1447": ["<b>"] } } } } });
  assert.deepEqual(bad.data.c1.challenges.kahf, { "2026-11-20": [0] });
  assert.deepEqual(bad.data.c1.challenges.dhul, { "1447": [] });
});
t("sanitizeState is idempotent on clean data", () => {
  const clean = { version: 1, mode: "adult", activeChildId: "c1", children: [{ id: "c1", name: "صديقي", avatar: { skin: 1, outfit: 0, headwear: "kufi", accessory: "none" }, weeklyGoalMinutes: 60 }], data: { c1: {} }, reminder: { time: "07:00", enabled: true }, onboarding: { role: "adult", goal: "hifz", startHref: "/memorize", done: "2026-11-01T10:00:00.000Z" } };
  const a = V.sanitizeState(clean);
  assert.deepEqual(V.sanitizeState(a), a);
  // Kids-only app: the old adult mode is dropped, and an old "adult" onboarding is read as "parent".
  assert.ok(!("mode" in a));
  assert.equal(a.onboarding.role, "parent");
});
t("day keys use local time, not UTC (Cairo after midnight)", () => {
  const prev = process.env.TZ;
  process.env.TZ = "Africa/Cairo";
  const fri = new Date("2026-11-27T00:30:00+02:00"); // Friday 00:30 in Cairo = Thursday 22:30 UTC
  assert.equal(V.localDay(fri), "2026-11-27");
  assert.equal(V.fridayKey(fri), "2026-11-27");
  assert.equal(V.dayOf("2026-11-26T22:30:00.000Z"), "2026-11-27");
  assert.equal(V.dayOf("2026-11-27"), "2026-11-27");
  assert.equal(V.dayOffset(-1, fri), "2026-11-26");
  assert.equal(V.dayOffset(1, new Date("2026-12-31T23:59:00+02:00")), "2027-01-01");
  process.env.TZ = "Asia/Riyadh";
  assert.equal(V.localDay(new Date("2026-03-01T02:30:00+03:00")), "2026-03-01");
  process.env.TZ = prev;
});
console.log(`validation: ${n} test groups passed`);
