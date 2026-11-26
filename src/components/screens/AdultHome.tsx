import { IconAlarm, IconBook, IconSparkle } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Link } from "@/components/shell/Link";
import { juzOfPage, reader, surahOfPage, useReader } from "@/lib/mushaf";
import { useRouter } from "@/lib/router";
import { surahMeta, toArabicDigits } from "@/lib/quran";
import { useFajrSettings } from "@/lib/fajr/settings";
import { nextAlarm } from "@/lib/fajr/times";

const time = (d: Date) => toArabicDigits(d.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" }));

/** The adults' corner: the full Mushaf, the adhkar and the Fajr alarm, in a calm layout. */
export function AdultHome() {
  const router = useRouter();
  const { last, mark } = useReader();
  const fajr = useFajrSettings();
  const next = nextAlarm(fajr, new Date());
  const hour = new Date().getHours();
  const adhkarHint = hour < 12 ? "أذكار الصباح" : hour < 20 ? "أذكار المساء" : "أذكار النوم";

  const open = (p: number) => {
    reader.setLast(p);
    router.push("/mushaf");
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-extrabold text-ink-900">السلام عليكم</h1>
      <p className="mt-1 text-ink-500">المصحف كاملًا، والأذكار، ومنبّه الفجر.</p>

      <button onClick={() => open(last)} className="mt-5 block w-full overflow-hidden rounded-[1.4rem] bg-gradient-to-l from-teal-700 to-[#0a4f49] p-6 text-right text-white shadow-soft">
        <div className="flex items-center gap-2 text-sm font-bold text-teal-100">
          <IconBook size={18} /> تابع القراءة
        </div>
        <div className="mt-2 font-display text-2xl font-extrabold">سورة {surahMeta(surahOfPage(last)).name}</div>
        <div className="mt-1 text-sm text-teal-50">
          صفحة {toArabicDigits(last)} · الجزء {toArabicDigits(juzOfPage(last))}
        </div>
      </button>

      <div className="mt-3 rounded-[1.4rem] border border-ink-300/25 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-ink-500">
          <svg width="14" height="16" viewBox="0 0 16 18" aria-hidden className="text-sun-500">
            <path d="M2 1h12v16l-6-4-6 4z" fill="currentColor" />
          </svg>
          علامة التوقّف
        </div>
        {mark ? (
          <button onClick={() => open(mark.p)} className="mt-2 flex w-full items-center justify-between text-right">
            <span>
              <span className="block font-display text-lg font-extrabold">
                سورة {surahMeta(mark.s).name} · الآية {toArabicDigits(mark.a)}
              </span>
              <span className="block text-sm text-ink-500">صفحة {toArabicDigits(mark.p)}</span>
            </span>
            <span className="rounded-xl bg-cream-100 px-4 py-2 text-sm font-bold text-teal-700">افتح</span>
          </button>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-ink-500">اضغط «علامة» أعلى الصفحة، أو اضغط على آيةٍ واختر «علامة هنا»، لتعود إليها في أيّ وقت.</p>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link href="/adults-adhkar" className="flex items-center gap-4 rounded-[1.4rem] border border-ink-300/25 bg-white p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <IconSparkle size={24} />
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold">الأذكار</span>
            <span className="block text-sm text-ink-500">{adhkarHint}، وأدعية كلّ يوم</span>
          </span>
        </Link>
        <Link href="/adults-fajr" className="flex items-center gap-4 rounded-[1.4rem] border border-ink-300/25 bg-white p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8ecf7] text-[#27407a]">
            <IconAlarm size={24} />
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold">منبّه الفجر</span>
            <span className="block text-sm text-ink-500">{next ? `القادم ${time(next)}` : "غير مفعّل"}</span>
          </span>
        </Link>
      </div>
    </AppShell>
  );
}
