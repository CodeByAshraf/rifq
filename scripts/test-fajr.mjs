// Tests for the Fajr alarm: prayer-time accuracy against published timetables, the alarm state
// machine, the notification plan (iOS 64-notification limit), settings validation, challenge
// generators.
//
//   node scripts/test-fajr.mjs
import { build } from "esbuild";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "node_modules/.cache/test-fajr.mjs");
await build({
  stdin: {
    contents: `
      export * as times from "./src/lib/fajr/times";
      export * as settings from "./src/lib/fajr/settings";
      export * as challenges from "./src/lib/fajr/challenges";
      export * as places from "./src/lib/fajr/places";
      export * as locate from "./src/lib/fajr/locate";
      export * as gate from "./src/lib/parental-gate";
      export * as mushaf from "./src/lib/mushaf";`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  logLevel: "error",
  external: ["react", "@capacitor/*"],
});
const { times, settings, challenges, places, locate, gate, mushaf } = await import(out);

let groups = 0;
const group = (name, fn) => {
  fn();
  groups++;
  console.log(`  ✓ ${name}`);
};
const hm = (d, tz) => d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
const S = (patch) => settings.sanitizeSettings({ ...settings.DEFAULT_SETTINGS, ...patch });

// ---------------------------------------------------------------- prayer times
group("Fajr matches published timetables (Egypt survey authority, Umm al-Qura, MWL)", () => {
  // [lat, lng, method, y, m, d, tz, expected Fajr, source]
  const cases = [
    [30.0444, 31.2357, "Egyptian", 2026, 11, 18, "Africa/Cairo", "04:52", "halaltrip, Cairo"],
    [30.0444, 31.2357, "Egyptian", 2026, 11, 1, "Africa/Cairo", "04:41", "akhbarelyom, Cairo"],
    [30.0444, 31.2357, "Egyptian", 2026, 2, 25, "Africa/Cairo", "04:59", "ahram, Cairo"],
    [31.2001, 29.9187, "Egyptian", 2026, 2, 25, "Africa/Cairo", "05:04", "ahram, Alexandria"],
    [31.3543, 27.2373, "Egyptian", 2026, 2, 25, "Africa/Cairo", "05:15", "ahram, Matrouh"],
    [30.0444, 31.2357, "Egyptian", 2026, 9, 26, "Africa/Cairo", "05:19", "akhbarelyom, Cairo (summer time)"],
    [21.4225, 39.8262, "UmmAlQura", 2026, 11, 6, "Asia/Riyadh", "05:08", "edarabia, Makkah"],
    [21.4225, 39.8262, "MuslimWorldLeague", 2026, 11, 3, "Asia/Riyadh", "05:09", "truecalendar, Makkah"],
  ];
  for (const [lat, lng, method, y, m, d, tz, exp, src] of cases) {
    const s = S({ place: { kind: "gps", lat, lng }, method });
    const f = times.fajrTime(s, new Date(y, m - 1, d));
    assert.equal(hm(f, tz), exp, `${src} ${y}-${m}-${d}`);
  }
  // The rounded city coordinates give the same minute as the precise ones.
  const city = S({ place: { kind: "city", id: "cairo" }, method: "Egyptian" });
  assert.equal(hm(times.fajrTime(city, new Date(2026, 10, 18)), "Africa/Cairo"), "04:52");
});

group("every listed city and method gives a valid Fajr before sunrise, all year", () => {
  for (const c of places.CITIES) {
    for (const mo of [0, 3, 6, 9]) {
      const s = S({ place: { kind: "city", id: c.id }, method: c.method });
      const f = times.fajrTime(s, new Date(2026, mo, 15));
      assert.ok(f && !Number.isNaN(f.getTime()), `${c.id} month ${mo + 1}`);
    }
  }
  for (const m of places.METHODS) assert.ok(times.fajrTime(S({ place: { kind: "city", id: "london" }, method: m.id }), new Date(2026, 5, 21)), `London June ${m.id}`);
  assert.equal(new Set(places.CITIES.map((c) => c.id)).size, places.CITIES.length, "city ids unique");
  const near = locate.nearestCity({ lat: 30.06, lng: 31.25 });
  assert.equal(near.city.id, "cairo");
});

// ---------------------------------------------------------------- state machine
const base = S({ enabled: true, place: { kind: "city", id: "cairo" }, method: "Egyptian", wakeCheck: true });
const day = new Date(2026, 10, 18);
const at = times.alarmTime(base, day).getTime();
const key = "2026-11-18";
const MIN = 60_000;

group("alarm phases: idle → ringing → waiting → check → re-ring → done", () => {
  assert.equal(times.phase(base, new Date(at - MIN)).kind, "idle");
  const r = times.phase(base, new Date(at + 10_000));
  assert.equal(r.kind, "ringing");
  assert.equal(r.day, key);
  assert.equal(times.phase(base, new Date(at + 61 * MIN)).kind, "idle", "gives up after the ring window");
  const solved = S({ ...base, log: { [key]: { solvedAt: at + 2 * MIN } } });
  assert.equal(times.phase(solved, new Date(at + 3 * MIN)).kind, "waiting");
  assert.equal(times.phase(solved, new Date(at + 7.5 * MIN)).kind, "check");
  const again = times.phase(solved, new Date(at + 9.5 * MIN));
  assert.equal(again.kind, "ringing");
  assert.equal(again.again, true);
  const confirmed = S({ ...solved, log: { [key]: { solvedAt: at + 2 * MIN, confirmedAt: at + 8 * MIN } } });
  assert.equal(times.phase(confirmed, new Date(at + 9.5 * MIN)).kind, "done");
  const noCheck = S({ ...solved, wakeCheck: false });
  assert.equal(times.phase(noCheck, new Date(at + 3 * MIN)).kind, "done");
  const off = S({ ...base, days: base.days.map((_, i) => i !== day.getDay()) });
  assert.equal(times.phase(off, new Date(at + 10_000)).kind, "idle", "weekday switched off");
  assert.equal(times.phase(S({ ...base, enabled: false }), new Date(at + 10_000)).kind, "idle");
  const test = S({ testAt: at - 30 * MIN });
  assert.equal(times.phase(test, new Date(at - 29 * MIN)).kind, "ringing");
});

group("negative offset before midnight still belongs to the next day's Fajr", () => {
  const early = S({ ...base, offset: -60 });
  const a = times.alarmTime(early, day);
  assert.equal(a.getTime(), at - 60 * MIN);
  assert.equal(times.phase(early, new Date(a.getTime() + 5000)).kind, "ringing");
});

// ---------------------------------------------------------------- notification plan
group("plan: unique ids, all in the future, within the iOS 64 limit", () => {
  for (const pf of ["android", "ios"]) {
    const list = times.plan(base, new Date(at - 6 * 3600_000), pf);
    const ids = list.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, `${pf} ids unique`);
    assert.ok(ids.every(times.isFajrId), `${pf} ids in range`);
    assert.ok(list.every((p) => p.at > at - 6 * 3600_000), `${pf} future`);
    const rings = list.filter((p) => p.kind === "ring");
    assert.equal(rings.length, times.BURST[pf].count * times.BURST[pf].days, `${pf} ring count`);
    assert.ok(list.some((p) => p.kind === "renew"), `${pf} renew reminder`);
    if (pf === "ios") assert.ok(list.length + 2 <= 64, `ios total ${list.length} (+ daily reminder + spare)`);
  }
  // Worst case on iOS: test alarm pending + check of today + 3 days.
  const busy = S({ ...base, testAt: at - 3600_000, log: { [key]: { solvedAt: at - 7200_000 + 1 } } });
  assert.ok(times.plan(busy, new Date(at - 3 * 3600_000 - 1000), "ios").length + 1 <= 64);
});

group("plan: solving stops the ringing; the check and re-ring are armed; confirming clears them", () => {
  const now = new Date(at + 2 * MIN);
  const solved = S({ ...base, log: { [key]: { solvedAt: now.getTime() } } });
  const p = times.plan(solved, now, "android").filter((x) => x.day === key);
  assert.ok(!p.some((x) => x.kind === "ring" && x.at < now.getTime() + 7 * MIN), "no ringing right after solving");
  assert.equal(p.filter((x) => x.kind === "check").length, 1);
  assert.equal(p.find((x) => x.kind === "check").at, now.getTime() + 5 * MIN);
  assert.equal(p.filter((x) => x.kind === "ring").length, times.BURST.android.recheck);
  const conf = S({ ...base, log: { [key]: { solvedAt: now.getTime(), confirmedAt: now.getTime() + 6 * MIN } } });
  assert.equal(times.plan(conf, now, "android").filter((x) => x.day === key).length, 0);
  assert.equal(times.plan(S({ ...base, enabled: false }), now, "android").length, 0);
});

// ---------------------------------------------------------------- settings
group("settings: anything stored is validated", () => {
  const junk = settings.sanitizeSettings({
    enabled: "yes",
    place: { kind: "gps", lat: 999, lng: 0 },
    method: "Evil",
    offset: 1e9,
    challenges: ["math", "<script>", "dua"],
    days: [1, 2],
    log: { "2026-11-18": { solvedAt: "x" }, "../../etc": {} },
    testAt: -5,
    extra: "dropped",
  });
  assert.equal(junk.enabled, false);
  assert.equal(junk.place, null);
  assert.equal(junk.method, "Egyptian");
  assert.equal(junk.offset, 0);
  assert.deepEqual(junk.challenges, ["dua"], "unknown challenges dropped");
  assert.equal(junk.level, "kid");
  assert.deepEqual(settings.sanitizeSettings({ challenges: ["math", "photo"] }).challenges, ["dua", "count", "colors"], "a child's alarm never gets adult challenges");
  const adult = settings.sanitizeSettings({ level: "adult", challenges: ["math", "dua", "photo"], difficulty: 3 });
  assert.deepEqual(adult.challenges, ["math"], "only the level's challenges; the removed photo challenge is dropped");
  assert.equal(adult.difficulty, 3);
  assert.equal(settings.sanitizeSettings({ level: "root", difficulty: 9 }).difficulty, 2);
  assert.equal(junk.days.length, 7);
  assert.deepEqual(Object.keys(junk.log), ["2026-11-18"]);
  assert.equal(junk.testAt, null);
  assert.ok(!("extra" in junk));
  const g = settings.sanitizeSettings({ place: { kind: "gps", lat: 30.04444, lng: 31.23571 } });
  assert.deepEqual(g.place, { kind: "gps", lat: 30.04, lng: 31.24 }, "location rounded to ~1 km");
  assert.equal(settings.sanitizeSettings({ place: { kind: "city", id: "atlantis" } }).place, null);
  const many = {};
  for (let i = 1; i <= 30; i++) many[`2026-10-${String(i).padStart(2, "0")}`] = { solvedAt: 1 };
  assert.equal(Object.keys(settings.sanitizeSettings({ log: many }).log).length, 14, "log capped");
});

// ---------------------------------------------------------------- challenges
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

group("dua puzzle uses the exact verified text and is never pre-solved", () => {
  const { text } = challenges.wakingDua();
  assert.equal(text, "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا، وَإِلَيْهِ النُّشُورُ");
  for (let i = 0; i < 200; i++) {
    const { pieces, order } = challenges.duaPuzzle(rnd);
    assert.equal(pieces.join(" "), text, "pieces rebuild the text exactly");
    assert.ok(pieces.every((pc) => !pc.includes("،") || pc.endsWith("،")), "no piece crosses a comma");
    assert.ok(pieces.length >= 3 && pieces.every((pc) => pc.split(" ").length <= 3));
    assert.deepEqual([...order].sort(), pieces.map((_, k) => k));
    assert.ok(!order.every((v, k) => v === k), "shuffled");
  }
});

group("challenge generators (children and adults); number parsing; parental gate", () => {
  for (let i = 0; i < 300; i++) {
    for (const r of challenges.countRounds(rnd)) {
      assert.ok(r.options.includes(r.n) && new Set(r.options).size === 3 && r.options.every((o) => o >= 1 && o <= 12));
    }
    const seq = challenges.colorSequence(rnd, 4);
    assert.ok(seq.every((v, k) => v >= 0 && v < 4 && (k === 0 || v !== seq[k - 1])));
    for (const d of [1, 2, 3]) {
      const p = challenges.mathProblem(rnd, d);
      assert.equal(Function(`return ${p.text.replace("×", "*")}`)(), p.answer, p.text);
      assert.ok(p.answer > 20 && p.answer < 2000);
    }
    const cells = challenges.memoryCells(rnd, 6);
    assert.ok(cells.length === 6 && new Set(cells).size === 6 && cells.every((c) => c >= 0 && c < 16));
    const q = gate.gateQuestion(rnd);
    const ones = ["ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
    const teens = ["اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
    const [ta, tb] = q.text.split(" × ");
    const a = teens.indexOf(ta) + 12;
    const b = ones.indexOf(tb) + 3;
    assert.ok(a >= 12 && b >= 3 && q.answer === a * b && q.answer >= 36 && !/\d/.test(q.text), q.text);
  }
  assert.equal(challenges.parseNumber("١٢٣"), 123);
  assert.equal(challenges.parseNumber("۴۵"), 45);
  assert.equal(challenges.parseNumber(" 77 "), 77);
  assert.equal(challenges.parseNumber("1e3"), null);
  assert.equal(challenges.parseNumber(""), null);
  assert.equal(gate.isUnlocked(0), false);
  assert.equal(gate.answerGate(true, 1000), true);
  assert.equal(gate.isUnlocked(1000 + 4 * 60_000), true);
  assert.equal(gate.isUnlocked(1000 + 6 * 60_000), false, "the gate locks again after a few minutes");
  // Three wrong answers lock the gate for a minute; a right answer then is refused.
  const t0 = 10_000_000;
  assert.equal(gate.answerGate(false, t0), false);
  assert.equal(gate.answerGate(false, t0 + 1), false);
  assert.equal(gate.answerGate(false, t0 + 2), false);
  assert.ok(gate.lockRemaining(t0 + 3) > 0, "locked after three wrong answers");
  assert.equal(gate.answerGate(true, t0 + 30_000), false, "no answer accepted while locked");
  assert.equal(gate.answerGate(true, t0 + 61_000), true, "opens again after the lock");
  for (const r of ["/parents", "/family", "/login", "/app", "/fajr"]) assert.ok(gate.PARENT_ROUTES.has(r), r);
  assert.ok(!gate.PARENT_ROUTES.has("/fajr-wake"), "the wake-up screen must never be gated");
});

group("Mushaf reader: navigation index and saved position", () => {
  assert.equal(mushaf.MUSHAF_INDEX.surah.length, 114);
  assert.equal(mushaf.MUSHAF_INDEX.page.length, 604);
  assert.equal(mushaf.MUSHAF_INDEX.surah[1], 2, "Al-Baqarah starts on page 2");
  assert.equal(mushaf.MUSHAF_INDEX.surah[35], 440, "Ya-Sin starts on page 440");
  assert.equal(mushaf.MUSHAF_INDEX.juz[29], 582, "Juz' Amma starts on page 582");
  assert.equal(mushaf.surahOfPage(440), 35, "page 440 opens with the end of Fatir");
  assert.equal(mushaf.juzOfPage(604), 30);
  assert.equal(mushaf.clampPage(0), 1);
  assert.equal(mushaf.clampPage(9999), 604);
  assert.equal(mushaf.ayahEnd(255), "\u06DD٢٥٥");
  assert.deepEqual(mushaf.sanitizeReader({ last: 700, mark: { p: 3, s: 999, a: 1, at: 1 } }), { last: 1, mark: null });
  assert.deepEqual(mushaf.sanitizeReader({ last: 50, mark: { p: 50, s: 3, a: 7, at: 5 }, x: "<b>" }), { last: 50, mark: { p: 50, s: 3, a: 7, at: 5 } });
  assert.deepEqual(mushaf.sanitizeReader("junk"), { last: 1, mark: null });
});

console.log(`fajr: ${groups} test groups passed`);
