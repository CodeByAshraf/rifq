import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { IconCheck, IconEye, IconPause, IconPlay, IconRefresh, IconX } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { Stepper } from "@/components/quran/PlayerBar";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { Button, Card, Celebrate, ProgressBar } from "@/components/ui";
import { playSfx } from "@/lib/fx";
import { useRecitation } from "@/lib/player";
import { RECITERS, surahMeta, toArabicDigits, words, type Surah } from "@/lib/quran";
import { actions } from "@/lib/store";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const allIdx = (t: string) => words(t).map((_, i) => i);

/* ------------------------------------------------------------------ */
/* 1. Link verses: memorize the connection between two verses         */
/* ------------------------------------------------------------------ */
export function LinkVerses({ surah, ayah, reciter }: { surah: Surah; ayah: number; reciter: number }) {
  const total = surah.verses.length;
  const a = total < 2 ? 1 : Math.max(1, Math.min(ayah, total) - (ayah > 1 ? 1 : 0));
  const b = Math.min(total, a + 1);
  const pair = surah.verses.slice(a - 1, b);
  const [rounds, setRounds] = useState(3);
  const [hide, setHide] = useState<"none" | "first" | "second" | "both">("none");
  const [done, setDone] = useState(false);
  const player = useRecitation();

  const hiddenFor = (i: number) =>
    hide === "both" || (hide === "first" && i === 0) || (hide === "second" && i === 1) ? allIdx(pair[i].text) : [];

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-center font-display text-2xl font-extrabold">ربط الآيات</h2>
      <p className="mt-1 text-center text-ink-500">
        نحفظ نهاية الآية {toArabicDigits(a)} مع بداية الآية {toArabicDigits(b)} حتى لا تنقطع القراءة.
      </p>

      <div className="mt-6 space-y-3 text-center text-3xl leading-loose">
        {pair.map((v, i) => (
          <motion.div key={v.id} layout className={`rounded-3xl p-4 ${player.ayah === v.id && player.playing ? "bg-sun-100" : "bg-cream-100"}`}>
            <VerseText text={v.text} hidden={hiddenFor(i)} />
            <AyahMark n={v.id} active={player.ayah === v.id && player.playing} />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Stepper label="عدد الجولات" value={rounds} set={setRounds} max={10} />
        <Button onClick={() => (player.playing ? player.pause() : player.play({ surah: surah.id, from: a, to: b, repeatEach: 1, repeatGroup: rounds, reciter: RECITERS[reciter], gap: 900 }))}>
          {player.playing ? <IconPause size={20} /> : <IconPlay size={20} />} {player.playing ? "إيقاف" : "استمع للآيتين"}
        </Button>
      </div>
      {player.error && <p className="mt-2 text-center text-sm font-bold text-coral-500">{player.error}</p>}

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {([
          ["none", "إظهار الكل"],
          ["first", "أخفِ الأولى"],
          ["second", "أخفِ الثانية"],
          ["both", "أخفِ الآيتين"],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setHide(k)} className={`rounded-2xl px-4 py-2 text-sm font-bold ${hide === k ? "bg-lilac-500 text-white" : "bg-lilac-100 text-lilac-600"}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          tone="mint"
          size="lg"
          onClick={() => {
            pair.forEach((v) => actions.rateVerse(surah.id, v.id, "good"));
            actions.addStars(3, { kind: "memorize", label: `ربط ${surahMeta(surah.id).name} ${toArabicDigits(a)}–${toArabicDigits(b)}` });
            setDone(true);
          }}
        >
          <IconCheck size={20} /> أتقنتُ الربط
        </Button>
      </div>
      <Celebrate open={done} onClose={() => setDone(false)} title="ربطٌ متقن!" message="صارت الآيتان متّصلتين في حفظك." stars={3} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Recite the whole surah from memory, verse by verse              */
/* ------------------------------------------------------------------ */
export function SurahRecital({ surah }: { surah: Surah }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const [result, setResult] = useState<Record<number, "ok" | "miss">>({});
  const [done, setDone] = useState(false);
  const total = surah.verses.length;
  const answered = Object.keys(result).length;
  const ok = Object.values(result).filter((r) => r === "ok").length;

  const mark = (id: number, r: "ok" | "miss") => {
    playSfx(r === "ok" ? "correct" : "wrong");
    actions.rateVerse(surah.id, id, r === "ok" ? "good" : "again");
    const next = { ...result, [id]: r };
    setResult(next);
    if (Object.keys(next).length === total) {
      actions.addStars(Math.max(3, Math.ceil(total / 2)), { kind: "revise", label: `تسميع سورة ${surahMeta(surah.id).name}` });
      setDone(true);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-center font-display text-2xl font-extrabold">تسميع سورة {surahMeta(surah.id).name}</h2>
      <p className="mt-1 text-center text-ink-500">اقرأ كلّ آيةٍ من حفظك، ثم اكشفها وتحقّق.</p>
      <ProgressBar value={answered / total} tone="mint" className="mt-4" />
      <div className="mt-6 space-y-3">
        {surah.verses.map((v) => {
          const shown = revealed.includes(v.id);
          const r = result[v.id];
          return (
            <div key={v.id} className={`rounded-3xl border-2 p-4 transition ${r === "ok" ? "border-mint-400 bg-mint-100/60" : r === "miss" ? "border-coral-400 bg-coral-100/60" : "border-cream-200 bg-cream-50"}`}>
              <div className="text-center text-2xl leading-loose sm:text-3xl">
                <VerseText text={v.text} hidden={shown ? [] : allIdx(v.text)} />
                <AyahMark n={v.id} />
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {!shown ? (
                  <Button size="sm" tone="white" onClick={() => setRevealed((x) => [...x, v.id])}>
                    <IconEye size={16} /> اكشف الآية
                  </Button>
                ) : r ? (
                  <span className={`flex items-center gap-1 font-bold ${r === "ok" ? "text-mint-600" : "text-coral-500"}`}>
                    {r === "ok" ? <IconCheck size={18} /> : <IconRefresh size={18} />} {r === "ok" ? "تذكّرتُها" : "سنراجعها قريبًا"}
                  </span>
                ) : (
                  <>
                    <Button size="sm" tone="mint" onClick={() => mark(v.id, "ok")}>
                      <IconCheck size={16} /> تذكّرتُها
                    </Button>
                    <Button size="sm" tone="coral" onClick={() => mark(v.id, "miss")}>
                      <IconX size={16} /> نسيتُ بعضها
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Celebrate open={done} onClose={() => setDone(false)} title="أتممتَ التسميع!" message={`تذكّرتَ ${toArabicDigits(ok)} من ${toArabicDigits(total)} آيات.`} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Missing word: pick the word that was hidden                      */
/* ------------------------------------------------------------------ */
export function MissingWord({ surah }: { surah: Surah }) {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => {
    const pool = surah.verses.filter((v) => words(v.text).length >= 3);
    const allWords = [...new Set(surah.verses.flatMap((v) => words(v.text)))];
    if (!pool.length) return [];
    return Array.from({ length: Math.min(6, Math.max(3, pool.length)) }, () => {
      const v = pool[Math.floor(Math.random() * pool.length)];
      const ws = words(v.text);
      const idx = 1 + Math.floor(Math.random() * (ws.length - 1));
      const right = ws[idx];
      const others = shuffle(allWords.filter((w) => w !== right)).slice(0, 2);
      const options = shuffle([right, ...others]);
      return { v, idx, options, answer: options.indexOf(right) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!rounds.length) return <Card className="p-8 text-center text-ink-500">آيات هذه السورة قصيرة جدًا لهذا التمرين. جرّب سورةً أخرى.</Card>;
  const r = rounds[i];
  const last = i + 1 === rounds.length;
  const correct = picked === r.answer;

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-center font-display text-2xl font-extrabold">الكلمة الناقصة</h2>
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar value={i / rounds.length} tone="sun" className="flex-1" />
        <span className="font-display font-bold text-sun-600">{toArabicDigits(score)}</span>
      </div>
      <p className="mt-4 text-center text-sm font-bold text-ink-500">
        سورة {surahMeta(surah.id).name} · الآية {toArabicDigits(r.v.id)} — ما الكلمة المخفيّة؟
      </p>
      <div className="mt-4 rounded-3xl bg-teal-50 p-5 text-center text-3xl leading-loose">
        <VerseText
          text={r.v.text}
          hidden={picked == null ? [r.idx] : []}
          highlight={picked != null ? { [r.idx]: correct ? "bg-mint-100 text-mint-600" : "bg-sun-100 text-sun-600" } : {}}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {r.options.map((o, k) => {
          const s = picked == null ? "idle" : k === r.answer ? "right" : k === picked ? "wrong" : "dim";
          return (
            <button
              key={k}
              disabled={picked != null}
              onClick={() => {
                setPicked(k);
                playSfx(k === r.answer ? "correct" : "wrong");
                if (k === r.answer) setScore((x) => x + 1);
              }}
              className={`quran clay rounded-2xl px-4 py-2 text-2xl ${s === "right" ? "clay-right" : s === "wrong" ? "clay-wrong" : "clay-white"} ${s === "dim" ? "opacity-60" : ""}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Mascot size={44} mood={correct ? "cheer" : "think"} />
          <Button
            onClick={() => {
              if (last) {
                actions.addStars(Math.max(1, score), { kind: "revise", label: `الكلمة الناقصة · ${surahMeta(surah.id).name}` });
                setDone(true);
              } else {
                setI(i + 1);
                setPicked(null);
              }
            }}
          >
            {last ? "النتيجة" : "التالي"}
          </Button>
        </div>
      )}
      <Celebrate
        open={done}
        onClose={() => { setDone(false); setI(0); setPicked(null); setScore(0); setSeed((s) => s + 1); }}
        title="أحسنت!"
        message={`عرفتَ ${toArabicDigits(score)} من ${toArabicDigits(rounds.length)} كلمات.`}
        actions={<Button onClick={() => { setDone(false); setI(0); setPicked(null); setScore(0); setSeed((s) => s + 1); }}>العب مرة أخرى</Button>}
      />
    </Card>
  );
}

