import { useState } from "react";
import { IconAlarm, IconBook, IconCalendar, IconCheck, IconFamily, IconShield, IconStar } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Link } from "@/components/shell/Link";
import { Button, Card } from "@/components/ui";
import { shareApp } from "@/lib/native";

const ITEMS = [
  { href: "/motivate", title: "تحفيز طفلك", text: "هديةٌ تعدونه بها، ورسالةٌ صوتية منكم تفرحه عند الوصول", icon: IconStar, tone: "bg-sun-100 text-sun-600" },
  { href: "/family", title: "متابعة الأبناء", text: "ملفّ لكلّ طفل، وهدفه الأسبوعي، وتقدّمه وانتظامه", icon: IconFamily, tone: "bg-teal-100 text-teal-700" },
  { href: "/login", title: "حساب العائلة", text: "مزامنة التقدّم بين الأجهزة، وحذف الحساب (اختياري)", icon: IconShield, tone: "bg-sky-100 text-sky-500" },
  { href: "/fajr", title: "منبّه الفجر", text: "اضبط المدينة والموعد والتحدّيات لطفلك", icon: IconAlarm, tone: "bg-lilac-100 text-lilac-600" },
  { href: "/app", title: "التذكير وبيانات الجهاز", text: "تذكيرٌ يوميّ بالوِرد، ومسح بيانات رِفق من الهاتف", icon: IconCalendar, tone: "bg-sun-100 text-sun-600" },
  { href: "/privacy", title: "سياسة الخصوصية", text: "ما الذي يحفظه رِفق وأين", icon: IconBook, tone: "bg-mint-100 text-mint-600" },
  { href: "/sources", title: "مصادر المحتوى", text: "مصدر نصّ المصحف والتفسير والأذكار وتراخيصها", icon: IconStar, tone: "bg-coral-100 text-coral-500" },
];

/** Parents' corner (behind the parental gate). */
export function Parents() {
  const [shared, setShared] = useState<"" | "copied" | "failed">("");
  const share = async () => {
    const r = await shareApp();
    setShared(r === "shared" ? "" : r);
  };
  return (
    <AppShell>
      <p className="text-sm font-bold text-teal-600">لبابا وماما</p>
      <h1 className="font-display text-4xl font-extrabold">ركن الوالدين</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {ITEMS.map((it) => (
          <Link key={it.href} href={it.href} className="card-3d flex items-center gap-4 p-4">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${it.tone}`}>
              <it.icon size={28} />
            </span>
            <span>
              <span className="block font-display text-lg font-extrabold">{it.title}</span>
              <span className="block text-sm text-ink-500">{it.text}</span>
            </span>
          </Link>
        ))}
      </div>
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="font-display text-lg font-extrabold">شارك رِفق</div>
          <div className="text-sm text-ink-500">صدقةٌ جارية عن الوالد مجدي، والدالّ على الخير كفاعله.</div>
        </div>
        <Button tone="sun" onClick={share}>
          {shared === "copied" ? (
            <>
              <IconCheck size={18} /> نُسخ النصّ
            </>
          ) : (
            "شارك التطبيق"
          )}
        </Button>
      </Card>
    </AppShell>
  );
}
