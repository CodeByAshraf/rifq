import { Link } from "@/components/shell/Link";
import { usePathname } from "@/lib/router";
import type { ReactNode } from "react";
import { Logo } from "@/components/art/GameArt";
import { Character } from "@/components/art/Character";
import {
  IconBook, IconFlame, IconHome, IconLantern, IconMap, IconPuzzle, IconSprout, IconStories, IconStar,
} from "@/components/art/Icons";
import { StarCount } from "@/components/ui";
import { SoundToggle } from "@/components/shell/Fx";
import { CertificateAnnouncer } from "@/components/certificates/CertificateAnnouncer";
import { MotivationAnnouncer } from "@/components/shell/MotivationAnnouncer";
import { ReminderBanner } from "@/components/shell/ReminderBanner";
import { streak, useChild } from "@/lib/store";
import { isAdultArea } from "@/lib/area";
import { IconAlarm, IconSparkle } from "@/components/art/Icons";

// Mobile bottom bar shows items without `desktopOnly`; "المزيد" opens every other section.
const NAV = [
  { href: "/kids", label: "عالمي", icon: IconHome },
  { href: "/quran", label: "المصحف", icon: IconBook },
  { href: "/memorize", label: "الحفظ", icon: IconSprout },
  { href: "/tajweed", label: "التجويد", icon: IconLantern, desktopOnly: true },
  { href: "/play", label: "العب", icon: IconPuzzle },
  { href: "/stories", label: "قصص", icon: IconStories, desktopOnly: true },
  { href: "/certificates", label: "شهاداتي", icon: IconStar },
  { href: "/more", label: "المزيد", icon: IconMap },
];

// The adults' corner: calm layout, its own navigation.
const ADULT_NAV = [
  { href: "/adults", label: "الرئيسية", icon: IconHome },
  { href: "/mushaf", label: "المصحف", icon: IconBook },
  { href: "/adults-adhkar", label: "الأذكار", icon: IconSparkle },
  { href: "/adults-fajr", label: "منبّه الفجر", icon: IconAlarm },
];

function AdultShell({ children, path }: { children: ReactNode; path: string }) {
  return (
    <div className="min-h-dvh bg-[#fbf8f2]">
      <header className="sticky top-0 z-40 border-b border-ink-300/25 bg-[#fbf8f2]/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/adults" className="flex items-center gap-2" aria-label="ركن الكبار">
            <Logo size={34} />
            <span className="font-display text-lg font-extrabold text-ink-900">ركن الكبار</span>
          </Link>
          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="ركن الكبار">
            {ADULT_NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`rounded-xl px-3 py-2 text-sm font-bold ${path === n.href ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-white"}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/kids" className="mr-auto rounded-xl bg-white px-3 py-2 text-xs font-bold text-teal-700 ring-1 ring-ink-300/30 lg:mr-0">
            عالم الأطفال
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 lg:pb-16">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-300/25 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="ركن الكبار">
        <div className="mx-auto flex max-w-md justify-around px-2 py-1.5">
          {ADULT_NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center gap-0.5 py-1" aria-current={active ? "page" : undefined}>
                <n.icon size={22} className={active ? "text-teal-700" : "text-ink-500"} />
                <span className={`text-[11px] font-bold ${active ? "text-teal-700" : "text-ink-500"}`}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const path = usePathname();
  if (isAdultArea(path)) return <AdultShell path={path}>{children}</AdultShell>;
  return <KidsShell wide={wide}>{children}</KidsShell>;
}

function KidsShell({ children, wide }: { children: ReactNode; wide: boolean }) {
  const path = usePathname();
  const { child, data } = useChild();
  const s = streak(data.activeDays);

  return (
    <div className="min-h-dvh sky-bg">
      <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className={`mx-auto mt-3 flex max-w-6xl items-center gap-3 rounded-[1.6rem] px-3 py-2 sm:px-4 glass shadow-soft mx-3 sm:mx-auto`}>
          <Link href="/kids" className="flex items-center gap-2" aria-label="رِفق — عالمي">
            <Logo size={38} />
            <span className="font-display text-xl font-extrabold text-teal-700">رِفق</span>
          </Link>

          <nav className="mx-auto hidden items-center gap-0.5 lg:flex" aria-label="التنقل الرئيسي">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-2.5 py-2 font-display text-[14px] font-bold transition xl:px-3 xl:text-[15px] ${
                    active ? "bg-teal-500 text-white shadow-[0_4px_0_#0d7870]" : "text-ink-700 hover:bg-white/70"
                  }`}
                >
                  <n.icon size={18} className="hidden xl:block" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mr-auto flex items-center gap-2 lg:mr-0">
            <span className="hidden items-center gap-1 rounded-full bg-coral-100 px-3 py-1.5 font-display font-bold text-coral-500 sm:inline-flex" title="أيام متتالية">
              <IconFlame size={18} /> {s.toLocaleString("ar-EG")}
            </span>
            <StarCount n={data.stars} />
            <SoundToggle />
            <Link href="/kids" className="grid h-11 w-11 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-sky-200 to-teal-100 ring-2 ring-white" aria-label={`ملف ${child.name}`}>
              <Character avatar={child.avatar} size={44} />
            </Link>
          </div>
        </div>
      </header>

      <ReminderBanner />
      <main className={`mx-auto px-4 pb-32 pt-6 lg:pb-16 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>{children}</main>
      <CertificateAnnouncer />
      <MotivationAnnouncer />

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 lg:hidden" aria-label="التنقل السفلي">
        <div className="flex justify-around rounded-[1.6rem] px-2 py-2 glass shadow-lift">
          {NAV
            .filter((n) => !n.desktopOnly)
            .map((n) => {
              const active = path === n.href;
              return (
                <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center gap-0.5 py-1" aria-current={active ? "page" : undefined}>
                  <span className={`grid h-10 w-11 place-items-center rounded-2xl transition ${active ? "bg-teal-500 text-white shadow-[0_3px_0_#0d7870]" : "text-ink-500"}`}>
                    <n.icon size={22} />
                  </span>
                  <span className={`whitespace-nowrap text-[10.5px] font-bold ${active ? "text-ink-900" : "text-ink-500"}`}>{n.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
