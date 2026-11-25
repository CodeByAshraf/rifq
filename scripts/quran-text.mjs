// Shared, documented transformation from the source Quran text to what the app serves.
//
// Source: quran-json@3.1.2 = Uthmani Hafs text of the Noble Qur'an Encyclopedia (quranenc.com),
// which is the King Fahd Complex (KFGQPC) text in the LEGACY font encoding. That encoding
// writes the three "open tanween" marks with code points that only the KFGQPC font draws
// correctly. Every other font (including Amiri Quran, used by the app) draws them as an
// inverted damma, a subscript alef and an empty box, so they must be mapped to the standard
// Unicode code points (U+08F0..U+08F2), exactly as the KFGQPC Uthmanic Hafs v3.0 release does.
//
// No letter is changed by this file. The two ayah fixes below are taken verbatim from the
// KFGQPC Uthmanic Hafs v3.0 (2026) release and are checked against it by verify-quran.mjs.

/** Legacy KFGQPC code point -> standard Unicode open tanween. */
export const TANWEEN_MAP = {
  "ٗ": "ࣰ", // open fathatan  (legacy: ARABIC INVERTED DAMMA)
  "ٞ": "ࣱ", // open dammatan  (legacy: ARABIC FATHA WITH TWO DOTS — missing from most fonts)
  "ٖ": "ࣲ", // open kasratan  (legacy: ARABIC SUBSCRIPT ALEF)
};

/**
 * Ayah-level corrections, each matched against an exact source string so a future source
 * update can never be silently "fixed" twice or patched in the wrong place.
 */
export const AYAH_FIXES = [
  {
    // Al-Baqarah 72: the legacy text seats the hamza of «فَٱدَّٰرَٰءۡتُمۡ» on a THIN SPACE (U+2009),
    // which splits the word in two in every font except KFGQPC's.
    key: "2:72",
    // فَٱدَّـٰرَ<THIN SPACE>ٰٔتُمۡ  ->  فَٱدَّٰرَٰءۡتُمۡ  (code points spelled out: mark order matters)
    from: "\u0641\u064E\u0671\u062F\u0651\u064E\u0640\u0670\u0631\u064E\u2009\u0670\u0654\u062A\u064F\u0645\u06E1",
    to: "\u0641\u064E\u0671\u062F\u0651\u064E\u0670\u0631\u064E\u0670\u0621\u06E1\u062A\u064F\u0645\u06E1",
  },
  {
    // At-Tur 37: Hafs reads «المصيطرون» with sad and seen, sad first, so the Madinah Mushaf
    // writes the small seen BELOW the sad (U+06E3), not above it (U+06DC, which marks
    // the seen-first words of Al-Baqarah 245 and Al-A'raf 69).
    key: "52:37",
    // ٱلۡمُصۜ‍َيۡطِرُونَ -> ٱلۡمُصۣ‍َيۡطِرُونَ (only the seen mark changes: U+06DC -> U+06E3)
    from: "\u0635\u06DC\u064E\u064A\u06E1\u0637",
    to: "\u0635\u06E3\u064E\u064A\u06E1\u0637",
  },
];

export function transformAyah(surah, ayah, text) {
  let t = text;
  const key = `${surah}:${ayah}`;
  for (const fix of AYAH_FIXES) {
    if (fix.key !== key) continue;
    if (!t.includes(fix.from)) throw new Error(`Fix for ${key} no longer matches the source text`);
    t = t.replace(fix.from, fix.to);
  }
  return t.replace(/[ٖٗٞ]/g, (c) => TANWEEN_MAP[c]);
}

/** Letters only (no marks, no tatweel, no spaces): used to prove no letter was changed. */
export function letters(text) {
  return text
    .normalize("NFD")
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ \s]/g, "")
    .replace(/ء/g, "") // the 2:72 fix moves a hamza from a mark (U+0654) to a letter (U+0621)
    .replace(/ٔ/g, "");
}
