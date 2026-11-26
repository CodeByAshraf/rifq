// Checks that every Tajweed example really shows its rule in the verified Quran text
// (public/quran/*.json, Hafs, Madinah orthography). The words come from the Quran files;
// this script only reads them. Run: npm run verify:tajweed (part of verify:content).
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = readFileSync(path.join(root, "src/data/tajweed.ts"), "utf8");
const verse = (s, a) => JSON.parse(readFileSync(path.join(root, `public/quran/${s}.json`), "utf8")).verses[a - 1].text;

// Marks
const SUKUN = "ۡ";
const SHADDA = "ّ";
const FATHA = "َ";
const DAMMA = "ُ";
const KASRA = "ِ";
const MADDAH = "ٓ";
const TANWEEN = /[ًࣰٌࣱٍࣲ]/;
const HARAKA = /[ً-ْٰۖ-ࣰۭ-ࣲٕٓٔ]/g;

/** Base letters of a word, without marks (alif wasla counts as alif). */
const letters = (w) => w.replace(HARAKA, "").replace(/ٱ/g, "ا").replace(/ـ/g, "");
/** First letter pronounced after a leading «ال» or wasla is dropped. */
const first = (w) => letters(w).replace(/^و?ا?/, "")[0];
const last = (w) => letters(w).at(-1);
const endsNoonOrTanween = (w) => {
  const t = w.replace(/[اى]$/u, "");
  return TANWEEN.test(t.slice(-2)) || /نۡ?$/.test(t);
};
const isAllah = (w) => w.startsWith("\u0671") && letters(w).startsWith("الله");
const startsAfterAl = (w) => w.replace(/^[ٱا]/, "");

const THROAT = "ءأإؤئهعحغخ";
const ISTILA = "خصضغطقظ";
const QALQALAH = "قطبجد";
const SHAMSI = "تثدذرزسشصضطظلن";

/** One test per rule id: (words, all words of the ayah, index of the first highlighted word) => ok */
const RULES = {
  izhar: ([a, b]) => endsNoonOrTanween(a) && THROAT.includes(first(b)),
  idgham_ghunnah: ([a, b]) => endsNoonOrTanween(a) && "ينمو".includes(first(b)),
  idgham_no_ghunnah: ([a, b]) => endsNoonOrTanween(a) && "لر".includes(first(b)),
  iqlab: ([a]) => /نۢب|[ۭۢ]/.test(a),
  ikhfa: ([a, b]) => endsNoonOrTanween(a) && !(THROAT + "ينمولرب").includes(first(b)),
  ikhfa_shafawi: ([a, b]) => /مۡ?$/.test(a) && first(b) === "ب",
  idgham_shafawi: ([a, b]) => /م$/.test(a) && first(b) === "م" && b.includes(SHADDA),
  izhar_shafawi: ([a, b]) => /مۡ$/.test(a) && !"بم".includes(first(b)),
  madd_tabii: ([a]) => /ٰ|[اوي]/.test(a),
  madd_muttasil: ([a]) => new RegExp(`[اوي]${MADDAH}[ءأإؤئ]`).test(a),
  madd_munfasil: ([a, b]) => a.endsWith(MADDAH) && /^[ءأإ]/.test(b),
  madd_lazim: ([a]) => new RegExp(`${MADDAH}.${SHADDA}`).test(a),
  madd_arid: ([a], ayah, i) => i === ayah.length - 1 && /[اويٰ]/.test(letters(a).at(-2) ?? "") || /ٰ.?.?ي?ن.$/.test(a) && i === ayah.length - 1,
  qalqalah_sughra: ([a], ayah, i) => i < ayah.length - 1 && new RegExp(`[${QALQALAH}]${SUKUN}`).test(a),
  qalqalah_kubra: ([a], ayah, i) => i === ayah.length - 1 && QALQALAH.includes(last(a)),
  tafkheem: ([a]) => [...letters(a)].some((c) => ISTILA.includes(c)),
  lam_heavy: ([a, b]) => isAllah(b) && /[\u064E\u064F]$/.test(a.replace(/[\u0657\u06E5]/g, "")),
  lam_light: ([a, b]) => isAllah(b) && a.replace(/\u06E1/g, "").endsWith(KASRA),
  lam_qamariya: ([a]) => new RegExp(`^ٱل${SUKUN}`).test(a) && !SHAMSI.includes(letters(a)[2]),
  lam_shamsiya: ([a]) => /^ٱل/.test(a) && SHAMSI.includes(letters(a)[2]) && startsAfterAl(a).slice(1, 4).includes(SHADDA),
  ghunnah_noon: ([a]) => a.includes("ن" + SHADDA),
  ghunnah_meem: ([a]) => a.includes("م" + SHADDA),
  ra_heavy: ([a]) => new RegExp(`ر${SHADDA}?[${FATHA}${DAMMA}]`).test(a),
  ra_light: ([a]) => new RegExp(`ر${KASRA}|${KASRA}ر${SUKUN}`).test(a),
  madd_badal: ([a]) => /^ءَا|[ءأ]َا|ءُو|إِي/.test(a),
  madd_iwad: ([a], ayah, i) => i === ayah.length - 1 && /[ًࣰ]ا$/.test(a),
  madd_leen: ([a], ayah, i) => i === ayah.length - 1 && new RegExp(`${FATHA}[وي]${SUKUN}.[^\\s]*$`).test(a),
  mithlayn: ([a, b]) => last(a) === first(b) && b.includes(SHADDA),
  mutajanisayn: ([a, b]) => last(a) !== first(b) && b.slice(0, 4).includes(SHADDA),
  mutaqaribayn: (w) => (w.length === 2 ? last(w[0]) !== first(w[1]) && w[1].slice(0, 4).includes(SHADDA) : /قكّ|قۡ?ك/.test(w[0])),
  waqf_lazim: ([a]) => a.includes("ۘ"),
  waqf_la: ([a]) => a.includes("ۙ"),
  waqf_jaiz: ([a]) => a.includes("ۚ"),
  waqf_sila: ([a]) => a.includes("ۖ"),
  waqf_qila: ([a]) => a.includes("ۗ"),
  waqf_muanaqa: ([a, b]) => a.includes("ۛ") && b.includes("ۛ"),
};

const re = /\{ surah: (\d+), ayah: (\d+), words: \[([\d, ]*)\], ruleId: "(\w+)" \}/g;
let n = 0;
const bad = [];
for (const m of src.matchAll(re)) {
  const [, s, a, idx, rule] = m;
  const ayah = verse(+s, +a).split(" ");
  const ids = idx.split(",").map((x) => +x.trim());
  const words = ids.map((i) => ayah[i]);
  const test = RULES[rule];
  n++;
  if (!test) bad.push(`${rule} ${s}:${a}: no check for this rule`);
  else if (words.some((w) => w === undefined)) bad.push(`${rule} ${s}:${a}: word index out of range`);
  else if (!test(words, ayah, ids[0])) bad.push(`${rule} ${s}:${a} [${idx}] «${words.join(" ")}» does not show the rule`);
}
if (n < 40) bad.push(`only ${n} examples found: the example pattern in tajweed.ts changed?`);
if (bad.length) {
  console.error("Tajweed examples failed:\n  " + bad.join("\n  "));
  process.exit(1);
}
console.log(`tajweed: ${n} examples show their rule in the verified text`);
