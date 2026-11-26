import { useRouter } from "@/lib/router";
import { useState } from "react";
import { Character } from "@/components/art/Character";
import { IconCheck, IconFamily, IconShield } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Chip, ProgressBar, SectionTitle } from "@/components/ui";
import { LESSONS } from "@/data/tajweed";
import { learnedTotal, relativeDay } from "@/lib/learning";
import { SURAHS, toArabicDigits } from "@/lib/quran";
import { actions, streak, surahProgress, useProgress } from "@/lib/store";
import { localDay } from "@/lib/dates";

export function Family() {
  const router = useRouter();
  const children = useProgress((s) => s.children);
  const all = useProgress((s) => s.data);
  const activeId = useProgress((s) => s.activeChildId);
  const [sel, setSel] = useState(activeId);
  const [name, setName] = useState("");
  const child = children.find((c) => c.id === sel) ?? children[0];
  const d = all[child.id];

  const week = Array.from({ length: 7 }, (_, i) => {
    const x = new Date();
    x.setDate(x.getDate() - (6 - i));
    return d.activeDays.includes(localDay(x));
  });
  const activeThisWeek = week.filter(Boolean).length;
  const goal = child.weeklyDaysGoal ?? 5;
  const completedSurahs = SURAHS.filter((m) => surahProgress(d.verses, m.id, m.verses).learned === m.verses);
  const revisions = d.activity.filter((a) => a.kind === "revise");

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-teal-600">لوحة العائلة</p>
          <h1 className="font-display text-4xl font-extrabold">متابعة أبنائي</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-3">
          {children.map((c) => (
            <button key={c.id} onClick={() => setSel(c.id)} className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-right transition ${c.id === sel ? "border-teal-400 bg-teal-50" : "border-ink-300/25 bg-white"}`}>
              <div className="h-12 w-12 overflow-hidden rounded-full bg-sky-100">
                <Character avatar={c.avatar} size={48} />
              </div>
              <div className="flex-1">
                <div className="font-display font-extrabold">{c.name}</div>
                <div className="text-xs text-ink-500">{toArabicDigits(learnedTotal(all[c.id].verses))} آية محفوظة</div>
              </div>
              {c.id === activeId && <Chip className="bg-mint-100 text-mint-600">نشط</Chip>}
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                actions.addChild(name.trim());
                setName("");
              }
            }}
            className="rounded-3xl border border-dashed border-ink-300/60 bg-white/70 p-3"
          >
            <label className="text-sm font-bold text-ink-700" htmlFor="child-name">إضافة طفل</label>
            <div className="mt-2 flex gap-2">
              <input id="child-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="الاسم الأول فقط" className="h-10 min-w-0 flex-1 rounded-2xl bg-cream-100 px-3 text-sm outline-none focus:ring-2 focus:ring-teal-300" />
              <Button size="sm" type="submit">إضافة</Button>
            </div>
          </form>
          <div className="flex gap-2 rounded-3xl bg-white p-4 text-xs leading-relaxed text-ink-500">
            <IconShield size={18} className="shrink-0 text-teal-600" />
            لا يحتاج الطفل بريدًا ولا كلمة مرور. ملفّه تابعٌ لحساب وليّ الأمر، ولا يظهر لأيّ مستخدمٍ آخر.
          </div>
        </aside>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-ink-300/25 bg-white p-6">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-b from-sky-200 to-mint-100">
              <Character avatar={child.avatar} size={80} />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-extrabold">{child.name}</h2>
              <p className="text-sm text-ink-500">
                {toArabicDigits(d.stars)} نجمة · {toArabicDigits(streak(d.activeDays))} أيام متتالية · {toArabicDigits(Object.keys(d.badges).length)} أوسمة
              </p>
            </div>
            <Button
              onClick={() => {
                actions.setActiveChild(child.id);
                router.push("/kids");
              }}
            >
              <IconFamily size={18} /> افتح عالم {child.name}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-ink-300/25 bg-white p-6">
              <SectionTitle title="الهدف الأسبوعي" hint="عدد أيام التعلّم في الأسبوع" />
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7].map((n) => (
                  <button key={n} onClick={() => actions.updateChildProfile(child.id, { weeklyDaysGoal: n })} className={`h-10 w-10 rounded-xl font-display font-bold ${goal === n ? "bg-ink-900 text-white" : "bg-cream-100"}`}>
                    {toArabicDigits(n)}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {week.map((on, i) => (
                  <div key={i} className={`grid aspect-square place-items-center rounded-xl ${on ? "bg-mint-500 text-white" : "bg-cream-200"}`}>{on && <IconCheck size={16} />}</div>
                ))}
              </div>
              <ProgressBar value={activeThisWeek / goal} tone="mint" className="mt-4" />
              <p className="mt-2 text-sm text-ink-500">
                {toArabicDigits(activeThisWeek)} من {toArabicDigits(goal)} أيام هذا الأسبوع
              </p>
            </div>

            <div className="rounded-3xl border border-ink-300/25 bg-white p-6">
              <SectionTitle title="السور المحفوظة" />
              {completedSurahs.length === 0 ? (
                <p className="text-ink-500">لم تكتمل سورة بعد.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {completedSurahs.map((m) => (
                    <Chip key={m.id} className="bg-teal-100 text-teal-700">سورة {m.name}</Chip>
                  ))}
                </div>
              )}
              <h3 className="mt-6 font-display font-extrabold">دروس التجويد</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {LESSONS.map((l) => (
                  <li key={l.id} className="flex items-center justify-between">
                    <span>{l.title}</span>
                    {d.lessons[l.id] ? <Chip className="bg-mint-100 text-mint-600">مكتمل</Chip> : <span className="text-ink-300">لم يبدأ</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-ink-300/25 bg-white p-6">
            <SectionTitle title="نشاط المراجعة والتعلّم" />
            {d.activity.length === 0 ? (
              <p className="text-ink-500">لا يوجد نشاط مسجّل بعد.</p>
            ) : (
              <ul className="divide-y divide-cream-200 text-sm">
                {d.activity.slice(0, 10).map((a, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span>{a.label}</span>
                    <span className="text-ink-500">{relativeDay(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-500">جلسات المراجعة: {toArabicDigits(revisions.length)}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
