import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconLock, IconStar } from "@/components/art/Icons";
import { CertificateView } from "@/components/certificates/CertificateView";
import { AppShell } from "@/components/shell/AppShell";
import { Card, Chip, Modal, SectionTitle } from "@/components/ui";
import { certInfo, GOALS, type CertKind } from "@/data/certificates";
import { toArabicDigits } from "@/lib/quran";
import { actions, getState, useChild } from "@/lib/store";

const KIND_STYLE: Record<CertKind, string> = {
  surah: "from-teal-400 to-teal-600",
  juz: "from-sun-400 to-sun-600",
  lesson: "from-lilac-400 to-lilac-600",
  tajweed: "from-lilac-500 to-lilac-600",
  journey: "from-mint-400 to-mint-600",
  streak: "from-coral-400 to-coral-500",
  stories: "from-sky-400 to-sky-500",
  adhkar: "from-teal-500 to-teal-700",
  challenge: "from-sun-500 to-sun-600",
  recite: "from-coral-400 to-coral-500",
};

function Medal({ kind, locked }: { kind: CertKind; locked?: boolean }) {
  return (
    <span className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${locked ? "from-cream-200 to-cream-300 text-ink-300" : `${KIND_STYLE[kind]} text-white`} shadow-soft`}>
      {locked ? <IconLock size={26} /> : <IconStar filled size={30} />}
      {!locked && <span className="absolute -bottom-1 h-2 w-10 rounded-full bg-sun-400" />}
    </span>
  );
}

export function Certificates() {
  const { child, data } = useChild();
  const earned = data.certificates ?? {};
  const [open, setOpen] = useState<string | null>(null);
  const ids = useMemo(() => Object.entries(earned).sort((a, b) => b[1].localeCompare(a[1])), [earned]);
  const locked = GOALS.filter((g) => !earned[g]);
  const gender = child.gender ?? (child.avatar.headwear === "hijab" ? "f" : "m");

  // Opened from the "new certificate" announcement
  useEffect(() => {
    const id = getState().openCert;
    if (id) {
      setOpen(id);
      actions.setOpenCert(undefined);
    }
  }, []);

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-l from-sun-400 via-sun-300 to-cream-100 p-7 shadow-lift sm:p-9">
        <div className="pattern-girih absolute inset-0 opacity-60" />
        <div className="relative flex items-center gap-5">
          <MagdyImage size={150} className="hidden shrink-0 drop-shadow-xl sm:block" />
          <div>
            <p className="font-display font-bold text-sun-600">شهاداتي</p>
            <h1 className="font-display text-4xl font-extrabold text-ink-900 sm:text-5xl">شهادات التقدير</h1>
            <p className="mt-2 max-w-lg text-ink-700">كلّ إنجازٍ كبير له شهادةٌ باسمك، تحمّلها أو تطبعها أو ترسلها لعائلتك.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip className="bg-white/80 text-ink-900">
                <IconStar filled size={14} className="text-sun-500" /> {toArabicDigits(ids.length)} شهادة
              </Chip>
              <span className="flex items-center gap-1 rounded-full bg-white/80 px-1 py-1 text-xs font-bold">
                {(["m", "f"] as const).map((g) => (
                  <button key={g} onClick={() => actions.updateChildProfile(child.id, { gender: g })} className={`rounded-full px-3 py-1 ${gender === g ? "bg-teal-500 text-white" : "text-ink-500"}`}>
                    {g === "m" ? "ولد" : "بنت"}
                  </button>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <SectionTitle title="شهاداتي" hint={ids.length ? "اضغط على الشهادة لعرضها وتحميلها" : undefined} />
        {ids.length === 0 ? (
          <Card className="flex flex-col items-center p-8 text-center">
            <MagdyImage size={160} />
            <p className="mt-3 font-display text-xl font-extrabold">أوّل شهادة تنتظرك!</p>
            <p className="mt-1 text-ink-500">احفظ سورة الفاتحة كاملة، أو أكمل درسًا في التجويد، وستظهر شهادتك هنا.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ids.map(([id, date], i) => {
              const info = certInfo(id);
              if (!info) return null;
              return (
                <motion.button key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.04 }} onClick={() => setOpen(id)} className="text-right">
                  <Card className="flex h-full items-center gap-4 p-4 transition hover:-translate-y-1">
                    <Medal kind={info.kind} />
                    <div className="min-w-0">
                      <div className="font-display text-lg font-extrabold leading-snug">{info.label}</div>
                      <div className="text-xs text-ink-500">{new Date(`${date}T12:00:00`).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                  </Card>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      {locked.length > 0 && (
        <section className="mt-8">
          <SectionTitle title="شهادات تنتظرك" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((id) => {
              const info = certInfo(id);
              if (!info) return null;
              return (
                <div key={id} className="flex items-center gap-4 rounded-[1.5rem] border-2 border-dashed border-cream-300 bg-white/60 p-4">
                  <Medal kind={info.kind} locked />
                  <div>
                    <div className="font-display font-extrabold text-ink-700">{info.label}</div>
                    <div className="text-xs text-ink-500">{info.how}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title="شهادة تقدير" wide>
        {open && earned[open] && <CertificateView id={open} date={earned[open]} child={child} />}
      </Modal>
    </AppShell>
  );
}
