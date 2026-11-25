/**
 * Public "delete your account" page (Google Play requires a web link where users can ask for
 * account deletion without the app). Rendered by scripts/build-legal.mjs.
 */
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui";

const CONTACT = process.env.RIFQ_CONTACT_EMAIL;

/** In-app screen (/delete-account). */
export function DeleteAccount() {
  return (
    <AppShell>
      <DeleteAccountInfo />
    </AppShell>
  );
}

/** @public (also rendered by scripts/build-legal.mjs) */
export function DeleteAccountInfo() {
  const mail = CONTACT ? `mailto:${CONTACT}?subject=${encodeURIComponent("طلب حذف حساب رِفق")}` : undefined;
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold">حذف حساب رِفق وبياناته</h1>
      <p className="mt-2 text-ink-500">تطبيق رِفق لتعليم القرآن الكريم للأطفال والكبار</p>

      <div className="mt-6 space-y-4">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-extrabold">من داخل التطبيق (فوريّ)</h2>
          <ol className="mt-3 list-inside list-decimal space-y-1 leading-relaxed text-ink-700">
            <li>افتح رِفق وسجّل الدخول بحسابك.</li>
            <li>اذهب إلى «المزيد» ← «الحساب».</li>
            <li>اضغط «حذف حسابي نهائيًا» ثمّ «نعم، احذف حسابي».</li>
          </ol>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-extrabold">بدون التطبيق</h2>
          <p className="mt-3 leading-relaxed text-ink-700">
            أرسل رسالةً من البريد المسجّل في الحساب إلى{" "}
            {CONTACT ? (
              <a href={mail} className="font-bold text-teal-700 underline" dir="ltr">
                {CONTACT}
              </a>
            ) : (
              "بريد التواصل الخاصّ برِفق"
            )}{" "}
            بعنوان «طلب حذف حساب رِفق». نحذف الحساب خلال ٣٠ يومًا من التحقّق من أنّ الطلب صادرٌ من صاحب البريد، ونردّ عليك
            عند الانتهاء.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-extrabold">ما الذي يُحذف؟</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 leading-relaxed text-ink-700">
            <li>البريد الإلكتروني وكلمة المرور (المشفّرة) واسم وليّ الأمر.</li>
            <li>أسماء الأطفال وشكل شخصيّاتهم.</li>
            <li>التقدّم في الحفظ والمراجعة والدروس والألعاب، والإنجازات والشهادات والمحفوظات.</li>
          </ul>
          <p className="mt-3 leading-relaxed text-ink-700">
            لا نحتفظ بأيّ من هذه البيانات بعد الحذف. إن وُجدت نسخٌ احتياطية لدى مزوّد الاستضافة فإنّها تُمحى تلقائيًا خلال مدّةٍ
            لا تتجاوز ٣٠ يومًا.
          </p>
          <p className="mt-3 leading-relaxed text-ink-700">
            البيانات المحفوظة على هاتفك فقط (التقدّم دون حساب، والتسجيلات، والتذكير، ومنبّه الفجر) لا تصل إلينا أصلًا؛ تُحذف بمسح
            التطبيق أو من «المزيد» ← «التذكير وبياناتك» ← «مسح كلّ بيانات رِفق من هذا الجهاز».
          </p>
        </Card>
      </div>
    </>
  );
}
