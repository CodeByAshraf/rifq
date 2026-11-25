/**
 * The wake-up challenges shown when the Fajr alarm rings. Each one calls `onDone` only after it
 * is really solved. Kids: order the waking dua, count, repeat a colour sequence.
 * Adults: arithmetic, memory grid, photograph the place of wudu.
 */
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCamera, IconCheck } from "@/components/art/Icons";
import { Button } from "@/components/ui";
import { colorSequence, countRounds, duaPuzzle, GRID, mathProblem, memoryCells, PADS, parseNumber, wakingDua } from "@/lib/fajr/challenges";
import { loadReference, fingerprint, similarity, MATCH } from "@/lib/fajr/photo";
import type { ChallengeId } from "@/lib/fajr/settings";
import { toArabicDigits } from "@/lib/quran";

type Done = () => void;
const rand = Math.random;

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex justify-center gap-2" aria-label={`${done} من ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-3 w-8 rounded-full ${i < done ? "bg-sun-400" : "bg-white/25"}`} />
      ))}
    </div>
  );
}

const Shake = ({ k, children }: { k: number; children: React.ReactNode }) => (
  <motion.div key={k} animate={k ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }}>
    {children}
  </motion.div>
);

// ---------------------------------------------------------------- kids

function DuaOrder({ onDone }: { onDone: Done }) {
  const { pieces, order } = useMemo(() => duaPuzzle(rand), []);
  const source = useMemo(() => wakingDua().source, []);
  const [placed, setPlaced] = useState<number[]>([]);
  const [miss, setMiss] = useState(0);
  const tap = (i: number) => {
    if (placed.includes(i)) return;
    if (i !== placed.length) return setMiss((m) => m + 1);
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === pieces.length) setTimeout(onDone, 700);
  };
  return (
    <div>
      <p className="text-center font-display text-xl font-bold">رتّب دعاء الاستيقاظ: اضغط القطع بالترتيب</p>
      <div className="mt-4 min-h-24 rounded-3xl bg-white/95 p-4 text-center font-display text-2xl font-bold leading-loose text-ink-900" dir="rtl">
        {placed.length ? placed.map((i) => pieces[i]).join(" ") : <span className="font-display text-base text-ink-300">…</span>}
      </div>
      <Shake k={miss}>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {order.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              disabled={placed.includes(i)}
              className={`min-h-16 rounded-2xl px-3 py-2 font-display text-xl font-bold transition ${placed.includes(i) ? "bg-white/10 text-white/30" : "bg-sun-300 text-ink-900 shadow-lg active:scale-95"}`}
            >
              {pieces[i]}
            </button>
          ))}
        </div>
      </Shake>
      <p className="mt-3 text-center text-sm text-white/70">رواه {source}</p>
    </div>
  );
}

const COUNT_ICON = { star: "⭐", moon: "🌙", sun: "☀️" } as const;
const COUNT_NAME = { star: "النجوم", moon: "الأقمار", sun: "الشموس" } as const;

function CountItems({ onDone }: { onDone: Done }) {
  const rounds = useMemo(() => countRounds(rand), []);
  const [r, setR] = useState(0);
  const [miss, setMiss] = useState(0);
  const cur = rounds[Math.min(r, rounds.length - 1)];
  const pick = (n: number) => {
    if (n !== cur.n) return setMiss((m) => m + 1);
    if (r + 1 === rounds.length) {
      setR(r + 1);
      setTimeout(onDone, 500);
    } else setR(r + 1);
  };
  return (
    <div>
      <Progress done={r} total={rounds.length} />
      <p className="mt-4 text-center font-display text-2xl font-bold">كم عدد {COUNT_NAME[cur.icon]}؟</p>
      <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-3 rounded-3xl bg-white/10 p-5 text-4xl" aria-hidden>
        {Array.from({ length: cur.n }, (_, i) => (
          <span key={`${r}-${i}`} className="text-center">
            {COUNT_ICON[cur.icon]}
          </span>
        ))}
      </div>
      <Shake k={miss}>
        <div className="mt-5 flex justify-center gap-3">
          {cur.options.map((n) => (
            <button key={`${r}-${n}`} type="button" onClick={() => pick(n)} className="h-20 w-20 rounded-3xl bg-sun-300 font-display text-4xl font-extrabold text-ink-900 shadow-lg active:scale-95">
              {toArabicDigits(n)}
            </button>
          ))}
        </div>
      </Shake>
    </div>
  );
}

const PAD_COLORS = ["bg-teal-400", "bg-sun-400", "bg-coral-400", "bg-lilac-400"];

function ColorSequence({ onDone }: { onDone: Done }) {
  const lengths = [3, 4];
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState(() => colorSequence(rand, lengths[0]));
  const [lit, setLit] = useState<number | null>(null);
  const [showing, setShowing] = useState(true);
  const [pos, setPos] = useState(0);
  const [miss, setMiss] = useState(0);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    setShowing(true);
    setPos(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    seq.forEach((p, i) => {
      timers.push(setTimeout(() => setLit(p), 700 + i * 750));
      timers.push(setTimeout(() => setLit(null), 700 + i * 750 + 500));
    });
    timers.push(setTimeout(() => setShowing(false), 700 + seq.length * 750));
    return () => timers.forEach(clearTimeout);
  }, [seq, replay]);

  const tap = (p: number) => {
    if (showing) return;
    if (p !== seq[pos]) {
      setMiss((m) => m + 1);
      setReplay((x) => x + 1);
      return;
    }
    setLit(p);
    setTimeout(() => setLit(null), 200);
    if (pos + 1 < seq.length) return setPos(pos + 1);
    if (round + 1 === lengths.length) {
      setRound(round + 1);
      setTimeout(onDone, 400);
      return;
    }
    setRound(round + 1);
    setSeq(colorSequence(rand, lengths[round + 1]));
  };

  return (
    <div>
      <Progress done={round} total={lengths.length} />
      <p className="mt-4 text-center font-display text-xl font-bold">{showing ? "انتبه للألوان…" : "اضغط الألوان بنفس الترتيب"}</p>
      <Shake k={miss}>
        <div className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-4">
          {Array.from({ length: PADS }, (_, p) => (
            <button
              key={p}
              type="button"
              aria-label={`لون ${p + 1}`}
              onClick={() => tap(p)}
              className={`aspect-square rounded-[2rem] ${PAD_COLORS[p]} transition ${lit === p ? "scale-105 opacity-100 ring-8 ring-white" : "opacity-60"}`}
            />
          ))}
        </div>
      </Shake>
    </div>
  );
}

// ---------------------------------------------------------------- adults

function MathChallenge({ onDone, difficulty }: { onDone: Done; difficulty: 1 | 2 | 3 }) {
  const total = 3;
  const [solved, setSolved] = useState(0);
  const [p, setP] = useState(() => mathProblem(rand, difficulty));
  const [value, setValue] = useState("");
  const [miss, setMiss] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseNumber(value);
    if (n === null) return;
    setValue("");
    if (n !== p.answer) {
      setMiss((m) => m + 1);
      setP(mathProblem(rand, difficulty)); // a new problem: no guessing the same one
      return;
    }
    if (solved + 1 === total) {
      setSolved(total);
      onDone();
      return;
    }
    setSolved(solved + 1);
    setP(mathProblem(rand, difficulty));
    input.current?.focus();
  };
  return (
    <form onSubmit={submit}>
      <Progress done={solved} total={total} />
      <p className="mt-4 text-center text-white/80">حُلّ {toArabicDigits(total)} مسائل صحيحة</p>
      <Shake k={miss}>
        <div className="mt-3 text-center font-display text-5xl font-extrabold tracking-wide" dir="ltr">
          {toArabicDigits(p.text)} = ؟
        </div>
      </Shake>
      <input
        ref={input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="numeric"
        autoComplete="off"
        aria-label="الإجابة"
        maxLength={6}
        className="mt-5 h-16 w-full rounded-2xl bg-white text-center font-display text-3xl text-ink-900"
        dir="ltr"
      />
      <Button type="submit" tone="sun" size="lg" className="mt-3 w-full">
        تحقّق
      </Button>
    </form>
  );
}

function MemoryGrid({ onDone, difficulty }: { onDone: Done; difficulty: 1 | 2 | 3 }) {
  const count = 3 + difficulty;
  const rounds = 2;
  const [round, setRound] = useState(0);
  const [cells, setCells] = useState(() => memoryCells(rand, count));
  const [showing, setShowing] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);
  const [miss, setMiss] = useState(0);

  useEffect(() => {
    setShowing(true);
    setPicked([]);
    const t = setTimeout(() => setShowing(false), 2500);
    return () => clearTimeout(t);
  }, [cells]);

  const tap = (i: number) => {
    if (showing || picked.includes(i)) return;
    if (!cells.includes(i)) {
      setMiss((m) => m + 1);
      setCells(memoryCells(rand, count)); // wrong cell: new pattern
      return;
    }
    const next = [...picked, i];
    setPicked(next);
    if (next.length < cells.length) return;
    if (round + 1 === rounds) {
      setRound(rounds);
      setTimeout(onDone, 400);
    } else {
      setRound(round + 1);
      setTimeout(() => setCells(memoryCells(rand, count)), 400);
    }
  };

  return (
    <div>
      <Progress done={round} total={rounds} />
      <p className="mt-4 text-center font-display text-xl font-bold">{showing ? `احفظ مكان ${toArabicDigits(count)} مربّعات…` : "اضغط المربّعات التي أضاءت"}</p>
      <Shake k={miss}>
        <div className="mx-auto mt-5 grid max-w-xs grid-cols-4 gap-2">
          {Array.from({ length: GRID }, (_, i) => {
            const on = (showing && cells.includes(i)) || picked.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-label={`مربع ${i + 1}`}
                onClick={() => tap(i)}
                className={`aspect-square rounded-xl transition ${on ? "bg-sun-400" : "bg-white/15"}`}
              />
            );
          })}
        </div>
      </Shake>
    </div>
  );
}

function PhotoChallenge({ onDone, onGiveUp }: { onDone: Done; onGiveUp: () => void }) {
  const ref = useMemo(() => loadReference(), []);
  const [fails, setFails] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!ref) onGiveUp();
  }, [ref, onGiveUp]);
  if (!ref) return null;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const fp = await fingerprint(f);
      if (similarity(ref, fp) >= MATCH) return onDone();
      const n = fails + 1;
      setFails(n);
      if (n >= 3) {
        setMsg("لم تتطابق الصورة ٣ مرّات، فلننتقل إلى مسائل الحساب.");
        setTimeout(onGiveUp, 1800);
      } else setMsg("الصورة لا تشبه المكان المحفوظ. قِف في نفس المكان وصوّر من نفس الزاوية.");
    } catch {
      setMsg("تعذّرت قراءة الصورة، حاول مرّة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-center">
      <p className="font-display text-xl font-bold">قُم إلى مكان الوضوء وصوّره من نفس الزاوية</p>
      {/* The thumbnail is a local data: URL saved on this device. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ref.thumb} alt="الصورة المحفوظة لمكان الوضوء" width={120} height={120} className="mx-auto mt-4 rounded-2xl ring-4 ring-white/40" />
      <label className={`clay clay-sun mt-5 inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[1.4rem] font-display text-lg font-bold text-ink-900 ${busy ? "opacity-60" : ""}`}>
        <IconCamera size={22} /> {busy ? "جارٍ المقارنة…" : "افتح الكاميرا"}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} disabled={busy} />
      </label>
      {msg && <p className="mt-3 text-sm font-bold text-sun-300">{msg}</p>}
      <p className="mt-3 text-xs text-white/60">تُقارَن الصورة على جهازك ولا تُحفظ ولا تُرفع.</p>
    </div>
  );
}

export const CHALLENGE_TITLES: Record<ChallengeId, string> = {
  dua: "رتّب دعاء الاستيقاظ",
  count: "عُدّ وأجب",
  colors: "تذكّر الألوان",
  math: "مسائل حساب",
  memory: "لعبة الذاكرة",
  photo: "صوّر مكان الوضوء",
};

export function WakeChallenge({ id, difficulty, onDone }: { id: ChallengeId; difficulty: 1 | 2 | 3; onDone: Done }) {
  const [current, setCurrent] = useState<ChallengeId>(id);
  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-2 text-sm font-bold text-white/80">
        <IconCheck size={16} /> {CHALLENGE_TITLES[current]}
      </div>
      {current === "dua" && <DuaOrder onDone={onDone} />}
      {current === "count" && <CountItems onDone={onDone} />}
      {current === "colors" && <ColorSequence onDone={onDone} />}
      {current === "math" && <MathChallenge onDone={onDone} difficulty={difficulty} />}
      {current === "memory" && <MemoryGrid onDone={onDone} difficulty={difficulty} />}
      {current === "photo" && <PhotoChallenge onDone={onDone} onGiveUp={() => setCurrent("math")} />}
    </div>
  );
}
