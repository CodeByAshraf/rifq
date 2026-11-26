/**
 * The page-by-page Mushaf of the adults' corner (Madinah layout, 604 pages × 15 lines), built
 * and verified by scripts/build-mushaf.mjs. Pages are small local files read on demand, so the
 * app does not load anything until a page is opened.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import INDEX from "@/data/mushaf-index.json";

export const PAGES = 604;
export const MUSHAF_INDEX = INDEX as { basmalah: string; surah: number[]; juz: number[]; page: number[] };

/** [surah, ayah, words, the āyah ends on this line] */
type Segment = [number, number, string, boolean];
export type Row = { h: number } | { b: 1 } | { l: Segment[] };
export interface MushafPage {
  p: number;
  j: number;
  rows: Row[];
}

const BASE: string = (globalThis as { __RIFQ_DATA_BASE__?: string }).__RIFQ_DATA_BASE__ ?? "";
const cache = new Map<number, Promise<MushafPage>>();

export const clampPage = (p: number) => Math.min(PAGES, Math.max(1, Math.round(Number.isFinite(p) ? p : 1)));

function loadPage(p: number): Promise<MushafPage> {
  const n = clampPage(p);
  if (!cache.has(n)) {
    const req = fetch(`${BASE}/mushaf/${n}.json`).then((r) => {
      if (!r.ok) throw new Error("page");
      return r.json() as Promise<MushafPage>;
    });
    req.catch(() => cache.delete(n));
    cache.set(n, req);
    // Keep memory small: only the last few pages stay cached.
    if (cache.size > 12) cache.delete(cache.keys().next().value!);
  }
  return cache.get(n)!;
}

export function useMushafPage(p: number) {
  const [page, setPage] = useState<MushafPage | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    setError(false);
    loadPage(p)
      .then((d) => {
        if (!alive) return;
        setPage(d);
        // Prefetch the neighbours so turning the page is instant.
        if (p < PAGES) void loadPage(p + 1).catch(() => {});
        if (p > 1) void loadPage(p - 1).catch(() => {});
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [p]);
  return { page: page?.p === p ? page : null, error };
}

/** The surah of the page's first line (what the printed page header names). */
export const surahOfPage = (p: number): number => MUSHAF_INDEX.page[clampPage(p) - 1] || 1;

export function juzOfPage(p: number): number {
  let j = 1;
  for (let i = 0; i < 30; i++) if (MUSHAF_INDEX.juz[i] <= p) j = i + 1;
  return j;
}

// ---------- reading position and bookmark (this device only) ----------

export interface Bookmark {
  p: number;
  s: number;
  a: number;
  at: number;
}
interface ReaderState {
  last: number;
  mark: Bookmark | null;
}

const KEY = "rifq.mushaf.v1";
const DEFAULT: ReaderState = { last: 1, mark: null };
let state: ReaderState | null = null;
const listeners = new Set<() => void>();

const int = (v: unknown, lo: number, hi: number) => typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;

/** Accepts anything and returns a valid reader state. @public (tests) */
export function sanitizeReader(raw: unknown): ReaderState {
  const out: ReaderState = { ...DEFAULT };
  if (typeof raw !== "object" || raw === null) return out;
  const r = raw as Record<string, unknown>;
  if (int(r.last, 1, PAGES)) out.last = r.last as number;
  const m = r.mark as Record<string, unknown> | null;
  if (m && typeof m === "object" && int(m.p, 1, PAGES) && int(m.s, 1, 114) && int(m.a, 1, 286) && int(m.at, 0, 9e15)) {
    out.mark = { p: m.p as number, s: m.s as number, a: m.a as number, at: m.at as number };
  }
  return out;
}

function read(): ReaderState {
  if (state) return state;
  try {
    state = sanitizeReader(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    state = { ...DEFAULT };
  }
  return state;
}

function write(next: ReaderState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export const reader = {
  setLast(p: number) {
    const cur = read();
    if (cur.last !== clampPage(p)) write({ ...cur, last: clampPage(p) });
  },
  setMark(m: Omit<Bookmark, "at">) {
    write({ ...read(), mark: { ...m, p: clampPage(m.p), at: Date.now() } });
  },
  clearMark() {
    write({ ...read(), mark: null });
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useReader = () => useSyncExternalStore(subscribe, read, () => DEFAULT);

/** «۝١٢» — the āyah-end sign with its number, as the Mushaf prints it (drawn by the KFGQPC font). */
export const ayahEnd = (n: number) => `۝${String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)])}`;
