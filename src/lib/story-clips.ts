/**
 * Story narration plan. Shared by the app (what to play) and scripts/narrate-stories.mjs
 * (what to record), so the file names always match.
 *
 * - The narrator (an AI voice) reads ONLY the retelling: title, pages, the lesson, and a few
 *   fixed linking lines. It never reads Quran.
 * - Quran verses are played from verified EveryAyah recitations by a human reciter.
 */
import type { Story } from "@/data/stories";

export type Clip =
  | { kind: "voice"; file: string; page?: number }
  | { kind: "ayah"; surah: number; ayah: number };

/** Fixed linking lines, recorded once. */
const LINES = {
  "line-ayah": "والآن، لنستمع معًا إلى آياتٍ من القرآن الكريم عن هذه القصة.",
  "line-next": "والآن، إلى قصّةٍ جديدة.",
  "line-goodnight": "انتهت حكايات الليلة. تصبحون على خير، في حفظ الله ورعايته.",
} as const;

type LineId = keyof typeof LINES;

const pageFile = (id: string, i: number) => `${id}.${i}.mp3`;
const lessonFile = (id: string) => `${id}.lesson.mp3`;

/** Every recording a story needs, with the exact text the narrator reads. @public (scripts/narrate-stories.mjs) */
export function narrationTexts(story: Story): { file: string; text: string }[] {
  return [
    ...story.pages.map((p, i) => ({ file: pageFile(story.id, i), text: i === 0 ? `${story.title}.\n\n${p}` : p })),
    { file: lessonFile(story.id), text: `ماذا تعلّمنا من هذه القصّة؟ ${story.lesson}` },
  ];
}

/** The fixed lines as recordings. @public (scripts/narrate-stories.mjs) */
export const lineTexts = () => (Object.entries(LINES) as [LineId, string][]).map(([k, text]) => ({ file: `${k}.mp3`, text }));

/** What to play for one story, starting at a page: pages, then the verses, then the lesson. */
export function storyPlan(story: Story, fromPage = 0): Clip[] {
  const out: Clip[] = [];
  for (let i = Math.max(0, fromPage); i < story.pages.length; i++) out.push({ kind: "voice", file: pageFile(story.id, i), page: i });
  if (story.ayah) {
    out.push({ kind: "voice", file: "line-ayah.mp3", page: story.pages.length });
    for (let a = story.ayah.from; a <= story.ayah.to; a++) out.push({ kind: "ayah", surah: story.ayah.surah, ayah: a });
  }
  out.push({ kind: "voice", file: lessonFile(story.id), page: story.pages.length });
  return out;
}
