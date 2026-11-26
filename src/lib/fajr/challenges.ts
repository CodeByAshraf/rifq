/**
 * Wake-up challenges (children and adults). Generators are pure and take a random function so tests can make them
 * deterministic. The dua puzzle only re-orders the exact verified text from adhkar.json; it
 * never builds, changes or drops a word.
 */
import adhkar from "@/data/adhkar.json";

export type Rand = () => number;
const int = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

function shuffle<T>(arr: T[], r: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- kids: order the waking dua ----------

const WAKE_DUA_ID = "w-ahyana";

interface AdhkarItem {
  id: string;
  text?: string;
  source?: string;
}

/** The waking dua exactly as stored in the verified adhkar data. */
export function wakingDua(): { text: string; source: string } {
  for (const sec of adhkar.sections as { items: AdhkarItem[] }[]) {
    const it = sec.items.find((x) => x.id === WAKE_DUA_ID);
    if (it?.text) return { text: it.text, source: it.source ?? "" };
  }
  throw new Error("waking dua missing from adhkar.json");
}

/**
 * Splits the dua into short pieces without crossing a comma (so each piece keeps its meaning):
 * two words each, and a lone last word of a clause joins the piece before it.
 */
function duaPieces(text: string): string[] {
  const pieces: string[] = [];
  for (const clause of text.split(/(?<=،)\s+/)) {
    const words = clause.split(" ");
    const part: string[][] = [];
    for (let i = 0; i < words.length; i += 2) part.push(words.slice(i, i + 2));
    if (part.length > 1 && part[part.length - 1].length === 1) part[part.length - 2].push(...part.pop()!);
    pieces.push(...part.map((w) => w.join(" ")));
  }
  return pieces;
}

/** The dua pieces, shuffled, never already in order. */
export function duaPuzzle(r: Rand): { pieces: string[]; order: number[] } {
  const pieces = duaPieces(wakingDua().text);
  const idx = pieces.map((_, i) => i);
  let order = shuffle(idx, r);
  for (let tries = 0; order.every((v, i) => v === i) && tries < 10; tries++) order = shuffle(idx, r);
  if (order.every((v, i) => v === i)) order = [...idx.slice(1), idx[0]];
  return { pieces, order };
}

// ---------- kids: counting ----------

export interface CountRound {
  n: number;
  options: number[];
  icon: "star" | "moon" | "sun";
}

export function countRounds(r: Rand, rounds = 3): CountRound[] {
  const icons: CountRound["icon"][] = ["star", "moon", "sun"];
  return Array.from({ length: rounds }, (_, i) => {
    const n = int(r, 3, 9);
    const set = new Set([n]);
    while (set.size < 3) {
      const d = n + (r() < 0.5 ? -1 : 1) * int(r, 1, 2);
      if (d >= 1 && d <= 12) set.add(d);
    }
    return { n, options: shuffle([...set], r), icon: icons[i % icons.length] };
  });
}

// ---------- kids: colour sequence ----------

export const PADS = 4;
export function colorSequence(r: Rand, length: number): number[] {
  const seq: number[] = [];
  while (seq.length < length) {
    const v = int(r, 0, PADS - 1);
    if (seq.length && seq[seq.length - 1] === v) continue; // no immediate repeats: easier to follow
    seq.push(v);
  }
  return seq;
}

// ---------- adults: arithmetic ----------

export interface MathProblem {
  text: string;
  answer: number;
}

export function mathProblem(r: Rand, difficulty: 1 | 2 | 3): MathProblem {
  if (difficulty === 1) {
    const a = int(r, 12, 89);
    const b = int(r, 12, 89);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (difficulty === 2) {
    const a = int(r, 12, 39);
    const b = int(r, 3, 9);
    const c = int(r, 11, 59);
    return { text: `${a} × ${b} + ${c}`, answer: a * b + c };
  }
  const a = int(r, 13, 49);
  const b = int(r, 12, 29);
  return { text: `${a} × ${b}`, answer: a * b };
}

// ---------- adults: memory grid ----------

export const GRID = 16;
export function memoryCells(r: Rand, count: number): number[] {
  return shuffle(Array.from({ length: GRID }, (_, i) => i), r).slice(0, count).sort((a, b) => a - b);
}

/** Parses digits typed in Arabic-Indic, Persian or Latin form. */
export function parseNumber(input: string): number | null {
  const latin = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  if (!/^\d{1,6}$/.test(latin)) return null;
  return Number(latin);
}
