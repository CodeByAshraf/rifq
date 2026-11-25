/**
 * Certificates of appreciation (شهادات تقدير).
 * Each certificate is earned once and is generated on the device as a printable image.
 */
import { STATIONS } from "@/data/journey";
import { STORIES } from "@/data/stories";
import { LESSONS } from "@/data/tajweed";
import surahs from "@/data/surahs.json";
import type { ChildData } from "@/lib/store";

type Gender = "m" | "f";
export type CertKind = "surah" | "juz" | "lesson" | "tajweed" | "journey" | "streak" | "stories" | "adhkar" | "challenge" | "recite";

export interface CertInfo {
  id: string;
  kind: CertKind;
  /** Short label for lists. */
  label: string;
  /** Main achievement line on the certificate (verb agrees with gender). */
  achievement: (g: Gender) => string;
  /** How to earn it (shown while locked). */
  how: string;
}

const v = (g: Gender, m: string, f: string) => (g === "f" ? f : m);

const learned = (d: ChildData, s: number, total: number) => {
  for (let a = 1; a <= total; a++) {
    const p = d.verses[`${s}:${a}`];
    if (!p || p.state === "not_started") return false;
  }
  return true;
};

const SURAH_META = surahs as { id: number; name: string; verses: number }[];
const JUZ_AMMA = SURAH_META.filter((s) => s.id >= 78);

export function certInfo(id: string): CertInfo | null {
  const [kind, arg] = id.split(":");
  switch (kind) {
    case "surah": {
      const s = SURAH_META[Number(arg) - 1];
      if (!s) return null;
      return { id, kind: "surah", label: `حفظ سورة ${s.name}`, achievement: (g) => `${v(g, "أتمّ", "أتمّت")} حفظ سورة ${s.name}`, how: `احفظ جميع آيات سورة ${s.name}.` };
    }
    case "juz":
      return { id, kind: "juz", label: "حفظ جزء عمّ", achievement: (g) => `${v(g, "أتمّ", "أتمّت")} حفظ جزء عمّ كاملًا`, how: "احفظ جميع سور جزء عمّ." };
    case "lesson": {
      const l = LESSONS.find((x) => x.id === arg);
      if (!l) return null;
      return { id, kind: "lesson", label: `درس ${l.title}`, achievement: (g) => `${v(g, "أتمّ", "أتمّت")} درس «${l.title}» في أكاديمية التجويد`, how: `أكمل درس ${l.title} واختباره.` };
    }
    case "tajweed":
      return { id, kind: "tajweed", label: "جميع دروس التجويد", achievement: (g) => `${v(g, "أتمّ", "أتمّت")} جميع دروس أكاديمية التجويد`, how: "أكمل كلّ دروس أكاديمية التجويد." };
    case "journey":
      return { id, kind: "journey", label: `${toAr(arg)} محطّات في الرحلة`, achievement: (g) => `${v(g, "اجتاز", "اجتازت")} ${toAr(arg)} محطّات في رحلة القرآن`, how: `أتمّ ${toAr(arg)} محطّات في خريطة الرحلة.` };
    case "streak":
      return { id, kind: "streak", label: `${toAr(arg)} يومًا متتالية`, achievement: (g) => `${v(g, "واظب", "واظبت")} على التعلّم ${toAr(arg)} يومًا متتالية`, how: `تعلّم ${toAr(arg)} يومًا بلا انقطاع.` };
    case "stories":
      return arg === "all"
        ? { id, kind: "stories", label: "كلّ الحكايات", achievement: (g) => `${v(g, "قرأ", "قرأت")} جميع حكايات رِفق`, how: "اقرأ كلّ القصص." }
        : { id, kind: "stories", label: `${toAr(arg)} قصص`, achievement: (g) => `${v(g, "قرأ", "قرأت")} ${toAr(arg)} قصص من حكايات رِفق`, how: `اقرأ ${toAr(arg)} قصص.` };
    case "adhkar":
      return { id, kind: "adhkar", label: "أذكار ٧ أيام", achievement: (g) => `${v(g, "حافظ", "حافظت")} على أذكار الصباح والمساء سبعة أيام`, how: "أكمل أذكار الصباح والمساء في ٧ أيام مختلفة." };
    case "kahf":
      return { id, kind: "challenge", label: `سورة الكهف · ${arg}`, achievement: (g) => `${v(g, "أتمّ", "أتمّت")} قراءة سورة الكهف يوم الجمعة`, how: "اقرأ سورة الكهف كاملة يوم الجمعة." };
    case "ramadan":
      return { id, kind: "challenge", label: `ختمة رمضان ${arg}`, achievement: (g) => `${v(g, "أتمّ", "أتمّت")} ختمة القرآن الكريم في رمضان`, how: "اقرأ الأجزاء الثلاثين في رمضان." };
    case "recite":
      return { id, kind: "recite", label: "١٠ تلاوات مسجّلة", achievement: (g) => `${v(g, "سجّل", "سجّلت")} عشر تلاوات ${v(g, "بصوته", "بصوتها")}`, how: "سجّل ١٠ تلاوات في «تلاوتي»." };
    default:
      return null;
  }
}

function toAr(n: string | number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

/** All certificate ids that a learner has earned according to their progress. */
export function earnedCertificates(d: ChildData, streak: number): string[] {
  const ids: string[] = [];
  for (const s of SURAH_META) if (learned(d, s.id, s.verses)) ids.push(`surah:${s.id}`);
  if (JUZ_AMMA.every((s) => learned(d, s.id, s.verses))) ids.push("juz:30");
  for (const l of LESSONS) if (d.lessons[l.id]) ids.push(`lesson:${l.id}`);
  if (LESSONS.every((l) => d.lessons[l.id])) ids.push("tajweed:all");
  const stationsDone = STATIONS.filter((st) => learned(d, st.surah, SURAH_META[st.surah - 1].verses)).length;
  for (const n of [5, 10, 20, STATIONS.length]) if (stationsDone >= n) ids.push(`journey:${n}`);
  for (const n of [7, 30]) if (streak >= n) ids.push(`streak:${n}`);
  const storiesRead = Object.keys(d.stories ?? {}).length;
  if (storiesRead >= 10) ids.push("stories:10");
  if (storiesRead >= STORIES.length) ids.push("stories:all");
  const adhkarDays = Object.values(d.adhkar ?? {}).filter((s) => s.includes("morning") && s.includes("evening")).length;
  if (adhkarDays >= 7) ids.push("adhkar:7");
  for (const [date, parts] of Object.entries(d.challenges?.kahf ?? {})) if (parts.length >= 10) ids.push(`kahf:${date}`);
  for (const [year, juz] of Object.entries(d.challenges?.ramadan ?? {})) if (juz.length >= 30) ids.push(`ramadan:${year}`);
  if ((d.recordings ?? 0) >= 10) ids.push("recite:10");
  return ids;
}

/** Certificates shown as goals in the gallery (a curated selection, not every surah). */
export const GOALS: string[] = [
  "surah:1",
  "surah:114",
  "surah:113",
  "surah:112",
  "surah:108",
  "surah:103",
  "juz:30",
  "lesson:noon",
  "lesson:meem",
  "lesson:madd",
  "tajweed:all",
  "journey:5",
  "journey:10",
  "streak:7",
  "streak:30",
  "stories:10",
  "adhkar:7",
  "recite:10",
];
