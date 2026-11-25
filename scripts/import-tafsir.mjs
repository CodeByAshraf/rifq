// Downloads two verified Arabic resources and splits them per surah into public/tafsir/{n}.json:
//  - "m": At-Tafsir Al-Muyassar (King Fahd Glorious Quran Printing Complex), one entry per verse.
//  - "w": Word meanings from "As-Siraj fi Bayan Gharib Al-Quran" (via quranenc.com), as [word, meaning] pairs.
// Source mirror: github.com/fawazahmed0/quran-api (editions ara-kingfahadquranc, ara-sirajtafseer).
// The texts are stored as provided; this script only splits and structures them.
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions";
const get = async (name) => (await (await fetch(`${BASE}/${name}.json`)).json()).quran;

const muyassar = await get("ara-kingfahadquranc");
const siraj = await get("ara-sirajtafseer");
if (muyassar.length !== 6236 || siraj.length !== 6236) throw new Error("Unexpected verse count");

function parseMeanings(text) {
  const open = text.indexOf("(");
  const close = text.lastIndexOf(")");
  if (open < 0 || close < open) return [];
  const inner = text.slice(open + 1, close);
  // entries look like "word: meaning, word2: meaning2"
  return inner
    .split(/,\s*(?=[^,:]+:)/)
    .map((p) => {
      const i = p.indexOf(":");
      return i > 0 ? [p.slice(0, i).trim(), p.slice(i + 1).trim()] : null;
    })
    .filter(Boolean);
}

mkdirSync("public/tafsir", { recursive: true });
const by = {};
for (const r of muyassar) (by[r.chapter] ??= { m: [], w: [] }).m[r.verse - 1] = r.text;
for (const r of siraj) by[r.chapter].w[r.verse - 1] = parseMeanings(r.text);
for (const [s, d] of Object.entries(by)) writeFileSync(`public/tafsir/${s}.json`, JSON.stringify(d));
console.log("Wrote tafsir for", Object.keys(by).length, "surahs");
