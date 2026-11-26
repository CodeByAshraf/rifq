import { Link } from "@/components/shell/Link";
import { useEffect, useMemo, useState } from "react";
import { IconAlarm, IconCheck, IconShield } from "@/components/art/Icons";
import { CHALLENGE_TITLES } from "@/components/fajr/WakeChallenges";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, SectionTitle } from "@/components/ui";
import { alarmPermissionState, applyPlan, cancelTest, openExactAlarmSettings, requestAlarmPermissions, scheduleTest, type PermissionResult } from "@/lib/fajr/alarm";
import { nearestCity } from "@/lib/fajr/locate";
import { CITIES, cityById, METHODS, type MethodId } from "@/lib/fajr/places";
import { challengesFor, updateSettings, useFajrSettings, type ChallengeId, type FajrSettings, type Level } from "@/lib/fajr/settings";
import { alarmTime, fajrTime, nextAlarm } from "@/lib/fajr/times";
import { isNative } from "@/lib/native";
import { toArabicDigits } from "@/lib/quran";

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const time = (d: Date | null) => (d ? toArabicDigits(d.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" })) : "—");
const dayName = (d: Date) => toArabicDigits(d.toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }));

/** Groups the city list by country for the <select>. */
const BY_COUNTRY = CITIES.reduce<Record<string, typeof CITIES>>((acc, c) => {
  (acc[c.country] ??= []).push(c);
  return acc;
}, {});

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-cream-100 p-4 font-bold">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 shrink-0 accent-teal-500" />
    </label>
  );
}

export function Fajr() {
  const s = useFajrSettings();
  const native = isNative();
  const [perm, setPerm] = useState<PermissionResult | null>(null);
  const [testMsg, setTestMsg] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (native) alarmPermissionState().then(setPerm).catch(() => {});
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, [native]);

  /** Every change re-plans the notifications so the phone always matches the screen. */
  const change = (patch: Partial<FajrSettings>) => {
    updateSettings(patch);
    if (native) applyPlan().catch(() => {});
  };

  const today = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const fajrToday = fajrTime(s, today);
  const next = nextAlarm(s, now);
  const placeName = s.place ? (s.place.kind === "city" ? cityById(s.place.id)?.name : `موقعك (قرب ${nearestCity(s.place).city.name})`) : null;

  const chooseCity = (id: string) => {
    const c = cityById(id);
    if (c) change({ place: { kind: "city", id }, method: c.method });
  };


  const toggleChallenge = (id: ChallengeId) => {
    const has = s.challenges.includes(id);
    const list = has ? s.challenges.filter((c) => c !== id) : [...s.challenges, id];
    if (list.length) change({ challenges: list });
  };

  const enable = async (on: boolean) => {
    if (!on) return change({ enabled: false });
    if (!s.place) return;
    if (native) {
      const p = await requestAlarmPermissions();
      setPerm(p);
      if (!p.notifications) return;
    }
    change({ enabled: true });
  };

  const fixExact = async () => {
    await openExactAlarmSettings();
    setPerm(await alarmPermissionState());
    applyPlan().catch(() => {});
  };

  const test = async () => {
    const p = await requestAlarmPermissions();
    setPerm(p);
    if (!p.notifications) return setTestMsg("فعّل الإشعارات لرِفق من إعدادات الهاتف أولًا.");
    await scheduleTest();
    setTestMsg("سيرنّ المنبّه بعد دقيقة. أغلق الشاشة وانتظره.");
  };

  const testPending = s.testAt !== null && s.testAt > now.getTime() - 20 * 60_000;

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-[#27407a] to-teal-600 p-7 text-white shadow-lift sm:p-9">
        <div className="pattern-girih absolute inset-0 opacity-40 mix-blend-overlay" />
        <div className="relative">
          <IconAlarm size={44} className="text-sun-300" />
          <h1 className="mt-2 font-display text-4xl font-extrabold">منبّه صلاة الفجر</h1>
          <p className="mt-2 max-w-lg text-white/85">يرنّ في وقت الفجر، ولا يسكت حتى يُحَلّ تحدٍّ يثبت الاستيقاظ فعلًا: ألعابٌ لطيفة للطفل، ومسائل وذاكرة للكبير.</p>
          {s.enabled && next && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 font-display font-bold">
              <IconCheck size={18} /> المنبّه القادم: {dayName(next)} — {time(next)}
            </div>
          )}
        </div>
      </div>

      {!native && (
        <Card className="mt-6 border-2 border-sun-300 p-5">
          <p className="font-bold text-ink-700">المنبّه يعمل في تطبيق رِفق على الهاتف (أندرويد وآيفون). هنا يمكنك معرفة وقت الفجر وتجربة التحدّيات.</p>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle title="مدينتك ووقت الفجر" />
          <select
            value={s.place?.kind === "city" ? s.place.id : ""}
            onChange={(e) => chooseCity(e.target.value)}
            aria-label="المدينة"
            className="h-12 w-full rounded-2xl bg-cream-100 px-4 font-bold"
          >
            <option value="">{s.place?.kind === "gps" ? "موقع محفوظ سابقًا — اختر مدينتك" : "اختر مدينتك"}</option>
            {Object.entries(BY_COUNTRY).map(([country, list]) => (
              <optgroup key={country} label={country}>
                {list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-2 text-sm font-bold text-ink-500">اختر أقرب مدينة إليك. لا يطلب رِفق موقع الهاتف.</p>

          {s.place && (
            <div className="mt-5 rounded-2xl bg-teal-50 p-4">
              <div className="text-sm font-bold text-teal-700">{placeName}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-bold text-ink-700">أذان الفجر اليوم</span>
                <span className="font-display text-3xl font-extrabold text-teal-700">{time(fajrToday)}</span>
              </div>
              {s.offset !== 0 && (
                <div className="mt-1 flex items-baseline justify-between text-sm">
                  <span className="text-ink-500">المنبّه</span>
                  <span className="font-bold">{time(alarmTime({ ...s, days: [true, true, true, true, true, true, true] }, today))}</span>
                </div>
              )}
            </div>
          )}

          <label className="mt-5 block text-sm font-bold text-ink-700">
            طريقة الحساب
            <select value={s.method} onChange={(e) => change({ method: e.target.value as MethodId })} className="mt-1 h-12 w-full rounded-2xl bg-cream-100 px-4 font-bold">
              {METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4">
            <div className="text-sm font-bold text-ink-700">موعد المنبّه</div>
            <div className="mt-1 flex items-center gap-2">
              <Button tone="white" size="sm" onClick={() => change({ offset: Math.max(-60, s.offset - 5) })} aria-label="قبل الأذان بخمس دقائق أكثر">
                −٥
              </Button>
              <div className="flex-1 rounded-2xl bg-cream-100 py-2 text-center font-bold">
                {s.offset === 0 ? "مع الأذان" : s.offset < 0 ? `قبل الأذان بـ ${toArabicDigits(-s.offset)} دقيقة` : `بعد الأذان بـ ${toArabicDigits(s.offset)} دقيقة`}
              </div>
              <Button tone="white" size="sm" onClick={() => change({ offset: Math.min(60, s.offset + 5) })} aria-label="بعد الأذان بخمس دقائق أكثر">
                +٥
              </Button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">قارن الوقت بأذان مسجدك، وغيّر طريقة الحساب إن اختلف.</p>
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle title="مَن سيستيقظ؟" hint="يُختار تحدٍّ واحد كلّ صباح، ولا يسكت المنبّه حتى يُحَلّ" />
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["kid", "adult"] as Level[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => change({ level: l, challenges: challengesFor(l) })}
                className={`h-12 rounded-2xl font-display font-bold ${s.level === l ? "bg-teal-500 text-white" : "bg-cream-100 text-ink-700"}`}
              >
                {l === "kid" ? "طفل" : "كبير"}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {challengesFor(s.level).map((c) => (
              <label key={c} className="flex items-center justify-between rounded-2xl bg-cream-100 p-3 font-bold">
                {CHALLENGE_TITLES[c]}
                <input type="checkbox" checked={s.challenges.includes(c)} onChange={() => toggleChallenge(c)} className="h-6 w-6 accent-teal-500" />
              </label>
            ))}
          </div>

          {s.level === "adult" && (
            <>
              <div className="mt-4 text-sm font-bold text-ink-700">الصعوبة</div>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => change({ difficulty: d })}
                    className={`h-11 rounded-2xl font-bold ${s.difficulty === d ? "bg-teal-500 text-white" : "bg-cream-100 text-ink-700"}`}
                  >
                    {d === 1 ? "سهل" : d === 2 ? "متوسّط" : "صعب"}
                  </button>
                ))}
              </div>
            </>
          )}

          <Link href="/fajr-wake" className="mt-5 block text-center text-sm font-bold text-teal-700 underline-offset-4 hover:underline">
            جرّب التحدّي الآن
          </Link>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <SectionTitle title="تشغيل المنبّه" />
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <button
              key={w}
              type="button"
              aria-pressed={s.days[i]}
              onClick={() => change({ days: s.days.map((d, j) => (j === i ? !d : d)) })}
              className={`h-11 rounded-xl text-xs font-bold ${s.days[i] ? "bg-teal-500 text-white" : "bg-cream-100 text-ink-500"}`}
            >
              {w.replace("ال", "")}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <Toggle label="سؤال «هل ما زلت مستيقظًا؟» بعد ٥ دقائق" checked={s.wakeCheck} onChange={(v) => change({ wakeCheck: v })} />
          {native ? (
            <Toggle label={s.place ? "تفعيل منبّه الفجر" : "اختر مدينتك أولًا"} checked={s.enabled} onChange={enable} />
          ) : null}
        </div>

        {native && perm && !perm.notifications && (s.enabled || testMsg) && (
          <p className="mt-3 text-sm font-bold text-coral-500">الإشعارات مرفوضة. فعّلها لرِفق من إعدادات الهاتف حتى يرنّ المنبّه.</p>
        )}
        {native && perm && perm.notifications && !perm.exact && (
          <div className="mt-3 rounded-2xl bg-sun-100 p-4">
            <p className="text-sm font-bold text-ink-700">ليرنّ المنبّه في الدقيقة نفسها، اسمح لرِفق بـ«المنبّهات والتذكيرات».</p>
            <Button tone="sun" size="sm" className="mt-2" onClick={fixExact}>
              فتح الإعداد
            </Button>
          </div>
        )}

        {native && (
          <div className="mt-5">
            {testPending ? (
              <Button tone="white" className="w-full" onClick={() => cancelTest().then(() => setTestMsg(""))}>
                إلغاء تجربة المنبّه
              </Button>
            ) : (
              <Button tone="lilac" className="w-full" onClick={test}>
                <IconAlarm size={20} /> جرّب المنبّه بعد دقيقة
              </Button>
            )}
            {testMsg && <p className="mt-2 text-sm font-bold text-teal-700">{testMsg}</p>}
          </div>
        )}

        <ul className="mt-5 list-inside list-disc space-y-1 text-xs leading-relaxed text-ink-500">
          <li>تأكّد أنّ الهاتف ليس على الوضع الصامت، وأنّ صوت الإشعارات مرتفع.</li>
          <li>يرنّ المنبّه كلّ {native && /iphone|ipad|ipod/i.test(navigator.userAgent) ? "دقيقة" : "٣٠ ثانية"} حتى تحلّ التحدّي داخل رِفق.</li>
          <li>افتح رِفق مرّةً كلّ بضعة أيام ليحسب مواعيد الفجر القادمة.</li>
        </ul>
      </Card>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
        <IconShield size={16} className="mt-0.5 shrink-0 text-teal-600" />
        يُحسب وقت الفجر على الهاتف دون إنترنت، ولا يطلب التطبيق موقع الهاتف.{" "}
        <Link href="/privacy" className="font-bold underline-offset-4 hover:underline">
          سياسة الخصوصية
        </Link>
      </p>
    </AppShell>
  );
}
