import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { certInfo } from "@/data/certificates";
import { canvasToBlob, certSerial, drawCertificate } from "@/lib/certificate";
import { formatGregorian, formatHijri } from "@/lib/hijri";
import type { ChildProfile } from "@/lib/store";
import { isNative, saveFile } from "@/lib/native";

/** Renders one certificate and offers download, print and share. */
export function CertificateView({ id, date, child, compact = false }: { id: string; date: string; child: ChildProfile; compact?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const info = certInfo(id);
  const gender = child.gender ?? (child.avatar.headwear === "hijab" ? "f" : "m");

  useEffect(() => {
    if (!canvas.current || !info) return;
    setReady(false);
    const d = new Date(`${date}T12:00:00`);
    drawCertificate(canvas.current, {
      name: child.name,
      achievement: info.achievement(gender),
      dateHijri: formatHijri(d),
      dateGregorian: formatGregorian(d),
      serial: certSerial(id, child.id),
      gender,
    }).then(() => setReady(true));
  }, [id, date, child.name, child.id, gender, info]);

  if (!info) return null;
  const native = isNative();
  const fileName = `شهادة-رفق-${info.label}.png`.replace(/\s+/g, "-");

  const download = async () => {
    const blob = canvas.current && (await canvasToBlob(canvas.current));
    if (!blob) return;
    const r = await saveFile(blob, fileName, "شهادة تقدير من رِفق");
    if (r === "saved") setMsg("تمّ حفظ الشهادة كصورة.");
    else if (r === "shared") setMsg("اختر «حفظ الصورة» أو أيّ تطبيقٍ لمشاركة الشهادة.");
  };

  const print = () => {
    if (!canvas.current) return;
    const holder = document.createElement("div");
    holder.id = "rifq-print";
    const img = document.createElement("img");
    img.src = canvas.current.toDataURL("image/png");
    holder.appendChild(img);
    document.body.appendChild(holder);
    const done = () => holder.remove();
    window.addEventListener("afterprint", done, { once: true });
    img.onload = () => {
      try {
        window.print();
      } catch {
        setMsg("الطباعة غير متاحة هنا، حمّل الصورة واطبعها.");
        done();
      }
    };
  };

  const share = async () => {
    const blob = canvas.current && (await canvasToBlob(canvas.current));
    if (!blob) return;
    if (native) {
      await saveFile(blob, fileName, "شهادة تقدير من رِفق");
      return;
    }
    const file = new File([blob], fileName, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "شهادة تقدير من رِفق", text: `${child.name} — ${info.achievement(gender)}` });
      } catch {
        /* cancelled */
      }
    } else {
      download();
    }
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-cream-200 shadow-lift ring-1 ring-cream-300">
        {!ready && <div className="absolute inset-0 animate-pulse bg-cream-100" />}
        <canvas ref={canvas} className="block h-auto w-full" style={{ aspectRatio: "2000 / 1414" }} aria-label={`شهادة تقدير: ${info.achievement(gender)}`} role="img" />
      </div>
      {!compact && (
        <>
          <div className={`mt-4 grid gap-2 ${native ? "grid-cols-2" : "grid-cols-3"}`}>
            <Button onClick={download} disabled={!ready}>
              {native ? "حفظ" : "تحميل"}
            </Button>
            {/* Printing is not available inside the app; saving the image lets parents print it from the gallery. */}
            {!native && (
              <Button tone="white" onClick={print} disabled={!ready}>
                طباعة
              </Button>
            )}
            <Button tone="sun" onClick={share} disabled={!ready}>
              مشاركة
            </Button>
          </div>
          {msg && <p className="mt-2 text-center text-sm font-bold text-teal-700">{msg}</p>}
        </>
      )}
    </div>
  );
}
