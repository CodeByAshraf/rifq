// Builds the page-by-page Mushaf (Madinah layout: 604 pages, 15 lines) for the adults' corner.
//
// Text, marks and line breaks come from the KFGQPC Uthmanic Hafs v3.0 data in @quran.ws/text
// (CC BY 4.0) — the same release scripts/verify-quran.mjs checks our served text against.
// Every āyah of every page is checked again here, letter by letter and mark by mark, against public/quran/*.json
// (the triple-verified text the rest of the app shows). The build stops on any difference.
//
// The KFGQPC font is shipped unchanged (its licence allows use, copy and distribution, but not
// modification), checked by SHA-256; src/styles/fonts.css bundles it byte for byte.
//
// Output: public/mushaf/<page>.json and src/data/mushaf-index.json.
//   Page file: { p, j, rows } where each row is one of
//     { h: surah }                       surah heading
//     { b: 1 }                           basmalah line
//     { l: [[surah, ayah, "words", end], …] }   one printed line, split by āyah; end = the āyah ends here
//
//   npm run build:mushaf      (verify only: npm run verify:mushaf)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Mushaf } from "@quran.ws/text";

// Same comparison as scripts/verify-quran.mjs: base letters with their marks as an unordered set
// (releases order stacked marks differently); word spacing ignored («مالي» / «ما لي»).
const MARK = /[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]/;
function clusters(t) {
  const out = [];
  for (const c of t.normalize("NFD").replace(/ـ/g, "")) {
    if (/\s/.test(c)) continue;
    if (MARK.test(c) && out.length) out[out.length - 1].m.push(c);
    else out.push({ b: c, m: [] });
  }
  return out.map((x) => x.b + x.m.sort().join("")).join("|");
}

const root = path.resolve(import.meta.dirname, "..");
const verifyOnly = process.argv.includes("--verify");
const FONT_SHA = "5c47602425fb4190327ab9e1a2e8ed2f53dceaf595d8ccc29ac32b8b209ad398";

const m = await Mushaf.hafs();
const fail = (msg) => {
  console.error(`✗ mushaf: ${msg}`);
  process.exit(1);
};

if (m.pageCount !== 604) fail(`expected 604 pages, got ${m.pageCount}`);

// Surahs whose first āyah begins on each page (the heading goes right before it).
const startsOn = new Map();
for (const s of m.surahs) {
  const p = s.ayah(1).page.number;
  if (!startsOn.has(p)) startsOn.set(p, []);
  startsOn.get(p).push(s.number);
}

const pages = [];
const seenEnds = new Map(); // "s:a" -> count of end markers
const ayahText = new Map(); // "s:a" -> rendered words from the page rows, in order

for (let p = 1; p <= 604; p++) {
  const page = m.page(p);
  const rows = [];
  for (const line of page.lines) {
    const first = line.wordList[0];
    if (first.ayah && first.ayah.number === 1 && first.index === 1) {
      rows.push({ h: first.surah.number });
      if (first.surah.number !== 1 && first.surah.number !== 9) rows.push({ b: 1 });
    }
    // A surah must start on a new line (the printed Mushaf never starts one mid-line).
    for (const w of line.wordList.slice(1)) if (w.ayah?.number === 1 && w.index === 1) fail(`surah ${w.surah.number} starts mid-line on page ${p}`);
    const segs = [];
    for (const w of line.wordList) {
      if (!w.ayah) fail(`unnumbered word on page ${p}`);
      const s = w.surah.number;
      const a = w.ayah.number;
      const last = segs[segs.length - 1];
      const txt = w.render(true);
      if (last && last[0] === s && last[1] === a) last[2] += ` ${txt}`;
      else segs.push([s, a, txt, false]);
      const key = `${s}:${a}`;
      ayahText.set(key, (ayahText.get(key) ? `${ayahText.get(key)} ` : "") + txt);
      if (w.index === w.ayah.length) {
        segs[segs.length - 1][3] = true;
        seenEnds.set(key, (seenEnds.get(key) ?? 0) + 1);
      }
    }
    rows.push({ l: segs });
  }
  const expected = p <= 2 ? rows.length : 15;
  if (rows.length !== expected) fail(`page ${p} has ${rows.length} rows, expected 15`);
  pages.push({ p, j: page.juz?.number ?? 0, rows });
}

// Every āyah: exactly one end marker, and the same letters as the verified served text.
let checked = 0;
for (const s of m.surahs) {
  const served = JSON.parse(readFileSync(path.join(root, "public/quran", `${s.number}.json`), "utf8"));
  if (served.verses.length !== s.ayahCount) fail(`surah ${s.number}: ${s.ayahCount} āyāt vs ${served.verses.length} served`);
  for (const v of served.verses) {
    const key = `${s.number}:${v.id}`;
    if (seenEnds.get(key) !== 1) fail(`${key}: ${seenEnds.get(key) ?? 0} end markers`);
    if (clusters(ayahText.get(key) ?? "") !== clusters(v.text)) fail(`${key}: page text differs from the verified text`);
    checked++;
  }
}
if (checked !== 6236) fail(`checked ${checked} āyāt, expected 6236`);

// Font: shipped byte-for-byte.
const fontSrc = path.join(root, "node_modules/@quran.ws/text/data/UthmanicHafs-v-3.0.ttf");
const sha = createHash("sha256").update(readFileSync(fontSrc)).digest("hex");
if (sha !== FONT_SHA) fail("KFGQPC font checksum changed");

// Index for navigation (small, bundled): first page of every surah and juz'.
const index = {
  // The basmalah line printed above each surah (except Al-Fatiha, where it is āyah 1, and At-Tawbah).
  basmalah: m.surahs[0].ayah(1).wordList.map((w) => w.render(true)).join(" "),
  surah: m.surahs.map((s) => s.ayah(1).page.number),
  // The surah of the first line of every page (what the printed page header names).
  page: pages.map((pg) => pg.rows.find((r) => r.l)?.l[0][0] ?? 0),
  juz: Array.from({ length: 30 }, (_, i) => {
    const p = pages.find((pg) => pg.j === i + 1);
    return p ? p.p : 0;
  }),
};
if (index.juz.some((p) => !p)) fail("a juz' has no first page");

if (verifyOnly) {
  const out = path.join(root, "public/mushaf");
  for (const pg of pages) {
    const file = readFileSync(path.join(out, `${pg.p}.json`), "utf8");
    if (file !== JSON.stringify(pg)) fail(`public/mushaf/${pg.p}.json is out of date (run npm run build:mushaf)`);
  }
  const idx = readFileSync(path.join(root, "src/data/mushaf-index.json"), "utf8");
  if (idx !== `${JSON.stringify(index)}\n`) fail("src/data/mushaf-index.json is out of date");
} else {
  const out = path.join(root, "public/mushaf");
  mkdirSync(out, { recursive: true });
  for (const pg of pages) writeFileSync(path.join(out, `${pg.p}.json`), JSON.stringify(pg));
  writeFileSync(path.join(root, "src/data/mushaf-index.json"), `${JSON.stringify(index)}\n`);
}
console.log(`OK: Mushaf — 604 pages, 15 lines each, ${checked} āyāt identical (letters and marks) to the verified text; KFGQPC font unmodified.`);
