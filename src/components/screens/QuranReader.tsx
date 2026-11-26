import { Link } from "@/components/shell/Link";
import { useRouter } from "@/lib/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconBookmark, IconPlay, IconSprout } from "@/components/art/Icons";
import { PlayerBar } from "@/components/quran/PlayerBar";
import { VerseMeaning } from "@/components/quran/VerseMeaning";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Chip, Modal } from "@/components/ui";
import { useRecitation } from "@/lib/player";
import { RECITERS, showBasmalaHeader, SURAHS, surahMeta, toArabicDigits, useSurah } from "@/lib/quran";
import { STATE_COLOR, STATE_LABEL } from "@/lib/srs";
import { actions, getState, useChild, verseKey } from "@/lib/store";

export function QuranReader() {
  const router = useRouter();
  const { data } = useChild();
  const [surahId, setSurahId] = useState(1);
  const [picker, setPicker] = useState(false);
  const [meaning, setMeaning] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [fontSize, setFontSize] = useState(34);
  const { surah, error } = useSurah(surahId);
  const { surah: fatiha } = useSurah(1); // for the Basmala header (verified text of 1:1)
  const meta = surahMeta(surahId);

  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [each, setEach] = useState(1);
  const [group, setGroup] = useState(1);
  const [reciter, setReciter] = useState(0);
  const player = useRecitation();
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Start from the verse chosen elsewhere (journey map, dashboard).
  const [scrollTo, setScrollTo] = useState<number | null>(null);
  useEffect(() => {
    const f = getState().focus;
    if (f) {
      setSurahId(f.surah);
      if (f.ayah > 1) setScrollTo(f.ayah);
    }
  }, []);
  useEffect(() => {
    if (!scrollTo || !surah || surah.id !== surahId) return;
    const t = setTimeout(() => {
      verseRefs.current[scrollTo]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setScrollTo(null);
    }, 300);
    return () => clearTimeout(t);
  }, [scrollTo, surah, surahId]);

  useEffect(() => {
    player.stop();
    setMeaning(null);
    setFrom(1);
    setTo(meta.verses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahId]);

  useEffect(() => {
    if (player.ayah) verseRefs.current[player.ayah]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [player.ayah]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter((s) => s.name.includes(q) || s.transliteration.toLowerCase().includes(q) || String(s.id) === q);
  }, [query]);

  const playFrom = (a: number, b = a) => player.play({ surah: surahId, from: a, to: b, repeatEach: each, repeatGroup: group, reciter: RECITERS[reciter] });

  const toggle = () => {
    if (player.playing) return player.pause();
    if (player.ayah && player.resume()) return;
    playFrom(from, to);
  };

  const step = (dir: 1 | -1) => {
    const cur = player.ayah ?? from;
    const n = Math.min(meta.verses, Math.max(1, cur + dir));
    playFrom(n, n);
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Surah list (desktop) */}
        <aside className="hidden lg:block">
          <div className="card-3d sticky top-24 max-h-[calc(100dvh-8rem)] overflow-hidden p-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن سورة…" className="mb-2 h-11 w-full rounded-2xl bg-cream-100 px-4 text-sm outline-none focus:ring-2 focus:ring-teal-300" />
            <SurahList list={filtered} current={surahId} onPick={setSurahId} className="max-h-[calc(100dvh-14rem)]" />
          </div>
        </aside>

        <section className="min-w-0 pb-52">
          <div className={`relative overflow-hidden rounded-[2rem] p-6 text-center bg-gradient-to-l from-teal-500 to-teal-700 text-white shadow-lift`}>
            <div className="pattern-girih absolute inset-0 opacity-50 mix-blend-overlay" />
            <div className="relative">
              <button onClick={() => setPicker(true)} className={`mb-2 rounded-full px-4 py-1.5 text-sm font-bold lg:hidden bg-white/20`}>
                تغيير السورة
              </button>
              <h1 className="font-display text-4xl font-extrabold">سورة {meta.name}</h1>
              <p className={`mt-1 text-sm text-teal-50`}>
                {meta.type === "meccan" ? "مكّية" : "مدنية"} · {toArabicDigits(meta.verses)} آية · {meta.transliteration}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-teal-50">حجم الخط</span>
                {[28, 34, 42].map((s, i) => (
                  <button key={s} onClick={() => setFontSize(s)} className={`h-8 w-8 rounded-xl font-bold ${fontSize === s ? "bg-white text-teal-700" : "bg-white/20"}`}>
                    {["ص", "م", "ك"][i]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="mt-6 rounded-2xl bg-coral-100 p-4 font-bold text-coral-500">{error}</p>}

          {surah && fatiha && showBasmalaHeader(surahId) && (
            <div className="mt-6 text-center text-3xl text-teal-700" aria-label="البسملة">
              <VerseText text={fatiha.verses[0].text} />
            </div>
          )}

          <div className="mt-6 space-y-3">
            {!surah &&
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[1.75rem] bg-white/70" />)}
            {surah?.verses.map((v) => {
              const k = verseKey(surahId, v.id);
              const prog = data.verses[k];
              const active = player.ayah === v.id;
              const marked = data.bookmarks.includes(k);
              return (
                <div
                  key={v.id}
                  ref={(el) => {
                    verseRefs.current[v.id] = el;
                  }}
                  className={`rounded-[1.75rem] border-2 p-5 transition-all ${active ? "border-sun-400 bg-sun-100/70 shadow-lift" : "border-transparent bg-white shadow-soft"}`}
                >
                  <p className="text-ink-900" style={{ fontSize }}>
                    <VerseText text={v.text} />
                    <AyahMark n={v.id} active={active} />
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cream-200 pt-3">
                    <button onClick={() => playFrom(v.id)} className="flex items-center gap-1.5 rounded-xl bg-teal-100 px-3 py-1.5 text-sm font-bold text-teal-700">
                      <IconPlay size={14} /> استمع
                    </button>
                    <button onClick={() => { setFrom(v.id); setTo(Math.min(meta.verses, v.id + 2)); playFrom(v.id, Math.min(meta.verses, v.id + 2)); }} className="rounded-xl bg-cream-100 px-3 py-1.5 text-sm font-bold text-ink-700">
                      كرّر مع ما بعدها
                    </button>
                    <button onClick={() => setMeaning(meaning === v.id ? null : v.id)} className={`rounded-xl px-3 py-1.5 text-sm font-bold ${meaning === v.id ? "bg-lilac-500 text-white" : "bg-lilac-100 text-lilac-600"}`} aria-expanded={meaning === v.id}>
                      المعنى
                    </button>
                    <button onClick={() => actions.toggleBookmark(surahId, v.id)} className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-bold ${marked ? "bg-sun-100 text-sun-600" : "bg-cream-100 text-ink-700"}`} aria-pressed={marked}>
                      <IconBookmark size={15} filled={marked} /> {marked ? "محفوظة" : "علامة"}
                    </button>
                    <button onClick={() => { actions.setFocus(surahId, v.id); router.push("/memorize"); }} className="flex items-center gap-1 rounded-xl bg-mint-100 px-3 py-1.5 text-sm font-bold text-mint-600">
                      <IconSprout size={15} /> احفظها
                    </button>
                    {prog && <Chip className={`mr-auto ${STATE_COLOR[prog.state]}`}>{STATE_LABEL[prog.state]}</Chip>}
                  </div>
                  {meaning === v.id && (
                    <div className="mt-3">
                      <VerseMeaning surah={surahId} ayah={v.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {data.bookmarks.length > 0 && (
            <div className="card-3d mt-8 p-5">
              <h2 className="font-display text-xl font-extrabold">علاماتي</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.bookmarks.map((b) => {
                  const [s, a] = b.split(":").map(Number);
                  return (
                    <button key={b} onClick={() => setSurahId(s)} className="rounded-xl bg-sun-100 px-3 py-1.5 text-sm font-bold text-sun-600">
                      {surahMeta(s).name} · {toArabicDigits(a)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <p className="mt-6 pb-24 text-center text-xs leading-relaxed text-ink-500">
            نصّ المصحف: رواية حفص، مصحف المدينة النبوية (مجمع الملك فهد)، عبر موسوعة القرآن الكريم — CC BY-SA 4.0.{" "}
            <Link href="/sources" className="font-bold underline-offset-4 hover:underline">
              المصادر والتراخيص
            </Link>
          </p>
        </section>
      </div>

      {surah && (
        <PlayerBar
          total={meta.verses}
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          each={each}
          setEach={setEach}
          group={group}
          setGroup={setGroup}
          reciter={reciter}
          setReciter={setReciter}
          playing={player.playing}
          loading={player.loading}
          current={player.ayah}
          rep={player.rep}
          onToggle={toggle}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          error={player.error}
        />
      )}

      <Modal open={picker} onClose={() => setPicker(false)} title="اختر سورة">
        <h3 className="font-display text-xl font-extrabold">اختر سورة</h3>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث…" className="mt-3 h-11 w-full rounded-2xl bg-cream-100 px-4 text-sm outline-none" />
        <SurahList list={filtered} current={surahId} onPick={(id) => { setSurahId(id); setPicker(false); }} className="mt-3 max-h-[55dvh]" />
      </Modal>
    </AppShell>
  );
}

function SurahList({ list, current, onPick, className = "" }: { list: typeof SURAHS; current: number; onPick: (id: number) => void; className?: string }) {
  return (
    <ul className={`no-scrollbar space-y-1 overflow-y-auto ${className}`}>
      {list.map((s) => (
        <li key={s.id}>
          <button onClick={() => onPick(s.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-right transition ${s.id === current ? "bg-teal-500 text-white" : "hover:bg-cream-100"}`}>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold ${s.id === current ? "bg-white/25" : "bg-cream-100 text-ink-500"}`}>{toArabicDigits(s.id)}</span>
            <span className="flex-1 font-display font-bold">{s.name}</span>
            <span className={`text-xs ${s.id === current ? "text-white/80" : "text-ink-300"}`}>{toArabicDigits(s.verses)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
