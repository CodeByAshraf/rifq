import { Link } from "@/components/shell/Link";
import { usePathname } from "@/lib/router";
import type { ReactNode } from "react";
import { Logo } from "@/components/art/GameArt";
import { Character } from "@/components/art/Character";
import {
  IconBook, IconChart, IconFamily, IconFlame, IconHome, IconLantern, IconMap, IconPuzzle, IconRefresh, IconSprout, IconStories, IconStar,
} from "@/components/art/Icons";
import { StarCount } from "@/components/ui";
import { SoundToggle } from "@/components/shell/Fx";
import { CertificateAnnouncer } from "@/components/certificates/CertificateAnnouncer";
import { ReminderBanner } from "@/components/shell/ReminderBanner";
import { actions, streak, useChild, useProgress } from "@/lib/store";

// Mobile bottom bar shows items without `desktopOnly`; "المزيد" opens every other section.
const KIDS_NAV = [
  { href: "/kids", label: "عالمي", icon: IconHome },
  { href: "/quran", label: "المصحف", icon: IconBook },
  { href: "/memorize", label: "الحفظ", icon: IconSprout },
  { href: "/tajweed", label: "التجويد", icon: IconLantern, desktopOnly: true },
  { href: "/play", label: "العب", icon: IconPuzzle },
  { href: "/stories", label: "قصص", icon: IconStories, desktopOnly: true },
  { href: "/certificates", label: "شهاداتي", icon: IconStar },
  { href: "/more", label: "المزيد", icon: IconMap },
];

const ADULT_NAV = [
  { href: "/adult", label: "لوحتي", icon: IconChart },
  { href: "/quran", label: "المصحف", icon: IconBook },
  { href: "/memorize", label: "الحفظ", icon: IconSprout },
  { href: "/revision", label: "المراجعة", icon: IconRefresh },
  { href: "/tajweed", label: "التجويد", icon: IconLantern, desktopOnly: true },
  { href: "/family", label: "العائلة", icon: IconFamily, desktopOnly: true },
  { href: "/more", label: "المزيد", icon: IconMap },
];

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const mode = useProgress((s) => s.mode);
  const path = usePathname();
  const { child, data } = useChild();
  const nav = mode === "kids" ? KIDS_NAV : ADULT_NAV;
  const isKids = mode === "kids";
  const s = streak(data.activeDays);

  return (
    <div className={`min-h-dvh ${isKids ? "sky-bg" : "adult-bg"}`}>
      <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className={`mx-auto mt-3 flex max-w-6xl items-center gap-3 rounded-[1.6rem] px-3 py-2 sm:px-4 ${isKids ? "glass shadow-soft" : "border border-ink-300/30 bg-white/85 backdrop-blur"} mx-3 sm:mx-auto`}>
          <Link href="/" className="flex items-center gap-2" aria-label="رِفق — الصفحة الرئيسية">
            <Logo size={38} />
            <span className="font-display text-xl font-extrabold text-teal-700">رِفق</span>
          </Link>

          <nav className="mx-auto hidden items-center gap-0.5 lg:flex" aria-label="التنقل الرئيسي">
            {nav.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-2.5 py-2 font-display text-[14px] font-bold transition xl:px-3 xl:text-[15px] ${
                    active ? (isKids ? "bg-teal-500 text-white shadow-[0_4px_0_#0d7870]" : "bg-ink-900 text-white") : "text-ink-700 hover:bg-white/70"
                  }`}
                >
                  <n.icon size={18} className="hidden xl:block" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mr-auto flex items-center gap-2 lg:mr-0">
            {isKids && (
              <>
                <span className="hidden items-center gap-1 rounded-full bg-coral-100 px-3 py-1.5 font-display font-bold text-coral-500 sm:inline-flex" title="أيام متتالية">
                  <IconFlame size={18} /> {s.toLocaleString("ar-EG")}
                </span>
                <StarCount n={data.stars} />
              </>
            )}
            {isKids && <SoundToggle />}
            <button
              onClick={() => actions.setMode(isKids ? "adult" : "kids")}
              className="whitespace-nowrap rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold text-ink-700 ring-1 ring-ink-300/40 hover:bg-white"
              title="تبديل الواجهة"
            >
              <span className="sm:hidden">{isKids ? "الكبار" : "الأطفال"}</span>
              <span className="hidden sm:inline">{isKids ? "واجهة الكبار" : "واجهة الأطفال"}</span>
            </button>
            {isKids && (
              <Link href="/kids" className="grid h-11 w-11 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-sky-200 to-teal-100 ring-2 ring-white" aria-label={`ملف ${child.name}`}>
                <Character avatar={child.avatar} size={44} />
              </Link>
            )}
          </div>
        </div>
      </header>

      <ReminderBanner />
      <main className={`mx-auto px-4 pb-32 pt-6 lg:pb-16 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>{children}</main>
      <CertificateAnnouncer />

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 lg:hidden" aria-label="التنقل السفلي">
        <div className={`flex justify-around rounded-[1.6rem] px-2 py-2 ${isKids ? "glass shadow-lift" : "border border-ink-300/30 bg-white/95 shadow-soft"}`}>
          {nav
            .filter((n) => !n.desktopOnly)
            .map((n) => {
              const active = path === n.href;
              return (
                <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center gap-0.5 py-1" aria-current={active ? "page" : undefined}>
                  <span className={`grid h-10 w-11 place-items-center rounded-2xl transition ${active ? (isKids ? "bg-teal-500 text-white shadow-[0_3px_0_#0d7870]" : "bg-ink-900 text-white") : "text-ink-500"}`}>
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
