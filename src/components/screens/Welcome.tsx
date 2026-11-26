import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "@/lib/router";
import { useEffect, useState, type ComponentType } from "react";
import { Character } from "@/components/art/Character";
import { Logo } from "@/components/art/GameArt";
import {
  IconBook, IconCalendar, IconCheck, IconEyeOff, IconFamily, IconHeadphones, IconLantern, IconMap, IconNext, IconPrev,
  IconPuzzle, IconRefresh, IconSprout, IconStar, IconStories, IconUser,
} from "@/components/art/Icons";
import { MagdyStanding } from "@/components/art/Magdy";
import { Cloud, Sparkle } from "@/components/art/Scenery";
import { Button } from "@/components/ui";
import { playSfx } from "@/lib/fx";
import { toArabicDigits } from "@/lib/quran";
import { actions } from "@/lib/store";
import { FROM_INTRO_KEY } from "@/components/shell/FirstVisitIntro";

type Icon = ComponentType<{ size?: number; className?: string }>;
type Role = "kid" | "parent";
type GoalId = "hifz" | "tajweed" | "tilawa" | "revision" | "stories" | "family";

interface PlanStep {
  icon: Icon;
  title: string;
  text: string;
  where: string;
}

interface Goal {
  id: GoalId;
  label: string;
  kidLabel: string;
  icon: Icon;
  tone: string;
  noor: string;
  start: string;
  steps: PlanStep[];
}

const GOALS: Goal[] = [
  {
    id: "hifz",
    label: "حفظ القرآن الكريم",
    kidLabel: "أحفظ سورًا جديدة",
    icon: IconSprout,
    tone: "bg-mint-100 text-mint-600",
    noor: "رائع! الحفظ في رِفق خطواتٌ صغيرة كلّ يوم، مع مراجعةٍ ذكية حتى لا تنسى. هذه خطّتك:",
    start: "/memorize",
    steps: [
      { icon: IconHeadphones, title: "استمع إلى الآية", text: "استمع إلى القارئ عدّة مرات وتابع الكلمات بعينيك.", where: "مركز الحفظ ← الخطوة ١" },
      { icon: IconRefresh, title: "ردّد ثم اقرأ بنفسك", text: "ردّد خلف القارئ في الوقفات، ثم اقرأ الآية بصوتك خمس مرات.", where: "مركز الحفظ ← الخطوتان ٢ و٣" },
      { icon: IconEyeOff, title: "أخفِ الكلمات تدريجيًا", text: "تختفي الكلمات شيئًا فشيئًا حتى تقرأ الآية كاملةً من حفظك، ثم رتّب كلماتها في التحدّي.", where: "مركز الحفظ ← الخطوات ٤ إلى ٦" },
      { icon: IconMap, title: "اربط الآية بما قبلها", text: "اسمع الآيتين معًا وأخفِهما حتى تتصل القراءة بلا توقّف.", where: "مركز الحفظ ← ربط الآيات" },
      { icon: IconCalendar, title: "راجع كلّ يوم", text: "يعيد لك جدول المراجعة كلّ آية في الوقت المناسب قبل أن تُنسى.", where: "المراجعة ← مستحقّة اليوم" },
      { icon: IconStar, title: "سمّع السورة كاملة", text: "عند إتمام السورة سمّعها آيةً آية، وما نسيتَه يعود إليك للمراجعة.", where: "مركز الحفظ ← تسميع السورة" },
    ],
  },
  {
    id: "tajweed",
    label: "تعلّم أحكام التجويد",
    kidLabel: "أتعلّم القراءة الصحيحة",
    icon: IconLantern,
    tone: "bg-lilac-100 text-lilac-600",
    noor: "جميل! التجويد يجعل تلاوتك صحيحةً وجميلة. سنتعلّمه بالألوان والأمثلة الحقيقية:",
    start: "/tajweed",
    steps: [
      { icon: IconUser, title: "مخارج الحروف وصفاتها", text: "ابدأ بمعرفة من أين يخرج كلّ حرف، وكيف يُنطق.", where: "أكاديمية التجويد ← مخارج الحروف" },
      { icon: IconLantern, title: "النون الساكنة والميم الساكنة", text: "أهمّ الأحكام وأكثرها تكرارًا في القرآن.", where: "أكاديمية التجويد ← الدرسان ١ و٢" },
      { icon: IconBook, title: "المدود واللامات والراء", text: "تعلّم متى تمدّ، ومتى تُظهر اللام أو تخفيها، ومتى تفخّم الراء.", where: "أكاديمية التجويد" },
      { icon: IconCheck, title: "تمرّن واختبر نفسك", text: "في كلّ درس: اضغط على الكلمة التي فيها الحكم، ثم أجب عن اختبارٍ قصير.", where: "داخل كلّ درس ← تمرّن / اختبار" },
      { icon: IconHeadphones, title: "طبّق مع القارئ", text: "استمع إلى الآيات في المصحف وكرّرها، وانتبه للأحكام التي تعلّمتها.", where: "المصحف ← التكرار" },
      { icon: IconPuzzle, title: "العب «اكتشف الحكم»", text: "لعبةٌ سريعة تثبّت ما تعلّمته.", where: "العب وتعلّم" },
    ],
  },
  {
    id: "tilawa",
    label: "تحسين التلاوة والقراءة",
    kidLabel: "أقرأ القرآن بصوتٍ جميل",
    icon: IconHeadphones,
    tone: "bg-sky-100 text-sky-500",
    noor: "ممتاز! التلاوة الجميلة تأتي بالاستماع الكثير والتكرار. اتبع هذه الخطوات:",
    start: "/quran",
    steps: [
      { icon: IconHeadphones, title: "اختر قارئًا تحبّه", text: "في المصحف ثلاثة قرّاء معروفين، اختر من تحبّ أن تقلّده.", where: "المصحف ← القارئ" },
      { icon: IconRefresh, title: "استمع ثم اقرأ", text: "كرّر الآية أو مجموعة آيات بعددٍ تختاره، ثم اقرأها بصوتك.", where: "المصحف ← كل آية / المجموعة" },
      { icon: IconLantern, title: "تعلّم الأحكام الأساسية", text: "دروسٌ قصيرة في التجويد تجعل قراءتك صحيحة.", where: "أكاديمية التجويد" },
      { icon: IconCalendar, title: "وِردٌ يومي ثابت", text: "اقرأ كلّ يوم ولو صفحة، وضع علامةً حيث توقّفت.", where: "المصحف ← علامة" },
    ],
  },
  {
    id: "revision",
    label: "مراجعة ما حفظتُه",
    kidLabel: "أراجع ما حفظت",
    icon: IconRefresh,
    tone: "bg-sun-100 text-sun-600",
    noor: "أحسنت! المراجعة سرّ الحفظ الثابت. رِفق يذكّرك بما تحتاج مراجعته كلّ يوم:",
    start: "/revision",
    steps: [
      { icon: IconCalendar, title: "افتح «مستحقّة اليوم»", text: "تظهر لك الآيات التي حان موعد مراجعتها.", where: "المراجعة" },
      { icon: IconCheck, title: "قيّم نفسك بصدق", text: "سمّع الآية ثم اكشفها، واختر: نسيتُ / تذكّرتُ / بسهولة. هكذا يُحدَّد موعدها القادم.", where: "المراجعة ← ابدأ المراجعة" },
      { icon: IconStar, title: "سمّع سورةً كاملة", text: "تسميعٌ آيةً آية لكلّ سورةٍ حفظتها.", where: "مركز الحفظ ← تسميع السورة" },
      { icon: IconPuzzle, title: "الكلمة الناقصة", text: "تمرينٌ سريع يكشف المواضع التي تحتاج تثبيتًا.", where: "مركز الحفظ ← الكلمة الناقصة" },
      { icon: IconRefresh, title: "ركّز على الآيات الصعبة", text: "قائمةٌ خاصة بالآيات التي تتعثّر فيها.", where: "المراجعة ← الآيات الصعبة" },
    ],
  },
  {
    id: "stories",
    label: "التعرّف على القرآن بالقصص",
    kidLabel: "أسمع قصصًا وألعب",
    icon: IconStories,
    tone: "bg-coral-100 text-coral-500",
    noor: "يا سلام! عندي قصصٌ كثيرة وألعابٌ ممتعة، وكلّها تعلّمك شيئًا جميلًا:",
    start: "/stories",
    steps: [
      { icon: IconStories, title: "قصة اليوم", text: "كلّ يومٍ قصةٌ قصيرة من قصص الأنبياء والقرآن والسيرة والأخلاق.", where: "قصص" },
      { icon: IconCheck, title: "ماذا تعلّمنا؟", text: "في آخر كلّ قصة: الدرس، والآية المرتبطة بها، وسؤالان صغيران.", where: "داخل كلّ قصة" },
      { icon: IconPuzzle, title: "العب وتعلّم", text: "ستّ ألعاب: أكمل الآية، رتّب الآيات، طابق الحروف وغيرها.", where: "العب وتعلّم" },
      { icon: IconStar, title: "اجمع النجوم والأوسمة", text: "كلّ نشاطٍ يمنحك نجومًا تزيّن بها حديقتك.", where: "عالمي" },
    ],
  },
  {
    id: "family",
    label: "تعليم أبنائي ومتابعتهم",
    kidLabel: "",
    icon: IconFamily,
    tone: "bg-teal-100 text-teal-700",
    noor: "بارك الله فيك! رِفق يساعدك أن ترافق أبناءك بهدوءٍ وبلا ضغط:",
    start: "/family",
    steps: [
      { icon: IconUser, title: "أنشئ حساب العائلة", text: "الحساب لك أنت فقط. لا يحتاج الأبناء بريدًا ولا كلمة مرور.", where: "تسجيل الدخول ← حساب جديد" },
      { icon: IconFamily, title: "أضف ملفات أبنائك", text: "ملفٌّ لكلّ طفل، بالاسم الأول فقط حفاظًا على الخصوصية.", where: "لوحة العائلة ← إضافة طفل" },
      { icon: IconCalendar, title: "حدّد هدفًا أسبوعيًا", text: "عدد أيام التعلّم في الأسبوع، بلا مقارنةٍ ولا لوحات صدارة.", where: "لوحة العائلة ← الهدف الأسبوعي" },
      { icon: IconMap, title: "يبدأ طفلك رحلته", text: "افتح عالم طفلك، وسيرشده بابا مجدي خطوةً خطوة.", where: "لوحة العائلة ← افتح عالم طفلي" },
      { icon: IconStar, title: "تابع وشجّع", text: "السور المحفوظة، والدروس، والمراجعة، والانتظام — في مكانٍ واحد.", where: "لوحة العائلة" },
    ],
  },
];

const TOUR: { icon: Icon; title: string; text: string; tone: string }[] = [
  { icon: IconBook, title: "مصحفٌ تفاعلي", text: "اقرأ واستمع إلى قرّاء معروفين، وكرّر الآيات بالعدد الذي تريده.", tone: "bg-teal-100 text-teal-600" },
  { icon: IconSprout, title: "حفظٌ خطوةً بخطوة", text: "استماع، ترديد، إخفاء تدريجي، ثم تسميع.", tone: "bg-mint-100 text-mint-600" },
  { icon: IconRefresh, title: "مراجعةٌ ذكية", text: "نعيد لك كلّ آية في الوقت المناسب قبل أن تُنسى.", tone: "bg-sun-100 text-sun-600" },
  { icon: IconLantern, title: "أكاديمية التجويد", text: "دروسٌ بالألوان مع أمثلةٍ من آياتٍ حقيقية.", tone: "bg-lilac-100 text-lilac-600" },
  { icon: IconStories, title: "قصصٌ وألعاب", text: "حكاياتٌ قصيرة وألعابٌ تعليمية ونجومٌ وأوسمة.", tone: "bg-coral-100 text-coral-500" },
];

/** Types the bubble text gradually, like Noor is talking. */
function useTypewriter(text: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      return;
    }
    const id = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(id), x) : x + 2)), 28);
    return () => clearInterval(id);
  }, [text]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

function Guide({ text }: { text: string }) {
  const t = useTypewriter(text);
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="shrink-0">
        <MagdyStanding size={typeof window !== "undefined" && window.innerWidth >= 640 ? 300 : 230} />
      </div>
      <motion.button
        onClick={t.skip}
        key={`bubble-${text}`}
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full rounded-[1.8rem] bg-white px-6 py-4 text-right font-display text-xl font-bold leading-relaxed text-ink-900 shadow-lift sm:text-2xl"
        aria-live="polite"
      >
        {t.shown}
        {!t.done && <span className="mr-1 inline-block h-5 w-1.5 animate-pulse rounded bg-teal-400 align-middle" />}
        <span className="absolute -top-2 right-1/2 h-5 w-5 rotate-45 rounded-sm bg-white sm:-right-2 sm:top-1/2 sm:-mt-2.5" />
      </motion.button>
    </div>
  );
}

export function Welcome() {
  const router = useRouter();
  // Coming straight from Baba Magdy's first greeting: skip the hello and start the tour.
  const [step, setStep] = useState(() => {
    try {
      if (sessionStorage.getItem(FROM_INTRO_KEY)) {
        sessionStorage.removeItem(FROM_INTRO_KEY);
        return 1;
      }
    } catch {
      /* ignore */
    }
    return 0;
  });
  const [tourIdx, setTourIdx] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [planIdx, setPlanIdx] = useState(0);
  /** A short celebratory sound for the choice, then move on. */
  const choose = (fn: () => void) => {
    playSfx("correct");
    setTimeout(fn, 750);
  };

  const STEPS = ["hello", "tour", "role", "goal", "plan", "ready"] as const;
  const cur = STEPS[step];
  const go = (n: number) => {
    playSfx("page");
    setStep(n);
  };

  const finish = (to: string) => {
    if (!goal || !role) return;
    actions.finishOnboarding({ role, goal: goal.id, startHref: goal.start });
    router.push(to);
  };

  const goals = GOALS.filter((g) => g.id !== "family");
  const familyGoal = GOALS.find((g) => g.id === "family")!;

  return (
    <div className="sky-bg relative min-h-dvh overflow-hidden">
      <svg viewBox="0 0 1000 600" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g className="animate-float-slow"><Cloud x={40} y={60} s={1.1} /></g>
        <g className="animate-float"><Cloud x={720} y={120} s={0.8} /></g>
        <Sparkle x={500} y={60} r={6} />
        <Sparkle x={880} y={380} r={5} color="#c9b8ff" delay={1} />
        <Sparkle x={120} y={420} r={5} color="#9fe6ff" delay={2} />
        <path d="M0 560 Q250 520 500 552 Q760 584 1000 540 L1000 600 L0 600 Z" fill="#8ee6b5" />
      </svg>

      <header className="relative mx-auto flex max-w-3xl items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <Logo size={38} />
          <span className="font-display text-xl font-extrabold text-teal-700">رِفق</span>
        </div>
        <div className="flex items-center gap-1.5" aria-label={`الخطوة ${step + 1} من ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={`h-2.5 rounded-full transition-all duration-500 ${i === step ? "w-8 bg-teal-500" : i < step ? "w-2.5 bg-teal-300" : "w-2.5 bg-white/80"}`} />
          ))}
        </div>
        <button
          onClick={() => {
            actions.finishOnboarding({ role: "kid", goal: "quran", startHref: "/kids" });
            router.push("/kids");
          }}
          className="rounded-2xl bg-white/70 px-3 py-1.5 text-sm font-bold text-ink-500"
        >
          تخطّي
        </button>
      </header>

      <main className="relative mx-auto max-w-3xl px-5 pb-16 pt-8">
        <AnimatePresence mode="wait">
          <motion.section
            key={cur}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            {cur === "hello" && (
              <>
                <Guide text="السلام عليكم ورحمة الله! أنا «بابا مجدي»، رفيقك في رحلة القرآن. سأعرّفك على رِفق، ثم أصنع لك خطّةً تناسبك تمامًا." />
                <div className="mt-10 flex justify-center">
                  <Button size="lg" className="min-w-56" onClick={() => go(1)}>
                    وعليكم السلام، هيّا بنا! <IconNext size={20} />
                  </Button>
                </div>
              </>
            )}

            {cur === "tour" && (
              <>
                <Guide text={tourIdx === 0 ? "رِفق عالمٌ صغير فيه كلّ ما تحتاجه مع القرآن. انظر معي:" : TOUR[tourIdx].text} />
                <div className="mt-8 grid gap-3">
                  {TOUR.map((t, i) => (
                    <motion.button
                      key={t.title}
                      onClick={() => setTourIdx(i)}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0, scale: i === tourIdx ? 1.02 : 1 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 22 }}
                      className={`card-3d flex items-center gap-4 p-4 text-right ${i === tourIdx ? "ring-4 ring-sun-300" : ""}`}
                    >
                      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${t.tone}`}>
                        <t.icon size={28} />
                      </span>
                      <span>
                        <span className="block font-display text-xl font-extrabold">{t.title}</span>
                        <span className="block text-sm text-ink-500">{t.text}</span>
                      </span>
                    </motion.button>
                  ))}
                </div>
                <Nav onBack={() => go(0)} onNext={() => go(2)} nextLabel="فهمت، التالي" />
              </>
            )}

            {cur === "role" && (
              <>
                <Guide text="قبل أن نبدأ… أخبرني، من أنت؟" />
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {([
                    ["kid", "أنا طفل", "أريد أن أتعلّم وألعب", { skin: 1, outfit: 0, headwear: "kufi", accessory: "satchel" }],
                    ["parent", "بابا أو ماما", "أريد تجهيز رِفق لأبنائي", { skin: 2, outfit: 1, headwear: "hijab", accessory: "none" }],
                  ] as const).map(([k, title, sub, av], i) => (
                    <motion.button
                      key={k}
                      onClick={() => {
                        setRole(k);
                        setPlanIdx(0);
                        if (k === "parent") {
                          setGoal(familyGoal);
                          choose(() => go(4));
                        } else {
                          setGoal(null);
                          choose(() => go(3));
                        }
                      }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 240, damping: 20 }}
                      whileHover={{ y: -6 }}
                      className={`card-3d flex flex-col items-center p-5 text-center ${role === k ? "ring-4 ring-teal-400" : ""}`}
                    >
                      <div className="h-28 overflow-hidden">
                        <Character avatar={av} size={110} />
                      </div>
                      <span className="mt-2 font-display text-xl font-extrabold">{title}</span>
                      <span className="text-sm text-ink-500">{sub}</span>
                    </motion.button>
                  ))}
                </div>
                <Nav onBack={() => go(1)} />
              </>
            )}

            {cur === "goal" && (
              <>
                <Guide text="أهلًا يا بطل! ماذا تحبّ أن تفعل في رِفق؟" />
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {goals.map((g, i) => (
                    <motion.button
                      key={g.id}
                      onClick={() => { setGoal(g); setPlanIdx(0); choose(() => go(4)); }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 20 }}
                      whileHover={{ scale: 1.03 }}
                      className={`card-3d flex items-center gap-4 p-4 text-right ${goal?.id === g.id ? "ring-4 ring-teal-400" : ""}`}
                    >
                      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${g.tone}`}>
                        <g.icon size={28} />
                      </span>
                      <span className="font-display text-lg font-extrabold">{g.kidLabel}</span>
                    </motion.button>
                  ))}
                </div>
                <Nav onBack={() => go(2)} />
              </>
            )}

            {cur === "plan" && goal && (
              <>
                <Guide text={planIdx === 0 ? goal.noor : `${goal.steps[planIdx].title}: ${goal.steps[planIdx].text}`} />
                <ol className="relative mt-8 space-y-3">
                  <span className="absolute right-[27px] top-4 bottom-4 w-1 rounded-full bg-white/80" aria-hidden />
                  {goal.steps.map((s, i) => {
                    const open = i === planIdx;
                    const seen = i < planIdx;
                    return (
                      <motion.li key={s.title} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                        <button onClick={() => setPlanIdx(i)} className={`card-3d relative flex w-full items-start gap-4 p-4 text-right transition ${open ? "ring-4 ring-sun-300" : ""}`}>
                          <span className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold ${seen ? "bg-mint-500 text-white" : open ? "bg-teal-500 text-white" : "bg-cream-100 text-ink-500"}`}>
                            {seen ? <IconCheck size={24} /> : <s.icon size={26} />}
                          </span>
                          <span className="flex-1">
                            <span className="block text-xs font-bold text-teal-600">الخطوة {toArabicDigits(i + 1)}</span>
                            <span className="block font-display text-lg font-extrabold">{s.title}</span>
                            <AnimatePresence initial={false}>
                              {open && (
                                <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden">
                                  <span className="mt-1 block text-ink-700">{s.text}</span>
                                  <span className="mt-2 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-500">أين؟ {s.where}</span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ol>
                <Nav
                  onBack={() => go(role === "parent" ? 2 : 3)}
                  onNext={() => (planIdx < goal.steps.length - 1 ? setPlanIdx(planIdx + 1) : choose(() => go(5)))}
                  nextLabel={planIdx < goal.steps.length - 1 ? "الخطوة التالية" : "فهمت الخطة!"}
                />
              </>
            )}

            {cur === "ready" && goal && role && (
              <>
                <Guide
                  text={
                    role === "kid"
                      ? "أنت جاهز يا بطل! اطلب من بابا أو ماما أن يسجّلوا الدخول بحساب العائلة، حتى نحفظ نجومك وتقدّمك."
                      : "كلّ شيء جاهز! أنشئ حساب العائلة من «ركن الوالدين» ليُحفظ تقدّم أبنائك، أو دعهم يبدؤون الآن."
                  }
                />
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }} className="card-3d mt-8 p-6 text-center">
                  <div className="text-sm font-bold text-ink-500">هدفك</div>
                  <div className="mt-1 flex items-center justify-center gap-2 font-display text-2xl font-extrabold">
                    <goal.icon size={26} className="text-teal-600" />
                    {role === "kid" ? goal.kidLabel : goal.label}
                  </div>
                  <div className="mt-1 text-ink-500">
                    خطّةٌ من {toArabicDigits(goal.steps.length)} خطوات
                  </div>
                  {role === "kid" ? (
                    <Button size="lg" className="mt-6 w-full" onClick={() => finish("/kids")}>
                      ابدأ رحلتي
                    </Button>
                  ) : (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Button size="lg" onClick={() => finish("/parents")}>
                        افتح ركن الوالدين
                      </Button>
                      <Button size="lg" tone="white" onClick={() => finish("/kids")}>
                        افتح عالم الطفل
                      </Button>
                    </div>
                  )}
                </motion.div>
                <Nav onBack={() => go(4)} />
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel = "التالي" }: { onBack: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Button tone="white" size="sm" onClick={onBack}>
        <IconPrev size={18} /> رجوع
      </Button>
      {onNext && (
        <Button onClick={onNext}>
          {nextLabel} <IconNext size={18} />
        </Button>
      )}
    </div>
  );
}
