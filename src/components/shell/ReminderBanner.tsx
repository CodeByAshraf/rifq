import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MagdyImage } from "@/components/art/Magdy";
import { IconX } from "@/components/art/Icons";
import { LinkButton } from "@/components/ui";
import { today, useChild, useProgress } from "@/lib/store";

const DISMISS_KEY = "rifq.reminder.dismissed";

/**
 * In-app daily reminder: after the chosen time, if nothing was learned today, Baba Magdy
 * gently reminds the learner. While the app stays open, a system notification is also shown
 * at the chosen time (when notifications are allowed).
 */
export function ReminderBanner() {
  const reminder = useProgress((s) => s.reminder);
  const { data } = useChild();
  const [now, setNow] = useState(() => new Date());
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === today());
    } catch {
      setDismissed(false);
    }
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const learnedToday = data.activeDays.includes(today());
  const [h, m] = (reminder?.time ?? "17:00").split(":").map(Number);
  const due = !!reminder?.enabled && now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  const show = due && !learnedToday && !dismissed;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, today());
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto mt-3 max-w-6xl px-3 sm:px-0">
          <div className="card-3d flex items-center gap-3 p-3 pr-4">
            <MagdyImage size={64} />
            <p className="flex-1 font-display font-bold">حان وقت وِردك اليومي يا حبيبي. آيةٌ واحدة تكفي لتبدأ!</p>
            <LinkButton href="/memorize" size="sm">
              ابدأ الآن
            </LinkButton>
            <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-cream-100" aria-label="إغلاق التذكير">
              <IconX size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
