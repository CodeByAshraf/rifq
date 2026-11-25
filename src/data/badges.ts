import type { ChildData } from "@/lib/store";
import surahs from "@/data/surahs.json";

export type BadgeId =
  | "first_verse"
  | "first_surah"
  | "streak_7"
  | "tajweed_explorer"
  | "memorization_champion"
  | "revision_hero"
  | "game_star"
  | "stars_100"
  | "story_lover";

export interface Badge {
  id: BadgeId;
  title: string;
  description: string;
  /** Palette key used by the badge illustration. */
  tone: "teal" | "sun" | "lilac" | "mint" | "sky" | "coral";
  shape: "star" | "book" | "flame" | "lantern" | "crown" | "shield" | "leaf" | "moon";
  check: (d: ChildData, streak: number) => boolean;
}

const learnedCount = (d: ChildData) => Object.values(d.verses).filter((v) => v.state !== "not_started").length;

function completedSurah(d: ChildData) {
  return surahs.some((s) => {
    for (let a = 1; a <= s.verses; a++) {
      const v = d.verses[`${s.id}:${a}`];
      if (!v || v.state === "not_started") return false;
    }
    return true;
  });
}

export const BADGES: Badge[] = [
  { id: "first_verse", title: "الخطوة الأولى", description: "حفظتَ أوّل آية", tone: "mint", shape: "leaf", check: (d) => learnedCount(d) >= 1 },
  { id: "first_surah", title: "أوّل سورة", description: "أتممتَ حفظ سورة كاملة", tone: "sun", shape: "book", check: completedSurah },
  { id: "streak_7", title: "سبعة أيام متتالية", description: "تعلّمتَ سبعة أيام بلا انقطاع", tone: "coral", shape: "flame", check: (_, s) => s >= 7 },
  { id: "tajweed_explorer", title: "مستكشف التجويد", description: "أكملتَ ثلاثة دروس في التجويد", tone: "lilac", shape: "lantern", check: (d) => Object.keys(d.lessons).length >= 3 },
  { id: "memorization_champion", title: "بطل الحفظ", description: "حفظتَ خمسين آية", tone: "teal", shape: "crown", check: (d) => learnedCount(d) >= 50 },
  { id: "revision_hero", title: "بطل المراجعة", description: "راجعتَ آياتك ثلاثين مرة", tone: "sky", shape: "shield", check: (d) => Object.values(d.verses).reduce((n, v) => n + v.reps, 0) >= 30 },
  { id: "game_star", title: "نجم الألعاب", description: "لعبتَ خمس ألعاب تعليمية", tone: "sun", shape: "star", check: (d) => Object.values(d.games).reduce((n, g) => n + g.plays, 0) >= 5 },
  { id: "story_lover", title: "صديق الحكايات", description: "قرأتَ خمس قصص", tone: "coral", shape: "book", check: (d) => Object.keys(d.stories ?? {}).length >= 5 },
  { id: "stars_100", title: "مئة نجمة", description: "جمعتَ مئة نجمة", tone: "lilac", shape: "moon", check: (d) => d.stars >= 100 },
];

/** Garden decorations unlocked by star totals. */
export const DECOR = [
  { id: "palm", title: "نخلة", stars: 10 },
  { id: "fountain", title: "نافورة", stars: 30 },
  { id: "lantern", title: "فانوس", stars: 60 },
  { id: "flowers", title: "زهور", stars: 90 },
  { id: "dome", title: "قبّة صغيرة", stars: 150 },
];
