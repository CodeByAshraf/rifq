import { playSfx } from "@/lib/fx";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Character } from "@/components/art/Character";
import { IconCheck, IconNext, IconPlay, IconPrev, IconShield, IconStar } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { StoryScene } from "@/components/art/StoryScene";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, Celebrate, Chip, SampleNotice } from "@/components/ui";
import { CATEGORIES, STORIES, storyOfTheDay, type Story, type StoryCategory } from "@/data/stories";
import { RULE_STYLES } from "@/data/tajweed";
import { useRecitation } from "@/lib/player";
import { surahMeta, toArabicDigits, useSurah } from "@/lib/quran";
import { actions, useChild } from "@/lib/store";

const catOf = (c: StoryCategory) => CATEGORIES.find((x) => x.id === c)!;

export function Stories() {
  const [open, setOpen] = useState<Story | null>(null);
  return <AppShell>{open ? <StoryReader story={open} onExit={() => setOpen(null)} onOpen={setOpen} /> : <StoryList onOpen={setOpen} />}</AppShell>;
}

function StoryList({ onOpen }: { onOpen: (s: Story) => void }) {
  const { data } = useChild();
  const [cat, setCat] = useState<StoryCategory | "all">("all");
  const [q, setQ] = useState("");
  const done = data.stories ?? {};
  const featured = storyOfTheDay();
  const list = useMemo(
    () => STORIES.filter((s) => (cat === "all" || s.category === cat) && (!q.trim() || s.title.includes(q.trim()))),
    [cat, q],
  );

  return (
    <>
      {/* hero: story of the day */}
      <div className="relative overflow-hidden rounded-[2.2rem] shadow-lift">
        <StoryScene scene={featured.scene} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-l from-ink-900/75 via-ink-900/35 to-transparent" />
        <div className="relative flex min-h-64 flex-col justify-end gap-3 p-7 text-white sm:min-h-72 sm:p-9">
          <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">قصة اليوم</span>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">{featured.title}</h1>
          <p className="max-w-md text-white/85">{featured.pages[0]}</p>
          <Button size="lg" tone="sun" className="w-fit" onClick={() => onOpen(featured)}>
            <IconPlay size={20} /> اقرأ القصة
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-3xl font-extrabold">حكايات رِفق</h2>
        <Chip className="bg-sun-100 text-sun-600">
          قرأتَ {toArabicDigits(Object.keys(done).length)} من {toArabicDigits(STORIES.length)}
        </Chip>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن قصة…" className="h-11 min-w-0 flex-1 rounded-2xl bg-white/90 px-4 text-sm outline-none ring-1 ring-ink-300/30 focus:ring-2 focus:ring-teal-300 sm:mr-auto sm:max-w-xs" />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {[{ id: "all" as const, label: "الكل", tone: "teal" as const }, ...CATEGORIES].map((c) => {
          const active = cat === c.id;
          const st = RULE_STYLES[c.tone];
          return (
            <button key={c.id} onClick={() => setCat(c.id)} className={`whitespace-nowrap rounded-2xl px-4 py-2.5 font-display font-bold transition ${active ? `${st.dot} text-white shadow-soft` : "bg-white/80 text-ink-700"}`}>
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {list.map((s, i) => {
          const c = catOf(s.category);
          const st = RULE_STYLES[c.tone];
          return (
            <motion.button key={s.id} onClick={() => onOpen(s)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }} className="group text-right">
              <Card className="h-full overflow-hidden p-0 transition group-hover:-translate-y-1">
                <div className="relative aspect-[16/10]">
                  <StoryScene scene={s.scene} className="h-full w-full" />
                  {s.cast && (
                    <div className="absolute bottom-0 left-2 flex">
                      {s.cast.slice(0, 2).map((m) => (
                        <Character key={m.name} avatar={{ skin: m.skin, outfit: m.outfit, headwear: m.headwear, accessory: "none" }} size={46} />
                      ))}
                    </div>
                  )}
                  {done[s.id] && (
                    <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-mint-500 text-white shadow-soft">
                      <IconCheck size={18} />
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <span className={`text-[11px] font-bold ${st.text}`}>{c.label}</span>
                  <div className="font-display text-lg font-extrabold leading-snug">{s.title}</div>
                  <div className="mt-1 text-xs text-ink-500">
                    {toArabicDigits(s.pages.length)} صفحات · العمر {s.age}
                  </div>
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>
      {list.length === 0 && <p className="mt-8 text-center text-ink-500">لا توجد قصة بهذا الاسم.</p>}

      <div className="mt-8">
        <SampleNotice>القصص إعادة صياغة مبسّطة للأطفال، ومعها مصدرها. الآيات تُعرض من النصّ القرآني الموثّق كما هو. لا تُرسم صور الأنبياء ولا الصحابة. «قصص الأخلاق» قصصٌ تربوية خيالية. جميع القصص بانتظار مراجعة مختصّين قبل النشر العام.</SampleNotice>
      </div>
    </>
  );
}

function StoryReader({ story, onExit, onOpen }: { story: Story; onExit: () => void; onOpen: (s: Story) => void }) {
  const total = story.pages.length;
  const [page, setPage] = useState(0); // pages, then "lesson" (= total), then quiz (= total + 1)
  const [answers, setAnswers] = useState<(number | null)[]>(story.quiz.map(() => null));
  const [celebrate, setCelebrate] = useState(false);
  const c = catOf(story.category);
  const st = RULE_STYLES[c.tone];
  const score = answers.filter((a, i) => a === story.quiz[i].answer).length;
  const allAnswered = answers.every((a) => a != null);
  const next = STORIES[(STORIES.findIndex((s) => s.id === story.id) + 1) % STORIES.length];

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onExit} className="mb-4 rounded-2xl bg-white/80 px-4 py-2 text-sm font-bold text-ink-700">
        → كلّ القصص
      </button>
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[16/9] overflow-hidden">
          <motion.div key={page} initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: "easeOut" }} className="h-full w-full">
            <StoryScene scene={story.scene} className="h-full w-full" />
          </motion.div>
          {story.cast && (
            <div className="absolute bottom-0 left-4 flex items-end">
              {story.cast.map((m, i) => (
                <motion.div key={m.name} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 * i }} className="flex flex-col items-center">
                  <Character avatar={{ skin: m.skin, outfit: m.outfit, headwear: m.headwear, accessory: "none" }} size={96} wave={i === 0 && page % 2 === 1} />
                  <span className="-mt-1 mb-1 rounded-full bg-white/90 px-2 text-xs font-bold">{m.name}</span>
                </motion.div>
              ))}
            </div>
          )}
          <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${st.bg} ${st.text}`}>{c.label}</span>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="font-display text-3xl font-extrabold">{story.title}</h1>

          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="mt-5 min-h-40">
              {page < total && <p className="font-display text-2xl font-bold leading-[1.9] text-ink-900 sm:text-[28px]">{story.pages[page]}</p>}

              {page === total && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 rounded-3xl bg-mint-100 p-5">
                    <Mascot size={60} mood="cheer" />
                    <div>
                      <div className="font-display text-lg font-extrabold text-mint-600">ماذا تعلّمنا؟</div>
                      <p className="mt-1 text-lg leading-relaxed text-ink-900">{story.lesson}</p>
                    </div>
                  </div>
                  {story.ayah && <AyahBox ayah={story.ayah} />}
                  <p className="flex items-start gap-2 text-sm text-ink-500">
                    <IconShield size={16} className="mt-0.5 shrink-0 text-teal-600" />
                    المصدر: {story.source}
                  </p>
                </div>
              )}

              {page === total + 1 && (
                <div className="space-y-5">
                  {story.quiz.map((qq, qi) => (
                    <div key={qi}>
                      <div className="font-display text-xl font-extrabold">{qq.q}</div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {qq.options.map((o, k) => {
                          const a = answers[qi];
                          const s = a == null ? "idle" : k === qq.answer ? "right" : k === a ? "wrong" : "dim";
                          return (
                            <button
                              key={k}
                              disabled={a != null}
                              onClick={() => { playSfx(k === qq.answer ? "correct" : "wrong"); setAnswers((arr) => arr.map((x, j) => (j === qi ? k : x))); }}
                              className={`clay rounded-2xl px-4 py-3 font-display font-bold ${s === "right" ? "clay-right" : s === "wrong" ? "clay-wrong" : "clay-white"} ${s === "dim" ? "opacity-60" : ""}`}
                            >
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {allAnswered && (
                    <div className="flex justify-center">
                      <Button size="lg" onClick={() => { actions.completeStory(story.id, story.title, score); setCelebrate(true); }}>
                        <IconStar filled size={20} /> أنهيتُ القصة
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* page dots + nav */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button tone="white" size="sm" className="whitespace-nowrap" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="الصفحة السابقة">
              <IconPrev size={18} /> السابق
            </Button>
            <div className="flex gap-1.5">
              {Array.from({ length: total + 2 }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)} aria-label={`صفحة ${i + 1}`} className={`h-2.5 rounded-full transition-all ${i === page ? `w-7 ${st.dot}` : "w-2.5 bg-cream-300"}`} />
              ))}
            </div>
            {page < total + 1 ? (
              <Button size="sm" className="whitespace-nowrap" onClick={() => setPage((p) => p + 1)}>
                {page === total - 1 ? "الدرس" : page === total ? "الأسئلة" : "التالي"} <IconNext size={18} />
              </Button>
            ) : (
              <span className="w-20" />
            )}
          </div>
        </div>
      </Card>

      <Celebrate
        open={celebrate}
        onClose={() => { setCelebrate(false); onExit(); }}
        title="قصةٌ جميلة!"
        message={`أجبتَ ${toArabicDigits(score)} من ${toArabicDigits(story.quiz.length)} إجاباتٍ صحيحة.`}
        actions={
          <>
            <Button onClick={() => { setCelebrate(false); onOpen(next); }}>القصة التالية</Button>
            <Button tone="white" onClick={() => { setCelebrate(false); onExit(); }}>كلّ القصص</Button>
          </>
        }
      />
    </div>
  );
}

/** Related verses, rendered only from the verified Quran text. */
function AyahBox({ ayah }: { ayah: NonNullable<Story["ayah"]> }) {
  const { surah } = useSurah(ayah.surah);
  const player = useRecitation();
  const verses = surah?.verses.slice(ayah.from - 1, ayah.to) ?? [];
  return (
    <div className="rounded-3xl border-2 border-cream-200 bg-cream-50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display font-extrabold text-teal-700">من القرآن الكريم</span>
        <span className="text-xs font-bold text-ink-500">
          سورة {surahMeta(ayah.surah).name} · {ayah.from === ayah.to ? `الآية ${toArabicDigits(ayah.from)}` : `الآيات ${toArabicDigits(ayah.from)}–${toArabicDigits(ayah.to)}`}
        </span>
        <button
          onClick={() => (player.playing ? player.pause() : player.play({ surah: ayah.surah, from: ayah.from, to: ayah.to, repeatEach: 1, repeatGroup: 1 }))}
          className="mr-auto flex items-center gap-1 rounded-xl bg-teal-100 px-3 py-1.5 text-sm font-bold text-teal-700"
        >
          <IconPlay size={14} /> {player.playing ? "إيقاف" : "استمع"}
        </button>
      </div>
      <p className="mt-3 text-center text-2xl sm:text-3xl">
        {verses.length === 0 && <span className="inline-block h-10 w-2/3 animate-pulse rounded-xl bg-cream-200" />}
        {verses.map((v) => (
          <span key={v.id} className={player.playing && player.ayah === v.id ? "rounded-xl bg-sun-100" : ""}>
            <VerseText text={v.text} />
            <AyahMark n={v.id} active={player.playing && player.ayah === v.id} />{" "}
          </span>
        ))}
      </p>
      {player.error && <p className="mt-2 text-center text-sm font-bold text-coral-500">{player.error}</p>}
    </div>
  );
}
