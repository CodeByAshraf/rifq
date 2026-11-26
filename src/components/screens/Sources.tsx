import { IconBook } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui";
import { RECITERS } from "@/lib/quran";
import { MEANINGS_SOURCE, TAFSIR_SOURCE } from "@/lib/tafsir";
import { isNative } from "@/lib/native";

/** Where every piece of religious content comes from, with the licence terms each source requires. */

const CONTACT = process.env.RIFQ_CONTACT_EMAIL;

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  // App stores' kids rules: no links that take a child out of the app without a parental gate.
  if (isNative()) return <b className="text-teal-700">{children}</b>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-700 underline-offset-4 hover:underline" dir="auto">
      {children}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-xl font-extrabold text-ink-900">{title}</h2>
      <div className="mt-3 space-y-2 leading-relaxed text-ink-700">{children}</div>
    </Card>
  );
}

export function Sources() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-700">
          <IconBook size={26} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">المصادر والتراخيص</h1>
          <p className="text-ink-500">من أين جاء كلّ نصٍّ وصوتٍ في رِفق.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Section title="نصّ المصحف الشريف">
          <p>
            رواية حفص عن عاصم، بالرسم العثماني، وفق مصحف المدينة النبوية الصادر عن <b>مجمع الملك فهد لطباعة المصحف الشريف</b>،
            من <Ext href="https://quranenc.com">موسوعة القرآن الكريم (quranenc.com)</Ext>.
          </p>
          <p>
            بيانات النص من مشروع <Ext href="https://github.com/risan/quran-json">quran-json</Ext> لـ Risan Bagja Pradana، بترخيص{" "}
            <Ext href="https://creativecommons.org/licenses/by-sa/4.0/deed.ar">المشاع الإبداعي CC BY-SA 4.0</Ext>.
          </p>
          <p>
            <b>التعديلات:</b> لم يُغيَّر أيّ حرف. حُوّلت رموز التنوين المُظهَر من ترميز خطّ المجمع القديم إلى رموز يونيكود
            القياسية لتظهر صحيحةً في كلّ الخطوط، وصُحّح موضعان طبقًا لإصدار المجمع «UthmanicHafs v3.0»: كلمة «فادّارأتم»
            (البقرة ٧٢)، وموضع السين الصغيرة في «المصيطرون» (الطور ٣٧). ملفّات النصّ المعروضة متاحة بالترخيص نفسه
            (CC BY-SA 4.0).
          </p>
          <p>
            يُطابَق النصّ آليًّا قبل كلّ إصدارٍ للتطبيق، آيةً آيةً مع علامات الوقف والسكت والسجدة، مع إصدار مجمع الملك فهد
            UthmanicHafs v3.0 من مشروع <Ext href="https://github.com/quran-ws/quran-text">quran-text</Ext> (CC BY 4.0)، ولا
            يُبنى التطبيق إن اختلفت آيةٌ واحدة.
          </p>
        </Section>

        <Section title="مصحف ركن الكبار (صفحة بصفحة)">
          <p>
            صفحات مصحف المدينة النبوية (٦٠٤ صفحات، ١٥ سطرًا) بنصّ وتوزيع أسطر إصدار مجمع الملك فهد UthmanicHafs v3.0 من مشروع{" "}
            <Ext href="https://github.com/quran-ws/quran-text">quran-text</Ext> (CC BY 4.0). تُطابَق كلّ آيةٍ في الصفحات حرفًا
            وتشكيلًا مع النصّ المعروض في بقيّة التطبيق قبل كلّ إصدار.
          </p>
          <p>
            الخطّ: «KFGQPC HAFS Uthmanic Script» © مجمع الملك فهد لطباعة المصحف الشريف، مُضمَّنٌ كما هو دون أيّ تعديل وفق
            ترخيصه الذي يسمح بالاستخدام والنسخ والتوزيع مجانًا.
          </p>
        </Section>

        <Section title="التلاوات">
          <p>
            تسجيلات آيةً آية من <Ext href="https://everyayah.com">EveryAyah.com</Ext> بأصوات: {RECITERS.map((r) => r.name).join("، ")}.
          </p>
        </Section>

        <Section title="الحكايات المسموعة">
          <p>
            يحكي القصصَ صوتُ الهاتف نفسه (تحويل النص إلى كلام)، ويقرأ نصّ الحكاية فقط. أمّا الآيات داخل الحكايات فبتلاوة الشيخ
            محمود خليل الحصري من EveryAyah.com، ولا يُقرأ القرآن بصوتٍ مولَّد أبدًا.
          </p>
        </Section>

        <Section title="معاني الآيات">
          <p>
            {TAFSIR_SOURCE}. ومعاني الكلمات من «{MEANINGS_SOURCE}». نُقلت عبر{" "}
            <Ext href="https://github.com/fawazahmed0/quran-api">fawazahmed0/quran-api</Ext>.
          </p>
        </Section>

        <Section title="الأذكار والأدعية">
          <p>
            مختارةٌ من كتاب «حصن المسلم» للشيخ سعيد بن علي القحطاني، مشكولةً ومنسوبةً إلى مصادرها، مع بيان ما اختلف أهل
            العلم في تصحيحه. وما فيها من آياتٍ يُعرض من نصّ المصحف الموثّق أعلاه.
          </p>
        </Section>

        <Section title="القصص ودروس التجويد">
          <p>
            القصص روايةٌ مبسّطة للأطفال بألفاظنا وليست نصًّا قرآنيًا، مع ذكر مصدر كلّ قصة، والآيات المرتبطة بها تُعرض من
            المصحف. أمثلة التجويد إشاراتٌ إلى كلماتٍ في المصحف نفسه. وكلاهما معروضٌ على مختصّين للمراجعة.
          </p>
        </Section>

        <Section title="الخطوط">
          <p>Amiri Quran، وBaloo Bhaijaan 2، وReadex Pro — بترخيص SIL Open Font License 1.1.</p>
        </Section>

        <Section title="إن وجدتَ خطأً">
          <p>
            نحرص على سلامة كلّ حرف. إن لاحظتَ أيّ خطأٍ في آيةٍ أو ذكرٍ أو قصّة فأخبرنا فورًا
            {CONTACT ? (
              <>
                {" "}على <Ext href={`mailto:${CONTACT}?subject=${encodeURIComponent("ملاحظة على محتوى رِفق")}`}>{CONTACT}</Ext>
              </>
            ) : null}
            ، وسنراجعه ونصحّحه بإذن الله.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
