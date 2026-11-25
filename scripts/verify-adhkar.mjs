// Checks src/data/adhkar.json before every build:
//  - it is exactly what the curated source produces (no hand edits to the JSON);
//  - every item is attributed, counted and well-formed;
//  - typography is clean (no stray/doubled marks, tatweel, glued words, undotted final ya in prose);
//  - Quran references exist, and NO Quran text is typed by hand: any run of 6+ words that matches
//    the Mushaf must come from a `quran` reference rendered from the verified text.
import { readFileSync } from "node:fs";
import { ADHKAR } from "./adhkar-source.mjs";

const json = JSON.parse(readFileSync("src/data/adhkar.json", "utf8"));
const problems = [];
const fail = (m) => problems.push(m);
if (JSON.stringify(json) !== JSON.stringify(ADHKAR)) fail("src/data/adhkar.json is out of date: run npm run build:adhkar");

const items = [...ADHKAR.sections.flatMap((s) => s.items), ...ADHKAR.daily.flatMap((d) => d.items)];
const ids = new Set();
const kfgqpc = JSON.parse(readFileSync("node_modules/@quran.ws/text/data/hafs.json", "utf8"));
const ayahCount = new Map(kfgqpc.surahs.map((s) => [s.number, s.ayah_count]));

const MARK = "ً-ْ";
const prose = (t) => t.replace(/\([^)]*\)/g, "");
for (const z of items) {
  if (ids.has(z.id) && !items.filter((x) => x.id === z.id).every((x) => x === z)) fail(`${z.id}: duplicate id`);
  ids.add(z.id);
  if (!z.text && !z.quran) fail(`${z.id}: no text and no Quran reference`);
  if (!Number.isInteger(z.count) || z.count < 1 || z.count > 100) fail(`${z.id}: bad count`);
  if (!z.source && !z.note) fail(`${z.id}: no source`);
  for (const [s, a, b, w] of z.quran ?? []) {
    if (!ayahCount.has(s) || a < 1 || b < a || b > ayahCount.get(s)) fail(`${z.id}: Quran reference ${s}:${a}-${b} does not exist`);
    if (w !== undefined && (w < 2 || a !== b)) fail(`${z.id}: bad partial-ayah reference`);
  }
  for (const [field, t] of Object.entries({ text: z.text, before: z.before, after: z.after, virtue: z.virtue, source: z.source, note: z.note })) {
    if (!t) continue;
    if (/ـ/.test(t)) fail(`${z.id}.${field}: tatweel`);
    if (new RegExp(`[${MARK}]{3,}`).test(t.replace(/ّ[ً-ِ]/g, "x"))) fail(`${z.id}.${field}: stacked marks`);
    if (new RegExp(`(^|\\s)[${MARK}]`).test(t)) fail(`${z.id}.${field}: mark without a letter`);
    if (/([َ-ِ])\1/.test(t)) fail(`${z.id}.${field}: doubled vowel`);
    const bare = t.normalize("NFD").replace(/[\u064B-\u065F\u0670]/g, "");
    if (/(أعوذب|اعوذب|أسألك[اأ]|لاإله)/.test(bare)) fail(`${z.id}.${field}: glued words`);
    if (/\s[،,.]/.test(t)) fail(`${z.id}.${field}: space before punctuation`);
    if (/(يمسى|يصبح\s?ى|شىء|الأخرة|شفاعتى|إلى\s?ى|ادركته|أبن السني|ابن ماجة)/.test(t)) fail(`${z.id}.${field}: misspelling`);
  }
}

// --- no hand-typed Quran -------------------------------------------------------------
const norm = (t) =>
  t.normalize("NFD")
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ؤ]/g, "و").replace(/[ئ]/g, "ي")
    .replace(/[^ء-ي ]/g, " ").replace(/\s+/g, " ").trim();
const N = 6;
// Phrases that are part of the HADITH wording itself and happen to match an ayah's wording.
// Each one is narrated as hadith text; it is not a Quran quotation.
const HADITH_WORDING = new Map([
  ["له الملك وله الحمد وهو علي", "«…لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ» — wording of the tahlil hadith (Bukhari, Muslim)"],
  ["شيء في الارض ولا في السماء", "«بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ…» — hadith of Uthman (Abu Dawud, Tirmidhi)"],
  ["حنيفا مسلما وما كان من المشركين", "«…وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا…» — hadith of Abd al-Rahman ibn Abza (Ahmad)"],
]);
const grams = new Set();
{
  const { rasm_imlai: imla, words } = kfgqpc;
  const ws = imla.map((w, i) => norm(w ?? words[i]));
  for (let i = 0; i + N <= ws.length; i++) grams.add(ws.slice(i, i + N).join(" "));
}
// Allowed hadith phrases are cut out (replaced by a break) so they cannot hide anything around them.
const cut = (t) => [...HADITH_WORDING.keys()].reduce((acc, h) => acc.split(h).join(" | "), norm(t));
for (const z of items)
  for (const t of [z.text, z.before, z.after]) {
    if (!t) continue;
    for (const chunk of cut(t).split("|")) {
      const w = chunk.trim().split(" ");
      for (let i = 0; i + N <= w.length; i++)
        if (grams.has(w.slice(i, i + N).join(" "))) {
          fail(`${z.id}: contains Quran typed by hand («${w.slice(i, i + N).join(" ")}») — use a quran reference`);
          break;
        }
    }
  }

if (problems.length) { console.error(problems.join("\n")); console.error(`FAILED: ${problems.length} problem(s).`); process.exit(1); }
console.log(`OK: ${ids.size} adhkar — attributed, well-formed, and every Quran passage comes from the verified Mushaf text.`);
