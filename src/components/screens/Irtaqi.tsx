import { motion } from "framer-motion";
import { Character } from "@/components/art/Character";
import { IconLock, IconStar } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Card, LinkButton, ProgressBar } from "@/components/ui";
import { learnedTotal } from "@/lib/learning";
import { IRTAQI_HADITH, ladder, STEPS } from "@/lib/motivation";
import { toArabicDigits } from "@/lib/quran";
import { useChild } from "@/lib/store";

/** «اقرأ وارتقِ»: each verse learned is a step up; real milestones carry a title. */
export function Irtaqi() {
  const { child, data } = useChild();
  const L = ladder(learnedTotal(data.verses));

  return (
    <AppShell>
      <Card className="overflow-hidden bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white">
        <p className="font-display text-lg font-bold text-teal-100">اقرأ وارتقِ</p>
        <p className="mt-2 font-display text-xl leading-loose">«{IRTAQI_HADITH.text}»</p>
        <p className="mt-1 text-sm text-teal-100">{IRTAQI_HADITH.source}</p>
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex items-center gap-4">
          <Character avatar={child.avatar} size={90} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink-500">لقبك الآن</div>
            <div className="font-display text-2xl font-extrabold text-teal-700">{L.title}</div>
            <div className="text-sm text-ink-500">
              {toArabicDigits(L.learned)} آية في رحلتك
            </div>
          </div>
        </div>
        {L.next ? (
          <>
            <ProgressBar value={L.pct} tone="sun" className="mt-4" label="التقدّم إلى الدرجة التالية" />
            <p className="mt-2 text-sm font-bold text-ink-500">
              باقي {toArabicDigits(L.toNext)} آية لتصل إلى «{L.next.title}»
            </p>
          </>
        ) : (
          <p className="mt-3 font-display text-lg font-bold text-mint-600">بلغتَ القمّة، ما شاء الله!</p>
        )}
        <LinkButton href="/memorize" className="mt-4 w-full">
          اصعد درجة: احفظ آية
        </LinkButton>
      </Card>

      {/* The ladder: top milestone first, so the child looks up. */}
      <div className="relative mx-auto mt-6 max-w-md pb-4">
        <div className="absolute bottom-4 right-[2.1rem] top-4 w-2 rounded-full bg-cream-200" aria-hidden />
        <ol className="relative space-y-3">
          {[...STEPS].reverse().map((s) => {
            const i = STEPS.indexOf(s);
            const reached = i <= L.level;
            const here = i === L.level;
            return (
              <motion.li
                key={s.at}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(0.5, (STEPS.length - i) * 0.03) }}
                className={`flex items-center gap-3 rounded-2xl p-3 ${here ? "bg-sun-100 ring-2 ring-sun-400" : reached ? "bg-mint-100" : "bg-white/70"}`}
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-sm font-extrabold ${reached ? "bg-mint-500 text-white" : "bg-cream-200 text-ink-300"}`}>
                  {reached ? <IconStar filled size={22} /> : <IconLock size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-display text-lg font-extrabold ${reached ? "text-ink-900" : "text-ink-300"}`}>{s.title}</span>
                  <span className="block text-xs font-bold text-ink-500">{toArabicDigits(s.at)} آية</span>
                </span>
                {here && <span className="rounded-xl bg-sun-400 px-2 py-1 text-xs font-extrabold text-ink-900">أنت هنا</span>}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </AppShell>
  );
}
