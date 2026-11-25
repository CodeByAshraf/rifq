import { useEffect, useState } from "react";

/**
 * Verse explanations from verified sources (see scripts/import-tafsir.mjs):
 *  m — At-Tafsir Al-Muyassar (King Fahd Glorious Quran Printing Complex)
 *  w — word meanings from "As-Siraj fi Bayan Gharib Al-Quran"
 */
export interface SurahTafsir {
  m: string[];
  w: [string, string][][];
}

const BASE: string = (globalThis as { __RIFQ_DATA_BASE__?: string }).__RIFQ_DATA_BASE__ ?? "";
const cache = new Map<number, Promise<SurahTafsir>>();

function loadTafsir(surah: number) {
  if (!cache.has(surah)) {
    const p = fetch(`${BASE}/tafsir/${surah}.json`).then((r) => {
      if (!r.ok) throw new Error("tafsir");
      return r.json() as Promise<SurahTafsir>;
    });
    p.catch(() => cache.delete(surah));
    cache.set(surah, p);
  }
  return cache.get(surah)!;
}

export function useTafsir(surah: number | null) {
  const [t, setT] = useState<SurahTafsir | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (surah == null) return;
    let alive = true;
    setT(null);
    setError(false);
    loadTafsir(surah)
      .then((d) => alive && setT(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [surah]);
  return { tafsir: t, error };
}

export const TAFSIR_SOURCE = "التفسير الميسّر — مجمع الملك فهد لطباعة المصحف الشريف";
export const MEANINGS_SOURCE = "السراج في بيان غريب القرآن";
