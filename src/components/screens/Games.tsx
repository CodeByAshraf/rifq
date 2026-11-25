import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GameArt, type GameArtKind } from "@/components/art/GameArt";
import { IconCheck, IconPlay, IconRefresh, IconStar, IconVolume, IconX } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, ProgressBar, SpeechBubble } from "@/components/ui";
import { LESSONS, LETTER_MAKHRAJ, MAKHRAJ_NAME, RULE_STYLES, ruleById } from "@/data/tajweed";
import { useRecitation } from "@/lib/player";
import { loadSurah, surahMeta, toArabicDigits, type Surah } from "@/lib/quran";
import { actions, useChild } from "@/lib/store";
import { playSfx } from "@/lib/fx";

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface GameDef {
  id: string;
  kind: GameArtKind;
  title: string;
  intro: string;
  how: string;
}

const GAMES: GameDef[] = [
  { id: "complete", kind: "complete", title: "أكمل الآية", intro: "هل تعرف ما الآية التالية؟", how: "تظهر لك آية، فاختر الآية التي تأتي بعدها في السورة." },
  { id: "tajweed", kind: "tajweed", title: "اكتشف الحكم", intro: "كن محقّق التجويد!", how: "انظر إلى الكلمة الملوّنة في الآية، واختر حكم التجويد الصحيح." },
  { id: "letters", kind: "letters", title: "طابق الحروف", intro: "من أين يخرج الحرف؟", how: "يظهر لك حرف، فاختر مخرجه: الحلق أو اللسان أو الشفتين." },
  { id: "arrange", kind: "arrange", title: "رتّب الآيات", intro: "أعد الآيات إلى مكانها!", how: "اضغط على آيات السورة بترتيبها الصحيح من الأولى إلى الأخيرة." },
  { id: "memory", kind: "memory", title: "تحدّي الذاكرة", intro: "اقلب البطاقات وتذكّر!", how: "اقلب بطاقتين في كلّ مرة، وطابق كلّ حكمٍ مع حروفه." },
  { id: "listen", kind: "listen", title: "استمع واختر", intro: "افتح أذنيك جيدًا!", how: "استمع إلى التلاوة، ثم اختر الآية التي سمعتها." },
];

// Al-Kafirun (109) is excluded from these games because it contains identical repeated verses,
// which would make "which verse comes next" ambiguous.
const SHORT = [1, 97, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 110, 111, 112, 113, 114];
const ARRANGE = [103, 108, 110, 106, 112, 105, 111, 113];

function useSurahPool(ids: number[]) {
  const [pool, setPool] = useState<Surah[] | null>(null);
  useEffect(() => {
    Promise.all(ids.map(loadSurah)).then(setPool).catch(() => setPool([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return pool;
}

export function Games() {
  const [active, setActive] = useState<GameDef | null>(null);
  const { data } = useChild();
  return (
    <AppShell>
      {!active ? (
        <>
          <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-sun-400 to-sun-500 p-8 shadow-lift">
            <div className="pattern-girih absolute inset-0 opacity-60 mix-blend-overlay" />
            <div className="relative flex items-center gap-6">
              <Mascot size={110} mood="cheer" className="hidden sm:block" />
              <div>
                <h1 className="font-display text-5xl font-extrabold text-ink-900">العب وتعلّم</h1>
                <p className="mt-2 max-w-lg text-lg text-ink-700">ألعابٌ قصيرة ولطيفة، كلّها من آياتٍ موثّقة ومحتوى تعليميٍّ صحيح. العب وتعلّم واجمع النجوم!</p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {GAMES.map((g, i) => {
              const stats = data.games[g.id];
              return (
                <motion.button key={g.id} onClick={() => setActive(g)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group text-right">
                  <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1">
                    <GameArt kind={g.kind} className="w-full" />
                    <div className="p-4">
                      <div className="font-display text-lg font-extrabold">{g.title}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-ink-500">
                        {stats ? (
                          <>
                            أفضل نتيجة {toArabicDigits(stats.best)} <IconStar filled size={12} className="text-sun-500" />
                          </>
                        ) : (
                          "لعبة جديدة"
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.button>
              );
            })}
          </div>
        </>
      ) : (
        <GameFrame def={active} onExit={() => setActive(null)} />
      )}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */

function GameFrame({ def, onExit }: { def: GameDef; onExit: () => void }) {
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [result, setResult] = useState({ score: 0, total: 0 });
  const [run, setRun] = useState(0);

  const finish = (score: number, total: number) => {
    setResult({ score, total });
    actions.recordGame(def.id, score, `لعبة ${def.title}`);
    setPhase("done");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onExit} className="mb-4 rounded-2xl bg-white/80 px-4 py-2 text-sm font-bold text-ink-700">
        → كلّ الألعاب
      </button>
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="overflow-hidden p-0 text-center">
              <GameArt kind={def.kind} className="w-full" />
              <div className="p-8">
                <div className="flex items-end justify-center gap-3">
                  <Mascot size={80} />
                  <SpeechBubble>{def.intro}</SpeechBubble>
                </div>
                <h1 className="mt-4 font-display text-3xl font-extrabold">{def.title}</h1>
                <p className="mx-auto mt-2 max-w-md text-lg text-ink-700">{def.how}</p>
                <Button size="lg" className="mt-6 min-w-48" onClick={() => setPhase("play")}>
                  <IconPlay size={20} /> ابدأ اللعب
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
        {phase === "play" && (
          <motion.div key={`play${run}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {def.id === "complete" && <CompleteVerse onFinish={finish} />}
            {def.id === "tajweed" && <FindRule onFinish={finish} />}
            {def.id === "letters" && <MatchLetters onFinish={finish} />}
            {def.id === "arrange" && <ArrangeVerses onFinish={finish} />}
            {def.id === "memory" && <MemoryGame onFinish={finish} />}
            {def.id === "listen" && <ListenChoose onFinish={finish} />}
          </motion.div>
        )}
        {phase === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 text-center">
              <Mascot size={110} mood="cheer" className="mx-auto" />
              <h2 className="mt-3 font-display text-3xl font-extrabold">{result.score === result.total ? "رائع! نتيجةٌ كاملة" : result.score >= result.total / 2 ? "أحسنت!" : "محاولةٌ جميلة!"}</h2>
              <p className="mt-2 text-lg text-ink-700">
                أجبتَ {toArabicDigits(result.score)} من {toArabicDigits(result.total)} بشكلٍ صحيح
              </p>
              <div className="mt-4 flex justify-center gap-1">
                {Array.from({ length: result.total }).map((_, i) => (
                  <IconStar key={i} filled size={28} className={i < result.score ? "text-sun-400" : "text-cream-300"} />
                ))}
              </div>
              <p className="mt-2 text-sm font-bold text-sun-600">+{toArabicDigits(Math.max(1, Math.round(result.score / 2)))} نجوم لحديقتك</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => { setRun((r) => r + 1); setPhase("play"); }}>
                  <IconRefresh size={20} /> العب مرة أخرى
                </Button>
                <Button tone="white" onClick={onExit}>لعبة أخرى</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Shared round chrome */
function Round({ i, total, score, children }: { i: number; total: number; score: number; children: ReactNode }) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <ProgressBar value={i / total} tone="sun" className="flex-1" />
        <span className="flex items-center gap-1 font-display font-bold text-sun-600">
          {toArabicDigits(score)} <IconStar filled size={18} />
        </span>
      </div>
      {children}
    </Card>
  );
}

function Options({ options, answer, picked, onPick, quran = false }: { options: string[]; answer: number; picked: number | null; onPick: (k: number) => void; quran?: boolean }) {
  return (
    <div className="grid gap-3">
      {options.map((o, k) => {
        const s = picked == null ? "idle" : k === answer ? "right" : k === picked ? "wrong" : "dim";
        return (
          <motion.button
            key={k}
            disabled={picked != null}
            onClick={() => onPick(k)}
            animate={s === "wrong" ? { x: [0, -8, 8, -4, 0] } : s === "right" ? { scale: [1, 1.03, 1] } : {}}
            className={`clay flex items-center gap-3 rounded-2xl px-5 py-3 text-right ${s === "right" ? "clay-right" : s === "wrong" ? "clay-wrong" : "clay-white text-ink-900"} ${s === "dim" ? "opacity-60" : ""}`}
          >
            <span className="flex-1">{quran ? <VerseText text={o} className="text-2xl" /> : <span className="font-display text-lg font-bold">{o}</span>}</span>
            {s === "right" && <IconCheck />}
            {s === "wrong" && <IconX />}
          </motion.button>
        );
      })}
    </div>
  );
}

function Feedback({ ok, onNext, last, extra }: { ok: boolean; onNext: () => void; last: boolean; extra?: string }) {
  const [cheer] = useState(() => pick(["أحسنت!", "ممتاز!", "بارك الله فيك!", "إجابةٌ رائعة!"]));
  useEffect(() => playSfx(ok ? "correct" : "wrong"), [ok]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-5 flex flex-wrap items-center gap-3 rounded-2xl p-4 ${ok ? "bg-mint-100" : "bg-coral-100"}`}>
      <Mascot size={48} mood={ok ? "cheer" : "think"} />
      <div className="flex-1">
        <p className={`font-display text-lg font-extrabold ${ok ? "text-mint-600" : "text-coral-500"}`}>{ok ? cheer : "لا بأس، تعلّمنا شيئًا جديدًا"}</p>
        {extra && <p className="text-sm text-ink-700">{extra}</p>}
      </div>
      <Button onClick={onNext}>{last ? "النتيجة" : "التالي"}</Button>
    </motion.div>
  );
}

function Loading() {
  return (
    <Card className="grid h-64 place-items-center p-8">
      <Mascot size={70} mood="think" className="" />
    </Card>
  );
}

/** Generic multiple-choice round runner. */
function useRounds<T>(make: () => T[] | null, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rounds = useMemo(make, deps);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  return { rounds, i, setI, picked, setPicked, score, setScore };
}

/* ---------------- Game 1: Complete the verse ---------------- */
function CompleteVerse({ onFinish }: { onFinish: (s: number, t: number) => void }) {
  const pool = useSurahPool(SHORT);
  const R = useRounds(() => {
    if (!pool) return null;
    const usable = pool.filter((s) => s.verses.length >= 4);
    return Array.from({ length: 5 }, () => {
      const s = pick(usable);
      const k = Math.floor(Math.random() * (s.verses.length - 1));
      const right = s.verses[k + 1].text;
      const others = shuffle(s.verses.filter((v, j) => j !== k + 1 && j !== k && v.text !== right)).map((v) => v.text).filter((t, j, a) => a.indexOf(t) === j && t !== s.verses[k].text).slice(0, 2);
      const options = shuffle([right, ...others]);
      return { surah: s.id, ayah: k + 1, prompt: s.verses[k].text, options, answer: options.indexOf(right) };
    });
  }, [pool]);
  if (!R.rounds) return <Loading />;
  const r = R.rounds[R.i];
  const last = R.i + 1 === R.rounds.length;
  return (
    <Round i={R.i} total={R.rounds.length} score={R.score}>
      <p className="text-center text-sm font-bold text-ink-500">سورة {surahMeta(r.surah).name} · ما الآية التي تأتي بعد:</p>
      <div className="my-5 rounded-3xl bg-teal-50 p-5 text-center text-3xl">
        <VerseText text={r.prompt} />
        <AyahMark n={r.ayah} />
      </div>
      <Options quran options={r.options} answer={r.answer} picked={R.picked} onPick={(k) => { R.setPicked(k); if (k === r.answer) R.setScore((s) => s + 1); }} />
      {R.picked != null && <Feedback ok={R.picked === r.answer} last={last} onNext={() => (last ? onFinish(R.score, R.rounds!.length) : (R.setI(R.i + 1), R.setPicked(null)))} />}
    </Round>
  );
}

/* ---------------- Game 2: Find the Tajweed rule ---------------- */
function FindRule({ onFinish }: { onFinish: (s: number, t: number) => void }) {
  const examples = LESSONS.flatMap((l) => l.examples);
  const pool = useSurahPool([...new Set(examples.map((e) => e.surah))]);
  const R = useRounds(() => {
    if (!pool) return null;
    const ruleIds = [...new Set(examples.map((e) => e.ruleId))];
    return shuffle(examples).slice(0, 5).map((ex) => {
      const others = shuffle(ruleIds.filter((r) => r !== ex.ruleId)).slice(0, 2);
      const opts = shuffle([ex.ruleId, ...others]);
      const text = pool.find((s) => s.id === ex.surah)!.verses[ex.ayah - 1].text;
      return { ex, text, options: opts.map((o) => ruleById(o)!.rule.name), answer: opts.indexOf(ex.ruleId) };
    });
  }, [pool]);
  if (!R.rounds) return <Loading />;
  const r = R.rounds[R.i];
  const last = R.i + 1 === R.rounds.length;
  const hl = Object.fromEntries(r.ex.words.map((w) => [w, `${RULE_STYLES.lilac.bg} ${RULE_STYLES.lilac.text} ring-2 ring-lilac-400`]));
  return (
    <Round i={R.i} total={R.rounds.length} score={R.score}>
      <p className="text-center text-sm font-bold text-ink-500">ما حكم التجويد في الكلمة المظلّلة؟</p>
      <div className="my-5 rounded-3xl bg-lilac-100/50 p-5 text-center text-3xl">
        <VerseText text={r.text} highlight={hl} />
        <div className="mt-1 text-xs font-bold text-ink-500">
          سورة {surahMeta(r.ex.surah).name} · الآية {toArabicDigits(r.ex.ayah)}
        </div>
      </div>
      <Options options={r.options} answer={r.answer} picked={R.picked} onPick={(k) => { R.setPicked(k); if (k === r.answer) R.setScore((s) => s + 1); }} />
      {R.picked != null && <Feedback ok={R.picked === r.answer} last={last} extra={ruleById(r.ex.ruleId)?.rule.kids} onNext={() => (last ? onFinish(R.score, R.rounds!.length) : (R.setI(R.i + 1), R.setPicked(null)))} />}
    </Round>
  );
}

/* ---------------- Game 3: Match the letters ---------------- */
function MatchLetters({ onFinish }: { onFinish: (s: number, t: number) => void }) {
  const keys = ["halq", "lisan", "shafatan"] as const;
  const R = useRounds(() => shuffle(LETTER_MAKHRAJ).slice(0, 6).map((l) => ({ ...l, answer: keys.indexOf(l.makhraj as (typeof keys)[number]) })), []);
  const r = R.rounds![R.i];
  const last = R.i + 1 === R.rounds!.length;
  return (
    <Round i={R.i} total={R.rounds!.length} score={R.score}>
      <p className="text-center text-sm font-bold text-ink-500">من أين يخرج هذا الحرف؟</p>
      <motion.div key={r.letter} initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="clay clay-teal mx-auto my-6 grid h-36 w-36 place-items-center rounded-[2rem] font-display text-7xl font-extrabold text-white">
        {r.letter}
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k, idx) => {
          const s = R.picked == null ? "idle" : idx === r.answer ? "right" : idx === R.picked ? "wrong" : "dim";
          return (
            <button key={k} disabled={R.picked != null} onClick={() => { R.setPicked(idx); if (idx === r.answer) R.setScore((x) => x + 1); }} className={`clay rounded-2xl py-5 font-display text-xl font-extrabold ${s === "right" ? "clay-right" : s === "wrong" ? "clay-wrong" : "clay-white"} ${s === "dim" ? "opacity-60" : ""}`}>
              {MAKHRAJ_NAME[k]}
            </button>
          );
        })}
      </div>
      {R.picked != null && <Feedback ok={R.picked === r.answer} last={last} extra={`الحرف «${r.letter}» يخرج من ${MAKHRAJ_NAME[r.makhraj]}.`} onNext={() => (last ? onFinish(R.score, R.rounds!.length) : (R.setI(R.i + 1), R.setPicked(null)))} />}
    </Round>
  );
}

/* ---------------- Game 4: Arrange the verses ---------------- */
function ArrangeVerses({ onFinish }: { onFinish: (s: number, t: number) => void }) {
  const pool = useSurahPool(ARRANGE);
  const rounds = useMemo(() => (pool ? shuffle(pool).slice(0, 3) : null), [pool]);
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const order = useMemo(() => (rounds ? shuffle(rounds[i].verses.map((v) => v.id)) : []), [rounds, i]);
  if (!rounds) return <Loading />;
  const s = rounds[i];
  const done = placed.length === s.verses.length;
  const last = i + 1 === rounds.length;

  const tap = (id: number) => {
    if (id === placed.length + 1) {
      const np = [...placed, id];
      setPlaced(np);
      if (np.length === s.verses.length && mistakes <= 1) setScore((x) => x + 1);
    } else {
      playSfx("wrong");
      setMistakes((m) => m + 1);
      setWrong(id);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <Round i={i} total={rounds.length} score={score}>
      <p className="text-center font-display text-xl font-extrabold">رتّب آيات سورة {surahMeta(s.id).name}</p>
      <p className="text-center text-sm text-ink-500">اضغط على الآية الأولى، ثم الثانية… حتى النهاية.</p>
      <div className="mt-5 space-y-2">
        {placed.map((id) => (
          <motion.div layout key={`p${id}`} className="flex items-center gap-2 rounded-2xl bg-mint-100 px-4 py-2 text-2xl">
            <AyahMark n={id} />
            <VerseText text={s.verses[id - 1].text} />
          </motion.div>
        ))}
      </div>
      {!done && (
        <div className="mt-4 space-y-2">
          {order
            .filter((id) => !placed.includes(id))
            .map((id) => (
              <motion.button layout key={id} onClick={() => tap(id)} animate={wrong === id ? { x: [0, -8, 8, -4, 0] } : {}} className={`clay clay-white block w-full rounded-2xl px-4 py-2 text-right text-2xl ${wrong === id ? "ring-2 ring-coral-400" : ""}`}>
                <VerseText text={s.verses[id - 1].text} />
              </motion.button>
            ))}
        </div>
      )}
      {done && (
        <Feedback
          ok={mistakes <= 1}
          last={last}
          extra={mistakes ? `عدد المحاولات الخاطئة: ${toArabicDigits(mistakes)}` : "رتّبتها كلّها من أوّل مرة!"}
          onNext={() => {
            if (last) onFinish(score, rounds.length);
            else {
              setI(i + 1);
              setPlaced([]);
              setMistakes(0);
            }
          }}
        />
      )}
    </Round>
  );
}

/* ---------------- Game 5: Memory challenge ---------------- */
const MEMORY_PAIRS: [string, string][] = [
  ["الإقلاب", "ب"],
  ["الإدغام بلا غنّة", "ل ر"],
  ["الإدغام بغنّة", "ي ن م و"],
  ["القلقلة", "ق ط ب ج د"],
  ["حروف الاستعلاء", "خ ص ض غ ط ق ظ"],
  ["الإظهار الحلقي", "ء هـ ع ح غ خ"],
];

function MemoryGame({ onFinish }: { onFinish: (s: number, t: number) => void }) {
  const cards = useMemo(() => shuffle(MEMORY_PAIRS.flatMap(([a, b], i) => [{ id: `${i}a`, pair: i, text: a, kind: "rule" }, { id: `${i}b`, pair: i, text: b, kind: "letters" }])), []);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((id) => cards.find((c) => c.id === id)!);
    setMoves((m) => m + 1);
    const t = setTimeout(() => {
      if (a.pair === b.pair) {
        playSfx("correct");
        setMatched((m) => [...m, a.pair]);
      }
      setOpen([]);
    }, a.pair === b.pair ? 350 : 900);
    return () => clearTimeout(t);
  }, [open, cards]);

  const done = matched.length === MEMORY_PAIRS.length;
  // Score out of 6: full marks within 9 moves, minus one per 2 extra moves.
  const score = Math.max(1, Math.min(6, 6 - Math.floor(Math.max(0, moves - 9) / 2)));

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg font-extrabold">طابق كلّ حكمٍ مع حروفه</p>
        <span className="rounded-full bg-cream-100 px-3 py-1 text-sm font-bold text-ink-700">المحاولات: {toArabicDigits(moves)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((c) => {
          const shown = open.includes(c.id) || matched.includes(c.pair);
          return (
            <button
              key={c.id}
              disabled={shown || open.length === 2}
              onClick={() => { playSfx("flip"); setOpen((o) => [...o, c.id]); }}
              className="aspect-[4/3] [perspective:800px]"
              aria-label={shown ? c.text : "بطاقة مقلوبة"}
            >
              <motion.div className="relative h-full w-full [transform-style:preserve-3d]" animate={{ rotateY: shown ? 180 : 0 }} transition={{ duration: 0.4 }}>
                <div className="clay clay-mint absolute inset-0 grid place-items-center rounded-2xl [backface-visibility:hidden]">
                  <IconStar filled size={28} className="text-white/80" />
                </div>
                <div className={`absolute inset-0 grid place-items-center rounded-2xl p-2 text-center font-display font-extrabold [backface-visibility:hidden] [transform:rotateY(180deg)] ${matched.includes(c.pair) ? "bg-mint-100 text-mint-600" : "bg-white text-ink-900 shadow-soft"} ${c.kind === "letters" ? "text-xl" : "text-base"}`}>
                  {c.text}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-6 text-center">
          <p className="font-display text-xl font-extrabold text-mint-600">طابقتَ كلّ البطاقات!</p>
          <Button className="mt-3" onClick={() => onFinish(score, 6)}>النتيجة</Button>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Game 6: Listen and choose ---------------- */
function ListenChoose({ onFinish }: { onFinish: (s: number, t: number) => void }) {
  const pool = useSurahPool([1, 112, 113, 114, 110, 108, 103]);
  const player = useRecitation();
  const R = useRounds(() => {
    if (!pool) return null;
    return Array.from({ length: 4 }, () => {
      const s = pick(pool.filter((x) => x.verses.length >= 3));
      const k = Math.floor(Math.random() * s.verses.length);
      const right = s.verses[k].text;
      const others = shuffle(s.verses.filter((v, j) => j !== k && v.text !== right)).map((v) => v.text).filter((t, j, a) => a.indexOf(t) === j).slice(0, 2);
      const options = shuffle([right, ...others]);
      return { surah: s.id, ayah: k + 1, options, answer: options.indexOf(right) };
    });
  }, [pool]);
  if (!R.rounds) return <Loading />;
  const r = R.rounds[R.i];
  const last = R.i + 1 === R.rounds.length;
  return (
    <Round i={R.i} total={R.rounds.length} score={R.score}>
      <p className="text-center text-sm font-bold text-ink-500">سورة {surahMeta(r.surah).name} · استمع ثم اختر الآية</p>
      <div className="my-6 flex justify-center">
        <button onClick={() => player.play({ surah: r.surah, from: r.ayah, to: r.ayah, repeatEach: 1, repeatGroup: 1 })} className="clay clay-coral grid h-28 w-28 place-items-center rounded-full text-white" aria-label="استمع">
          {player.loading ? <span className="h-8 w-8 animate-spin rounded-full border-4 border-white/40 border-t-white" /> : <IconVolume size={44} />}
        </button>
      </div>
      {player.error && <p className="mb-4 text-center text-sm font-bold text-coral-500">{player.error}</p>}
      <Options quran options={r.options} answer={r.answer} picked={R.picked} onPick={(k) => { R.setPicked(k); player.stop(); if (k === r.answer) R.setScore((s) => s + 1); }} />
      {R.picked != null && <Feedback ok={R.picked === r.answer} last={last} onNext={() => (last ? onFinish(R.score, R.rounds!.length) : (R.setI(R.i + 1), R.setPicked(null)))} />}
    </Round>
  );
}
