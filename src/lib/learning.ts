import { STATIONS } from "@/data/journey";
import { surahMeta } from "@/lib/quran";
import { isDue } from "@/lib/srs";
import { surahProgress, today, verseKey, type ActivityEntry, type ChildData, type VerseProgress } from "@/lib/store";
import { dayOf, dayOffset } from "@/lib/dates";

/** First verse along the journey that has not been started yet. */
export function nextVerseToLearn(verses: Record<string, VerseProgress>) {
  for (const st of STATIONS) {
    const m = surahMeta(st.surah);
    for (let a = 1; a <= m.verses; a++) {
      const v = verses[verseKey(st.surah, a)];
      if (!v || v.state === "not_started") return { surah: st.surah, ayah: a };
    }
  }
  return { surah: 1, ayah: 1 };
}

export function dueVerses(verses: Record<string, VerseProgress>) {
  const t = today();
  return Object.entries(verses)
    .filter(([, v]) => v.state !== "not_started" && isDue(v, t))
    .map(([k, v]) => {
      const [surah, ayah] = k.split(":").map(Number);
      return { surah, ayah, v };
    })
    .sort((a, b) => (a.v.state === "needs_revision" ? -1 : 0) - (b.v.state === "needs_revision" ? -1 : 0) || a.v.due.localeCompare(b.v.due));
}

export function stationStatus(verses: Record<string, VerseProgress>) {
  let unlockedNext = true;
  return STATIONS.map((st) => {
    const p = surahProgress(verses, st.surah, surahMeta(st.surah).verses);
    const done = p.learned === p.total;
    const status: "done" | "current" | "locked" = done ? "done" : unlockedNext ? "current" : "locked";
    if (!done) unlockedNext = false;
    return { ...st, ...p, status };
  });
}

const sameDay = (iso: string, day: string) => dayOf(iso) === day;

export function dailyMissions(d: ChildData) {
  const t = today();
  const todays = d.activity.filter((a) => sameDay(a.at, t));
  const has = (k: ActivityEntry["kind"]) => todays.some((a) => a.kind === k);
  return [
    { id: "memorize", label: "احفظ آيةً جديدة", done: has("memorize"), href: "/memorize", stars: 5 },
    { id: "revise", label: "راجع آياتك", done: has("revise"), href: "/revision", stars: 3 },
    { id: "play", label: "العب لعبةً تعليمية", done: has("game") || has("lesson"), href: "/play", stars: 2 },
  ];
}

export function learnedTotal(verses: Record<string, VerseProgress>) {
  return Object.values(verses).filter((v) => v.state !== "not_started").length;
}

export function relativeDay(iso: string) {
  const d = dayOf(iso);
  if (d === today()) return "اليوم";
  if (d === dayOffset(-1)) return "أمس";
  return new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}
