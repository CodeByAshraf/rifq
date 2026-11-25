import { useCallback, useEffect, useRef, useState } from "react";
import { audioUrl, RECITERS, type Reciter } from "@/lib/quran";

export interface PlayPlan {
  surah: number;
  from: number;
  to: number;
  /** times each verse is played before moving on */
  repeatEach: number;
  /** times the whole group [from..to] is played */
  repeatGroup: number;
  reciter?: Reciter;
  /** pause in ms between repetitions (gives the learner time to repeat) */
  gap?: number;
}

interface Cursor {
  ayah: number;
  eachDone: number;
  groupDone: number;
}

/**
 * Verse-by-verse recitation player with per-verse and per-group repetition.
 * Audio is streamed from verified EveryAyah recordings; nothing is synthesized.
 */
export function useRecitation() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const plan = useRef<PlayPlan | null>(null);
  const cursor = useRef<Cursor>({ ayah: 0, eachDone: 0, groupDone: 0 });
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ayah, setAyah] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rep, setRep] = useState({ each: 0, group: 0 });

  const playCurrent = useCallback(() => {
    const p = plan.current;
    const a = audio.current;
    if (!p || !a) return;
    const c = cursor.current;
    setAyah(c.ayah);
    setRep({ each: c.eachDone + 1, group: c.groupDone + 1 });
    setLoading(true);
    a.src = audioUrl(p.surah, c.ayah, p.reciter ?? RECITERS[0]);
    a.play()
      .then(() => {
        setPlaying(true);
        setError(null);
      })
      .catch((e: unknown) => {
        setPlaying(false);
        setLoading(false);
        if ((e as { name?: string })?.name !== "AbortError") setError("تعذّر تشغيل التلاوة. تأكّد من الاتصال بالإنترنت.");
      });
  }, []);

  const advance = useCallback(() => {
    const p = plan.current;
    if (!p) return;
    const c = cursor.current;
    c.eachDone++;
    if (c.eachDone < p.repeatEach) return schedule();
    c.eachDone = 0;
    c.ayah++;
    if (c.ayah <= p.to) return schedule();
    c.groupDone++;
    if (c.groupDone < p.repeatGroup) {
      c.ayah = p.from;
      return schedule();
    }
    // finished
    setPlaying(false);
    plan.current = null;

    function schedule() {
      gapTimer.current = setTimeout(playCurrent, p!.gap ?? 350);
    }
  }, [playCurrent]);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audio.current = a;
    const onEnded = () => advance();
    const onPlaying = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setPlaying(false);
      setError("تعذّر تحميل ملف التلاوة لهذه الآية.");
    };
    a.addEventListener("ended", onEnded);
    a.addEventListener("playing", onPlaying);
    a.addEventListener("error", onError);
    return () => {
      a.pause();
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("error", onError);
      if (gapTimer.current) clearTimeout(gapTimer.current);
    };
  }, [advance]);

  const play = useCallback(
    (p: PlayPlan) => {
      if (gapTimer.current) clearTimeout(gapTimer.current);
      plan.current = { ...p, repeatEach: Math.max(1, p.repeatEach), repeatGroup: Math.max(1, p.repeatGroup) };
      cursor.current = { ayah: p.from, eachDone: 0, groupDone: 0 };
      playCurrent();
    },
    [playCurrent],
  );

  const pause = useCallback(() => {
    if (gapTimer.current) clearTimeout(gapTimer.current);
    audio.current?.pause();
    setPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (!plan.current) return false;
    audio.current
      ?.play()
      .then(() => setPlaying(true))
      .catch(() => setError("تعذّر تشغيل التلاوة."));
    return true;
  }, []);

  const stop = useCallback(() => {
    if (gapTimer.current) clearTimeout(gapTimer.current);
    audio.current?.pause();
    plan.current = null;
    setPlaying(false);
    setAyah(null);
  }, []);

  return { play, pause, resume, stop, playing, ayah, loading, error, rep, plan };
}
