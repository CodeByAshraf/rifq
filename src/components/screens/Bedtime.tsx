import { useEffect, useMemo, useRef, useState } from "react";
import { IconHeadphones, IconPause, IconPlay, IconSparkle } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { STORIES, storyOfTheDay, type Story } from "@/data/stories";
import { surahMeta, toArabicDigits } from "@/lib/quran";
import { useNarrator } from "@/lib/story-audio";
import { installVoice, isAndroid, voiceSettings, voiceStatus, type VoiceStatus } from "@/lib/voice";
import { lineClip, storyPlan, type Clip } from "@/lib/story-clips";

/** Sleep timer: a number of stories, or minutes (then the voice fades out). */
const TIMERS = [
  { id: "s1", label: "قصة واحدة", stories: 1 },
  { id: "s2", label: "قصتان", stories: 2 },
  { id: "s3", label: "ثلاث قصص", stories: 3 },
  { id: "m20", label: "٢٠ دقيقة", minutes: 20 },
] as const;
type TimerId = (typeof TIMERS)[number]["id"];

/** Builds the night's queue: stories one after another, linked, ending with "good night". */
function nightQueue(first: Story, count: number): { clips: Clip[]; storyOf: number[] } {
  const start = STORIES.findIndex((s) => s.id === first.id);
  const clips: Clip[] = [];
  const storyOf: number[] = [];
  for (let k = 0; k < count; k++) {
    const si = (start + k) % STORIES.length;
    if (k > 0) {
      clips.push(lineClip("line-next"));
      storyOf.push(si);
    }
    for (const c of storyPlan(STORIES[si])) {
      clips.push(c);
      storyOf.push(si);
    }
  }
  clips.push(lineClip("line-goodnight"));
  storyOf.push(storyOf.at(-1) ?? start);
  return { clips, storyOf };
}

/** «حكايات قبل النوم»: a calm, dark screen that tells stories aloud with a sleep timer. */
export function Bedtime() {
  const [chosen, setChosen] = useState<Story>(() => storyOfTheDay());
  const [timer, setTimer] = useState<TimerId>("s1");
  const [now, setNow] = useState<{ story: number; page?: number; ayah?: string } | null>(null);
  const [ended, setEnded] = useState(false);
  const map = useRef<number[]>([]);
  const stopAt = useRef<ReturnType<typeof setTimeout> | null>(null);

  const narrator = useNarrator({
    onClip: (c, i) => {
      const story = map.current[i];
      setNow({ story, page: c.kind === "voice" ? c.page : undefined, ayah: c.kind === "ayah" ? `${surahMeta(c.surah).name} · ${toArabicDigits(c.ayah)}` : undefined });
    },
    onEnd: () => {
      setEnded(true);
      setNow(null);
    },
  });
  const active = narrator.state !== "idle" && narrator.state !== "error";

  useEffect(() => () => void (stopAt.current && clearTimeout(stopAt.current)), []);
  // The phone voice needs an Arabic voice (Android: Google's speech engine + its Arabic voice).
  // Checked again when the user comes back from installing it.
  const [voice, setVoice] = useState<VoiceStatus | null>(null);
  useEffect(() => {
    let alive = true;
    const check = (fresh: boolean) =>
      voiceStatus(fresh)
        .then((v) => alive && setVoice(v))
        .catch(() => {});
    void check(false);
    const back = () => document.visibilityState === "visible" && void check(true);
    document.addEventListener("visibilitychange", back);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", back);
    };
  }, []);

  const begin = () => {
    const t = TIMERS.find((x) => x.id === timer)!;
    const count = "stories" in t ? t.stories : 12;
    const q = nightQueue(chosen, count);
    map.current = q.storyOf;
    setEnded(false);
    narrator.start(q.clips);
    if (stopAt.current) clearTimeout(stopAt.current);
    if ("minutes" in t) stopAt.current = setTimeout(() => narrator.fadeOut(), t.minutes * 60_000);
  };
  const stop = () => {
    if (stopAt.current) clearTimeout(stopAt.current);
    narrator.stop();
    setNow(null);
  };

  const current = now ? STORIES[now.story] : null;
  const text = current && now?.page != null ? (now.page < current.pages.length ? current.pages[now.page] : current.lesson) : null;

  return (
    <AppShell>
      <div className="relative min-h-[75vh] overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-[#0b1736] via-[#13224a] to-[#1d2f5c] p-6 text-white shadow-lift sm:p-9">
        <Sky />
        <div className="relative">
          <div className="flex items-center gap-3">
            <Moon />
            <div>
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">حكايات قبل النوم</h1>
              <p className="mt-1 text-white/70">أغمض عينيك، واستمع إلى حكايةٍ هادئة.</p>
            </div>
          </div>

          {active || ended ? (
            <div className="mt-10 text-center">
              {current && <div className="font-display text-2xl font-extrabold text-sun-300">{current.title}</div>}
              <p className="mx-auto mt-5 min-h-28 max-w-xl font-display text-xl leading-[2] text-white/80 transition-opacity duration-700">
                {ended ? "تصبحون على خير، في حفظ الله ورعايته." : now?.ayah ? `آياتٌ من سورة ${now.ayah}` : (text ?? "…")}
              </p>
              {narrator.state === "loading" && <p className="mt-2 text-sm text-white/50">جارٍ التحميل…</p>}
              <div className="mt-8 flex items-center justify-center gap-4">
                {!ended && (
                  <button
                    onClick={() => (narrator.state === "paused" ? narrator.resume() : narrator.pause())}
                    aria-label={narrator.state === "paused" ? "تشغيل" : "إيقاف مؤقّت"}
                    className="grid h-20 w-20 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition active:scale-95"
                  >
                    {narrator.state === "paused" ? <IconPlay size={34} /> : <IconPause size={34} />}
                  </button>
                )}
                <button onClick={() => (ended ? setEnded(false) : stop())} className="rounded-full bg-white/10 px-5 py-3 font-bold text-white/80">
                  {ended ? "حكاية أخرى" : "إنهاء"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mt-8 font-display text-xl font-extrabold text-sun-300">اختر الحكاية الأولى</h2>
              <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-2">
                {STORIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setChosen(s)}
                    className={`shrink-0 rounded-2xl px-4 py-3 text-right font-bold transition ${chosen.id === s.id ? "bg-sun-300 text-ink-900" : "bg-white/10 text-white/85"}`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              <h2 className="mt-6 font-display text-xl font-extrabold text-sun-300">متى نتوقّف؟</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {TIMERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTimer(t.id)}
                    className={`rounded-2xl px-4 py-2.5 font-bold transition ${timer === t.id ? "bg-white text-[#13224a]" : "bg-white/10 text-white/85"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                onClick={begin}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-[1.6rem] bg-sun-300 py-5 font-display text-2xl font-extrabold text-ink-900 shadow-lift transition active:scale-[0.98]"
              >
                <IconHeadphones size={28} /> ابدأ الحكاية
              </button>
              {voice && !voice.arabic && <VoiceSetup v={voice} />}
              {narrator.state === "error" && (
                <p className="mt-3 text-center text-sm font-bold text-coral-400">تعذّر التشغيل الآن. تأكّد من الاتصال بالإنترنت (للآيات) ومن تجهيز الصوت العربي.</p>
              )}
              <p className="mt-6 flex items-start gap-2 text-sm text-white/55">
                <IconSparkle size={16} className="mt-0.5 shrink-0" />
                يحكي القصةَ صوتُ الهاتف، أمّا آيات القرآن فبتلاوة الشيخ محمود خليل الحصري. خفّف إضاءة الشاشة، وضع الهاتف بعيدًا عن وسادة طفلك.
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/** Guides the parent to get an Arabic voice on the phone (one time). */
function VoiceSetup({ v }: { v: VoiceStatus }) {
  const btn = "mt-3 w-full rounded-xl bg-white px-4 py-3 font-bold text-[#13224a]";
  return (
    <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-relaxed">
      <p className="font-display text-base font-extrabold text-sun-300">تجهيز صوت الحكايات (مرة واحدة)</p>
      {!isAndroid ? (
        <p className="mt-1 text-white/80">لا يوجد صوتٌ عربي على هذا الجهاز. أضِفه من إعدادات الجهاز: تسهيلات الاستخدام ← المحتوى المنطوق ← الأصوات ← العربية.</p>
      ) : !v.google ? (
        <>
          <p className="mt-1 text-white/80">ثبّت تطبيق «خدمات الكلام من Google» المجاني من متجر Play، ثم ارجع إلى هنا.</p>
          <button onClick={installVoice} className={btn}>
            فتح متجر Play
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-white/80">نزّل «العربية» من قائمة اللغات في «خدمات الكلام من Google»، ثم ارجع إلى هنا.</p>
          <button onClick={installVoice} className={btn}>
            تنزيل الصوت العربي
          </button>
          <button onClick={voiceSettings} className="mt-2 w-full text-center text-xs font-bold text-white/60 underline">
            أو افتح إعدادات تحويل النص إلى كلام
          </button>
        </>
      )}
    </div>
  );
}

function Moon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden className="shrink-0 drop-shadow-[0_0_18px_rgba(255,226,140,.45)]">
      <path d="M42 8a24 24 0 1 0 14 40A20 20 0 0 1 42 8z" fill="#ffe08a" />
    </svg>
  );
}

/** Soft twinkling stars (CSS only, very light). */
function Sky() {
  const stars = useMemo(
    () => Array.from({ length: 34 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 70, r: 1 + (i % 3) * 0.6, d: (i % 7) * 0.6 })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute animate-pulse rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, opacity: 0.55, animationDelay: `${s.d}s`, animationDuration: "3.5s" }}
        />
      ))}
    </div>
  );
}
