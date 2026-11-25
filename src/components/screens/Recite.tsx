import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconHeadphones, IconPause, IconPlay, IconShield, IconX } from "@/components/art/Icons";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, Celebrate, SectionTitle } from "@/components/ui";
import { useRecitation } from "@/lib/player";
import { KIDS_SURAHS, SURAHS, surahMeta, toArabicDigits, useSurah } from "@/lib/quran";
import { deleteRecording, listRecordings, pickMime, saveRecording, type Recording } from "@/lib/recordings";
import { actions, useProgress } from "@/lib/store";
import { saveFile } from "@/lib/native";

const fmt = (s: number) => `${toArabicDigits(Math.floor(s / 60))}:${toArabicDigits(String(Math.floor(s % 60)).padStart(2, "0"))}`;
const rangeLabel = (r: { surah: number; from: number; to: number }) =>
  `سورة ${surahMeta(r.surah).name} · ${r.from === r.to ? `الآية ${toArabicDigits(r.from)}` : `الآيات ${toArabicDigits(r.from)}–${toArabicDigits(r.to)}`}`;

export function Recite() {
  const mode = useProgress((s) => s.mode);
  const [surahId, setSurahId] = useState(1);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(7);
  const { surah } = useSurah(surahId);
  const meta = surahMeta(surahId);
  const [recs, setRecs] = useState<Recording[]>([]);
  const [state, setState] = useState<"idle" | "recording" | "saving">("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const raf = useRef(0);
  const startedAt = useRef(0);

  const refresh = useCallback(() => {
    listRecordings().then(setRecs).catch(() => setRecs([]));
  }, []);
  useEffect(refresh, [refresh]);

  useEffect(() => {
    setFrom(1);
    setTo(Math.min(meta.verses, 7));
  }, [surahId, meta.verses]);

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("التسجيل غير مدعوم على هذا الجهاز.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      const mime = pickMime();
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = async () => {
        setState("saving");
        const blob = new Blob(chunks.current, { type: r.mimeType || mime || "audio/webm" });
        const duration = (Date.now() - startedAt.current) / 1000;
        s.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(raf.current);
        if (duration > 1) {
          await saveRecording({ id: `r${Date.now()}`, surah: surahId, from, to, at: new Date().toISOString(), duration, mime: blob.type, blob });
          actions.addRecording(`تسجيل ${rangeLabel({ surah: surahId, from, to })}`);
          setSaved(true);
          refresh();
        }
        setState("idle");
      };
      // live level meter
      try {
        const ctx = new AudioContext();
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        ctx.createMediaStreamSource(s).connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        const loop = () => {
          an.getByteFrequencyData(buf);
          setLevel(buf.reduce((a, b) => a + b, 0) / buf.length / 128);
          raf.current = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        /* meter is optional */
      }
      rec.current = r;
      startedAt.current = Date.now();
      setSeconds(0);
      timer.current = setInterval(() => setSeconds((x) => x + 1), 1000);
      r.start();
      setState("recording");
    } catch {
      setError("لم نتمكّن من الوصول إلى الميكروفون. اسمح لرِفق باستخدام الميكروفون من إعدادات الهاتف.");
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    rec.current?.stop();
  }

  const surahOptions = mode === "kids" ? KIDS_SURAHS.map((id) => surahMeta(id)) : SURAHS;

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-coral-400 to-coral-500 p-7 text-white shadow-lift sm:p-9">
        <div className="pattern-girih absolute inset-0 opacity-50 mix-blend-overlay" />
        <div className="relative flex items-center gap-5">
          <MagdyImage size={140} className="hidden shrink-0 drop-shadow-xl sm:block" />
          <div>
            <h1 className="font-display text-4xl font-extrabold">تلاوتي</h1>
            <p className="mt-2 max-w-lg text-coral-100">سجّل قراءتك، ثم استمع إليها وقارنها بالقارئ. يمكن لوالديك أو معلّمك الاستماع إليها أيضًا.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <select value={surahId} onChange={(e) => setSurahId(+e.target.value)} className="h-11 rounded-2xl bg-cream-100 px-3 font-display font-bold" aria-label="السورة" disabled={state !== "idle"}>
              {surahOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  سورة {s.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-bold text-ink-500">
              من
              <select value={from} disabled={state !== "idle"} onChange={(e) => { const v = +e.target.value; setFrom(v); if (v > to) setTo(v); }} className="h-11 rounded-2xl bg-cream-100 px-2 font-display text-ink-900">
                {Array.from({ length: meta.verses }, (_, i) => <option key={i} value={i + 1}>{toArabicDigits(i + 1)}</option>)}
              </select>
              إلى
              <select value={to} disabled={state !== "idle"} onChange={(e) => { const v = +e.target.value; setTo(v); if (v < from) setFrom(v); }} className="h-11 rounded-2xl bg-cream-100 px-2 font-display text-ink-900">
                {Array.from({ length: meta.verses }, (_, i) => <option key={i} value={i + 1}>{toArabicDigits(i + 1)}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 max-h-[45vh] overflow-y-auto rounded-3xl bg-cream-50 p-4 text-center text-2xl leading-[2.3] sm:text-3xl">
            {surah ? (
              surah.verses.slice(from - 1, to).map((v) => (
                <span key={v.id}>
                  <VerseText text={v.text} />
                  <AyahMark n={v.id} />{" "}
                </span>
              ))
            ) : (
              <span className="inline-block h-10 w-2/3 animate-pulse rounded-xl bg-cream-200" />
            )}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="relative">
              <AnimatePresence>
                {state === "recording" && (
                  <motion.span className="absolute inset-0 rounded-full bg-coral-400" initial={{ scale: 1, opacity: 0.4 }} animate={{ scale: 1 + level * 0.9, opacity: 0.25 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} />
                )}
              </AnimatePresence>
              <button
                onClick={state === "recording" ? stop : start}
                disabled={state === "saving"}
                className={`clay relative grid h-24 w-24 place-items-center rounded-full text-white ${state === "recording" ? "clay-coral" : "clay-teal"}`}
                aria-label={state === "recording" ? "إيقاف التسجيل" : "ابدأ التسجيل"}
              >
                {state === "recording" ? (
                  <span className="h-8 w-8 rounded-lg bg-white" />
                ) : (
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="font-display text-lg font-bold">{state === "recording" ? `جارٍ التسجيل… ${fmt(seconds)}` : state === "saving" ? "جارٍ الحفظ…" : "اضغط وابدأ القراءة"}</div>
            {error && <p className="max-w-md text-center text-sm font-bold text-coral-500">{error}</p>}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title="تسجيلاتي" hint={`${toArabicDigits(recs.length)} تسجيل`} />
            {recs.length === 0 ? (
              <p className="text-sm text-ink-500">لا توجد تسجيلات بعد. سجّل أوّل تلاوة لك!</p>
            ) : (
              <ul className="space-y-3">
                {recs.map((r) => (
                  <RecordingRow key={r.id} r={r} onDelete={() => deleteRecording(r.id).then(refresh)} />
                ))}
              </ul>
            )}
          </Card>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
            <IconShield size={16} className="mt-0.5 shrink-0 text-teal-600" />
            التسجيلات محفوظة على هذا الجهاز فقط ولا تُرفع إلى أيّ مكان. لا يوجد تقييمٌ آلي للتلاوة؛ اطلب من معلّمك أو والديك الاستماع إليك.
          </p>
        </div>
      </div>
      <Celebrate open={saved} onClose={() => setSaved(false)} title="سُجّلت تلاوتك!" message="استمع إليها الآن وقارنها بتلاوة القارئ." stars={2} />
    </AppShell>
  );
}

function RecordingRow({ r, onDelete }: { r: Recording; onDelete: () => void }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [url] = useState(() => URL.createObjectURL(r.blob));
  const [playing, setPlaying] = useState<"own" | "compare" | null>(null);
  const reciter = useRecitation();

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const playOwn = () => {
    reciter.stop();
    if (!audio.current) {
      audio.current = new Audio(url);
      audio.current.onended = () => setPlaying(null);
    }
    if (playing === "own") {
      audio.current.pause();
      setPlaying(null);
      return;
    }
    audio.current.currentTime = 0;
    audio.current.play().catch(() => {});
    setPlaying("own");
  };

  const compare = () => {
    audio.current?.pause();
    if (playing === "compare") {
      reciter.stop();
      setPlaying(null);
      return;
    }
    setPlaying("compare");
    reciter.play({ surah: r.surah, from: r.from, to: r.to, repeatEach: 1, repeatGroup: 1 });
  };

  // after the reciter ends during a comparison, play the learner's recording
  const wasPlaying = useRef(false);
  useEffect(() => {
    if (playing !== "compare") return;
    if (reciter.playing) wasPlaying.current = true;
    if (wasPlaying.current && !reciter.playing && !reciter.loading) {
      wasPlaying.current = false;
      if (!audio.current) {
        audio.current = new Audio(url);
        audio.current.onended = () => setPlaying(null);
      }
      audio.current.currentTime = 0;
      audio.current.play().catch(() => setPlaying(null));
    }
  }, [playing, reciter.playing, reciter.loading, url]);

  const download = () =>
    saveFile(r.blob, `تلاوتي-${surahMeta(r.surah).name}-${r.from}-${r.to}.${r.mime.includes("mp4") ? "m4a" : "webm"}`, "تلاوتي في رِفق");

  return (
    <li className="rounded-2xl bg-cream-100 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display font-bold">{rangeLabel(r)}</div>
          <div className="text-xs text-ink-500">
            {new Date(r.at).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })} · {fmt(r.duration)}
          </div>
        </div>
        <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-xl text-ink-300 hover:bg-white hover:text-coral-500" aria-label="حذف التسجيل">
          <IconX size={16} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" onClick={playOwn}>
          {playing === "own" ? <IconPause size={16} /> : <IconPlay size={16} />} صوتي
        </Button>
        <Button size="sm" tone="sky" onClick={compare}>
          <IconHeadphones size={16} /> {playing === "compare" ? "إيقاف" : "قارن بالقارئ"}
        </Button>
        <Button size="sm" tone="white" onClick={download}>
          حفظ
        </Button>
      </div>
      {reciter.error && playing === "compare" && <p className="mt-1 text-xs font-bold text-coral-500">{reciter.error}</p>}
    </li>
  );
}
