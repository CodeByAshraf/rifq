// Verifies the Quran text the app serves. Runs before every build (npm run prebuild).
//
//  1. Served text == documented transformation of the source (quran-json / quranenc.com),
//     and matches the SHA-256 manifest.
//  2. No letter differs from the source (the transformation only touches marks).
//  3. Every ayah matches an INDEPENDENT release: the King Fahd Complex Uthmanic Hafs v3.0
//     (2026), from @quran.ws/text — including every waqf, sakt and sajdah sign.
//  4. Every code point is one the app's Quran font (Amiri Quran) can draw: no empty boxes.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { letters, transformAyah, TANWEEN_MAP } from "./quran-text.mjs";

const require = createRequire(import.meta.url);
const source = JSON.parse(readFileSync(require.resolve("quran-json/dist/quran.json"), "utf8"));
const manifest = JSON.parse(readFileSync("src/data/quran-manifest.json", "utf8"));
const kfgqpc = JSON.parse(readFileSync("node_modules/@quran.ws/text/data/hafs.json", "utf8"));
const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const problems = [];
const fail = (m) => problems.length < 50 && problems.push(m);

// --- independent reference: rebuild each ayah with its signs re-attached --------------
const refAyah = new Map();
{
  const { words, marks, mark_types: types, ayah_starts: starts, surahs } = kfgqpc;
  const after = new Map(), before = new Map();
  for (const [pos, t] of marks) {
    const m = types[t].side === "before" ? before : after;
    m.set(pos, (m.get(pos) ?? "") + types[t].sign);
  }
  const full = words.map((w, i) => (before.has(i) ? before.get(i) + " " : "") + w + (after.get(i) ?? ""));
  let i = 0;
  for (const s of surahs)
    for (let a = 1; a <= s.ayah_count; a++, i++)
      refAyah.set(`${s.number}:${a}`, full.slice(starts[i], starts[i + 1] ?? full.length).join(" "));
}

// Compare base letters with their marks as an unordered set (the two releases order stacked
// marks differently) and ignore word spacing (they join «مالي» / «وما منا» differently).
const MARK = /[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]/;
function clusters(t) {
  const out = [];
  for (const c of t.normalize("NFD").replace(/ـ/g, "")) {
    if (/\s/.test(c)) continue;
    if (MARK.test(c) && out.length) out[out.length - 1].m.push(c);
    else out.push({ b: c, m: [] });
  }
  return out.map((x) => x.b + x.m.sort().join("")).join("|");
}

// Code points Amiri Quran draws (checked with fontTools against the bundled font file).
const DRAWABLE = new Set(
  [
    ...[0x20, 0x621, 0x622, 0x623, 0x624, 0x625, 0x626, 0x627, 0x628, 0x629, 0x62a, 0x62b, 0x62c, 0x62d, 0x62e, 0x62f],
    ...[0x630, 0x631, 0x632, 0x633, 0x634, 0x635, 0x636, 0x637, 0x638, 0x639, 0x63a, 0x640, 0x641, 0x642, 0x643, 0x644],
    ...[0x645, 0x646, 0x647, 0x648, 0x649, 0x64a, 0x64b, 0x64c, 0x64d, 0x64e, 0x64f, 0x650, 0x651, 0x652, 0x653, 0x654],
    ...[0x655, 0x65c, 0x670, 0x671, 0x6d6, 0x6d7, 0x6d8, 0x6d9, 0x6da, 0x6db, 0x6dc, 0x6de, 0x6df, 0x6e0, 0x6e1, 0x6e2, 0x6e3],
    ...[0x6e4, 0x6e5, 0x6e6, 0x6e7, 0x6e8, 0x6e9, 0x6ea, 0x6eb, 0x6ec, 0x6ed, 0x8f0, 0x8f1, 0x8f2],
  ].map((c) => String.fromCodePoint(c)),
);

let verses = 0;
for (const s of source) {
  const served = JSON.parse(readFileSync(`public/quran/${s.id}.json`, "utf8"));
  if (served.verses.length !== s.verses.length) { fail(`Surah ${s.id}: verse count differs`); continue; }
  served.verses.forEach((v, i) => {
    verses++;
    const key = `${s.id}:${i + 1}`;
    const raw = s.verses[i].text;
    if (v.text !== transformAyah(s.id, i + 1, raw)) fail(`${key}: served text is not the documented transformation of the source`);
    if (letters(v.text) !== letters(raw)) fail(`${key}: a letter differs from the source`);
    const ref = refAyah.get(key);
    if (!ref) fail(`${key}: missing from the KFGQPC v3 reference`);
    else if (clusters(v.text) !== clusters(ref)) fail(`${key}: differs from KFGQPC Uthmanic Hafs v3.0`);
    for (const c of v.text) if (!DRAWABLE.has(c)) { fail(`${key}: U+${c.codePointAt(0).toString(16).toUpperCase()} cannot be drawn by the Quran font`); break; }
    if (Object.keys(TANWEEN_MAP).some((c) => v.text.includes(c))) fail(`${key}: legacy tanween code point left`);
    // The UI renders words split on single spaces: no stray spacing, no "word" made only of marks.
    if (v.text !== v.text.trim() || v.text.includes("  ") || /[\t\n\r\u00A0\u200B-\u200F\u2000-\u200A\u202F]/.test(v.text))
      fail(`${key}: irregular spacing`);
    if (v.text.split(" ").some((w) => !/[\u0621-\u064A\u0671]/.test(w))) fail(`${key}: a word with no letter`);
  });
  if (sha(served.verses.map((v) => v.text).join("\n")) !== manifest.surahs[s.id]) fail(`Checksum mismatch: surah ${s.id}`);
}
if (verses !== 6236 || refAyah.size !== 6236) fail(`Expected 6236 ayahs, got ${verses} served / ${refAyah.size} reference`);

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`FAILED: ${problems.length} problem(s).`);
  process.exit(1);
}
console.log(
  `OK: ${verses} ayahs across ${source.length} surahs — identical letters to the source, ` +
    `identical to the King Fahd Complex Hafs v3.0 release (incl. all waqf/sakt/sajdah signs), all drawable by the Quran font.`,
);
