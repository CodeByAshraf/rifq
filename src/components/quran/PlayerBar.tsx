import { useState } from "react";
import { IconNext, IconPause, IconPlay, IconPrev, IconRepeat } from "@/components/art/Icons";
import { RECITERS, toArabicDigits } from "@/lib/quran";

export function Stepper({ label, value, set, min = 1, max = 20 }: { label: string; value: number; set: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-ink-500">{label}</span>
      <div className="flex items-center rounded-2xl bg-cream-100 p-1">
        <button className="grid h-8 w-8 place-items-center rounded-xl bg-white font-bold shadow-sm disabled:opacity-40" onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} aria-label={`إنقاص ${label}`}>
          −
        </button>
        <span className="w-8 text-center font-display font-bold">{toArabicDigits(value)}</span>
        <button className="grid h-8 w-8 place-items-center rounded-xl bg-white font-bold shadow-sm disabled:opacity-40" onClick={() => set(Math.min(max, value + 1))} disabled={value >= max} aria-label={`زيادة ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

export function PlayerBar(props: {
  total: number;
  from: number;
  to: number;
  setFrom: (n: number) => void;
  setTo: (n: number) => void;
  each: number;
  setEach: (n: number) => void;
  group: number;
  setGroup: (n: number) => void;
  reciter: number;
  setReciter: (n: number) => void;
  playing: boolean;
  loading: boolean;
  current: number | null;
  rep: { each: number; group: number };
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  error: string | null;
}) {
  const p = props;
  const [more, setMore] = useState(false);
  return (
    <div className="fixed inset-x-3 bottom-24 z-30 mx-auto max-w-4xl lg:bottom-4">
      <div className="card-3d p-3 sm:p-4">
        {p.error && <div className="mb-2 rounded-xl bg-coral-100 px-3 py-2 text-sm font-bold text-coral-500">{p.error}</div>}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={p.onPrev} className="grid h-11 w-11 place-items-center rounded-2xl bg-cream-100 text-ink-700" aria-label="الآية السابقة">
              <IconPrev />
            </button>
            <button onClick={p.onToggle} className="clay clay-teal grid h-14 w-14 place-items-center rounded-[1.2rem] text-white" aria-label={p.playing ? "إيقاف مؤقت" : "تشغيل"}>
              {p.loading ? <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white" /> : p.playing ? <IconPause /> : <IconPlay />}
            </button>
            <button onClick={p.onNext} className="grid h-11 w-11 place-items-center rounded-2xl bg-cream-100 text-ink-700" aria-label="الآية التالية">
              <IconNext />
            </button>
          </div>
          <div className="min-w-24 text-sm">
            <div className="font-display font-bold">{p.current ? `الآية ${toArabicDigits(p.current)}` : "جاهز للاستماع"}</div>
            {p.current && (
              <div className="text-xs text-ink-500">
                تكرار {toArabicDigits(p.rep.each)}/{toArabicDigits(p.each)} · جولة {toArabicDigits(p.rep.group)}/{toArabicDigits(p.group)}
              </div>
            )}
          </div>
          <button onClick={() => setMore((m) => !m)} className="mr-auto rounded-xl bg-cream-100 px-3 py-2 text-xs font-bold text-ink-700 sm:hidden" aria-expanded={more}>
            {more ? "إخفاء الإعدادات" : "التكرار والقارئ"}
          </button>
          <div className={`${more ? "flex" : "hidden"} w-full flex-wrap items-center gap-3 sm:mr-auto sm:flex sm:w-auto`}>
            <label className="flex items-center gap-2 text-xs font-bold text-ink-500">
              من
              <select value={p.from} onChange={(e) => { const v = +e.target.value; p.setFrom(v); if (v > p.to) p.setTo(v); }} className="h-9 rounded-xl bg-cream-100 px-2 font-display text-sm text-ink-900">
                {Array.from({ length: p.total }, (_, i) => (
                  <option key={i} value={i + 1}>{toArabicDigits(i + 1)}</option>
                ))}
              </select>
              إلى
              <select value={p.to} onChange={(e) => { const v = +e.target.value; p.setTo(v); if (v < p.from) p.setFrom(v); }} className="h-9 rounded-xl bg-cream-100 px-2 font-display text-sm text-ink-900">
                {Array.from({ length: p.total }, (_, i) => (
                  <option key={i} value={i + 1}>{toArabicDigits(i + 1)}</option>
                ))}
              </select>
            </label>
            <span className="hidden text-ink-300 sm:inline"><IconRepeat size={18} /></span>
            <Stepper label="كل آية" value={p.each} set={p.setEach} />
            <Stepper label="المجموعة" value={p.group} set={p.setGroup} />
            <select value={p.reciter} onChange={(e) => p.setReciter(+e.target.value)} className="h-9 rounded-xl bg-cream-100 px-2 text-xs font-bold text-ink-900" aria-label="القارئ">
              {RECITERS.map((r, i) => (
                <option key={r.id} value={i}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
