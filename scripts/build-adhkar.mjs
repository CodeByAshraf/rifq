// Writes src/data/adhkar.json from the curated source (scripts/adhkar-source.mjs).
import { writeFileSync } from "node:fs";
import { ADHKAR } from "./adhkar-source.mjs";
writeFileSync("src/data/adhkar.json", JSON.stringify(ADHKAR, null, 1) + "\n");
const n = ADHKAR.sections.reduce((a, s) => a + s.items.length, 0) + ADHKAR.daily.reduce((a, d) => a + d.items.length, 0);
console.log(`adhkar.json written: ${ADHKAR.sections.length} sections + ${ADHKAR.daily.length} daily occasions, ${n} items.`);
