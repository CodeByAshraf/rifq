import { playSfx } from "@/lib/fx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconEye, IconEyeOff, IconHeadphones, IconPause, IconPlay, IconRefresh, IconSprout, IconStar } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { Stepper } from "@/components/quran/PlayerBar";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, Celebrate, Chip, LinkButton, SpeechBubble } from "@/components/ui";
import { nextVerseToLearn } from "@/lib/learning";
import { LinkVerses, MissingWord, SurahRecital } from "@/components/screens/MemorizeModes";
import { VerseMeaning } from "@/components/quran/VerseMeaning";
import { useRecitation } from "@/lib/player";
import { PICKER_SURAHS, RECITERS, surahMeta, toArabicDigits, useSurah, words } from "@/lib/quran";
import { STATE_COLOR, STATE_LABEL, type Rating } from "@/lib/srs";
import { actions, getState, useChild, verseKey } from "@/lib/store";

const STEPS = [
  { t: "استمع", d: "استمع إلى الآية بتركيز", icon: IconHeadphones },
  { t: "ردّد", d: "ردّد خلف القارئ في الوقفات", icon: IconRefresh },
  { t: "اقرأ", d: "اقرأ الآية بنفسك", icon: IconEye },
  { t: "أخفِ", d: "نخفي الكلمات تدريجيًا", icon: IconEyeOff },
  { t: "سمّع", d: "سمّع الآية بلا نص", icon: IconSprout },
  { t: "تحدٍّ", d: "رتّب كلمات الآية", icon: IconStar },
  { t: "احفظ", d: "سجّل تقدّمك", icon: IconCheck },
];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Memorize() {
  const { data } = useChild();
  const [surahId, setSurahId] = useState<number | null>(null);
  const [ayah, setAyah] = useState(1);
  const [step, setStep] = useState(0);
  const [reciter, setReciter] = useState(0);
  const [listenTimes, setListenTimes] = useState(3);
  const [readCount, setReadCount] = useState(0);
  const [hideLevel, setHideLevel] = useState(0);
  const [peek, setPeek] = useState<number[]>([]);
  const [celebrate, setCelebrate] = useState(false);
  const [tool, setTool] = useState<"verse" | "link" | "recite" | "missing">("verse");
  const player = useRecitation();

  useEffect(() => {
    const st = getState();
    const d = st.data[st.activeChildId];
    const f = st.focus;
    const pick = f ?? nextVerseToLearn(d?.verses ?? {});
    setSurahId(pick.surah);
    setAyah(pick.ayah);
  }, []);

  const { surah } = useSurah(surahId);
  const verse = surah?.verses[ayah - 1];
  const list = useMemo(() => (verse ? words(verse.text) : []), [verse]);
  const meta = surahId ? surahMeta(surahId) : null;
  const prog = surahId ? data.verses[verseKey(surahId, ayah)] : undefined;

  // Reset the flow whenever the verse changes.
  useEffect(() => {
    setStep(0);
    setReadCount(0);
    setHideLevel(0);
    setPeek([]);
    player.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahId, ayah]);

  const hidden = useMemo(() => {
    if (step === 3) {
      const n = Math.ceil((list.length * hideLevel) / 4);
      // hide from the end of the verse first
      return list.map((_, i) => i).slice(list.length - n);
    }
    if (step === 4) return list.map((_, i) => i).filter((i) => !peek.includes(i));
    return [];
  }, [step, hideLevel, list, peek]);

  const difficult = Object.entries(data.verses)
    .filter(([, v]) => v.state === "needs_revision")
    .slice(0, 6)
    .map(([k]) => k.split(":").map(Number));

  const listen = (times: number, gap = 400) =>
    surahId && player.play({ surah: surahId, from: ayah, to: ayah, repeatEach: times, repeatGroup: 1, reciter: RECITERS[reciter], gap });

  function finish(r: Rating) {
    if (!surahId) return;
    const first = !prog || prog.state === "not_started";
    actions.rateVerse(surahId, ayah, r);
    actions.addStars(first ? 5 : 3, { kind: first ? "memorize" : "revise", label: `${first ? "حفظ" : "مراجعة"} ${meta?.name} · الآية ${toArabicDigits(ayah)}` });
    setCelebrate(true);
  }

  const nextVerse = () => {
    setCelebrate(false);
    if (!meta) return;
    if (ayah < meta.verses) setAyah(ayah + 1);
    else {
      const n = nextVerseToLearn(getState().data[getState().activeChildId].verses);
      setSurahId(n.surah);
      setAyah(n.ayah);
    }
  };


  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          {/* verse picker */}
          <Card className="flex flex-wrap items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-100 text-mint-600">
              <IconSprout />
            </span>
            <h1 className="font-display text-2xl font-extrabold">مركز الحفظ</h1>
            <div className="mr-auto flex flex-wrap items-center gap-2">
              <select value={surahId ?? 1} onChange={(e) => { setSurahId(+e.target.value); setAyah(1); }} className="h-10 rounded-2xl bg-cream-100 px-3 font-display font-bold" aria-label="السورة">
                {PICKER_SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>سورة {s.name}</option>
                ))}
              </select>
              <select value={ayah} onChange={(e) => setAyah(+e.target.value)} className="h-10 rounded-2xl bg-cream-100 px-3 font-display font-bold" aria-label="الآية">
                {meta && Array.from({ length: meta.verses }, (_, i) => (
                  <option key={i} value={i + 1}>الآية {toArabicDigits(i + 1)}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* modes */}
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto rounded-[1.4rem] bg-white/70 p-1.5">
            {([
              ["verse", "حفظ آية"],
              ["link", "ربط الآيات"],
              ["recite", "تسميع السورة"],
              ["missing", "الكلمة الناقصة"],
            ] as const).map(([k, l]) => (
              <button key={k} onClick={() => { player.stop(); setTool(k); }} className={`flex-1 whitespace-nowrap rounded-2xl px-4 py-2.5 font-display font-bold transition ${tool === k ? "bg-mint-500 text-white shadow-[0_4px_0_#2fa868]" : "text-ink-700"}`}>
                {l}
              </button>
            ))}
          </div>

          {tool === "link" && surah && <div className="mt-4"><LinkVerses key={`${surahId}:${ayah}`} surah={surah} ayah={ayah} reciter={reciter} /></div>}
          {tool === "recite" && surah && <div className="mt-4"><SurahRecital key={surahId} surah={surah} /></div>}
          {tool === "missing" && surah && <div className="mt-4"><MissingWord key={surahId} surah={surah} /></div>}

          {tool === "verse" && (<>
          {/* stepper */}
          <ol className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-bold transition ${
                    i === step ? "bg-teal-500 text-white shadow-[0_4px_0_#0d7870]" : i < step ? "bg-mint-100 text-mint-600" : "bg-white/80 text-ink-500"
                  }`}
                >
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${i === step ? "bg-white/25" : i < step ? "bg-mint-500 text-white" : "bg-cream-200"}`}>
                    {i < step ? <IconCheck size={14} /> : toArabicDigits(i + 1)}
                  </span>
                  {s.t}
                </button>
              </li>
            ))}
          </ol>

          {/* verse stage */}
          <Card className="relative mt-4 overflow-hidden p-6 sm:p-10">
            <div className="flex items-center justify-between">
              <Chip className="bg-cream-100 text-ink-700">
                سورة {meta?.name} · الآية {toArabicDigits(ayah)}
              </Chip>
              {prog && <Chip className={STATE_COLOR[prog.state]}>{STATE_LABEL[prog.state]}</Chip>}
            </div>

            <div className="mt-6 min-h-40 text-center text-3xl leading-loose sm:text-[42px]">
              {verse ? (
                <>
                  <VerseText
                    text={verse.text}
                    hidden={hidden}
                    highlight={player.playing ? Object.fromEntries(list.map((_, i) => [i, "text-teal-700"])) : {}}
                    onWordClick={step === 4 ? (i) => setPeek((p) => (p.includes(i) ? p : [...p, i])) : undefined}
                  />
                  <AyahMark n={ayah} active={player.playing} />
                </>
              ) : (
                <div className="mx-auto h-16 w-3/4 animate-pulse rounded-2xl bg-cream-200" />
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-8">
                {step === 0 && (
                  <StepPanel title="١. استمع جيدًا" hint="استمع إلى الآية عدّة مرات، وتابع الكلمات بعينيك.">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <Stepper label="عدد المرات" value={listenTimes} set={setListenTimes} max={10} />
                      <Button onClick={() => (player.playing ? player.pause() : listen(listenTimes))}>
                        {player.playing ? <IconPause size={20} /> : <IconPlay size={20} />} {player.playing ? "إيقاف" : "استمع"}
                      </Button>
                      <select value={reciter} onChange={(e) => setReciter(+e.target.value)} className="h-10 rounded-xl bg-cream-100 px-2 text-sm font-bold" aria-label="القارئ">
                        {RECITERS.map((r, i) => <option key={r.id} value={i}>{r.name}</option>)}
                      </select>
                    </div>
                    {player.error && <p className="mt-3 text-center text-sm font-bold text-coral-500">{player.error}</p>}
                  </StepPanel>
                )}
                {step === 1 && (
                  <StepPanel title="٢. ردّد خلف القارئ" hint="سيقرأ القارئ ثم يتوقف قليلًا لتردّد بصوتك. كرّر حتى تشعر بالراحة.">
                    <div className="flex justify-center">
                      <Button onClick={() => (player.playing ? player.pause() : listen(3, 4500))}>
                        {player.playing ? <IconPause size={20} /> : <IconRefresh size={20} />} {player.playing ? "إيقاف" : "ابدأ الترديد (٣ مرات)"}
                      </Button>
                    </div>
                    {player.playing && <p className="mt-3 text-center font-bold text-teal-600">التكرار {toArabicDigits(player.rep.each)} من ٣ — ردّد بعد انتهاء القارئ</p>}
                  </StepPanel>
                )}
                {step === 2 && (
                  <StepPanel title="٣. اقرأ بنفسك" hint="اقرأ الآية بصوتٍ مسموع، واضغط بعد كلّ قراءة.">
                    <div className="flex items-center justify-center gap-4">
                      <Button tone="mint" onClick={() => setReadCount((c) => c + 1)}>
                        <IconCheck size={20} /> قرأتُها
                      </Button>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span key={i} className={`h-4 w-4 rounded-full ${i < readCount ? "bg-mint-500" : "bg-cream-200"}`} />
                        ))}
                      </div>
                    </div>
                  </StepPanel>
                )}
                {step === 3 && (
                  <StepPanel title="٤. الإخفاء التدريجي" hint="اقرأ الآية كاملةً رغم اختفاء بعض كلماتها، ثم أخفِ المزيد.">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {[0, 1, 2, 3, 4].map((l) => (
                        <button key={l} onClick={() => setHideLevel(l)} className={`rounded-2xl px-4 py-2 text-sm font-bold ${hideLevel === l ? "bg-lilac-500 text-white" : "bg-lilac-100 text-lilac-600"}`}>
                          {["بلا إخفاء", "الربع", "النصف", "ثلاثة أرباع", "الكل"][l]}
                        </button>
                      ))}
                    </div>
                  </StepPanel>
                )}
                {step === 4 && (
                  <StepPanel title="٥. سمّع بلا نص" hint="حاول قراءة الآية من حفظك. إن احتجت مساعدة، اضغط على أيّ كلمة لتظهر.">
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button tone="white" onClick={() => setPeek(list.map((_, i) => i))}>
                        <IconEye size={20} /> أظهر الآية
                      </Button>
                      <Button tone="white" onClick={() => setPeek([])}>
                        <IconEyeOff size={20} /> أخفِها
                      </Button>
                      <Button tone="sky" onClick={() => listen(1)}>
                        <IconPlay size={20} /> تحقّق بالاستماع
                      </Button>
                    </div>
                  </StepPanel>
                )}
                {step === 5 && verse && <RecallChallenge key={`${surahId}:${ayah}`} words={list} onDone={() => setStep(6)} />}
                {step === 6 && (
                  <StepPanel title="٧. كيف كان حفظك؟" hint="اختر بصدق، فسنعيد لك الآية في الوقت المناسب للمراجعة.">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button tone="coral" onClick={() => finish("again")}>ما زالت صعبة</Button>
                      <Button tone="sky" onClick={() => finish("good")}>جيّدة</Button>
                      <Button tone="mint" onClick={() => finish("easy")}>سهلةٌ جدًا</Button>
                    </div>
                  </StepPanel>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              <Button tone="white" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                السابق
              </Button>
              {step < 5 && (
                <Button size="sm" onClick={() => setStep((s) => Math.min(6, s + 1))}>
                  الخطوة التالية
                </Button>
              )}
            </div>
          </Card>
          </>)}
        </section>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Mascot size={64} mood={step === 5 ? "think" : "happy"} />
              <SpeechBubble className="flex-1 text-base">{STEPS[step].d}</SpeechBubble>
            </div>
          </Card>
          {surahId && (
            <Card className="p-5">
              <h2 className="mb-3 font-display text-lg font-extrabold">ماذا تعني الآية؟</h2>
              <VerseMeaning surah={surahId} ayah={ayah} />
            </Card>
          )}
          <Card className="p-5">
            <h2 className="font-display text-lg font-extrabold">آياتٌ تحتاج عناية</h2>
            {difficult.length === 0 ? (
              <p className="mt-2 text-sm text-ink-500">لا توجد آيات صعبة الآن. أحسنت!</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {difficult.map(([s, a]) => (
                  <button key={`${s}:${a}`} onClick={() => { setSurahId(s); setAyah(a); }} className="rounded-xl bg-coral-100 px-3 py-1.5 text-sm font-bold text-coral-500">
                    {surahMeta(s).name} · {toArabicDigits(a)}
                  </button>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-lg font-extrabold">نصيحة</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">احفظ آياتٍ قليلة كلّ يوم وراجعها، فالقليل الدائم خيرٌ من الكثير المنقطع.</p>
          </Card>
        </aside>
      </div>

      <Celebrate
        open={celebrate}
        onClose={() => setCelebrate(false)}
        title="ما شاء الله!"
        message="سُجّل تقدّمك، وستعود إليك الآية في موعد مراجعتها."
        actions={
          <>
            <Button onClick={nextVerse}>الآية التالية</Button>
            <LinkButton href="/kids" tone="white">عالمي</LinkButton>
          </>
        }
      />
    </AppShell>
  );
}

function StepPanel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-cream-100 p-5">
      <h3 className="text-center font-display text-xl font-extrabold">{title}</h3>
      <p className="mb-4 mt-1 text-center text-sm text-ink-500">{hint}</p>
      {children}
    </div>
  );
}

/** Tap the words of the verse in order. Words come from splitting the verified text only. */
function RecallChallenge({ words: all, onDone }: { words: string[]; onDone: () => void }) {
  const take = Math.min(all.length, 8);
  const target = all.slice(0, take);
  const [pool] = useState(() => shuffle(target.map((w, i) => ({ w, id: i }))));
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = placed.length === take;

  if (all.length < 2) {
    return (
      <StepPanel title="٦. تحدّي الاستذكار" hint="هذه الآية كلمةٌ واحدة، فلا حاجة للترتيب.">
        <div className="flex justify-center">
          <Button onClick={onDone}>متابعة</Button>
        </div>
      </StepPanel>
    );
  }

  const tap = (id: number) => {
    const expected = target[placed.length];
    const item = pool.find((p) => p.id === id)!;
    if (item.w === expected) {
      setPlaced((p) => [...p, id]);
      setWrong(null);
      if (placed.length + 1 === take) playSfx("correct");
    } else {
      playSfx("wrong");
      setWrong(id);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <StepPanel title="٦. تحدّي الاستذكار" hint={take < all.length ? `رتّب أوّل ${toArabicDigits(take)} كلمات من الآية بالترتيب الصحيح.` : "رتّب كلمات الآية بالترتيب الصحيح."}>
      <div className="quran mb-4 min-h-16 rounded-2xl bg-white p-3 text-center text-2xl sm:text-3xl">
        {placed.map((id) => pool.find((p) => p.id === id)!.w).join(" ") || <span className="font-body text-base text-ink-300">اضغط على الكلمة الأولى…</span>}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pool.map((p) =>
          placed.includes(p.id) ? null : (
            <motion.button
              key={p.id}
              layout
              animate={wrong === p.id ? { x: [0, -8, 8, -4, 0] } : {}}
              onClick={() => tap(p.id)}
              className={`quran clay clay-white rounded-2xl px-4 py-1 text-2xl ${wrong === p.id ? "ring-2 ring-coral-400" : ""}`}
            >
              {p.w}
            </motion.button>
          ),
        )}
      </div>
      {done && (
        <div className="mt-5 text-center">
          <p className="font-display text-lg font-extrabold text-mint-600">أحسنت! ترتيبٌ صحيح</p>
          <Button className="mt-3" onClick={onDone}>متابعة</Button>
        </div>
      )}
    </StepPanel>
  );
}
