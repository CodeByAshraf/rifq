import { Link } from "@/components/shell/Link";
import { IconBook, IconCalendar, IconChart, IconFlame, IconHeadphones, IconRefresh, IconSprout } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Card, LinkButton, ProgressBar, Ring, SectionTitle } from "@/components/ui";
import { dueVerses, learnedTotal, nextVerseToLearn, relativeDay } from "@/lib/learning";
import { SURAHS, surahMeta, toArabicDigits } from "@/lib/quran";
import { actions, streak, surahProgress, useChild } from "@/lib/store";
import { localDay } from "@/lib/dates";

const TOTAL = 6236;
const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function AdultDashboard() {
  const { child, data } = useChild();
  const learned = learnedTotal(data.verses);
  const mastered = Object.values(data.verses).filter((v) => v.state === "mastered" || v.state === "good").length;
  const due = dueVerses(data.verses);
  const s = streak(data.activeDays);
  const daily = child.dailyVerses ?? 3;
  const next = nextVerseToLearn(data.verses);

  // Revision forecast for the next 7 days.
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = localDay(d);
    const n = Object.values(data.verses).filter((v) => v.state !== "not_started" && (i === 0 ? v.due <= iso : v.due === iso)).length;
    return { label: i === 0 ? "اليوم" : DAY_NAMES[d.getDay()], n };
  });
  const maxF = Math.max(1, ...forecast.map((f) => f.n));

  // Last 14 days activity.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return data.activeDays.includes(localDay(d));
  });

  const inProgress = SURAHS.map((m) => ({ m, p: surahProgress(data.verses, m.id, m.verses) }))
    .filter((x) => x.p.learned > 0)
    .sort((a, b) => b.p.pct - a.p.pct)
    .slice(0, 6);

  const remaining = TOTAL - learned;
  const daysToFinish = Math.ceil(remaining / Math.max(1, daily));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-teal-600">السلام عليكم</p>
          <h1 className="font-display text-4xl font-extrabold">لوحة المتعلّم</h1>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/quran" tone="white">
            <IconBook size={18} /> المصحف
          </LinkButton>
          <LinkButton href="/memorize">
            <IconSprout size={18} /> تابع الحفظ
          </LinkButton>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "آيات محفوظة", v: learned, icon: IconSprout, sub: `${toArabicDigits(((learned / TOTAL) * 100).toFixed(1))}٪ من القرآن` },
          { l: "جيدة أو متقنة", v: mastered, icon: IconChart, sub: "ثابتة في الذاكرة" },
          { l: "مستحقّة للمراجعة", v: due.length, icon: IconRefresh, sub: "اليوم" },
          { l: "أيام متتالية", v: s, icon: IconFlame, sub: "استمرارية" },
        ].map((x) => (
          <div key={x.l} className="rounded-3xl border border-ink-300/25 bg-white p-5">
            <div className="flex items-center justify-between text-ink-500">
              <span className="text-sm font-bold">{x.l}</span>
              <x.icon size={20} />
            </div>
            <div className="mt-2 font-display text-4xl font-extrabold">{x.v.toLocaleString("ar-EG")}</div>
            <div className="text-xs text-ink-500">{x.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-ink-300/25 bg-white p-6 lg:col-span-2">
          <SectionTitle title="خطّة الحفظ" hint="اضبط وِردك اليومي، ونقترح عليك الآية التالية" />
          <div className="flex flex-wrap items-center gap-6">
            <Ring value={learned / TOTAL} size={120} stroke={12} color="#12968b">
              <div className="text-center">
                <div className="font-display text-xl font-extrabold">{toArabicDigits(learned)}</div>
                <div className="text-[11px] text-ink-500">من {toArabicDigits(TOTAL)}</div>
              </div>
            </Ring>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink-700">آيات جديدة يوميًا:</span>
                {[1, 3, 5, 10].map((n) => (
                  <button key={n} onClick={() => actions.updateChildProfile(child.id, { dailyVerses: n })} className={`h-9 min-w-9 rounded-xl px-3 font-display font-bold ${daily === n ? "bg-ink-900 text-white" : "bg-cream-100"}`}>
                    {toArabicDigits(n)}
                  </button>
                ))}
              </div>
              <p className="text-sm text-ink-500">
                بهذا المعدّل تُتمّ الحفظ خلال نحو {toArabicDigits(Math.round(daysToFinish / 30))} شهرًا تقريبًا، مع المراجعة المنتظمة.
              </p>
              <Link href="/memorize" onClick={() => actions.setFocus(next.surah, next.ayah)} className="flex items-center justify-between rounded-2xl bg-teal-50 p-4 transition hover:bg-teal-100">
                <div>
                  <div className="text-xs font-bold text-teal-600">الآية التالية في خطتك</div>
                  <div className="font-display text-lg font-extrabold">
                    سورة {surahMeta(next.surah).name} · الآية {toArabicDigits(next.ayah)}
                  </div>
                </div>
                <IconSprout className="text-teal-600" />
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-ink-300/25 bg-white p-6">
          <SectionTitle title="جدول المراجعة" hint="الأيام السبعة القادمة" />
          <div className="flex h-40 items-end gap-2">
            {forecast.map((f, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold text-ink-500">{toArabicDigits(f.n)}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-teal-600 to-teal-300" style={{ height: `${Math.max(4, (f.n / maxF) * 110)}px`, opacity: f.n ? 1 : 0.25 }} />
                <span className="text-[10px] font-bold text-ink-500">{f.label}</span>
              </div>
            ))}
          </div>
          <LinkButton href="/revision" tone="white" size="sm" className="mt-4 w-full">
            <IconCalendar size={16} /> افتح المراجعة
          </LinkButton>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-ink-300/25 bg-white p-6 lg:col-span-2">
          <SectionTitle title="تقدّم السور" />
          {inProgress.length === 0 ? (
            <p className="text-ink-500">لم تبدأ حفظ أيّ سورة بعد.</p>
          ) : (
            <div className="space-y-4">
              {inProgress.map(({ m, p }) => (
                <div key={m.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-display font-bold">سورة {m.name}</span>
                    <span className="text-ink-500">
                      {toArabicDigits(p.learned)}/{toArabicDigits(p.total)}
                    </span>
                  </div>
                  <ProgressBar value={p.pct} tone="teal" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-ink-300/25 bg-white p-6">
          <SectionTitle title="الانتظام" hint="آخر أسبوعين" />
          <div className="grid grid-cols-7 gap-2">
            {days.map((on, i) => (
              <div key={i} className={`aspect-square rounded-xl ${on ? "bg-teal-500" : "bg-cream-200"}`} />
            ))}
          </div>
          <h3 className="mt-6 font-display font-extrabold">آخر النشاطات</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {data.activity.slice(0, 4).map((a, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate">{a.label}</span>
                <span className="shrink-0 text-ink-500">{relativeDay(a.at)}</span>
              </li>
            ))}
            {data.activity.length === 0 && <li className="text-ink-500">لا توجد نشاطات بعد.</li>}
          </ul>
        </div>
      </div>

      <Card className="mt-6 flex flex-wrap items-center gap-4 p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-500">
          <IconHeadphones />
        </span>
        <div className="flex-1">
          <div className="font-display text-lg font-extrabold">أدوات الاستماع والتكرار</div>
          <p className="text-sm text-ink-500">كرّر الآية أو مجموعة آيات بعددٍ تختاره، واختر القارئ، وتابع الآية المقروءة مظلّلة.</p>
        </div>
        <LinkButton href="/quran" tone="sky">افتح المصحف</LinkButton>
      </Card>
    </AppShell>
  );
}
