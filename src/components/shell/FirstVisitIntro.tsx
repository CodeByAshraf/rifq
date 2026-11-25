import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "@/lib/router";
import { useEffect, useRef, useState } from "react";
import { MagdyStanding } from "@/components/art/Magdy";
import { IconCheck, IconPause, IconPlay } from "@/components/art/Icons";
import { Logo } from "@/components/art/GameArt";
import { Cloud, Sparkle } from "@/components/art/Scenery";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { playSfx } from "@/lib/fx";
import { useRecitation } from "@/lib/player";
import { useSurah } from "@/lib/quran";

const SEEN_KEY = "rifq.intro.seen";
export const FROM_INTRO_KEY = "rifq.fromIntro";

/** Baba Magdy's first words to a new visitor (educational message, not Quran). */
const MESSAGE = [
  "السلام عليكم ورحمة الله وبركاته يا حبيبي،",
  "أنا بابا مجدي.",
  "هاخدك معايا في رحلة جميلة، نحفظ فيها القرآن، ونتعرّف فيها على ربنا أكتر، ونقرب منه.",
  "بس قبل ما نبدأ… عايزك تقرالي سورة الفاتحة.",
];

/** Types text character by character, pausing a little longer after punctuation. */
function useTyping(lines: string[], start: boolean) {
  const full = lines.join("\n");
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(full.length);
      return;
    }
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      i++;
      setN(i);
      if (i >= full.length) return;
      const ch = full[i - 1];
      const delay = ch === "\n" ? 650 : ch === "،" || ch === "," ? 280 : ch === "." || ch === "…" ? 420 : 42;
      t = setTimeout(tick, delay);
    };
    t = setTimeout(tick, 500);
    return () => clearTimeout(t);
  }, [full, start]);
  return { text: full.slice(0, n), done: n >= full.length, finish: () => setN(full.length) };
}

export function FirstVisitIntro() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // Never cover the Fajr wake-up screen (the alarm may ring before the intro was seen).
      const wake = /fajr-wake/.test(location.pathname + location.hash);
      if (!wake && !localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      /* storage unavailable: don't block the site */
    }
  }, []);

  if (!open) return null;
  return <IntroScreen onClose={() => setOpen(false)} />;
}

function IntroScreen({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const typing = useTyping(MESSAGE, entered);
  const { surah } = useSurah(1);
  const player = useRecitation();
  const [phase, setPhase] = useState<"message" | "fatiha" | "done">("message");
  const leaving = useRef(false);
  const fatihaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typing.done && phase === "message") {
      const t = setTimeout(() => {
        setPhase("fatiha");
        // bring the surah into view on small screens
        setTimeout(() => fatihaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [typing.done, phase]);

  const finish = (skip = false) => {
    if (leaving.current) return;
    leaving.current = true;
    player.stop();
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
      if (!skip) sessionStorage.setItem(FROM_INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    if (skip) {
      onClose();
      return;
    }
    playSfx("win");
    setPhase("done");
    setTimeout(() => {
      onClose();
      router.push("/welcome");
    }, 2600);
  };

  return (
    <motion.div
      className="sky-bg fixed inset-0 z-[90] overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      role="dialog"
      aria-modal="true"
      aria-label="رسالة ترحيب من بابا مجدي"
    >
      <svg viewBox="0 0 1000 600" className="pointer-events-none fixed inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g className="animate-float-slow"><Cloud x={60} y={70} s={1.1} /></g>
        <g className="animate-float"><Cloud x={700} y={110} s={0.8} /></g>
        <Sparkle x={480} y={50} r={6} />
        <Sparkle x={900} y={360} r={5} color="#c9b8ff" delay={1} />
        <Sparkle x={120} y={420} r={5} color="#9fe6ff" delay={2} />
        <path d="M0 560 Q250 520 500 552 Q760 584 1000 540 L1000 600 L0 600 Z" fill="#8ee6b5" />
      </svg>

      <div className="relative mx-auto flex min-h-full max-w-4xl flex-col px-5 pb-10 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-xl font-extrabold text-teal-700">رِفق</span>
          </div>
          {phase !== "done" && (
            <button onClick={() => finish(true)} className="rounded-2xl bg-white/60 px-3 py-1.5 text-xs font-bold text-ink-500">
              تخطّي
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-1 flex-col items-center gap-4 sm:mt-8 sm:flex-row sm:items-start sm:gap-8">
          {/* Baba Magdy */}
          <div className="shrink-0 sm:sticky sm:top-10">
            <MagdyStanding size={typeof window !== "undefined" && window.innerWidth >= 640 ? 330 : 190} />
          </div>

          <div className="w-full flex-1">
            {/* typed message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.6 }}
              onClick={typing.finish}
              className="relative cursor-pointer rounded-[2rem] bg-white px-6 py-6 shadow-lift sm:px-8"
            >
              <span className="absolute -top-2 right-1/2 h-5 w-5 rotate-45 rounded-sm bg-white sm:-right-2 sm:top-16" aria-hidden />
              <p className="whitespace-pre-line font-display text-[22px] font-bold leading-[1.9] text-ink-900 sm:text-[26px]" aria-live="polite">
                {phase === "done" ? "ما شاء الله عليك! ربنا يتقبّل منك ويجعل القرآن ربيع قلبك.\nيلا بينا نبدأ رحلتنا…" : typing.text}
                {phase === "message" && !typing.done && <span className="mr-1 inline-block h-6 w-1.5 animate-pulse rounded bg-teal-400 align-middle" />}
              </p>
            </motion.div>

            {/* Al-Fatihah, from the verified text */}
            <AnimatePresence>
              {phase === "fatiha" && surah && (
                <motion.div ref={fatihaRef} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: "spring", stiffness: 140, damping: 18 }} className="card-3d mt-5 scroll-mt-4 p-5 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-2xl font-extrabold text-teal-700">سورة الفاتحة</h2>
                    <button
                      onClick={() => (player.playing ? player.pause() : player.play({ surah: 1, from: 1, to: 7, repeatEach: 1, repeatGroup: 1 }))}
                      className="flex items-center gap-1.5 rounded-2xl bg-teal-100 px-4 py-2 text-sm font-bold text-teal-700"
                    >
                      {player.playing ? <IconPause size={16} /> : <IconPlay size={16} />} {player.playing ? "إيقاف" : "اقرأ مع القارئ"}
                    </button>
                  </div>
                  <div className="mt-4 text-center text-[26px] leading-[2.4] sm:text-[32px]">
                    {surah.verses.map((v, i) => (
                      <motion.span
                        key={v.id}
                        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.25 + i * 0.35, duration: 0.6 }}
                        className={`rounded-xl transition-colors ${player.playing && player.ayah === v.id ? "bg-sun-100" : ""}`}
                      >
                        <VerseText text={v.text} />
                        <AyahMark n={v.id} active={player.playing && player.ayah === v.id} />{" "}
                      </motion.span>
                    ))}
                  </div>
                  {player.error && <p className="mt-2 text-center text-sm font-bold text-coral-500">{player.error}</p>}

                  <motion.div className="mt-6 flex justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + 7 * 0.35 + 0.3, type: "spring", stiffness: 220, damping: 14 }}>
                    <motion.button
                      onClick={() => finish(false)}
                      animate={{ boxShadow: ["0 0 0 0 rgba(31,179,166,0.45)", "0 0 0 18px rgba(31,179,166,0)"] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="clay clay-teal flex h-16 items-center gap-3 rounded-[1.6rem] px-10 font-display text-xl font-extrabold text-white"
                    >
                      <IconCheck size={24} /> قرأتُ الفاتحة
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
