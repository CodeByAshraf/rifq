import { Link } from "@/components/shell/Link";
import { IconShield } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui";

/**
 * Privacy policy. The same content is shown in the app (/privacy) and rendered to the public
 * store page by scripts/build-legal.mjs (the stores require a public URL). It must match what
 * the code actually does — update it whenever data handling changes.
 */

const UPDATED = "٢٥ نوفمبر ٢٠٢٦";
const CONTACT = process.env.RIFQ_CONTACT_EMAIL;

/** `web`: the public page, where in-app links become plain text. */
type Where = "app" | "web";
const InApp = ({ where, href, children }: { where: Where; href: string; children: React.ReactNode }) =>
  where === "app" ? (
    <Link href={href} className="font-bold text-teal-700">
      {children}
    </Link>
  ) : (
    <b>{children}</b>
  );

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-xl font-extrabold text-ink-900">{title}</h2>
      <div className="mt-3 space-y-2 leading-relaxed text-ink-700">{children}</div>
    </Card>
  );
}

export function Privacy() {
  return (
    <AppShell>
      <PrivacyContent where="app" />
    </AppShell>
  );
}

/** @public (also rendered by scripts/build-legal.mjs) */
export function PrivacyContent({ where }: { where: Where }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-700">
          <IconShield size={26} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">سياسة الخصوصية</h1>
          <p className="text-ink-500">آخر تحديث: {UPDATED}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Section title="باختصار">
          <ul className="list-inside list-disc space-y-1">
            <li>لا إعلانات، ولا أدوات تتبّع أو تحليلات، ولا بيع لأيّ بيانات.</li>
            <li>يمكن استخدام رِفق كاملًا دون حساب، وتبقى كلّ البيانات على جهازك.</li>
            <li>الحساب اختياريّ، يُنشئه وليّ الأمر فقط، ويمكن حذفه من داخل التطبيق في أيّ وقت.</li>
          </ul>
        </Section>

        <Section title="ما يُحفظ على جهازك فقط">
          <p>
            أسماء الأطفال التي تكتبها وشكل شخصيّاتهم، والتقدّم في الحفظ والمراجعة والدروس والألعاب، والإنجازات والشهادات،
            ووقت التذكير. وتسجيلات «سمّع لنفسك» الصوتية تبقى على الجهاز ولا تُرفع إلى أيّ خادم.
          </p>
          <p>
            يمكنك مسح كلّ ذلك من{" "}
            <InApp where={where} href="/app">
              المزيد ← ركن الوالدين ← التذكير وبيانات الجهاز
            </InApp>
            .
          </p>
        </Section>

        <Section title="الحساب الاختياريّ والمزامنة">
          <p>
            إن أنشأ وليّ الأمر حسابًا لمزامنة التقدّم بين الأجهزة، نحفظ: البريد الإلكتروني، واسم وليّ الأمر، وأسماء الأطفال
            المعروضة وشكل شخصيّاتهم، وبيانات التقدّم المذكورة أعلاه. كلمة المرور لا نراها؛ تُحفظ مُشفّرة (bcrypt) لدى مزوّد
            المصادقة.
          </p>
          <p>
            تُخزَّن هذه البيانات لدى مزوّد الاستضافة Supabase، ولا يصل كلّ مستخدمٍ إلّا إلى بياناته. لا نطلب من الأطفال بريدًا
            إلكترونيًا ولا أيّ وسيلة تواصل.
          </p>
          <p>
            <b>حذف الحساب:</b> من شاشة الحساب ← «حذف حسابي نهائيًا»، فيُحذف الحساب وكلّ بياناته من الخادم فورًا. ويمكن طلب
            الحذف دون التطبيق أيضًا، كما في{" "}
            {where === "app" ? <InApp where={where} href="/delete-account">صفحة حذف الحساب</InApp> : <a href="delete-account.html" className="font-bold text-teal-700 underline">صفحة حذف الحساب</a>}.
          </p>
        </Section>

        <Section title="الميكروفون والإشعارات">
          <p>
            لا يُستخدم الميكروفون إلّا عندما تضغط «ابدأ التسجيل» في «سمّع لنفسك»، ولا يُحلَّل الصوت ولا يُرسَل. الإشعارات تذكيرٌ
            يوميّ تضبطه أنت ويُجدوَل على جهازك.
          </p>
        </Section>

        <Section title="منبّه الفجر والموقع">
          <p>
            يُحسب وقت الفجر على الهاتف دون إنترنت. إن اختار وليّ الأمر «استخدم موقعي التقريبي» يُطلب الموقع مرّةً واحدة، ويُقرَّب
            إلى نحو كيلومتر، ويُحفظ على الهاتف فقط ولا يُرسَل إلى أيّ جهة. ويمكن بدلًا من ذلك اختيار المدينة من القائمة.
          </p>
        </Section>

        <Section title="خدمات خارجية">
          <p>
            <b>التلاوات الصوتية</b> تُبثّ من EveryAyah.com عند الضغط على «استمع»، فيصل إليه عنوان IP الخاصّ بجهازك ورقم الآية
            المطلوبة، كأيّ موقعٍ تفتحه. <b>التحقّق من أنّك لست روبوتًا</b> عند تسجيل الدخول (إن كان مفعّلًا) تقدّمه Cloudflare.
            ولا يُرسَل إلى هذه الخدمات أيّ اسمٍ أو تقدّمٍ أو بيانات حساب.
          </p>
        </Section>

        <Section title="الأطفال">
          <p>
            رِفق تطبيقٌ للأطفال. لا يحتاج الطفل إلى حساب، ولا يعرض التطبيق إعلانات، ولا يحتوي على مشتريات داخل التطبيق، ولا
            روابط تُخرج الطفل من التطبيق. الحساب والمتابعة والإعدادات والمشاركة في «ركن الوالدين»، ولا يُفتح إلّا بعد سؤالٍ
            حسابيّ مكتوبٍ بالكلمات يجيب عنه الكبار.
          </p>
        </Section>

        <Section title="التواصل">
          <p>
            لأيّ سؤالٍ عن الخصوصية أو طلبٍ يخصّ بياناتك{CONTACT ? <> راسلنا على <b dir="ltr">{CONTACT}</b></> : " تواصل معنا"}.
          </p>
        </Section>
      </div>
    </>
  );
}
