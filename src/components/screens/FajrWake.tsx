import { Link } from "@/components/shell/Link";
import { useEffect, useMemo, useState } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconAlarm, IconCheck } from "@/components/art/Icons";
import { CHALLENGE_TITLES, WakeChallenge } from "@/components/fajr/WakeChallenges";
import { Button } from "@/components/ui";
import { confirmAwake, markSolved } from "@/lib/fajr/alarm";
import { wakingDua } from "@/lib/fajr/challenges";
import { useFajrSettings, type ChallengeId } from "@/lib/fajr/settings";
import { phase } from "@/lib/fajr/times";
import { startTune, stopTune } from "@/lib/fajr/tune";
import { toArabicDigits } from "@/lib/quran";

const clock = (ms: number) => toArabicDigits(new Date(ms).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" }));
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return toArabicDigits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
};

function useNow(every = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

function pickChallenge(list: ChallengeId[]): ChallengeId {
  const pool: ChallengeId[] = list.length ? list : ["count"];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function FajrWake() {
  const s = useFajrSettings();
  const now = useNow();
  const p = phase(s, now);
  const [started, setStarted] = useState(false);
  const [practice, setPractice] = useState(false);
  const [finished, setFinished] = useState<null | { practice: boolean }>(null);
  const challenge = useMemo(() => pickChallenge(s.challenges), [s.challenges]);
  const dua = useMemo(() => wakingDua(), []);
  const ringing = p.kind === "ringing" && !finished;

  useEffect(() => () => stopTune(), []);
  // After a solve the screen shows the dua; when the "still awake?" check (or a re-ring) comes,
  // switch back to it.
  const needsAction = p.kind === "check" || p.kind === "ringing";
  useEffect(() => {
    if (needsAction) setFinished((f) => (f && !f.practice ? null : f));
  }, [needsAction]);

  const start = () => {
    setStarted(true);
    startTune();
  };

  const solved = async () => {
    stopTune();
    if (practice) {
      setFinished({ practice: true });
      return;
    }
    if (p.kind === "ringing") await markSolved(p.day);
    setFinished({ practice: false });
    setStarted(false);
  };

  const body = (() => {
    if (finished) {
      return (
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-mint-400 text-white">
            <IconCheck size={44} />
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold">{finished.practice ? "أحسنت! هكذا يعمل التحدّي" : "أحسنت يا بطل!"}</h1>
          <div className="mt-5 rounded-3xl bg-white/95 p-5 text-ink-900">
            <div className="text-sm font-bold text-teal-700">دعاء الاستيقاظ</div>
            <p className="mt-2 font-display text-2xl font-bold leading-loose">{dua.text}</p>
            <div className="mt-1 text-xs text-ink-500">رواه {dua.source}</div>
          </div>
          {!finished.practice && <p className="mt-4 text-lg text-white/90">توضّأ وصلِّ الفجر، تقبّل الله منك.</p>}
          {!finished.practice && s.wakeCheck && <p className="mt-2 text-sm text-white/70">سنسألك بعد ٥ دقائق: هل ما زلت مستيقظًا؟</p>}
          <Link href="/kids" className="mt-6 inline-block font-bold text-white/80 underline-offset-4 hover:underline">
            إلى رِفق
          </Link>
        </div>
      );
    }

    if (ringing || practice) {
      const again = p.kind === "ringing" && p.again;
      if (!started) {
        return (
          <div className="text-center" data-wake-lock={ringing ? "" : undefined}>
            <MagdyImage size={150} className="mx-auto drop-shadow-xl" />
            <div className="mt-2 font-display text-6xl font-extrabold">{clock(now.getTime())}</div>
            <h1 className="mt-3 font-display text-3xl font-extrabold">{practice ? "تجربة التحدّي" : again ? "لم تؤكّد أنّك مستيقظ!" : "حان وقت صلاة الفجر"}</h1>
            {!practice && <p className="mt-2 text-lg text-white/85">اصحَ يا بطل، حلّ التحدّي ليسكت المنبّه</p>}
            <Button tone="sun" size="lg" className="mt-8 w-full" onClick={start}>
              ابدأ التحدّي: {CHALLENGE_TITLES[challenge]}
            </Button>
            {!practice && <p className="mt-3 text-xs text-white/60">لن يتوقّف المنبّه حتى تحلّ التحدّي.</p>}
          </div>
        );
      }
      return (
        <div data-wake-lock={ringing ? "" : undefined}>
          <WakeChallenge id={challenge} onDone={solved} />
        </div>
      );
    }

    if (p.kind === "check") {
      return (
        <div className="text-center" data-wake-lock="">
          <h1 className="font-display text-4xl font-extrabold">هل ما زلت مستيقظًا؟</h1>
          <p className="mt-2 text-white/80">اضغط خلال {mmss(p.until - now.getTime())} وإلّا رنّ المنبّه من جديد.</p>
          <Button tone="sun" size="lg" className="mt-8 w-full" onClick={() => confirmAwake(p.day)}>
            <IconCheck size={22} /> نعم، أنا مستيقظ
          </Button>
        </div>
      );
    }

    if (p.kind === "waiting") {
      return (
        <div className="text-center">
          <h1 className="font-display text-3xl font-extrabold">تقبّل الله منك</h1>
          <p className="mt-3 text-white/80">سنسألك «هل ما زلت مستيقظًا؟» بعد {mmss(p.checkAt - now.getTime())}</p>
          <p className="mt-6 rounded-3xl bg-white/95 p-5 font-display text-2xl font-bold leading-loose text-ink-900">{dua.text}</p>
        </div>
      );
    }

    if (p.kind === "done") {
      return (
        <div className="text-center">
          <h1 className="font-display text-3xl font-extrabold">استيقظت للفجر اليوم، تقبّل الله منك</h1>
          <Link href="/fajr" className="mt-6 inline-block font-bold text-white/80 underline-offset-4 hover:underline">
            إعدادات المنبّه
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center">
        <IconAlarm size={56} className="mx-auto text-sun-300" />
        <h1 className="mt-3 font-display text-3xl font-extrabold">لا يرنّ المنبّه الآن</h1>
        <p className="mt-2 text-white/80">جرّب التحدّي لترى كيف سيوقظك رِفق.</p>
        <Button tone="sun" size="lg" className="mt-6 w-full" onClick={() => setPractice(true)}>
          جرّب التحدّي الآن
        </Button>
        <Link href="/fajr" className="mt-5 inline-block font-bold text-white/80 underline-offset-4 hover:underline">
          إعدادات المنبّه
        </Link>
      </div>
    );
  })();

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#1b2a5c] via-[#27407a] to-teal-700 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] text-white">
      <div className="mx-auto max-w-md">{body}</div>
    </main>
  );
}
