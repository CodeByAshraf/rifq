/**
 * The wake-up challenges shown when the Fajr alarm rings. Each one calls `onDone` only after it
 * is really solved: order the waking dua, count, repeat a colour sequence.
 */
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { IconCheck } from "@/components/art/Icons";
import { colorSequence, countRounds, duaPuzzle, PADS, wakingDua } from "@/lib/fajr/challenges";
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

export const CHALLENGE_TITLES: Record<ChallengeId, string> = {
  dua: "رتّب دعاء الاستيقاظ",
  count: "عُدّ وأجب",
  colors: "تذكّر الألوان",
};

export function WakeChallenge({ id, onDone }: { id: ChallengeId; onDone: Done }) {
  const current = id;
  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-2 text-sm font-bold text-white/80">
        <IconCheck size={16} /> {CHALLENGE_TITLES[current]}
      </div>
      {current === "dua" && <DuaOrder onDone={onDone} />}
      {current === "count" && <CountItems onDone={onDone} />}
      {current === "colors" && <ColorSequence onDone={onDone} />}
    </div>
  );
}
