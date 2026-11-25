import { useRouter } from "@/lib/router";
import { useEffect, useState } from "react";
import { CertificateView } from "@/components/certificates/CertificateView";
import { Button, Modal } from "@/components/ui";
import { certInfo } from "@/data/certificates";
import { playSfx } from "@/lib/fx";
import { actions, useChild } from "@/lib/store";

/** Announces a newly earned certificate with a preview, one at a time. */
export function CertificateAnnouncer() {
  const router = useRouter();
  const { child, data } = useChild();
  const pending = data.pendingCerts ?? [];
  const id = pending[0];
  const date = id ? data.certificates?.[id] : undefined;
  const [shown, setShown] = useState<string | null>(null);

  // Wait until any other celebration/dialog has been closed, then announce.
  useEffect(() => {
    if (!id || shown) return;
    let calm = 0;
    const t = setInterval(() => {
      const busy = document.querySelector('[role="dialog"]');
      calm = busy ? 0 : calm + 1;
      if (calm >= 2) {
        clearInterval(t);
        setShown(id);
        playSfx("win");
      }
    }, 400);
    return () => clearInterval(t);
  }, [id, shown]);

  const info = shown ? certInfo(shown) : null;
  const close = () => {
    if (shown) actions.dismissCert(shown);
    setShown(null);
  };

  return (
    <Modal open={!!shown && !!info && !!date} onClose={close} title="شهادة جديدة" wide>
      {shown && info && date && (
        <div className="text-center">
          <p className="font-display text-lg font-bold text-sun-600">مبروك!</p>
          <h3 className="font-display text-3xl font-extrabold">حصلتَ على شهادة تقدير</h3>
          <p className="mt-1 text-ink-500">{info.label}</p>
          <div className="mx-auto mt-4 max-w-2xl">
            <CertificateView id={shown} date={date} child={child} compact />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => {
                actions.setOpenCert(shown);
                close();
                router.push("/certificates");
              }}
            >
              عرض وتحميل الشهادة
            </Button>
            <Button size="lg" tone="white" onClick={close}>
              لاحقًا
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
