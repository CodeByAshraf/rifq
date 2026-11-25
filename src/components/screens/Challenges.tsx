import { useRouter } from "@/lib/router";
import type { ReactNode } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconBook, IconCalendar, IconCheck, IconFlame, IconLock, IconMap, IconStar } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, Chip, LinkButton, ProgressBar } from "@/components/ui";
import { JUZ_START, KAHF_PARTS } from "@/data/juz";
import { daysUntilHijriMonth, fridayKey, toHijri } from "@/lib/hijri";
import { surahMeta, toArabicDigits } from "@/lib/quran";
import { actions, streak, surahProgress, today, useChild } from "@/lib/store";

function ChallengeCard({ tone, title, subtitle, status, children }: { tone: string; title: string; subtitle: string; status: ReactNode; children: ReactNode }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className={`flex flex-wrap items-center gap-3 bg-gradient-to-l ${tone} p-5 text-white`}>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <p className="text-sm text-white/85">{subtitle}</p>
        </div>
        {status}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function Challenges() {
  const router = useRouter();
  const { data } = useChild();
  const h = toHijri();
  const friday = fridayKey();
  const kahfDone = friday ? data.challenges?.kahf?.[friday] ?? [] : [];
  const kahfFridays = Object.values(data.challenges?.kahf ?? {}).filter((p) => p.length >= 10).length;
  const daysToFriday = (5 - new Date().getDay() + 7) % 7;

  const isRamadan = h.month === 9;
  const ramadanKey = String(h.year);
  const juzDone = data.challenges?.ramadan?.[ramadanKey] ?? [];

  const isDhul = h.month === 12 && h.day <= 10;
  const dhulDays = data.challenges?.dhul?.[String(h.year)] ?? [];
  const dhulToday = dhulDays.includes(today());

  const juzAmma = Array.from({ length: 37 }, (_, i) => 78 + i);
  const juzAmmaDone = juzAmma.filter((s) => surahProgress(data.verses, s, surahMeta(s).verses).learned === surahMeta(s).verses).length;
  const s = streak(data.activeDays);

  const read = (surah: number, ayah: number) => {
    actions.setFocus(surah, ayah);
    router.push("/quran");
  };

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-lilac-500 to-sky-500 p-7 text-white shadow-lift sm:p-9">
        <div className="pattern-girih absolute inset-0 opacity-50 mix-blend-overlay" />
        <div className="relative flex items-center gap-5">
          <MagdyImage size={140} className="hidden shrink-0 drop-shadow-xl sm:block" />
          <div>
            <h1 className="font-display text-4xl font-extrabold">التحديات</h1>
            <p className="mt-2 max-w-lg text-white/85">تحدّيات في المواسم المباركة وكلّ أسبوع. أتمّها واحصل على نجوم وشهادات تقدير.</p>
            <Chip className="mt-3 bg-white/20 text-white">
              <IconCalendar size={14} /> {toArabicDigits(h.day)} {h.monthName} {toArabicDigits(h.year)} هـ
            </Chip>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Friday: Al-Kahf */}
        <ChallengeCard
          tone="from-teal-500 to-teal-700"
          title="تحدّي الجمعة: سورة الكهف"
          subtitle="اقرأ سورة الكهف يوم الجمعة، مقسّمةً إلى عشرة أجزاء قصيرة."
          status={
            friday ? (
              <Chip className="bg-white text-teal-700">
                {toArabicDigits(kahfDone.length)}/١٠
              </Chip>
            ) : (
              <Chip className="bg-white/20 text-white">
                <IconLock size={14} /> بعد {toArabicDigits(daysToFriday)} {daysToFriday === 1 ? "يوم" : "أيام"}
              </Chip>
            )
          }
        >
          {friday && <ProgressBar value={kahfDone.length / 10} tone="mint" className="mb-4" />}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {KAHF_PARTS.map(([a, b], i) => {
              const done = kahfDone.includes(i);
              return (
                <div key={i} className={`rounded-2xl p-3 text-center ${done ? "bg-mint-100" : "bg-cream-100"}`}>
                  <div className="font-display text-sm font-extrabold">الجزء {toArabicDigits(i + 1)}</div>
                  <div className="text-xs text-ink-500">
                    الآيات {toArabicDigits(a)}–{toArabicDigits(b)}
                  </div>
                  <div className="mt-2 flex justify-center gap-1">
                    <button onClick={() => read(18, a)} className="rounded-xl bg-white px-2 py-1 text-xs font-bold text-teal-700">
                      اقرأ
                    </button>
                    {friday && (
                      <button onClick={() => actions.toggleChallenge("kahf", friday, i)} className={`grid h-7 w-7 place-items-center rounded-xl ${done ? "bg-mint-500 text-white" : "bg-white text-ink-300"}`} aria-label={done ? "إلغاء" : "قرأته"} aria-pressed={done}>
                        <IconCheck size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-500">أتممتَ سورة الكهف في {toArabicDigits(kahfFridays)} جمعة.</p>
        </ChallengeCard>

        {/* Ramadan */}
        <ChallengeCard
          tone="from-sun-500 to-sun-600"
          title="تحدّي رمضان: ختمة الشهر"
          subtitle="جزءٌ واحد كلّ يوم، فتختم القرآن الكريم في رمضان."
          status={
            isRamadan ? (
              <Chip className="bg-white text-sun-600">{toArabicDigits(juzDone.length)}/٣٠</Chip>
            ) : (
              <Chip className="bg-white/20 text-white">
                <IconLock size={14} /> يبدأ بعد نحو {toArabicDigits(daysUntilHijriMonth(9))} يومًا
              </Chip>
            )
          }
        >
          {isRamadan && <ProgressBar value={juzDone.length / 30} tone="sun" className="mb-4" />}
          <div className={`grid grid-cols-5 gap-2 sm:grid-cols-10 ${isRamadan ? "" : "opacity-50"}`}>
            {JUZ_START.map(([s0], i) => {
              const n = i + 1;
              const done = juzDone.includes(n);
              return (
                <button
                  key={n}
                  disabled={!isRamadan}
                  onClick={() => actions.toggleChallenge("ramadan", ramadanKey, n)}
                  className={`aspect-square rounded-2xl font-display text-lg font-extrabold ${done ? "bg-sun-400 text-white" : "bg-cream-100 text-ink-700"}`}
                  title={`الجزء ${n} — يبدأ من سورة ${surahMeta(s0).name}`}
                  aria-pressed={done}
                >
                  {done ? <IconCheck size={18} className="mx-auto" /> : toArabicDigits(n)}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="text-sm font-bold text-ink-500" htmlFor="juz-open">افتح جزءًا في المصحف:</label>
            <select id="juz-open" defaultValue="" onChange={(e) => { const n = Number(e.target.value); if (n) read(JUZ_START[n - 1][0], JUZ_START[n - 1][1]); }} className="h-10 rounded-2xl bg-cream-100 px-3 font-display font-bold">
              <option value="" disabled>اختر الجزء</option>
              {JUZ_START.map(([s0], i) => (
                <option key={i} value={i + 1}>الجزء {toArabicDigits(i + 1)} — سورة {surahMeta(s0).name}</option>
              ))}
            </select>
          </div>
          {isRamadan && <p className="mt-2 text-xs text-ink-500">اضغط على رقم الجزء بعد قراءته ليُسجَّل.</p>}
        </ChallengeCard>

        {/* Dhul-Hijjah */}
        <ChallengeCard
          tone="from-mint-500 to-mint-600"
          title="العشر الأوائل من ذي الحجّة"
          subtitle="أيامٌ مباركة: حافظ فيها كلّ يوم على وِردك وأذكارك."
          status={
            isDhul ? (
              <Chip className="bg-white text-mint-600">{toArabicDigits(dhulDays.length)}/١٠</Chip>
            ) : (
              <Chip className="bg-white/20 text-white">
                <IconLock size={14} /> بعد نحو {toArabicDigits(daysUntilHijriMonth(12))} يومًا
              </Chip>
            )
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button tone="mint" disabled={!isDhul || dhulToday} onClick={() => actions.markDhulDay(String(h.year))}>
              <IconCheck size={18} /> {dhulToday ? "سُجّل يومك" : "أتممتُ وِردي وأذكاري اليوم"}
            </Button>
            <LinkButton href="/adhkar" tone="white" size="sm">
              الأذكار
            </LinkButton>
          </div>
        </ChallengeCard>

        {/* Always-on */}
        <div className="grid gap-6 md:grid-cols-2">
          <ChallengeCard
            tone="from-sky-400 to-sky-500"
            title="تحدّي جزء عمّ"
            subtitle="احفظ سور جزء عمّ كلّها، سورةً بعد سورة."
            status={<Chip className="bg-white text-sky-500">{toArabicDigits(juzAmmaDone)}/٣٧</Chip>}
          >
            <ProgressBar value={juzAmmaDone / 37} tone="sky" />
            <LinkButton href="/journey" tone="white" size="sm" className="mt-4">
              <IconMap size={16} /> خريطة الرحلة
            </LinkButton>
          </ChallengeCard>
          <ChallengeCard
            tone="from-coral-400 to-coral-500"
            title="سبعة أيام متتالية"
            subtitle="تعلّم كلّ يوم ولو قليلًا."
            status={
              <Chip className="bg-white text-coral-500">
                <IconFlame size={14} /> {toArabicDigits(Math.min(s, 7))}/٧
              </Chip>
            }
          >
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`grid aspect-square place-items-center rounded-xl ${i < s ? "bg-coral-400 text-white" : "bg-cream-100 text-ink-300"}`}>
                  {i < s ? <IconStar filled size={16} /> : toArabicDigits(i + 1)}
                </div>
              ))}
            </div>
            <LinkButton href="/memorize" tone="white" size="sm" className="mt-4">
              <IconBook size={16} /> تعلّم اليوم
            </LinkButton>
          </ChallengeCard>
        </div>
      </div>
    </AppShell>
  );
}
