/**
 * Tajweed Academy content.
 *
 * IMPORTANT
 * - Explanations below are educational text, NOT Quran. They are kept separate from Quranic text.
 * - Quranic examples are REFERENCES ONLY (surah, ayah, word indexes). The words themselves are
 *   always rendered from the verified Quran files at runtime, never typed here.
 * - Review: the texts were checked against standard Hafs (Shatibiyya) references and approved by
 *   the app owner (2026-11-26). Every example is checked against the verified text by
 *   scripts/verify-tajweed.mjs. Set a lesson back to "pending" to show the "under review" badge.
 */

export type RuleColor = "teal" | "lilac" | "sun" | "coral" | "sky" | "mint";

export interface Example {
  surah: number;
  ayah: number;
  /** Indexes of words (split by spaces) that carry the rule. */
  words: number[];
  ruleId: string;
}

interface Rule {
  id: string;
  name: string;
  color: RuleColor;
  kids: string;
  /** Letters that trigger the rule (educational, not Quranic text). */
  letters?: string;
}

interface QuizQ {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  tone: RuleColor;
  intro: string;
  rules: Rule[];
  examples: Example[];
  quiz: QuizQ[];
  review: "pending" | "approved";
}

export const LESSONS: Lesson[] = [
  {
    id: "noon",
    title: "النون الساكنة والتنوين",
    subtitle: "أربعة أحكام تُغيّر صوت النون",
    tone: "teal",
    intro: "النون الساكنة هي نونٌ بلا حركة، والتنوين نونٌ نسمعها ولا نكتبها في آخر الكلمة. ننظر إلى الحرف الذي بعدها لنعرف كيف ننطقها.",
    rules: [
      { id: "izhar", name: "الإظهار", color: "sky", letters: "ء هـ ع ح غ خ", kids: "ننطق النون واضحةً تمامًا، لأن الحرف بعدها من الحلق." },
      { id: "idgham_ghunnah", name: "الإدغام بغنّة", color: "mint", letters: "ي ن م و", kids: "تدخل النون في الحرف الذي بعدها مع صوتٍ لطيفٍ من الأنف. يكون ذلك بين كلمتين فقط، أمّا في كلمةٍ واحدة مثل «الدُّنيا» فتظهر النون." },
      { id: "idgham_no_ghunnah", name: "الإدغام بلا غنّة", color: "lilac", letters: "ل ر", kids: "تختفي النون تمامًا في اللام أو الراء بلا صوتٍ من الأنف." },
      { id: "iqlab", name: "الإقلاب", color: "coral", letters: "ب", kids: "إذا جاءت الباء تُقلب النون ميمًا مُخفاة مع غنّة، وفي المصحف ميمٌ صغيرة فوقها." },
      { id: "ikhfa", name: "الإخفاء", color: "sun", letters: "باقي الحروف الخمسة عشر", kids: "ننطق النون بين الوضوح والاختفاء مع غنّة." },
    ],
    examples: [
      { surah: 112, ayah: 4, words: [3, 4], ruleId: "izhar" },
      { surah: 99, ayah: 7, words: [0, 1], ruleId: "idgham_ghunnah" },
      { surah: 112, ayah: 4, words: [1, 2], ruleId: "idgham_no_ghunnah" },
      { surah: 104, ayah: 4, words: [1], ruleId: "iqlab" },
      { surah: 113, ayah: 2, words: [0, 1], ruleId: "ikhfa" },
      { surah: 106, ayah: 4, words: [5, 6], ruleId: "izhar" },
    ],
    quiz: [
      { q: "إذا جاء بعد النون الساكنة حرف الباء، فما الحكم؟", options: ["الإظهار", "الإقلاب", "الإخفاء"], answer: 1, why: "الباء هي حرف الإقلاب الوحيد." },
      { q: "حروف الإظهار تخرج من…", options: ["الشفتين", "الحلق", "الأنف"], answer: 1, why: "حروف الإظهار الستة حروفٌ حلقية." },
      { q: "أيّ الحروف التالية من حروف الإدغام بلا غنّة؟", options: ["الراء", "الياء", "الميم"], answer: 0, why: "الإدغام بلا غنّة يكون في اللام والراء." },
    ],
    review: "approved",
  },
  {
    id: "meem",
    title: "الميم الساكنة",
    subtitle: "ثلاثة أحكام تُسمّى «شفوية»",
    tone: "lilac",
    intro: "الميم تخرج من الشفتين، ولذلك نسمّي أحكامها شفوية. ننظر إلى الحرف الذي بعد الميم الساكنة.",
    rules: [
      { id: "ikhfa_shafawi", name: "الإخفاء الشفوي", color: "sun", letters: "ب", kids: "إذا جاءت الباء بعد الميم الساكنة نخفي الميم قليلًا مع غنّة." },
      { id: "idgham_shafawi", name: "الإدغام الشفوي", color: "mint", letters: "م", kids: "ميمٌ ساكنة بعدها ميم: تصيران ميمًا واحدة مشدّدة مع غنّة." },
      { id: "izhar_shafawi", name: "الإظهار الشفوي", color: "sky", letters: "باقي الحروف", kids: "مع باقي الحروف ننطق الميم واضحة، خاصّةً قبل الواو والفاء." },
    ],
    examples: [
      { surah: 105, ayah: 4, words: [0, 1], ruleId: "ikhfa_shafawi" },
      { surah: 106, ayah: 4, words: [1, 2], ruleId: "idgham_shafawi" },
      { surah: 105, ayah: 1, words: [0, 1], ruleId: "izhar_shafawi" },
    ],
    quiz: [
      { q: "لماذا تُسمّى أحكام الميم الساكنة «شفوية»؟", options: ["لأن الميم تخرج من الشفتين", "لأنها تُقرأ بسرعة", "لأنها في آخر الآية"], answer: 0, why: "مخرج الميم من الشفتين." },
      { q: "ميمٌ ساكنة بعدها باء، ما الحكم؟", options: ["الإظهار الشفوي", "الإخفاء الشفوي", "الإدغام الشفوي"], answer: 1, why: "الباء هي حرف الإخفاء الشفوي." },
    ],
    review: "approved",
  },
  {
    id: "madd",
    title: "أحكام المدّ",
    subtitle: "نُطيل الصوت بقدرٍ معلوم",
    tone: "sun",
    intro: "حروف المدّ ثلاثة: الألف الساكنة بعد فتح، والواو الساكنة بعد ضم، والياء الساكنة بعد كسر. نقيس طول المدّ بالحركات.",
    rules: [
      { id: "madd_tabii", name: "المدّ الطبيعي", color: "sky", kids: "مدٌّ قصير بمقدار حركتين، كأننا نثني إصبعين بهدوء." },
      { id: "madd_muttasil", name: "المدّ المتّصل", color: "coral", kids: "حرف المدّ وبعده همزة في نفس الكلمة. مدّه واجب: أربع أو خمس حركات." },
      { id: "madd_munfasil", name: "المدّ المنفصل", color: "lilac", kids: "حرف المدّ في آخر كلمة، والهمزة في أوّل الكلمة التي بعدها. نمدّه أربع أو خمس حركات." },
      { id: "madd_lazim", name: "المدّ اللازم", color: "teal", kids: "حرف المدّ وبعده حرفٌ مشدّد أو ساكن دائمًا، فنمدّه ستّ حركات." },
      { id: "madd_arid", name: "المدّ العارض للسكون", color: "mint", kids: "عندما نقف على آخر الكلمة وقبلها حرف مدّ، يصير الحرف الأخير ساكنًا، فنمدّ حركتين أو أربعًا أو ستًّا." },
    ],
    examples: [
      { surah: 1, ayah: 4, words: [0], ruleId: "madd_tabii" },
      { surah: 110, ayah: 1, words: [1], ruleId: "madd_muttasil" },
      { surah: 109, ayah: 2, words: [0, 1], ruleId: "madd_munfasil" },
      { surah: 1, ayah: 7, words: [8], ruleId: "madd_lazim" },
      { surah: 1, ayah: 2, words: [3], ruleId: "madd_arid" },
    ],
    quiz: [
      { q: "كم حركةً يُمدّ المدّ الطبيعي؟", options: ["حركتان", "أربع حركات", "ست حركات"], answer: 0, why: "المدّ الطبيعي حركتان." },
      { q: "حرف المدّ وبعده همزة في نفس الكلمة يُسمّى…", options: ["المدّ المنفصل", "المدّ المتّصل", "المدّ اللازم"], answer: 1, why: "اتصل حرف المدّ والهمز في كلمةٍ واحدة." },
      { q: "كم حركةً يُمدّ المدّ اللازم؟", options: ["حركتان", "أربع", "ست"], answer: 2, why: "المدّ اللازم يُمدّ ست حركات لزومًا." },
    ],
    review: "approved",
  },
  {
    id: "qalqalah",
    title: "القلقلة",
    subtitle: "صوتٌ يرتدّ مثل الكرة",
    tone: "coral",
    intro: "القلقلة اضطرابٌ في المخرج عند النطق بالحرف ساكنًا حتى يُسمع له نبرةٌ قوية. حروفها خمسة يجمعها قولنا: «قطب جد».",
    rules: [
      { id: "qalqalah_sughra", name: "القلقلة الصغرى", color: "sky", letters: "ق ط ب ج د", kids: "حرف القلقلة ساكن في وسط الكلمة أو الكلام: ارتدادٌ خفيف." },
      { id: "qalqalah_kubra", name: "القلقلة الكبرى", color: "coral", letters: "ق ط ب ج د", kids: "حرف القلقلة في آخر الكلمة عندما نقف عليه، وأكثر ذلك في آخر الآية: ارتدادٌ أوضح." },
    ],
    examples: [
      { surah: 112, ayah: 3, words: [1], ruleId: "qalqalah_sughra" },
      { surah: 112, ayah: 3, words: [3], ruleId: "qalqalah_kubra" },
      { surah: 113, ayah: 1, words: [3], ruleId: "qalqalah_kubra" },
      { surah: 111, ayah: 1, words: [4], ruleId: "qalqalah_kubra" },
    ],
    quiz: [
      { q: "ما الكلمة التي تجمع حروف القلقلة؟", options: ["قطب جد", "ينمو", "خص ضغط قظ"], answer: 0, why: "«قطب جد»: ق ط ب ج د." },
      { q: "متى تكون القلقلة كبرى؟", options: ["عند الوقف على حرف القلقلة", "إذا كان الحرف متحرّكًا", "في أوّل الكلمة"], answer: 0, why: "تكون كبرى عند الوقف." },
    ],
    review: "approved",
  },
  {
    id: "heavy",
    title: "التفخيم والترقيق",
    subtitle: "حروفٌ ممتلئة وحروفٌ خفيفة",
    tone: "sky",
    intro: "بعض الحروف ننطقها ممتلئةً بالصوت (مفخّمة)، وبعضها خفيفةً (مرقّقة). حروف الاستعلاء المفخّمة دائمًا يجمعها قولنا: «خصّ ضغطٍ قظ».",
    rules: [
      { id: "tafkheem", name: "حروف التفخيم", color: "coral", letters: "خ ص ض غ ط ق ظ", kids: "ننطقها والفم ممتلئ، كأننا نقول صوتًا كبيرًا." },
      { id: "lam_heavy", name: "لام لفظ الجلالة المفخّمة", color: "sun", kids: "إذا جاء قبل كلمة «الله» فتحٌ أو ضمّ نفخّم اللام." },
      { id: "lam_light", name: "لام لفظ الجلالة المرقّقة", color: "mint", kids: "إذا جاء قبلها كسرٌ نرقّق اللام ونجعلها خفيفة." },
    ],
    examples: [
      { surah: 1, ayah: 6, words: [1], ruleId: "tafkheem" },
      { surah: 114, ayah: 4, words: [3], ruleId: "tafkheem" },
      { surah: 112, ayah: 1, words: [1, 2], ruleId: "lam_heavy" },
      { surah: 1, ayah: 1, words: [0, 1], ruleId: "lam_light" },
    ],
    quiz: [
      { q: "أيّ هذه الحروف يُفخّم دائمًا؟", options: ["الصاد", "السين", "الميم"], answer: 0, why: "الصاد من حروف الاستعلاء والإطباق." },
      { q: "تُرقّق لام لفظ الجلالة إذا سبقها…", options: ["فتح", "ضم", "كسر"], answer: 2, why: "مع الكسر تُرقّق." },
    ],
    review: "approved",
  },
  {
    id: "lam",
    title: "اللام الشمسية والقمرية",
    subtitle: "متى نسمع لام «ال» ومتى تختفي؟",
    tone: "sun",
    intro: "«ال» في أوّل الكلمة لها حالتان: نسمع اللام واضحةً مع الحروف القمرية، وتختفي اللام ويُشدَّد الحرف بعدها مع الحروف الشمسية.",
    rules: [
      { id: "lam_qamariya", name: "اللام القمرية", color: "sky", letters: "أ ب غ ح ج ك و خ ف ع ق ي م هـ", kids: "نقرأ اللام واضحة. حروفها تجمعها جملة: «ابغِ حجّك وخف عقيمه»." },
      { id: "lam_shamsiya", name: "اللام الشمسية", color: "coral", letters: "ت ث د ذ ر ز س ش ص ض ط ظ ل ن", kids: "تختفي اللام، ونشدّد الحرف الذي بعدها." },
    ],
    examples: [
      { surah: 1, ayah: 2, words: [0], ruleId: "lam_qamariya" },
      { surah: 1, ayah: 2, words: [3], ruleId: "lam_qamariya" },
      { surah: 1, ayah: 3, words: [0], ruleId: "lam_shamsiya" },
      { surah: 114, ayah: 1, words: [3], ruleId: "lam_shamsiya" },
    ],
    quiz: [
      { q: "في اللام الشمسية…", options: ["تختفي اللام ويُشدّد ما بعدها", "تظهر اللام واضحة", "تُمدّ اللام"], answer: 0, why: "اللام الشمسية تُدغم في الحرف الذي بعدها." },
      { q: "أيّ حرفٍ من الحروف القمرية؟", options: ["القاف", "الشين", "النون"], answer: 0, why: "القاف من حروف «ابغِ حجّك وخف عقيمه»." },
    ],
    review: "approved",
  },
  {
    id: "ghunnah",
    title: "الغنّة والنون والميم المشدّدتان",
    subtitle: "صوتٌ جميل يخرج من الأنف",
    tone: "mint",
    intro: "الغنّة صوتٌ رخيم يخرج من الخيشوم (الأنف). إذا جاءت النون أو الميم مشدّدة، نُظهر الغنّة كاملةً بمقدار حركتين.",
    rules: [
      { id: "ghunnah_noon", name: "النون المشدّدة", color: "mint", letters: "نّ", kids: "نونٌ عليها شدّة: نمسك صوتها في الأنف قليلًا." },
      { id: "ghunnah_meem", name: "الميم المشدّدة", color: "lilac", letters: "مّ", kids: "ميمٌ عليها شدّة: نغلق الشفتين ونُخرج الصوت من الأنف." },
    ],
    examples: [
      { surah: 108, ayah: 3, words: [0], ruleId: "ghunnah_noon" },
      { surah: 108, ayah: 1, words: [0], ruleId: "ghunnah_noon" },
      { surah: 78, ayah: 1, words: [0], ruleId: "ghunnah_meem" },
      { surah: 102, ayah: 4, words: [0], ruleId: "ghunnah_meem" },
    ],
    quiz: [
      { q: "من أين تخرج الغنّة؟", options: ["من الخيشوم", "من الحلق", "من الشفتين"], answer: 0, why: "الخيشوم مخرج الغنّة." },
      { q: "كم حركةً نُطيل الغنّة في النون المشدّدة؟", options: ["حركتين", "ست حركات", "لا نطيلها"], answer: 0, why: "مقدار الغنّة حركتان." },
    ],
    review: "approved",
  },
  {
    id: "ra",
    title: "أحكام الراء",
    subtitle: "متى تكون الراء ثقيلة ومتى تكون خفيفة؟",
    tone: "coral",
    intro: "الراء حرفٌ يُفخَّم أحيانًا ويُرقَّق أحيانًا، ونعرف ذلك من حركتها أو من حركة ما قبلها.",
    rules: [
      { id: "ra_heavy", name: "الراء المفخّمة", color: "coral", kids: "إذا كانت الراء مفتوحةً أو مضمومة، أو ساكنةً قبلها فتحٌ أو ضمّ، نقرؤها ثقيلةً ممتلئة." },
      { id: "ra_light", name: "الراء المرقّقة", color: "sky", kids: "إذا كانت الراء مكسورة، أو ساكنةً قبلها كسرٌ أصليّ وليس بعدها حرف استعلاء في الكلمة نفسها، نقرؤها خفيفة." },
    ],
    examples: [
      { surah: 114, ayah: 1, words: [2], ruleId: "ra_heavy" },
      { surah: 110, ayah: 1, words: [2], ruleId: "ra_heavy" },
      { surah: 106, ayah: 2, words: [1], ruleId: "ra_light" },
      { surah: 89, ayah: 10, words: [0], ruleId: "ra_light" },
    ],
    quiz: [
      { q: "الراء المفتوحة تكون…", options: ["مفخّمة", "مرقّقة", "ساكنة"], answer: 0, why: "الراء المفتوحة تُفخَّم." },
      { q: "الراء المكسورة تكون…", options: ["مرقّقة", "مفخّمة", "مقلقلة"], answer: 0, why: "الكسر يرقّق الراء." },
    ],
    review: "approved",
  },
  {
    id: "madd2",
    title: "مدودٌ أخرى",
    subtitle: "البدل والعِوَض واللين",
    tone: "sun",
    intro: "بعد المدّ الطبيعي والمتّصل والمنفصل، نتعرّف على ثلاثة مدودٍ أخرى نقابلها كثيرًا في القراءة.",
    rules: [
      { id: "madd_badal", name: "مدّ البدل", color: "lilac", kids: "همزةٌ يأتي بعدها حرف مدّ، مثل «ءا»، فنمدّ حركتين." },
      { id: "madd_iwad", name: "مدّ العِوَض", color: "sun", kids: "عندما نقف على تنوين الفتح نقلبه ألفًا ونمدّ حركتين." },
      { id: "madd_leen", name: "مدّ اللين", color: "teal", kids: "واوٌ أو ياءٌ ساكنة قبلها فتح، ونقف على الحرف الذي بعدها، فنمدّ مدًّا ليّنًا: حركتين أو أربعًا أو ستًّا." },
    ],
    examples: [
      { surah: 103, ayah: 3, words: [2], ruleId: "madd_badal" },
      { surah: 110, ayah: 2, words: [6], ruleId: "madd_iwad" },
      { surah: 106, ayah: 1, words: [1], ruleId: "madd_leen" },
      { surah: 106, ayah: 3, words: [3], ruleId: "madd_leen" },
    ],
    quiz: [
      { q: "عند الوقف على تنوين الفتح نقرؤه…", options: ["ألفًا ممدودة حركتين", "نونًا", "نحذفه"], answer: 0, why: "هذا مدّ العِوَض." },
      { q: "في مدّ البدل تأتي الهمزة…", options: ["قبل حرف المدّ", "بعد حرف المدّ", "في آخر الآية فقط"], answer: 0, why: "يتقدّم الهمز على حرف المدّ." },
    ],
    review: "approved",
  },
  {
    id: "idgham2",
    title: "المتماثلان والمتجانسان والمتقاربان",
    subtitle: "حرفان يلتقيان فيدخل أحدهما في الآخر",
    tone: "lilac",
    intro: "إذا التقى حرفان وكان الأوّل ساكنًا والثاني متحرّكًا، فقد يُدغم الأوّل في الثاني بحسب علاقتهما في المخرج والصفة.",
    rules: [
      { id: "mithlayn", name: "المتماثلان", color: "mint", kids: "حرفان متشابهان تمامًا: الأوّل ساكن، فيصيران حرفًا واحدًا مشدّدًا." },
      { id: "mutajanisayn", name: "المتجانسان", color: "sky", kids: "حرفان يخرجان من المكان نفسه، لكنّ صوتيهما مختلفان قليلًا." },
      { id: "mutaqaribayn", name: "المتقاربان", color: "coral", kids: "حرفان مكاناهما قريبان من بعض، كاللام والراء." },
    ],
    examples: [
      { surah: 26, ayah: 63, words: [4, 5], ruleId: "mithlayn" },
      { surah: 2, ayah: 256, words: [4, 5], ruleId: "mutajanisayn" },
      { surah: 17, ayah: 24, words: [6, 7], ruleId: "mutaqaribayn" },
      { surah: 77, ayah: 20, words: [1], ruleId: "mutaqaribayn" },
    ],
    quiz: [
      { q: "باءٌ ساكنة بعدها باء، هذا…", options: ["متماثلان", "متجانسان", "متقاربان"], answer: 0, why: "الحرفان متطابقان." },
      { q: "اللام الساكنة مع الراء من…", options: ["المتقاربين", "المتماثلين", "الإظهار"], answer: 0, why: "مخرجاهما متقاربان." },
    ],
    review: "approved",
  },
  {
    id: "waqf",
    title: "علامات الوقف",
    subtitle: "إشاراتٌ صغيرة تعلّمنا أين نقف",
    tone: "sky",
    intro: "في المصحف علاماتٌ صغيرة فوق الكلمات، تخبرنا هل نقف أو نصل، حتى يبقى المعنى صحيحًا وواضحًا.",
    rules: [
      { id: "waqf_lazim", name: "الوقف اللازم", color: "coral", letters: "م", kids: "علامة «م»: يجب أن نقف هنا." },
      { id: "waqf_la", name: "الوقف الممنوع", color: "lilac", letters: "لا", kids: "علامة «لا»: لا نقف هنا، إلا إذا كانت على رأس آية." },
      { id: "waqf_jaiz", name: "الوقف الجائز", color: "mint", letters: "ج", kids: "علامة «ج»: نقف أو نصل، الأمران سواء." },
      { id: "waqf_sila", name: "الوصل أولى", color: "sky", letters: "صلى", kids: "علامة «صلى»: الأفضل أن نصل." },
      { id: "waqf_qila", name: "الوقف أولى", color: "sun", letters: "قلى", kids: "علامة «قلى»: الأفضل أن نقف." },
      { id: "waqf_muanaqa", name: "وقف المعانقة", color: "teal", letters: "∴ ∴", kids: "ثلاث نقاط في مكانين: نقف عند أحدهما فقط." },
    ],
    examples: [
      { surah: 2, ayah: 26, words: [27], ruleId: "waqf_lazim" },
      { surah: 79, ayah: 27, words: [4], ruleId: "waqf_jaiz" },
      { surah: 78, ayah: 37, words: [5], ruleId: "waqf_sila" },
      { surah: 2, ayah: 13, words: [11], ruleId: "waqf_qila" },
      { surah: 2, ayah: 2, words: [3, 4], ruleId: "waqf_muanaqa" },
    ],
    quiz: [
      { q: "علامة «م» تعني…", options: ["يجب الوقف", "يُمنع الوقف", "الوصل أولى"], answer: 0, why: "«م» علامة الوقف اللازم." },
      { q: "علامة «صلى» تعني…", options: ["الوصل أولى", "الوقف أولى", "الوقف لازم"], answer: 0, why: "«صلى» تعني أنّ الوصل أفضل." },
      { q: "في وقف المعانقة…", options: ["نقف عند أحد الموضعين فقط", "نقف عندهما معًا", "لا نقف أبدًا"], answer: 0, why: "لا يُجمع بين الوقفين." },
    ],
    review: "approved",
  },
  {
    id: "makharij",
    title: "مخارج الحروف",
    subtitle: "من أين يخرج كلّ حرف؟",
    tone: "mint",
    intro: "لكلّ حرفٍ مكانٌ يخرج منه يُسمّى «المخرج». المخارج العامة خمسة: الجوف، والحلق، واللسان، والشفتان، والخيشوم.",
    rules: [
      { id: "jawf", name: "الجوف", color: "sky", letters: "ا و ي (حروف المدّ)", kids: "الفراغ داخل الفم والحلق، ومنه تخرج حروف المدّ." },
      { id: "halq", name: "الحلق", color: "coral", letters: "ء هـ ع ح غ خ", kids: "من الحلق تخرج ستة حروف: أوّله وأوسطه وآخره." },
      { id: "lisan", name: "اللسان", color: "sun", letters: "ق ك ج ش ي ض ل ن ر ط د ت ص ز س ظ ذ ث", kids: "اللسان أكبر مخرج، ومنه ثمانية عشر حرفًا." },
      { id: "shafatan", name: "الشفتان", color: "lilac", letters: "ف و ب م", kids: "من الشفتين تخرج الفاء والواو والباء والميم." },
      { id: "khayshum", name: "الخيشوم", color: "mint", kids: "أعلى الأنف من الداخل، ومنه تخرج الغنّة." },
    ],
    examples: [],
    quiz: [
      { q: "من أين تخرج الباء والميم؟", options: ["الحلق", "الشفتين", "الخيشوم"], answer: 1, why: "تخرجان بانطباق الشفتين." },
      { q: "كم حرفًا يخرج من الحلق؟", options: ["ثلاثة", "ستة", "ثمانية عشر"], answer: 1, why: "ء هـ ع ح غ خ." },
      { q: "الغنّة تخرج من…", options: ["الخيشوم", "اللسان", "الجوف"], answer: 0, why: "الخيشوم مخرج الغنة." },
    ],
    review: "approved",
  },
  {
    id: "sifat",
    title: "صفات الحروف",
    subtitle: "شخصية كلّ حرف",
    tone: "teal",
    intro: "الصفة هي الكيفية التي يُنطق بها الحرف: هل يجري معه النَّفَس؟ هل يقوى صوته؟ بعض الصفات لها أضداد.",
    rules: [
      { id: "hams", name: "الهمس", color: "sky", letters: "ف ح ث هـ ش خ ص س ك ت", kids: "يجري النَّفَس مع الحرف، كأنك تهمس. يجمعها «فحثّه شخصٌ سكت»." },
      { id: "shiddah", name: "الشدّة", color: "coral", letters: "أ ج د ق ط ب ك ت", kids: "ينحبس الصوت مع الحرف لقوّته. يجمعها «أجد قط بكت»." },
      { id: "istilaa", name: "الاستعلاء", color: "sun", letters: "خ ص ض غ ط ق ظ", kids: "يرتفع اللسان إلى أعلى الفم، فيمتلئ الصوت." },
      { id: "qalqalah_sifa", name: "القلقلة", color: "lilac", letters: "ق ط ب ج د", kids: "ارتدادٌ في الصوت عند سكون الحرف." },
    ],
    examples: [],
    quiz: [
      { q: "«أجد قط بكت» تجمع حروف…", options: ["الهمس", "الشدّة", "الاستعلاء"], answer: 1, why: "هي حروف الشدّة الثمانية." },
      { q: "ما ضدّ صفة الاستعلاء؟", options: ["الاستفال", "الهمس", "القلقلة"], answer: 0, why: "الاستفال انخفاض اللسان." },
    ],
    review: "approved",
  },
];

export const ruleById = (id: string) => {
  for (const l of LESSONS) {
    const r = l.rules.find((x) => x.id === id);
    if (r) return { rule: r, lesson: l };
  }
  return null;
};

export const RULE_STYLES: Record<RuleColor, { text: string; bg: string; ring: string; dot: string }> = {
  teal: { text: "text-teal-700", bg: "bg-teal-100", ring: "ring-teal-400", dot: "bg-teal-500" },
  lilac: { text: "text-lilac-600", bg: "bg-lilac-100", ring: "ring-lilac-400", dot: "bg-lilac-500" },
  sun: { text: "text-sun-600", bg: "bg-sun-100", ring: "ring-sun-400", dot: "bg-sun-500" },
  coral: { text: "text-coral-500", bg: "bg-coral-100", ring: "ring-coral-400", dot: "bg-coral-500" },
  sky: { text: "text-sky-500", bg: "bg-sky-100", ring: "ring-sky-400", dot: "bg-sky-500" },
  mint: { text: "text-mint-600", bg: "bg-mint-100", ring: "ring-mint-400", dot: "bg-mint-500" },
};

/** Letters for the "Match the Letters" game, grouped by general makhraj (educational data). */
export const LETTER_MAKHRAJ: { letter: string; makhraj: "halq" | "lisan" | "shafatan" | "jawf" }[] = [
  { letter: "ع", makhraj: "halq" },
  { letter: "ح", makhraj: "halq" },
  { letter: "غ", makhraj: "halq" },
  { letter: "خ", makhraj: "halq" },
  { letter: "هـ", makhraj: "halq" },
  { letter: "ء", makhraj: "halq" },
  { letter: "ب", makhraj: "shafatan" },
  { letter: "م", makhraj: "shafatan" },
  { letter: "ف", makhraj: "shafatan" },
  { letter: "ق", makhraj: "lisan" },
  { letter: "ك", makhraj: "lisan" },
  { letter: "ل", makhraj: "lisan" },
  { letter: "ر", makhraj: "lisan" },
  { letter: "ت", makhraj: "lisan" },
  { letter: "س", makhraj: "lisan" },
  { letter: "ض", makhraj: "lisan" },
  { letter: "ش", makhraj: "lisan" },
  { letter: "ن", makhraj: "lisan" },
];
export const MAKHRAJ_NAME = { halq: "الحلق", lisan: "اللسان", shafatan: "الشفتان", jawf: "الجوف" } as const;
