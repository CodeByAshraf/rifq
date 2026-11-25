import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { IconCalendar, IconEye, IconPlay, IconRefresh } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, Celebrate, Chip, LinkButton, ProgressBar, SectionTitle } from "@/components/ui";
import { dueVerses } from "@/lib/learning";
import { useRecitation } from "@/lib/player";
import { surahMeta, toArabicDigits, useSurahs } from "@/lib/quran";
import { STATE_COLOR, STATE_LABEL, type Rating } from "@/lib/srs";
import { actions, today, useChild, type VerseProgress } from "@/lib/store";
import { dayOffset } from "@/lib/dates";

type Item = { surah: number; ayah: number; v: VerseProgress };
type Tab = "due" | "today" | "yesterday" | "hard" | "surahs";

const yesterday = () => dayOffset(-1);

export function Revision() {
  const { data } = useChild();
  const [tab, setTab] = useState<Tab>("due");
  const [session, setSession] = useState<Item[] | null>(null);

  const all: Item[] = useMemo(
    () =>
      Object.entries(data.verses)
        .filter(([, v]) => v.state !== "not_started")
        .map(([k, v]) => {
          const [surah, ayah] = k.split(":").map(Number);
          return { surah, ayah, v };
        })
        .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah),
    [data.verses],
  );

  const lists: Record<Tab, Item[]> = {
    due: dueVerses(data.verses),
    today: all.filter((x) => x.v.firstLearned === today()),
    yesterday: all.filter((x) => x.v.firstLearned === yesterday()),
    hard: all.filter((x) => x.v.state === "needs_revision" || x.v.lapses >= 2),
    surahs: all,
  };

  const bySurah = useMemo(() => {
    const m = new Map<number, Item[]>();
    all.forEach((x) => m.set(x.surah, [...(m.get(x.surah) ?? []), x]));
    return [...m.entries()];
  }, [all]);

  if (session) return <AppShell><ReviewSession items={session} onExit={() => setSession(null)} /></AppShell>;

  const tabs: [Tab, string][] = [
    ["due", "مستحقّة اليوم"],
    ["today", "حفظ اليوم"],
    ["yesterday", "حفظ الأمس"],
    ["hard", "الآيات الصعبة"],
    ["surahs", "السور السابقة"],
  ];
  const current = lists[tab];

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-sky-400 to-sky-500 p-8 text-white shadow-lift">
        <div className="pattern-girih absolute inset-0 opacity-50 mix-blend-overlay" />
        <div className="relative flex flex-wrap items-center gap-6">
          <Mascot size={96} className="" />
          <div className="flex-1">
            <h1 className="font-display text-4xl font-extrabold">المراجعة</h1>
            <p className="mt-1 text-sky-100">المراجعة تحفظ ما حفظتَه. سنعيد لك كلّ آيةٍ في الوقت المناسب.</p>
          </div>
          <div className="rounded-3xl bg-white/20 px-6 py-4 text-center">
            <div className="font-display text-4xl font-extrabold">{toArabicDigits(lists.due.length)}</div>
            <div className="text-sm text-sky-100">آيات مستحقّة</div>
          </div>
        </div>
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-2xl px-4 py-2.5 font-display font-bold ${tab === k ? "bg-sky-500 text-white shadow-[0_4px_0_#2f86c4]" : "bg-white/80 text-ink-700"}`}>
            {l} <span className="opacity-70">({toArabicDigits(lists[k].length)})</span>
          </button>
        ))}
      </div>

      <Card className="mt-4 p-6">
        {current.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Mascot size={90} mood="think" />
            <p className="mt-3 font-display text-xl font-extrabold">{tab === "due" ? "لا توجد آيات مستحقّة الآن" : "لا توجد آيات هنا بعد"}</p>
            <p className="mt-1 text-ink-500">{all.length ? "أحسنت! يمكنك مراجعة سورةٍ سابقة أو حفظ آية جديدة." : "ابدأ بحفظ أول آية، وستظهر هنا للمراجعة."}</p>
            <LinkButton href="/memorize" className="mt-5">إلى مركز الحفظ</LinkButton>
          </div>
        ) : tab === "surahs" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {bySurah.map(([s, items]) => {
              const total = surahMeta(s).verses;
              return (
                <div key={s} className="rounded-3xl bg-cream-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-lg font-extrabold">سورة {surahMeta(s).name}</div>
                    <Chip className="bg-white text-ink-500">
                      {toArabicDigits(items.length)}/{toArabicDigits(total)}
                    </Chip>
                  </div>
                  <ProgressBar value={items.length / total} tone="sky" className="mt-3" />
                  <Button size="sm" tone="sky" className="mt-3 w-full" onClick={() => setSession(items)}>
                    <IconRefresh size={18} /> راجع السورة
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <SectionTitle title={tabs.find((t) => t[0] === tab)![1]} hint={`${toArabicDigits(current.length)} آيات`} action={<Button tone="sky" onClick={() => setSession(current)}><IconRefresh size={18} /> ابدأ المراجعة</Button>} />
            <ul className="divide-y divide-cream-200">
              {current.map((x) => (
                <li key={`${x.surah}:${x.ayah}`} className="flex items-center gap-3 py-3">
                  <span className="font-display font-bold">سورة {surahMeta(x.surah).name}</span>
                  <span className="text-ink-500">الآية {toArabicDigits(x.ayah)}</span>
                  <Chip className={`mr-auto ${STATE_COLOR[x.v.state]}`}>{STATE_LABEL[x.v.state]}</Chip>
                  <span className="hidden items-center gap-1 text-xs text-ink-500 sm:flex">
                    <IconCalendar size={14} /> {x.v.due}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </AppShell>
  );
}

function ReviewSession({ items, onExit }: { items: Item[]; onExit: () => void }) {
  const ids = useMemo(() => [...new Set(items.map((i) => i.surah))], [items]);
  const surahs = useSurahs(ids);
  const player = useRecitation();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);
  const item = items[i];
  const text = surahs[item.surah]?.verses[item.ayah - 1]?.text;

  const rate = (r: Rating) => {
    actions.rateVerse(item.surah, item.ayah, r);
    player.stop();
    if (i + 1 < items.length) {
      setI(i + 1);
      setShown(false);
    } else {
      actions.addStars(Math.max(3, Math.ceil(items.length / 2)), { kind: "revise", label: `مراجعة ${toArabicDigits(items.length)} آيات` });
      setDone(true);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={onExit} className="mb-4 rounded-2xl bg-white/80 px-4 py-2 text-sm font-bold text-ink-700">→ رجوع</button>
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ProgressBar value={i / items.length} tone="sky" className="flex-1" />
          <span className="font-display font-bold text-ink-500">
            {toArabicDigits(i + 1)}/{toArabicDigits(items.length)}
          </span>
        </div>
        <div className="mt-6 text-center">
          <Chip className="bg-cream-100 text-ink-700">
            سورة {surahMeta(item.surah).name} · الآية {toArabicDigits(item.ayah)}
          </Chip>
          <p className="mt-3 text-ink-500">{shown ? "هل قرأتَها كما هي؟" : "سمّع الآية من حفظك، ثم اكشفها لتتحقّق."}</p>
        </div>
        <motion.div key={`${i}${shown}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 min-h-32 text-center text-3xl sm:text-4xl">
          {text ? (
            <>
              <VerseText text={text} hidden={shown ? [] : text.split(" ").map((_, k) => k)} />
              <AyahMark n={item.ayah} />
            </>
          ) : (
            <span className="inline-block h-12 w-2/3 animate-pulse rounded-xl bg-cream-200" />
          )}
        </motion.div>
        {!shown ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => setShown(true)}>
              <IconEye size={20} /> اكشف الآية
            </Button>
            <Button size="lg" tone="white" onClick={() => player.play({ surah: item.surah, from: item.ayah, to: item.ayah, repeatEach: 1, repeatGroup: 1 })}>
              <IconPlay size={20} /> استمع
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Button tone="coral" onClick={() => rate("again")}>نسيتُ بعضها</Button>
            <Button tone="sky" onClick={() => rate("good")}>تذكّرتُها</Button>
            <Button tone="mint" onClick={() => rate("easy")}>بسهولة</Button>
          </div>
        )}
        {player.error && <p className="mt-3 text-center text-sm font-bold text-coral-500">{player.error}</p>}
      </Card>
      <Celebrate open={done} onClose={onExit} title="بطل المراجعة!" message="أتممتَ المراجعة، وحُدّدت مواعيد المراجعة القادمة تلقائيًا." />
    </div>
  );
}
