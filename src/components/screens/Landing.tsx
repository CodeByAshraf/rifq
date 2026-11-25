import { motion } from "framer-motion";
import { Link } from "@/components/shell/Link";
import { BadgeArt } from "@/components/art/BadgeArt";
import { Character } from "@/components/art/Character";
import { GameArt, Logo, type GameArtKind } from "@/components/art/GameArt";
import { HeroScene } from "@/components/art/HeroScene";
import { StoryScene } from "@/components/art/StoryScene";
import { STORIES } from "@/data/stories";
import { IconBook, IconCheck, IconEyeOff, IconFamily, IconHeadphones, IconRefresh, IconShield, IconSprout, IconStar } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { MagdyImage } from "@/components/art/Magdy";
import { DomeHouse, Palm, RoundTree } from "@/components/art/Scenery";
import { VerseText } from "@/components/quran/VerseText";
import { Card, LinkButton, ProgressBar } from "@/components/ui";
import { BADGES } from "@/data/badges";
import { RULE_STYLES } from "@/data/tajweed";
import { useSurah } from "@/lib/quran";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const GAMES: { kind: GameArtKind; title: string }[] = [
  { kind: "complete", title: "أكمل الآية" },
  { kind: "tajweed", title: "اكتشف الحكم" },
  { kind: "letters", title: "طابق الحروف" },
  { kind: "arrange", title: "رتّب الآيات" },
  { kind: "memory", title: "تحدّي الذاكرة" },
  { kind: "listen", title: "استمع واختر" },
];

export function Landing() {
  const { surah: falaq } = useSurah(113);

  return (
    <div className="overflow-hidden">
      {/* ---------- HERO ---------- */}
      <section className="sky-bg relative pb-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2">
            <Logo size={44} />
            <div>
              <div className="font-display text-2xl font-extrabold leading-none text-teal-700">رِفق</div>
              <div className="text-[11px] font-bold tracking-widest text-teal-600/80">RIFQ</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-bold text-ink-700 md:flex">
            <a href="#journey" className="hover:text-teal-600">الرحلة</a>
            <a href="#tajweed" className="hover:text-teal-600">التجويد</a>
            <a href="#memorize" className="hover:text-teal-600">الحفظ</a>
            <a href="#games" className="hover:text-teal-600">الألعاب</a>
            <a href="#stories" className="hover:text-teal-600">القصص</a>
            <a href="#family" className="hover:text-teal-600">للعائلة</a>
          </nav>
          <div className="flex gap-2">
            <LinkButton href="/login" tone="white" size="sm">تسجيل الدخول</LinkButton>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 pt-8 md:grid-cols-[1fr_1.15fr] md:pt-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-teal-700 shadow-soft">
              <IconStar filled size={16} className="text-sun-500" />
              رفيقك في رحلة القرآن
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.15] text-ink-900 sm:text-6xl">
              عالمٌ هادئ
              <br />
              <span className="bg-gradient-to-l from-teal-500 to-lilac-500 bg-clip-text text-transparent">يحبّب أطفالنا بالقرآن</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-700">
              في رِفق يتعلّم الطفل التلاوة والتجويد، ويحفظ آياته خطوةً بخطوة، ويراجعها بانتظام، وكلّ إنجازٍ يفتح له مكانًا جديدًا في رحلته.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/welcome" size="lg">ابدأ الرحلة</LinkButton>
              <LinkButton href="/adult" size="lg" tone="white">واجهة الكبار</LinkButton>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-ink-700">
              {["نصٌّ عثماني موثّق", "تلاوات قرّاء معروفين", "بلا إعلانات ولا منافسة"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-mint-500 text-white">
                    <IconCheck size={13} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div className="relative" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}>
            <HeroScene className="w-full drop-shadow-[0_30px_40px_rgba(29,58,74,0.18)]" />
            <div className="absolute bottom-[19%] right-[14%] w-[17%] animate-float">
              <Character avatar={{ skin: 1, outfit: 0, headwear: "kufi", accessory: "satchel" }} size={150} wave className="h-auto w-full" />
            </div>
            <div className="absolute bottom-[21%] left-[17%] w-[15%] animate-float" style={{ animationDelay: "1.2s" }}>
              <Character avatar={{ skin: 2, outfit: 1, headwear: "hijab", accessory: "none" }} size={130} className="h-auto w-full" />
            </div>
            <div className="absolute bottom-[12%] left-[1%] w-[19%]">
              <MagdyImage size={300} className="!h-auto !w-full drop-shadow-xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- JOURNEY ---------- */}
      <section id="journey" className="bg-cream-100 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <motion.div {...fade}>
            <p className="font-display font-bold text-teal-600">رحلة الطفل</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">خريطةٌ تكبر مع كلّ سورة</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-700">
              تبدأ الرحلة من بوابة الفاتحة، ثمّ تنتقل بين محطات جزء عمّ. كلّ سورةٍ يتمّها الطفل تفتح محطةً جديدة وتزيّن حديقته بنخلةٍ أو فانوسٍ أو نافورة.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BADGES.slice(0, 4).map((b) => (
                <div key={b.id} className="flex flex-col items-center gap-1 text-center">
                  <BadgeArt badge={b} earned size={64} />
                  <span className="text-xs font-bold text-ink-700">{b.title}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div {...fade}>
            <Card className="relative overflow-hidden p-0">
              <svg viewBox="0 0 520 340" className="w-full" aria-hidden>
                <defs>
                  <linearGradient id="jl-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#d7f1ff" />
                    <stop offset="1" stopColor="#c9f3dd" />
                  </linearGradient>
                </defs>
                <rect width="520" height="340" fill="url(#jl-bg)" />
                <path d="M40 300 C140 300 120 200 230 210 S360 120 470 60" stroke="#fff" strokeWidth="26" fill="none" strokeLinecap="round" />
                <path d="M40 300 C140 300 120 200 230 210 S360 120 470 60" stroke="#f2dcb9" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray="2 18" />
                <Palm x={110} y={250} s={0.7} />
                <RoundTree x={320} y={260} s={0.8} />
                <RoundTree x={420} y={190} s={0.6} tone="teal" />
                <DomeHouse x={470} y={98} s={0.45} />
                {[
                  [40, 300, "#45c785", true],
                  [150, 250, "#45c785", true],
                  [230, 210, "#ffcc4d", false],
                  [350, 140, "#d5dee3", false],
                ].map(([x, y, c, done], i) => (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <ellipse cy="10" rx="26" ry="8" fill="#1d3a4a" opacity="0.12" />
                    <circle r="24" fill={c as string} />
                    <circle r="24" fill="none" stroke="#fff" strokeWidth="5" />
                    {done ? <path d="M-8 0 L-2 6 L9 -6" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" /> : <circle r="6" fill="#fff" />}
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-4 right-4 left-4 flex items-center gap-3 rounded-2xl bg-white/90 p-3">
                <Mascot size={44} />
                <div className="flex-1">
                  <div className="text-sm font-bold">المحطة التالية: سورة الإخلاص</div>
                  <ProgressBar value={0.5} tone="sun" className="mt-1.5" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ---------- TAJWEED ---------- */}
      <section id="tajweed" className="relative bg-gradient-to-b from-lilac-100/60 to-cream-100 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fade} className="mx-auto max-w-2xl text-center">
            <p className="font-display font-bold text-lilac-600">أكاديمية التجويد</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">نرى الحكم بالألوان قبل أن نسمعه</h2>
            <p className="mt-4 text-lg text-ink-700">كلّ حكمٍ له لون. يرى الطفل الكلمة مظلّلة في آيةٍ حقيقية، ويستمع إليها، ثمّ يجرّب بنفسه.</p>
          </motion.div>
          <motion.div {...fade}>
            <Card className="mx-auto mt-10 max-w-3xl p-6 sm:p-10">
              <div className="text-center text-sm font-bold text-ink-500">سورة الفلق · الآية ٢</div>
              <div className="mt-4 text-center text-4xl sm:text-5xl">
                {falaq ? (
                  <VerseText text={falaq.verses[1].text} highlight={{ 0: `${RULE_STYLES.sun.bg} ${RULE_STYLES.sun.text}`, 1: `${RULE_STYLES.sun.bg} ${RULE_STYLES.sun.text}` }} />
                ) : (
                  <span className="inline-block h-14 w-64 animate-pulse rounded-2xl bg-cream-200" />
                )}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  ["الإخفاء", "sun"],
                  ["الإظهار", "sky"],
                  ["الإدغام بغنّة", "mint"],
                  ["الإقلاب", "coral"],
                  ["الإدغام بلا غنّة", "lilac"],
                ].map(([n, c]) => (
                  <span key={n} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${RULE_STYLES[c as "sun"].bg} ${RULE_STYLES[c as "sun"].text}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${RULE_STYLES[c as "sun"].dot}`} />
                    {n}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ---------- MEMORIZE ---------- */}
      <section id="memorize" className="bg-cream-100 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fade} className="max-w-2xl">
            <p className="font-display font-bold text-mint-600">مركز الحفظ</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">سبع خطوات لطيفة لحفظٍ ثابت</h2>
            <p className="mt-4 text-lg text-ink-700">من الاستماع إلى التسميع، ثمّ مراجعةٌ ذكية تعود بالآية في الوقت المناسب قبل أن تُنسى.</p>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: IconHeadphones, t: "استمع", d: "تلاوةٌ حقيقية لقارئٍ معروف", c: "bg-sky-100 text-sky-500" },
              { icon: IconRefresh, t: "ردّد وكرّر", d: "عدد مرات تختاره أنت", c: "bg-teal-100 text-teal-600" },
              { icon: IconEyeOff, t: "أخفِ تدريجيًا", d: "تختفي الكلمات واحدةً تلو الأخرى", c: "bg-lilac-100 text-lilac-600" },
              { icon: IconSprout, t: "راجع بذكاء", d: "جدولٌ يعيد الآية عند الحاجة", c: "bg-mint-100 text-mint-600" },
            ].map((f, i) => (
              <motion.div key={f.t} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }}>
                <Card className="h-full p-6">
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl ${f.c}`}>
                    <f.icon size={28} />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-extrabold">{f.t}</h3>
                  <p className="mt-1 text-ink-500">{f.d}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- GAMES ---------- */}
      <section id="games" className="bg-gradient-to-b from-sun-100/60 to-cream-100 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fade} className="text-center">
            <p className="font-display font-bold text-sun-600">العب وتعلّم</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">ألعابٌ قصيرة، وتعلّمٌ حقيقي</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-700">كلّ لعبةٍ مبنيّة على نصٍّ قرآنيٍّ موثّق ومحتوى تعليميٍّ قابلٍ للمراجعة، بلا آياتٍ مُختلقة ولا نصٍّ معدّل.</p>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
            {GAMES.map((g, i) => (
              <motion.div key={g.kind} {...fade} transition={{ ...fade.transition, delay: i * 0.06 }}>
                <Link href="/play" className="group block">
                  <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1">
                    <GameArt kind={g.kind} className="w-full" />
                    <div className="p-4 font-display text-lg font-extrabold">{g.title}</div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- STORIES ---------- */}
      <section id="stories" className="bg-gradient-to-b from-coral-100/50 to-cream-100 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fade} className="text-center">
            <p className="font-display font-bold text-coral-500">حكايات رِفق</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">قصصٌ قصيرة تزرع القيم</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-700">
              أكثر من ثلاثين قصة من قصص الأنبياء والقرآن والسيرة والصحابة، وقصصٌ تربوية عن الأخلاق، ومع كلّ قصة آيةٌ موثّقة ودرسٌ صغير.
            </p>
          </motion.div>
          <div className="no-scrollbar -mx-5 mt-10 flex gap-4 overflow-x-auto px-5 pb-4">
            {STORIES.slice(0, 10).map((s) => (
              <Link key={s.id} href="/stories" className="w-56 shrink-0">
                <Card className="overflow-hidden p-0 transition hover:-translate-y-1">
                  <StoryScene scene={s.scene} className="aspect-[16/10] w-full" />
                  <div className="p-4 font-display text-lg font-extrabold">{s.title}</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAMILY ---------- */}
      <section id="family" className="bg-cream-100 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <motion.div {...fade}>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-600">
                  <IconFamily size={26} />
                </span>
                <div>
                  <div className="font-display text-lg font-extrabold">لوحة العائلة</div>
                  <div className="text-sm text-ink-500">هذا الأسبوع</div>
                </div>
              </div>
              {[
                { n: "سارة", a: { skin: 1, outfit: 1, headwear: "hijab", accessory: "none" } as const, p: 0.8, t: "سورة النصر" },
                { n: "يوسف", a: { skin: 2, outfit: 3, headwear: "kufi", accessory: "scarf" } as const, p: 0.45, t: "سورة الكوثر" },
              ].map((c) => (
                <div key={c.n} className="mt-4 flex items-center gap-3 rounded-2xl bg-cream-100 p-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-sky-100">
                    <Character avatar={c.a} size={48} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{c.n}</span>
                      <span className="text-ink-500">{c.t}</span>
                    </div>
                    <ProgressBar value={c.p} tone="mint" className="mt-1.5" />
                  </div>
                </div>
              ))}
              <p className="mt-4 text-xs text-ink-500">مثال توضيحي للوحة العائلة.</p>
            </Card>
          </motion.div>
          <motion.div {...fade}>
            <p className="font-display font-bold text-teal-600">للأهل والمعلّمين</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">تابِع بهدوء، وشجّع بلا ضغط</h2>
            <ul className="mt-6 space-y-3 text-lg text-ink-700">
              {["ملفّات متعدّدة للأطفال تحت حسابٍ واحد", "تقدّم الحفظ لكلّ سورة ولكلّ آية", "أهدافٌ أسبوعية ومتابعة للانتظام", "لا لوحات صدارة ولا مقارنة بين الأطفال", "حماية الخصوصية: لا يحتاج الطفل بريدًا إلكترونيًا"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-600">
                    <IconCheck size={15} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="px-5 pb-16">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-teal-500 to-teal-700 px-8 py-14 text-center text-white shadow-lift">
          <div className="pattern-girih absolute inset-0 opacity-60 mix-blend-overlay" />
          <Mascot size={90} mood="cheer" className="relative mx-auto" />
          <h2 className="relative mt-3 font-display text-4xl font-extrabold">ابدأ رحلتك اليوم</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-teal-50">جرّب رِفق مباشرةً الآن، ويُحفظ تقدّمك على هذا الجهاز. أنشئ حسابًا عائليًا لمزامنته بين الأجهزة.</p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <LinkButton href="/welcome" tone="sun" size="lg">ابدأ مع بابا مجدي</LinkButton>
            <LinkButton href="/login" tone="white" size="lg">إنشاء حساب عائلي</LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-cream-300/60 bg-cream-50 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-xl font-extrabold text-teal-700">رِفق</span>
          </div>
          <div className="max-w-2xl space-y-2 text-sm text-ink-500">
            <p className="flex items-start gap-2">
              <IconShield size={18} className="mt-0.5 shrink-0 text-teal-600" />
              النصّ القرآني مأخوذٌ كما هو من مصدرٍ موثّق بالرسم العثماني (موسوعة القرآن الكريم — quranenc.com)، ويُتحقَّق من مطابقته آليًا. لا يُولَّد أيّ نصٍّ قرآنيٍّ ولا يُعدَّل.
            </p>
            <p className="flex items-start gap-2">
              <IconHeadphones size={18} className="mt-0.5 shrink-0 text-teal-600" />
              التلاوات مسجّلاتٌ حقيقية لقرّاء معروفين عبر EveryAyah.com.
            </p>
            <p className="flex items-start gap-2 font-bold text-teal-700">
              <IconStar filled size={18} className="mt-0.5 shrink-0 text-sun-500" />
              <Link href="/magdy" className="underline-offset-4 hover:underline">رِفق صدقةٌ جارية عن الوالد مجدي، نسألكم له الدعاء.</Link>
            </p>
            <p className="flex items-start gap-2">
              <IconBook size={18} className="mt-0.5 shrink-0 text-teal-600" />
              الشروح التعليمية في التجويد بانتظار مراجعة معلّمين مختصّين قبل النشر العام.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
