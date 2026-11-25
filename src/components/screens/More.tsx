import { Link } from "@/components/shell/Link";
import { motion } from "framer-motion";
import { MagdyImage } from "@/components/art/Magdy";
import { IconAlarm, IconBook, IconShield, IconCalendar, IconFamily, IconFlame, IconLantern, IconMap, IconPuzzle, IconRefresh, IconSparkle, IconStar, IconStories, IconVolume } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui";
import { toArabicDigits } from "@/lib/quran";
import { useChild, useProgress } from "@/lib/store";

const ITEMS = [
  { href: "/certificates", title: "شهاداتي", text: "شهادات تقدير باسمك تطبعها أو ترسلها", icon: IconStar, tone: "from-sun-300 to-sun-500 text-ink-900", hero: true },
  { href: "/adhkar", title: "الأذكار والأدعية", text: "أذكار الصباح والمساء وأدعية كلّ يوم", icon: IconSparkle, tone: "from-teal-400 to-teal-600 text-white" },
  { href: "/recite", title: "تلاوتي", text: "سجّل قراءتك وقارنها بالقارئ", icon: IconVolume, tone: "from-coral-400 to-coral-500 text-white" },
  { href: "/challenges", title: "التحديات", text: "الكهف يوم الجمعة، وختمة رمضان", icon: IconFlame, tone: "from-lilac-400 to-lilac-600 text-white" },
  { href: "/quran", title: "المصحف ومعاني الآيات", text: "اقرأ واستمع، واعرف معنى كلّ آية", icon: IconBook, tone: "from-sky-400 to-sky-500 text-white" },
  { href: "/tajweed", title: "أكاديمية التجويد", text: "دروسٌ بالألوان وتمارين", icon: IconLantern, tone: "from-lilac-500 to-lilac-600 text-white" },
  { href: "/journey", title: "خريطة الرحلة", text: "محطات جزء عمّ", icon: IconMap, tone: "from-mint-400 to-mint-600 text-white" },
  { href: "/revision", title: "المراجعة", text: "ثبّت ما حفظته", icon: IconRefresh, tone: "from-sky-300 to-sky-500 text-white" },
  { href: "/play", title: "العب وتعلّم", text: "ستّ ألعاب تعليمية", icon: IconPuzzle, tone: "from-sun-400 to-sun-500 text-ink-900" },
  { href: "/stories", title: "حكايات رِفق", text: "قصصٌ قصيرة تزرع القيم", icon: IconStories, tone: "from-coral-300 to-coral-500 text-white" },
  { href: "/fajr", title: "منبّه الفجر", text: "يوقظك للفجر ولا يسكت حتى تستيقظ", icon: IconAlarm, tone: "from-[#27407a] to-teal-600 text-white" },
  { href: "/app", title: "التذكير وبياناتك", text: "تذكيرٌ يوميّ بوِردك، وبيانات هاتفك", icon: IconCalendar, tone: "from-teal-300 to-sky-500 text-white" },
  { href: "/login", title: "الحساب", text: "مزامنة التقدّم بين الأجهزة (اختياري)", icon: IconShield, tone: "from-sky-500 to-teal-700 text-white" },
  { href: "/family", title: "لوحة العائلة", text: "تابع تقدّم أبنائك", icon: IconFamily, tone: "from-ink-500 to-ink-700 text-white" },
];

export function More() {
  const { data } = useChild();
  const mode = useProgress((s) => s.mode);
  const certs = Object.keys(data.certificates ?? {}).length;
  return (
    <AppShell>
      <h1 className="font-display text-4xl font-extrabold">كلّ ما في رِفق</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ITEMS.filter((i) => mode === "adult" || i.href !== "/family").map((it, i) => (
          <motion.div key={it.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={it.hero ? "col-span-2" : ""}>
            <Link href={it.href} className="block h-full">
              <div className={`relative h-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-5 shadow-soft transition hover:-translate-y-1 ${it.tone}`}>
                <it.icon size={30} />
                <div className="mt-3 font-display text-xl font-extrabold">{it.title}</div>
                <div className="text-sm opacity-85">{it.text}</div>
                {it.hero && (
                  <>
                    <div className="mt-2 font-display font-bold">{toArabicDigits(certs)} شهادة حتى الآن</div>
                    <MagdyImage size={150} className="absolute -bottom-3 left-3 hidden drop-shadow-lg sm:block" />
                  </>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <Link href="/magdy" className="mt-6 block">
        <Card className="flex items-center gap-4 p-4">
          <MagdyImage size={90} />
          <div>
            <div className="font-display text-xl font-extrabold">عن بابا مجدي</div>
            <div className="text-sm text-ink-500">رِفق صدقةٌ جارية — ادعُ له وشارك التطبيق</div>
          </div>
        </Card>
      </Link>
      <div className="mt-3 flex justify-center gap-4 text-sm font-bold text-ink-500">
        <Link href="/sources" className="underline-offset-4 hover:underline">
          المصادر والتراخيص
        </Link>
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          سياسة الخصوصية
        </Link>
      </div>
    </AppShell>
  );
}
