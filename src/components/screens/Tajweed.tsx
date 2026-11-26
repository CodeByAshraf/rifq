import { playSfx } from "@/lib/fx";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { IconCheck, IconLantern, IconPlay, IconShield, IconX } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, Celebrate, Chip, SampleNotice } from "@/components/ui";
import { LESSONS, RULE_STYLES, ruleById, type Example, type Lesson } from "@/data/tajweed";
import { useRecitation } from "@/lib/player";
import { surahMeta, toArabicDigits, useSurahs } from "@/lib/quran";
import { actions, useChild } from "@/lib/store";

export function Tajweed() {
  const [active, setActive] = useState<string | null>(null);
  const lesson = LESSONS.find((l) => l.id === active) ?? null;
  return <AppShell>{lesson ? <LessonView lesson={lesson} onBack={() => setActive(null)} /> : <LessonList onOpen={setActive} />}</AppShell>;
}

function LessonList({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useChild();
  return (
    <>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-lilac-500 to-lilac-600 p-8 text-white shadow-lift">
        <div className="pattern-girih absolute inset-0 opacity-50 mix-blend-overlay" />
        <div className="relative flex items-center gap-6">
          <Mascot size={110} className="hidden sm:block" />
          <div>
            <p className="font-display font-bold text-lilac-100">أكاديمية التجويد</p>
            <h1 className="font-display text-4xl font-extrabold">نتعلّم كيف نقرأ القرآن بإتقان</h1>
            <p className="mt-2 max-w-xl text-lilac-100">دروسٌ قصيرة بالألوان، مع أمثلةٍ من آياتٍ حقيقية، وتلاوةٍ مسموعة، وتمارين واختبارٍ صغير.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LESSONS.map((l, i) => {
          const done = data.lessons[l.id];
          const st = RULE_STYLES[l.tone];
          return (
            <motion.button key={l.id} onClick={() => onOpen(l.id)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="text-right">
              <Card className="h-full p-5 transition hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-extrabold ${st.bg} ${st.text}`}>{toArabicDigits(i + 1)}</span>
                  {done ? (
                    <Chip className="bg-mint-100 text-mint-600">
                      <IconCheck size={14} /> مكتمل
                    </Chip>
                  ) : (
                    <Chip className="bg-cream-100 text-ink-500">{toArabicDigits(l.rules.length)} أحكام</Chip>
                  )}
                </div>
                <h2 className="mt-4 font-display text-xl font-extrabold">{l.title}</h2>
                <p className="mt-1 text-sm text-ink-500">{l.subtitle}</p>
                <div className="mt-4 flex gap-1.5">
                  {l.rules.map((r) => (
                    <span key={r.id} className={`h-2.5 flex-1 rounded-full ${RULE_STYLES[r.color].dot}`} />
                  ))}
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6">
        <SampleNotice>الشروح على رواية حفص عن عاصم من طريق الشاطبية، والأمثلة القرآنية تُعرض من النصّ الموثّق كما هو. والتجويد يُتلقّى مشافهةً، فاقرأ على معلّمٍ متقن.</SampleNotice>
      </div>
    </>
  );
}

function LessonView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const ids = useMemo(() => [...new Set(lesson.examples.map((e) => e.surah))], [lesson]);
  const surahs = useSurahs(ids);
  const player = useRecitation();
  const [tab, setTab] = useState<"learn" | "practice" | "quiz">("learn");
  const [celebrate, setCelebrate] = useState(false);
  const st = RULE_STYLES[lesson.tone];

  return (
    <>
      <button onClick={onBack} className="mb-4 rounded-2xl bg-white/80 px-4 py-2 text-sm font-bold text-ink-700">
        → جميع الدروس
      </button>
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`grid h-14 w-14 place-items-center rounded-2xl ${st.bg} ${st.text}`}>
            <IconLantern size={28} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold">{lesson.title}</h1>
            <p className="text-ink-500">{lesson.subtitle}</p>
          </div>
          {lesson.review === "pending" && (
            <Chip className="mr-auto bg-lilac-100 text-lilac-600">
              <IconShield size={14} /> بانتظار مراجعة مختص
            </Chip>
          )}
        </div>
        <p className="mt-5 text-lg leading-relaxed text-ink-700">{lesson.intro}</p>

        <div className="mt-6 flex gap-2 rounded-2xl bg-cream-100 p-1.5">
          {([
            ["learn", "تعلّم"],
            ["practice", "تمرّن"],
            ["quiz", "اختبار قصير"],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-xl py-2.5 font-display font-bold transition ${tab === k ? "bg-white text-ink-900 shadow-soft" : "text-ink-500"}`}>
              {l}
            </button>
          ))}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
          {tab === "learn" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {lesson.rules.map((r) => {
                  const rs = RULE_STYLES[r.color];
                  return (
                    <Card key={r.id} className="p-5">
                      <div className="flex items-center gap-2">
                        <span className={`h-3.5 w-3.5 rounded-full ${rs.dot}`} />
                        <h3 className={`font-display text-xl font-extrabold ${rs.text}`}>{r.name}</h3>
                      </div>
                      <p className="mt-2 leading-relaxed text-ink-700">{r.kids}</p>
                      {r.letters && (
                        <div className={`mt-3 rounded-2xl px-4 py-2 font-display text-lg font-bold ${rs.bg} ${rs.text}`}>
                          الحروف: <span className="tracking-wide">{r.letters}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {lesson.examples.length > 0 && (
                <Card className="p-5 sm:p-6">
                  <h3 className="font-display text-xl font-extrabold">أمثلة من القرآن الكريم</h3>
                  <p className="text-sm text-ink-500">الكلمات الملوّنة تحمل الحكم. اضغط «استمع» لسماع الآية من القارئ.</p>
                  <div className="mt-4 space-y-3">
                    {lesson.examples.map((ex, i) => (
                      <ExampleRow key={i} ex={ex} text={surahs[ex.surah]?.verses[ex.ayah - 1]?.text} playing={player.playing && player.ayah === ex.ayah && player.plan.current?.surah === ex.surah} onPlay={() => player.play({ surah: ex.surah, from: ex.ayah, to: ex.ayah, repeatEach: 1, repeatGroup: 1 })} />
                    ))}
                  </div>
                  {player.error && <p className="mt-3 text-sm font-bold text-coral-500">{player.error}</p>}
                </Card>
              )}
              <div className="flex justify-center">
                <Button size="lg" onClick={() => setTab(lesson.examples.length ? "practice" : "quiz")}>
                  {lesson.examples.length ? "إلى التمرين" : "إلى الاختبار"}
                </Button>
              </div>
            </div>
          )}
          {tab === "practice" && (lesson.examples.length ? <Practice lesson={lesson} surahs={surahs} onDone={() => setTab("quiz")} /> : <Card className="p-6 text-center text-ink-500">لا يوجد تمرين على الآيات لهذا الدرس. انتقل إلى الاختبار.</Card>)}
          {tab === "quiz" && (
            <Quiz
              lesson={lesson}
              onDone={(score) => {
                actions.completeLesson(lesson.id, score, `درس ${lesson.title}`);
                setCelebrate(true);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <Celebrate open={celebrate} onClose={() => { setCelebrate(false); onBack(); }} title="أتممتَ الدرس!" message={`بارك الله فيك، أنهيتَ درس ${lesson.title}.`} stars={5} />
    </>
  );
}

function ExampleRow({ ex, text, onPlay, playing }: { ex: Example; text?: string; onPlay: () => void; playing: boolean }) {
  const info = ruleById(ex.ruleId);
  const rs = info ? RULE_STYLES[info.rule.color] : RULE_STYLES.teal;
  const hl = Object.fromEntries(ex.words.map((w) => [w, `${rs.bg} ${rs.text}`]));
  return (
    <div className={`rounded-3xl border-2 p-4 transition ${playing ? "border-sun-400 bg-sun-100/50" : "border-cream-200 bg-cream-50"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip className={`${rs.bg} ${rs.text}`}>
          <span className={`h-2 w-2 rounded-full ${rs.dot}`} /> {info?.rule.name}
        </Chip>
        <span className="text-xs font-bold text-ink-500">
          سورة {surahMeta(ex.surah).name} · الآية {toArabicDigits(ex.ayah)}
        </span>
        <button onClick={onPlay} className="mr-auto flex items-center gap-1 rounded-xl bg-teal-100 px-3 py-1.5 text-sm font-bold text-teal-700">
          <IconPlay size={14} /> استمع
        </button>
      </div>
      <p className="mt-2 text-center text-3xl">
        {text ? (
          <>
            <VerseText text={text} highlight={hl} />
            <AyahMark n={ex.ayah} />
          </>
        ) : (
          <span className="inline-block h-10 w-2/3 animate-pulse rounded-xl bg-cream-200" />
        )}
      </p>
    </div>
  );
}

/** Tap the word(s) carrying the rule in a verified verse. */
function Practice({ lesson, surahs, onDone }: { lesson: Lesson; surahs: Record<number, { verses: { text: string }[] }>; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const ex = lesson.examples[i];
  const info = ruleById(ex.ruleId);
  const text = surahs[ex.surah]?.verses[ex.ayah - 1]?.text;
  const correct = picked != null && ex.words.includes(picked);
  const rs = info ? RULE_STYLES[info.rule.color] : RULE_STYLES.teal;

  const highlight: Record<number, string> = {};
  if (picked != null) {
    if (correct) ex.words.forEach((w) => (highlight[w] = `${rs.bg} ${rs.text}`));
    else highlight[picked] = "bg-coral-100 text-coral-500";
  }

  return (
    <Card className="p-6 text-center">
      <div className="text-sm font-bold text-ink-500">
        تمرين {toArabicDigits(i + 1)} من {toArabicDigits(lesson.examples.length)}
      </div>
      <h3 className="mt-2 font-display text-2xl font-extrabold">
        اضغط على كلمةٍ فيها حكم: <span className={rs.text}>{info?.rule.name}</span>
      </h3>
      <p className="mt-6 text-4xl">{text ? <VerseText text={text} highlight={highlight} onWordClick={(w) => { if (correct) return; playSfx(ex.words.includes(w) ? "correct" : "wrong"); setPicked(w); }} /> : null}</p>
      <div className="mt-6 min-h-14">
        {picked != null &&
          (correct ? (
            <div className="flex flex-col items-center gap-3">
              <p className="flex items-center gap-2 font-display text-xl font-extrabold text-mint-600">
                <IconCheck /> أحسنت! هذا هو موضع الحكم
              </p>
              <Button onClick={() => { setPicked(null); if (i + 1 < lesson.examples.length) setI(i + 1); else onDone(); }}>
                {i + 1 < lesson.examples.length ? "التالي" : "إلى الاختبار"}
              </Button>
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 font-display text-lg font-bold text-coral-500">
              <IconX /> ليست هذه. تذكّر حروف الحكم وحاول مرة أخرى.
            </p>
          ))}
      </div>
    </Card>
  );
}

function Quiz({ lesson, onDone }: { lesson: Lesson; onDone: (score: number) => void }) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = lesson.quiz[i];
  const last = i + 1 === lesson.quiz.length;

  return (
    <Card className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between text-sm font-bold text-ink-500">
        <span>
          سؤال {toArabicDigits(i + 1)} من {toArabicDigits(lesson.quiz.length)}
        </span>
        <span>
          الصحيح: {toArabicDigits(score)}
        </span>
      </div>
      <h3 className="mt-3 font-display text-2xl font-extrabold">{q.q}</h3>
      <div className="mt-5 grid gap-3">
        {q.options.map((o, k) => {
          const state = answer == null ? "idle" : k === q.answer ? "right" : k === answer ? "wrong" : "idle";
          return (
            <button
              key={k}
              disabled={answer != null}
              onClick={() => {
                setAnswer(k);
                playSfx(k === q.answer ? "correct" : "wrong");
                if (k === q.answer) setScore((s) => s + 1);
              }}
              className={`clay rounded-2xl px-5 py-4 text-right font-display text-lg font-bold ${state === "right" ? "clay-right" : state === "wrong" ? "clay-wrong" : "clay-white text-ink-900"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {answer != null && (
        <div className="mt-5 rounded-2xl bg-cream-100 p-4">
          <p className="font-bold">{answer === q.answer ? "إجابةٌ صحيحة!" : "لا بأس، نتعلّم معًا."}</p>
          <p className="mt-1 text-ink-700">{q.why}</p>
          <Button
            className="mt-4"
            onClick={() => {
              if (last) onDone(score);
              else {
                setI(i + 1);
                setAnswer(null);
              }
            }}
          >
            {last ? "إنهاء الدرس" : "السؤال التالي"}
          </Button>
        </div>
      )}
    </Card>
  );
}
