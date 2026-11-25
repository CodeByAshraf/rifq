import { Link } from "@/components/shell/Link";
import { useState } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconCheck, IconShield } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, SectionTitle } from "@/components/ui";
import { isNative, setNativeDailyReminder, type ReminderResult } from "@/lib/native";
import { disableAlarm } from "@/lib/fajr/alarm";
import { clearRecordings } from "@/lib/recordings";
import { actions, useProgress } from "@/lib/store";

const DEFAULT_REMINDER = { time: "17:00", enabled: false };

export function AppSettings() {
  const saved = useProgress((s) => s.reminder);
  const reminder = saved ?? DEFAULT_REMINDER;
  const [time, setTime] = useState(reminder.time);
  const native = isNative();
  const [wipeStep, setWipeStep] = useState<0 | 1 | 2>(0);
  /** Erases everything RIFQ keeps on this device: progress, children, recordings, reminders, settings. */
  const wipeDevice = async () => {
    await clearRecordings().catch(() => {});
    if (native) await setNativeDailyReminder(time, false).catch(() => {});
    await disableAlarm().catch(() => {});
    actions.resetAll();
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("rifq.")) localStorage.removeItem(k);
    } catch {
      /* storage unavailable */
    }
    setWipeStep(2);
  };
  const [nativeState, setNativeState] = useState<ReminderResult | null>(null);
  const saveNative = async (enabled: boolean, at = time) => {
    const r = await setNativeDailyReminder(at, enabled);
    setNativeState(r);
    actions.setReminder({ time: at, enabled: r === "scheduled" });
  };

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-sky-400 to-teal-500 p-7 text-white shadow-lift sm:p-9">
        <div className="pattern-girih absolute inset-0 opacity-50 mix-blend-overlay" />
        <div className="relative flex items-center gap-5">
          <MagdyImage size={140} className="hidden shrink-0 drop-shadow-xl sm:block" />
          <div>
            <h1 className="font-display text-4xl font-extrabold">التذكير وبياناتك</h1>
            <p className="mt-2 max-w-lg text-white/85">اضبط تذكيرًا يوميًا بوِردك، وتحكّم في بيانات رِفق على هاتفك.</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <SectionTitle title="التذكير اليومي" hint="اختر الوقت الذي يناسبك لوِردك اليومي" />
          <label className="flex items-center gap-3 font-bold text-ink-700">
            الوقت
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} onBlur={() => reminder.enabled && saveNative(true)} className="h-12 rounded-2xl bg-cream-100 px-4 font-display text-lg" />
          </label>

          {native ? (
            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-2xl bg-cream-100 p-4 font-bold">
                إشعارٌ يوميّ في هذا الوقت
                <input
                  type="checkbox"
                  checked={reminder.enabled}
                  onChange={(e) => saveNative(e.target.checked)}
                  className="h-6 w-6 accent-teal-500"
                />
              </label>
              <p className="text-xs leading-relaxed text-ink-500">يصلك الإشعار كلّ يوم حتى لو كان التطبيق مغلقًا. غيّر الوقت ثمّ أعد التفعيل لتحديثه.</p>
              {nativeState === "denied" && (
                <p className="text-sm font-bold text-coral-500">الإشعارات مرفوضة. فعّلها لرِفق من إعدادات الهاتف ثمّ حاول مرّة أخرى.</p>
              )}
              {nativeState === "scheduled" && (
                <p className="flex items-center gap-1 text-sm font-bold text-mint-600">
                  <IconCheck size={16} /> سيذكّرك رِفق كلّ يوم الساعة {time}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-cream-100 p-4 text-sm font-bold text-ink-700">التذكير اليومي يعمل في تطبيق رِفق على الهاتف.</p>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <SectionTitle title="بياناتك على هذا الجهاز" hint="التقدّم والأطفال والتسجيلات والتذكير" />
        {wipeStep === 2 ? (
          <p className="font-bold text-mint-600">مُسحت كلّ بيانات رِفق من هذا الجهاز.</p>
        ) : wipeStep === 1 ? (
          <div>
            <p className="text-sm font-bold text-ink-700">سيُمسح كلّ التقدّم والأطفال والشهادات والتسجيلات من هذا الجهاز نهائيًا. (الحساب على الخادم، إن وُجد، لا يتأثّر.)</p>
            <div className="mt-3 flex gap-2">
              <Button tone="white" onClick={() => setWipeStep(0)}>
                إلغاء
              </Button>
              <button type="button" onClick={wipeDevice} className="h-12 flex-1 rounded-2xl bg-coral-500 font-display font-bold text-white">
                نعم، امسح كلّ شيء
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setWipeStep(1)} className="text-sm font-bold text-coral-500 underline-offset-4 hover:underline">
            مسح كلّ بيانات رِفق من هذا الجهاز
          </button>
        )}
      </Card>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
        <IconShield size={16} className="mt-0.5 shrink-0 text-teal-600" />
        لا يجمع رِفق أيّ بيانات للإعلانات. التذكير والتسجيلات والتقدّم محفوظة على جهازك.{" "}
        <Link href="/privacy" className="font-bold underline-offset-4 hover:underline">سياسة الخصوصية</Link>
      </p>
    </AppShell>
  );
}
