import { motion } from "framer-motion";
import { useState } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconPlay, IconStar } from "@/components/art/Icons";
import { AyahMark, VerseText } from "@/components/quran/VerseText";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card } from "@/components/ui";
import { playSfx } from "@/lib/fx";
import { useRecitation } from "@/lib/player";
import { surahMeta, toArabicDigits, useSurah } from "@/lib/quran";
import { actions, useProgress } from "@/lib/store";

/** Duas for parents from the Quran — rendered from the verified text. */
const QURAN_DUAS: [number, number][] = [
  [17, 24],
  [14, 41],
  [71, 28],
];

function QuranDua({ surah, ayah }: { surah: number; ayah: number }) {
  const { surah: s } = useSurah(surah);
  const player = useRecitation();
  const v = s?.verses[ayah - 1];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-ink-500">
          سورة {surahMeta(surah).name} · الآية {toArabicDigits(ayah)}
        </span>
        <button onClick={() => (player.playing ? player.stop() : player.play({ surah, from: ayah, to: ayah, repeatEach: 1, repeatGroup: 1 }))} className="flex items-center gap-1 rounded-xl bg-teal-100 px-3 py-1.5 text-sm font-bold text-teal-700">
          <IconPlay size={14} /> {player.playing ? "إيقاف" : "استمع"}
        </button>
      </div>
      <p className="mt-3 text-center text-3xl leading-[2.2]">
        {v ? (
          <>
            <VerseText text={v.text} />
            <AyahMark n={ayah} />
          </>
        ) : (
          <span className="inline-block h-10 w-2/3 animate-pulse rounded-xl bg-cream-200" />
        )}
      </p>
    </Card>
  );
}

export function Magdy() {
  const count = useProgress((s) => s.magdyDuas ?? 0);
  const [thanks, setThanks] = useState(false);

  const pray = () => {
    actions.prayForMagdy();
    playSfx("correct");
    setThanks(true);
    setTimeout(() => setThanks(false), 2500);
  };

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-sky-200 via-cream-100 to-cream-100 p-6 shadow-lift sm:p-10">
        <div className="pattern-girih absolute inset-0 opacity-40" />
        <div className="relative grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <MagdyImage size={320} className="drop-shadow-2xl" />
          </div>
          <div className="text-center sm:text-right">
            <p className="font-display text-lg font-bold text-teal-700">بابا مجدي</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight sm:text-5xl">صدقةٌ جارية</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-loose text-ink-700 sm:mx-0">
              رِفق أُنشئ صدقةً جاريةً عن الوالد <b className="text-teal-700">مجدي</b>. كلّ آيةٍ يحفظها طفلٌ هنا، وكلّ حرفٍ يُقرأ، وكلّ دعاءٍ يُقال، نرجو الله أن يجعله في ميزان حسناته.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Button size="lg" onClick={pray}>
                <IconStar filled size={20} /> دعوتُ له
              </Button>
            </div>
            <motion.p key={count} initial={{ scale: 1.2, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 text-sm font-bold text-ink-500">
              {thanks ? "تقبّل الله دعاءك، وجزاك خيرًا." : count ? `دعوتَ له ${toArabicDigits(count)} مرّة من هذا الجهاز.` : "اضغط «دعوتُ له» بعد أن تدعو له."}
            </motion.p>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-extrabold">ادعُ له</h2>
        <p className="mt-1 text-ink-500">دعاءٌ عامّ يصلح أن تدعو به:</p>
        <Card className="mt-4 p-6 text-center">
          <p className="font-display text-2xl font-bold leading-loose text-ink-900">اللهمّ اغفر له وارحمه، واجزه عنّا خير الجزاء، واجعل هذا العمل في ميزان حسناته، وارفع درجته.</p>
        </Card>
        <h3 className="mt-8 font-display text-xl font-extrabold">من أدعية القرآن الكريم للوالدين</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {QURAN_DUAS.map(([s, a]) => (
            <QuranDua key={`${s}:${a}`} surah={s} ayah={a} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
