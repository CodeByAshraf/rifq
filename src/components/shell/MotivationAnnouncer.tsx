import { useEffect, useRef, useState } from "react";
import { IconPause, IconPlay } from "@/components/art/Icons";
import { Celebrate } from "@/components/ui";
import { Button } from "@/components/ui";
import { learnedTotal } from "@/lib/learning";
import { getMessage, messageId, type FamilyMessage } from "@/lib/messages";
import { ladder, nextCelebration, rewardProgress, STEPS } from "@/lib/motivation";
import { actions, today, useChild } from "@/lib/store";
import { useRouter } from "@/lib/router";

/**
 * Celebrates daily goals, new «اقرأ وارتقِ» steps and a reached reward, one at a time, after any
 * other dialog has closed. Plays the family's voice message for the occasion when there is one.
 */
export function MotivationAnnouncer() {
  const router = useRouter();
  const { child, data } = useChild();
  // Certificates are announced first (CertificateAnnouncer); never two dialogs at once.
  const certsWaiting = (data.pendingCerts ?? []).length > 0;
  const due = certsWaiting ? null : nextCelebration(data, today());
  const key = due ? `${child.id}:${due.kind}:${due.level ?? ""}` : "";
  const [shown, setShown] = useState<typeof due>(null);
  const [msg, setMsg] = useState<FamilyMessage | null>(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Wait until no other dialog is open (certificates, game results...), then announce.
  useEffect(() => {
    if (!due || shown) return;
    let calm = 0;
    const t = setInterval(() => {
      calm = document.querySelector('[role="dialog"]') ? 0 : calm + 1;
      if (calm >= 2) {
        clearInterval(t);
        setShown(due);
        getMessage(messageId(child.id, due.kind))
          .then(setMsg)
          .catch(() => setMsg(null));
      }
    }, 500);
    return () => clearInterval(t);
  }, [key, shown]);

  useEffect(() => () => audio.current?.pause(), []);

  const play = () => {
    if (!msg) return;
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    const url = URL.createObjectURL(msg.blob);
    const a = new Audio(url);
    audio.current = a;
    a.onended = () => {
      setPlaying(false);
      URL.revokeObjectURL(url);
    };
    void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const close = () => {
    audio.current?.pause();
    setPlaying(false);
    if (shown?.kind === "goal") actions.markSeen({ goal: today() });
    if (shown?.kind === "ladder") actions.markSeen({ ladder: shown.level });
    if (shown?.kind === "reward" && data.reward?.reached) actions.markSeen({ reward: data.reward.reached });
    setShown(null);
    setMsg(null);
  };

  if (!shown) return null;
  let title = "";
  let message = "";
  if (shown.kind === "goal") {
    title = "أتممتَ مهمّة اليوم!";
    message = "بارك الله فيك، القرآن يكبر في قلبك كل يوم.";
  } else if (shown.kind === "ladder") {
    const L = ladder(learnedTotal(data.verses));
    title = `ارتقيتَ درجة: «${STEPS[shown.level ?? 0].title}»`;
    message = L.next ? `باقي ${L.toNext.toLocaleString("ar-EG")} آية للدرجة التالية. اقرأ وارتقِ!` : "بلغتَ القمّة، ما شاء الله!";
  } else if (data.reward) {
    const p = rewardProgress(data, data.reward);
    title = "استحققتَ هديتك! 🎁";
    message = `أتممتَ «${p.goal}». هديتك: ${data.reward.text}. أخبر بابا وماما!`;
  }

  return (
    <Celebrate
      open
      onClose={close}
      title={title}
      message={message}
      actions={
        <>
          {msg && (
            <Button size="lg" tone="sun" onClick={play}>
              {playing ? <IconPause size={20} /> : <IconPlay size={20} />} رسالة من {msg.from}
            </Button>
          )}
          {shown.kind === "ladder" ? (
            <Button
              size="lg"
              tone="white"
              onClick={() => {
                close();
                router.push("/irtaqi");
              }}
            >
              شاهد السلّم
            </Button>
          ) : (
            <Button size="lg" tone={msg ? "white" : "teal"} onClick={close}>
              متابعة
            </Button>
          )}
        </>
      }
    />
  );
}
