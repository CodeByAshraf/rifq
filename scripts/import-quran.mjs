// Imports the verified Uthmani Quran text from the `quran-json` package
// (source: The Noble Qur'an Encyclopedia, quranenc.com — King Fahd Complex text).
// Letters are copied unchanged. The only transformation is the documented encoding
// conversion in scripts/quran-text.mjs (legacy open-tanween code points -> Unicode, and two
// ayah fixes taken from the KFGQPC Uthmanic Hafs v3.0 release). verify-quran.mjs proves it.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { transformAyah } from "./quran-text.mjs";

const require = createRequire(import.meta.url);
const srcPath = require.resolve("quran-json/dist/quran.json");
const quran = JSON.parse(readFileSync(srcPath, "utf8"));

const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");
mkdirSync("public/quran", { recursive: true });

const index = [];
const manifest = {
  source: "quran-json@3.1.2 (quranenc.com Uthmani text), Unicode open tanween + 2 ayah fixes (scripts/quran-text.mjs)",
  surahs: {},
};
let total = 0;

for (const s of quran) {
  const verses = s.verses.map((v) => ({ id: v.id, text: transformAyah(s.id, v.id, v.text) }));
  const out = { id: s.id, name: s.name, verses };
  writeFileSync(`public/quran/${s.id}.json`, JSON.stringify(out));
  index.push({ id: s.id, name: s.name, transliteration: s.transliteration, type: s.type, verses: s.total_verses });
  manifest.surahs[s.id] = sha(verses.map((v) => v.text).join("\n"));
  total += s.verses.length;
}

if (quran.length !== 114 || total !== 6236) throw new Error(`Unexpected counts: ${quran.length} surahs / ${total} verses`);
writeFileSync("src/data/surahs.json", JSON.stringify(index, null, 0));
writeFileSync("src/data/quran-manifest.json", JSON.stringify(manifest, null, 2));
console.log(`Imported ${quran.length} surahs, ${total} verses.`);
