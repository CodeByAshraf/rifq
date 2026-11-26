import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconBook, IconPause, IconPlay, IconX } from "@/components/art/Icons";
import { Link } from "@/components/shell/Link";
import { ayahEnd, clampPage, juzOfPage, MUSHAF_INDEX, PAGES, reader, surahOfPage, useMushafPage, useReader, type MushafPage, type Row } from "@/lib/mushaf";
import { useRecitation } from "@/lib/player";
import { RECITERS, surahMeta, SURAHS, toArabicDigits } from "@/lib/quran";
import { TAFSIR_SOURCE, MEANINGS_SOURCE, useTafsir } from "@/lib/tafsir";

/** Widest common printed line, in em of the KFGQPC font (measured over all 604 pages: 99% of
 *  lines fit; the few wider lines shrink themselves slightly). */
const LINE_EM = 20.4;
/** Minimum row height in em; rows grow to fill the page height like a printed page. */
const MIN_ROW = 1.75;
const ROW = "var(--row)";

type Sel = { s: number; a: number } | null;

const Chevron = ({ dir, size = 18 }: { dir: "left" | "right"; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
);

// ---------------------------------------------------------------- page rendering

/** One printed line, justified edge to edge like the printed Mushaf. */
const Line = memo(function Line({ row, sel, playing, onPick, center }: { row: Extract<Row, { l: unknown }>; sel: Sel; playing: Sel; onPick: (s: number, a: number) => void; center: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setScale(1);
    requestAnimationFrame(() => {
      if (el.scrollWidth > el.clientWidth + 1) setScale(el.clientWidth / el.scrollWidth);
    });
  }, [row]);
  return (
    <div ref={ref} className={`flex whitespace-nowrap ${center ? "justify-center gap-[0.35em]" : "justify-between gap-[0.2em]"}`} style={{ fontSize: `${scale}em`, height: ROW, lineHeight: ROW }}>
      {row.l.flatMap(([s, a, text, end]) => {
        const on = sel?.s === s && sel.a === a;
        const live = playing?.s === s && playing.a === a;
        const cls = `cursor-pointer rounded-md transition-colors ${on ? "bg-sun-300/45" : live ? "bg-teal-100" : ""}`;
        const words = text.split(" ").map((w, i) => (
          <span key={`${s}:${a}:${i}`} className={cls} onClick={() => onPick(s, a)}>
            {w}
          </span>
        ));
        if (end)
          words.push(
            <span key={`${s}:${a}:end`} className={`${cls} text-teal-700`} onClick={() => onPick(s, a)} aria-label={`نهاية الآية ${a}`}>
              {ayahEnd(a)}
            </span>,
          );
        return words;
      })}
    </div>
  );
});

function PageView({ page, sel, playing, onPick }: { page: MushafPage; sel: Sel; playing: Sel; onPick: (s: number, a: number) => void }) {
  const opening = page.p <= 2;
  return (
    <div className={opening ? "flex h-full flex-col justify-center" : ""}>
      {page.rows.map((r: Row, i) => {
        if ("h" in r)
          return (
            <div key={i} className="flex items-center justify-center" style={{ height: ROW }}>
              <div className="flex h-[1.6em] w-full items-center justify-center rounded-full border-2 border-teal-600/50 bg-gradient-to-l from-teal-50 via-white to-teal-50 font-display text-[0.8em] font-extrabold text-teal-700">
                سورة {surahMeta(r.h).name}
              </div>
            </div>
          );
        if ("b" in r)
          return (
            <div key={i} className="text-center" style={{ height: ROW, lineHeight: ROW }}>
              {MUSHAF_INDEX.basmalah}
            </div>
          );
        return <Line key={i} row={r} sel={sel} playing={playing} onPick={onPick} center={opening} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------- ayah sheet

type Player = ReturnType<typeof useRecitation>;

function AyahSheet({ sel, onClose, page, player, reciter, setReciter }: { sel: { s: number; a: number }; onClose: () => void; page: number; player: Player; reciter: string; setReciter: (id: string) => void }) {
  const [tab, setTab] = useState<"listen" | "tafsir">("listen");
  const { tafsir, error } = useTafsir(tab === "tafsir" ? sel.s : null);
  const { mark } = useReader();
  const meta = surahMeta(sel.s);
  const marked = mark?.s === sel.s && mark.a === sel.a;
  const rec = RECITERS.find((r) => r.id === reciter) ?? RECITERS[0];

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const listen = (toEnd: boolean) => {
    player.play({ surah: sel.s, from: sel.a, to: toEnd ? meta.verses : sel.a, repeatEach: 1, repeatGroup: 1, reciter: rec, gap: 150 });
    // Continuous recitation keeps playing with the page visible; the sheet gets out of the way.
    if (toEnd) onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 bg-ink-900/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`سورة ${meta.name}، الآية ${sel.a}`}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[75dvh] max-w-2xl overflow-y-auto rounded-t-[1.6rem] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-lift"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink-300/50" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-lg font-extrabold">
              سورة {meta.name} · الآية {toArabicDigits(sel.a)}
            </div>
            <div className="text-xs text-ink-500">صفحة {toArabicDigits(page)}</div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-cream-200 text-ink-700" aria-label="إغلاق">
            <IconX size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button onClick={() => setTab("listen")} className={`rounded-xl py-2.5 text-sm font-bold ${tab === "listen" ? "bg-teal-600 text-white" : "bg-cream-100 text-ink-700"}`}>
            استماع
          </button>
          <button onClick={() => setTab("tafsir")} className={`rounded-xl py-2.5 text-sm font-bold ${tab === "tafsir" ? "bg-teal-600 text-white" : "bg-cream-100 text-ink-700"}`}>
            التفسير
          </button>
          <button
            onClick={() => (marked ? reader.clearMark() : reader.setMark({ p: page, s: sel.s, a: sel.a }))}
            className={`rounded-xl py-2.5 text-sm font-bold ${marked ? "bg-sun-300 text-ink-900" : "bg-cream-100 text-ink-700"}`}
          >
            {marked ? "إزالة العلامة" : "علامة هنا"}
          </button>
        </div>

        {tab === "listen" ? (
          <div className="mt-4">
            <label className="block text-xs font-bold text-ink-500">
              القارئ
              <select value={reciter} onChange={(e) => setReciter(e.target.value)} className="mt-1 h-11 w-full rounded-xl bg-cream-100 px-3 text-sm font-bold text-ink-900">
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {player.playing ? (
                <button onClick={player.pause} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-ink-900 font-bold text-white">
                  <IconPause size={20} /> إيقاف مؤقّت
                  {player.ayah && <span className="text-sm opacity-80">(الآية {toArabicDigits(player.ayah)})</span>}
                </button>
              ) : (
                <>
                  <button onClick={() => listen(false)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 font-bold text-white">
                    <IconPlay size={18} /> الآية فقط
                  </button>
                  <button onClick={() => listen(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-50 font-bold text-teal-700">
                    <IconPlay size={18} /> من هنا للسورة
                  </button>
                </>
              )}
            </div>
            {player.loading && <p className="mt-2 text-center text-xs text-ink-500">جارٍ التحميل…</p>}
            {player.error && <p className="mt-2 text-center text-xs font-bold text-coral-500">{player.error}</p>}
            <p className="mt-3 text-center text-[11px] text-ink-500">التلاوة من EveryAyah وتحتاج اتصالًا بالإنترنت.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-right">
            {error && <p className="text-sm font-bold text-coral-500">تعذّر تحميل التفسير.</p>}
            {!tafsir && !error && <div className="h-20 animate-pulse rounded-2xl bg-cream-100" />}
            {tafsir && (
              <>
                <p className="rounded-2xl bg-teal-50 p-4 leading-loose text-ink-900">{tafsir.m[sel.a - 1]}</p>
                {(tafsir.w[sel.a - 1] ?? []).length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-bold text-ink-500">معاني الكلمات</div>
                    <div className="flex flex-wrap gap-2">
                      {tafsir.w[sel.a - 1].map(([w, m], i) => (
                        <span key={i} className="rounded-xl bg-cream-100 px-3 py-1.5 text-sm leading-relaxed">
                          <b className="text-teal-700">{w}</b>: {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-ink-500">
                  {TAFSIR_SOURCE}، و{MEANINGS_SOURCE}.
                </p>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- index

function IndexSheet({ onClose, onGo, current }: { onClose: () => void; onGo: (p: number) => void; current: number }) {
  const [tab, setTab] = useState<"surah" | "juz" | "page">("surah");
  const [q, setQ] = useState("");
  const [num, setNum] = useState("");
  const list = useMemo(() => {
    const t = q.trim();
    return SURAHS.filter((s) => !t || s.name.includes(t) || String(s.id) === t.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
  }, [q]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const goNum = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(num.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
    if (Number.isInteger(n) && n >= 1 && n <= PAGES) onGo(n);
  };
  return (
    <motion.div className="fixed inset-0 z-50 bg-ink-900/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="فهرس المصحف"
        className="absolute inset-x-0 bottom-0 mx-auto flex h-[82dvh] max-w-2xl flex-col rounded-t-[1.6rem] bg-white pt-3 shadow-lift"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink-300/50" />
        <div className="flex items-center justify-between px-5">
          <div className="font-display text-xl font-extrabold">الفهرس</div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-cream-200 text-ink-700" aria-label="إغلاق">
            <IconX size={18} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 px-5">
          {(
            [
              ["surah", "السور"],
              ["juz", "الأجزاء"],
              ["page", "صفحة"],
            ] as const
          ).map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-xl py-2 text-sm font-bold ${tab === k ? "bg-ink-900 text-white" : "bg-cream-100 text-ink-700"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {tab === "surah" && (
            <>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم السورة أو رقمها" aria-label="بحث" className="mb-2 h-11 w-full rounded-xl bg-cream-100 px-4 text-sm outline-none focus:ring-2 focus:ring-teal-300" />
              <ul className="divide-y divide-cream-200">
                {list.map((s) => {
                  const p = MUSHAF_INDEX.surah[s.id - 1];
                  return (
                    <li key={s.id}>
                      <button onClick={() => onGo(p)} className={`flex w-full items-center gap-3 py-3 text-right ${surahOfPage(current) === s.id ? "text-teal-700" : ""}`}>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100 text-xs font-bold">{toArabicDigits(s.id)}</span>
                        <span className="flex-1">
                          <span className="block font-bold">سورة {s.name}</span>
                          <span className="block text-xs text-ink-500">
                            {s.type === "medinan" ? "مدنية" : "مكية"} · {toArabicDigits(s.verses)} آية
                          </span>
                        </span>
                        <span className="text-sm text-ink-500">ص {toArabicDigits(p)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {tab === "juz" && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {MUSHAF_INDEX.juz.map((p, i) => (
                <button key={i} onClick={() => onGo(p)} className={`rounded-xl py-3 text-center ${juzOfPage(current) === i + 1 ? "bg-teal-600 text-white" : "bg-cream-100"}`}>
                  <span className="block font-display font-extrabold">الجزء {toArabicDigits(i + 1)}</span>
                  <span className="block text-xs opacity-80">ص {toArabicDigits(p)}</span>
                </button>
              ))}
            </div>
          )}
          {tab === "page" && (
            <form onSubmit={goNum} className="pt-2">
              <label className="block text-sm font-bold text-ink-700">
                رقم الصفحة (١ – ٦٠٤)
                <input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" maxLength={3} className="mt-2 h-12 w-full rounded-xl bg-cream-100 px-4 text-center font-display text-xl outline-none focus:ring-2 focus:ring-teal-300" dir="ltr" />
              </label>
              <button type="submit" className="mt-3 h-12 w-full rounded-xl bg-teal-600 font-bold text-white">
                انتقال
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- reader

/** The adults' Mushaf: page by page in the Madinah layout. */
export function MushafReader() {
  const { last, mark } = useReader();
  const [p, setP] = useState(last);
  const [dir, setDir] = useState(0);
  const [sel, setSel] = useState<Sel>(null);
  const player = useRecitation();
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const playingSurah = player.plan.current?.surah;
  const playing: Sel = player.playing && player.ayah && playingSurah ? { s: playingSurah, a: player.ayah } : null;
  const [index, setIndex] = useState(false);
  const { page, error } = useMushafPage(p);
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ fs: 16, row: 32 });

  const go = useCallback((n: number) => {
    const t = clampPage(n);
    setP((cur) => {
      setDir(t > cur ? 1 : -1);
      return t;
    });
    setSel(null);
  }, []);

  useEffect(() => reader.setLast(p), [p]);

  // Continuous recitation turns the page when the āyah being read is on the next page.
  useEffect(() => {
    if (!playing || !page) return;
    const lines = page.rows.filter((r): r is Extract<Row, { l: unknown }> => "l" in r);
    const on = lines.some((r) => r.l.some(([s, a]) => s === playing.s && a === playing.a));
    const lastSeg = lines[lines.length - 1]?.l.at(-1);
    if (!on && lastSeg && (playing.s > lastSeg[0] || (playing.s === lastSeg[0] && playing.a > lastSeg[1]))) go(p + 1);
  }, [playing?.s, playing?.a, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Font size from the available box: the widest common line fills the width, and 15 lines fit
  // the height. Recomputed only when the screen size changes.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const fs = Math.max(12, Math.min(w / LINE_EM, h / (15 * MIN_ROW), 34));
      setFit({ fs, row: Math.max(fs * MIN_ROW, Math.min(h / 15, fs * 2.6)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (sel || index) return;
      if (e.key === "ArrowLeft") go(p + 1);
      if (e.key === "ArrowRight") go(p - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [p, go, sel, index]);

  const surah = surahMeta(surahOfPage(p));
  const onPick = useCallback((s: number, a: number) => setSel({ s, a }), []);
  const markedHere = mark?.p === p;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f7f1e3]">
      {/* top bar */}
      <header className="flex items-center gap-2 border-b border-[#e6dcc3] bg-[#fbf8f2] px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Link href="/adults" className="grid h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-white" aria-label="رجوع">
          <Chevron dir="right" size={22} />
        </Link>
        <button onClick={() => setIndex(true)} className="flex min-w-0 flex-1 flex-col items-start rounded-xl px-2 py-1 text-right hover:bg-white" aria-label="الفهرس">
          <span className="truncate font-display text-base font-extrabold text-ink-900">سورة {surah.name}</span>
          <span className="text-xs text-ink-500">الجزء {toArabicDigits(page?.j || juzOfPage(p))} · الفهرس</span>
        </button>
        <button
          onClick={() => (markedHere ? reader.clearMark() : reader.setMark({ p, s: surah.id, a: page?.rows.find((r): r is Extract<Row, { l: unknown }> => "l" in r)?.l[0][1] ?? 1 }))}
          className={`flex h-10 items-center gap-1 rounded-full px-3 text-sm font-bold ${markedHere ? "bg-sun-300 text-ink-900" : "bg-white text-ink-700 ring-1 ring-[#e6dcc3]"}`}
          aria-pressed={markedHere}
        >
          <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden>
            <path d="M2 1h12v16l-6-4-6 4z" fill={markedHere ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {markedHere ? "العلامة هنا" : "علامة"}
        </button>
      </header>

      {/* page */}
      <div className="relative min-h-0 flex-1 overflow-hidden px-3 py-3">
        <div className="mx-auto flex h-full max-w-3xl flex-col rounded-[0.6rem] border-[3px] border-double border-[#c9b98f] bg-[#fffdf7] px-3 py-2 shadow-[0_10px_30px_rgba(80,60,20,0.08)]">
          <div ref={box} className="relative min-h-0 flex-1 overflow-hidden" style={{ fontFamily: '"KFGQPC Hafs", var(--font-quran)', fontSize: fit.fs, ["--row" as string]: `${fit.row}px` }} dir="rtl">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              {page ? (
                <motion.div
                  key={page.p}
                  custom={dir}
                  className="absolute inset-0 text-ink-900"
                  initial={{ x: dir > 0 ? "-35%" : "35%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: dir > 0 ? "35%" : "-35%", opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={(_, info) => {
                    // Arabic Mushaf: the next page is to the left, so swipe right to move forward.
                    if (info.offset.x > 70) go(p + 1);
                    else if (info.offset.x < -70) go(p - 1);
                  }}
                >
                  <PageView page={page} sel={sel} playing={playing} onPick={onPick} />
                </motion.div>
              ) : error ? (
                <p key="err" className="absolute inset-0 grid place-items-center font-display text-base text-coral-500">
                  تعذّر فتح الصفحة.
                </p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {(player.playing || player.loading) && !sel && (
        <div className="flex items-center justify-between gap-3 border-t border-[#e6dcc3] bg-teal-50 px-4 py-2 text-sm">
          <span className="font-bold text-teal-700">
            {player.loading ? "جارٍ التحميل…" : `تُتلى الآن: سورة ${surahMeta(playingSurah ?? 1).name}، الآية ${toArabicDigits(player.ayah ?? 1)}`}
          </span>
          <button onClick={player.stop} className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-bold text-ink-700 ring-1 ring-[#e6dcc3]">
            <IconPause size={16} /> إيقاف
          </button>
        </div>
      )}
      {player.error && !sel && <div className="bg-coral-100 px-4 py-2 text-center text-xs font-bold text-coral-500">{player.error}</div>}

      {/* bottom bar */}
      <footer className="flex items-center justify-between gap-3 border-t border-[#e6dcc3] bg-[#fbf8f2] px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        <button onClick={() => go(p - 1)} disabled={p <= 1} className="flex h-11 items-center gap-1 rounded-full bg-white px-4 text-sm font-bold text-ink-700 ring-1 ring-[#e6dcc3] disabled:opacity-40">
          <Chevron dir="right" /> السابقة
        </button>
        <button onClick={() => setIndex(true)} className="flex items-center gap-1.5 rounded-full px-3 py-2 font-display font-extrabold text-ink-900" aria-label="انتقال إلى صفحة">
          <IconBook size={16} className="text-teal-700" />
          {toArabicDigits(p)}
        </button>
        <button onClick={() => go(p + 1)} disabled={p >= PAGES} className="flex h-11 items-center gap-1 rounded-full bg-white px-4 text-sm font-bold text-ink-700 ring-1 ring-[#e6dcc3] disabled:opacity-40">
          التالية <Chevron dir="left" />
        </button>
      </footer>

      <AnimatePresence>
        {sel && <AyahSheet key="ayah" sel={sel} page={p} onClose={() => setSel(null)} player={player} reciter={reciter} setReciter={setReciter} />}
        {index && (
          <IndexSheet
            key="index"
            current={p}
            onClose={() => setIndex(false)}
            onGo={(n) => {
              setIndex(false);
              go(n);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
