import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconCheck, IconFamily, IconFlame, IconHome, IconLantern, IconRefresh, IconShield, IconSparkle, IconSprout, IconStar, IconUser } from "@/components/art/Icons";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { isAdultArea } from "@/lib/area";
import { usePathname } from "@/lib/router";
import { Card, Celebrate, Chip, Modal, ProgressBar } from "@/components/ui";
import adhkar from "@/data/adhkar.json";
import { playSfx } from "@/lib/fx";
import { showBasmalaHeader, surahMeta, toArabicDigits, useSurah } from "@/lib/quran";
import { actions, today, useChild } from "@/lib/store";

interface Zekr {
  id: string;
  text?: string;
  before?: string;
  after?: string;
  /** [surah, fromAyah, toAyah, fromWord?] — fromWord (1-based) shows only the end of the first ayah. */
  quran?: ([number, number, number] | [number, number, number, number])[];
  basmala?: boolean;
  count: number;
  virtue?: string;
  source?: string;
  /** Grading note for narrations that scholars graded differently. */
  note?: string;
}
interface Section {
  id: string;
  title: string;
  items: Zekr[];
}
interface Daily {
  key: string;
  title: string;
  icon: string;
  items: Zekr[];
}

const DATA = adhkar as { source: string; sections: Section[]; daily: Daily[] };

const ICONS: Record<string, typeof IconHome> = {
  sun: IconSparkle,
  shirt: IconUser,
  door: IconHome,
  drop: IconSprout,
  home: IconHome,
  mosque: IconLantern,
  food: IconStar,
  smile: IconSparkle,
  heart: IconFlame,
  rain: IconRefresh,
  people: IconFamily,
  moon: IconLantern,
};
const TONES = ["bg-teal-100 text-teal-700", "bg-sun-100 text-sun-600", "bg-lilac-100 text-lilac-600", "bg-sky-100 text-sky-500", "bg-mint-100 text-mint-600", "bg-coral-100 text-coral-500"];

/** Quran passage inside a zekr — always rendered from the verified Quran text. */
function QuranPassage({ surah, from, to, fromWord, basmala }: { surah: number; from: number; to: number; fromWord?: number; basmala?: boolean }) {
  const { surah: s } = useSurah(surah);
  const { surah: fatiha } = useSurah(basmala && showBasmalaHeader(surah) ? 1 : null);
  if (!s) return <span className="inline-block h-8 w-2/3 animate-pulse rounded-xl bg-cream-200" />;
  return (
    <span className="block">
      {basmala && fatiha && showBasmalaHeader(surah) && (
        <span className="mb-1 block text-teal-700">
          <VerseText text={fatiha.verses[0].text} />
        </span>
      )}
      {s.verses.slice(from - 1, to).map((v, i) => (
        <span key={v.id}>
          {/* Words are taken from the verified text as-is; nothing is retyped. */}
          <VerseText text={i === 0 && fromWord ? v.text.split(" ").slice(fromWord - 1).join(" ") : v.text} />
          <AyahMark n={v.id} />{" "}
        </span>
      ))}
      <span className="mt-1 block font-body text-xs text-ink-500">
        سورة {surahMeta(surah).name} {from === to ? toArabicDigits(from) : `${toArabicDigits(from)}–${toArabicDigits(to)}`}
        {fromWord ? " (من الآية)" : ""}
      </span>
    </span>
  );
}

function ZekrBody({ z, big = false }: { z: Zekr; big?: boolean }) {
  return (
    <div className={`text-right leading-[2.1] ${big ? "text-2xl" : "text-xl"}`}>
      {z.before && <p className="font-display font-bold text-ink-900">{z.before}</p>}
      {z.quran?.map(([s, a, b, w], i) => (
        <div key={i} className="quran my-2 rounded-2xl bg-teal-50 p-3 text-center text-[1.35em]">
          <QuranPassage surah={s} from={a} to={b} fromWord={w} basmala={z.basmala} />
        </div>
      ))}
      {z.text && <p className="font-display font-bold text-ink-900">{z.text}</p>}
      {z.after && <p className="font-display font-bold text-ink-900">{z.after}</p>}
    </div>
  );
}

export function Adhkar() {
  const adult = isAdultArea(usePathname());
  const { data } = useChild();
  const hour = new Date().getHours();
  const [tab, setTab] = useState<string>(hour < 12 ? "morning" : hour < 20 ? "evening" : "daily");
  const [dua, setDua] = useState<Daily | null>(null);
  const doneToday = data.adhkar?.[today()] ?? [];

  const tabs = [{ id: "daily", title: "أدعية يومية" }, ...DATA.sections.map((s) => ({ id: s.id, title: s.title }))];
  const section = DATA.sections.find((s) => s.id === tab);

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-teal-500 to-teal-700 p-7 text-white shadow-lift sm:p-9">
        <div className="pattern-girih absolute inset-0 opacity-50 mix-blend-overlay" />
        <div className="relative flex items-center gap-5">
          {!adult && <MagdyImage size={140} className="hidden shrink-0 drop-shadow-xl sm:block" />}
          <div>
            <h1 className="font-display text-4xl font-extrabold">الأذكار والأدعية</h1>
            <p className="mt-2 max-w-lg text-teal-50">ابدأ يومك واختمه بذكر الله، فذكر الله نورٌ للقلب وطمأنينة.</p>
            {!adult && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(["morning", "evening"] as const).map((k) => (
                  <Chip key={k} className={doneToday.includes(k) ? "bg-white text-teal-700" : "bg-white/20 text-white"}>
                    {doneToday.includes(k) && <IconCheck size={14} />} {k === "morning" ? "أذكار الصباح" : "أذكار المساء"}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-2xl px-4 py-2.5 font-display font-bold transition ${tab === t.id ? "bg-teal-500 text-white shadow-[0_4px_0_#0d7870]" : "bg-white/80 text-ink-700"}`}>
            {t.title}
            {(t.id === "morning" || t.id === "evening") && doneToday.includes(t.id) && <IconCheck size={14} className="mr-1 inline" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
          {tab === "daily" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {DATA.daily.map((d, i) => {
                const I = ICONS[d.icon] ?? IconStar;
                return (
                  <button key={d.key} onClick={() => setDua(d)} className="text-right">
                    <Card className="flex h-full flex-col gap-3 p-4 transition hover:-translate-y-1">
                      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${TONES[i % TONES.length]}`}>
                        <I size={24} />
                      </span>
                      <span className="font-display text-lg font-extrabold leading-snug">{d.title}</span>
                    </Card>
                  </button>
                );
              })}
            </div>
          ) : section ? (
            <SectionReader key={section.id} section={section} done={!adult && doneToday.includes(section.id)} adult={adult} />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
        <IconShield size={16} className="mt-0.5 shrink-0 text-teal-600" />
        المصدر: {DATA.source}
      </p>

      <Modal open={!!dua} onClose={() => setDua(null)} title={dua?.title}>
        {dua && (
          <div>
            <h3 className="font-display text-2xl font-extrabold text-teal-700">{dua.title}</h3>
            {dua.items.map((z) => (
              <div key={z.id} className="mt-4">
                <ZekrBody z={z} big />
                {z.virtue && <p className="mt-3 rounded-2xl bg-sun-100 p-3 text-sm text-ink-700">{z.virtue}</p>}
                {z.source && <p className="mt-2 text-xs text-ink-500">رواه: {z.source}</p>}
                {z.note && <p className="mt-1 text-xs text-ink-500">{z.note}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

function SectionReader({ section, done, adult }: { section: Section; done: boolean; adult: boolean }) {
  const [left, setLeft] = useState<Record<string, number>>(() => Object.fromEntries(section.items.map((z) => [z.id, z.count])));
  const [celebrate, setCelebrate] = useState(false);
  const total = useMemo(() => section.items.reduce((n, z) => n + z.count, 0), [section]);
  const remaining = Object.values(left).reduce((n, x) => n + x, 0);
  const finished = section.items.filter((z) => left[z.id] === 0).length;

  const tap = (z: Zekr) => {
    if (left[z.id] === 0) return;
    const nx = { ...left, [z.id]: left[z.id] - 1 };
    setLeft(nx);
    if (navigator.vibrate) navigator.vibrate(12);
    if (nx[z.id] === 0) playSfx("correct");
    if (Object.values(nx).every((x) => x === 0)) {
      // Stars and certificates belong to the child's profile, not to an adult reading here.
      if (!adult) actions.completeAdhkar(section.id, `${section.title}`);
      setCelebrate(true);
    }
  };

  return (
    <>
      <Card className="sticky top-24 z-20 mb-4 flex items-center gap-3 p-4">
        <span className="font-display font-extrabold">{section.title}</span>
        <ProgressBar value={(total - remaining) / total} tone="mint" className="flex-1" />
        <span className="text-sm font-bold text-ink-500">
          {toArabicDigits(finished)}/{toArabicDigits(section.items.length)}
        </span>
        {done && (
          <Chip className="bg-mint-100 text-mint-600">
            <IconCheck size={14} /> أُنجزت اليوم
          </Chip>
        )}
      </Card>
      <div className="space-y-3">
        {section.items.map((z) => {
          const n = left[z.id];
          const complete = n === 0;
          return (
            <motion.div key={z.id} layout>
              <Card className={`p-5 transition ${complete ? "opacity-60" : ""}`}>
                <ZekrBody z={z} />
                {z.virtue && !complete && <p className="mt-3 rounded-2xl bg-sun-100/70 p-3 text-sm leading-relaxed text-ink-700">{z.virtue}</p>}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-500">
                    {z.source ? `رواه: ${z.source}` : ""}
                    {z.note && <span className="block">{z.note}</span>}
                  </span>
                  <button
                    onClick={() => tap(z)}
                    disabled={complete}
                    className={`clay flex h-14 min-w-28 items-center justify-center gap-2 rounded-2xl px-5 font-display text-lg font-extrabold ${complete ? "clay-mint text-white" : "clay-teal text-white"}`}
                    aria-label={complete ? "تمّ" : `اضغط للعدّ، المتبقّي ${n}`}
                  >
                    {complete ? (
                      <>
                        <IconCheck size={20} /> تمّ
                      </>
                    ) : z.count > 1 ? (
                      <>
                        {toArabicDigits(n)} <span className="text-sm font-bold opacity-80">مرّة</span>
                      </>
                    ) : (
                      "قرأتُه"
                    )}
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <Celebrate open={celebrate} onClose={() => setCelebrate(false)} title="تقبّل الله منك" message={`أتممتَ ${section.title}. نسأل الله أن يحفظك ويبارك في يومك.`} stars={done || adult ? undefined : 3} />
    </>
  );
}
