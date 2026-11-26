import { motion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { getLastTap, installTapEffects, isSoundOn, playSfx, setSound, subscribeSound } from "@/lib/fx";

/** Installs global tap bursts + press bounce. Render once near the root. */
export function TapEffects() {
  useEffect(() => installTapEffects(), []);
  return null;
}

function useSound() {
  return useSyncExternalStore(subscribeSound, isSoundOn, () => true);
}

export function SoundToggle() {
  const on = useSound();
  return (
    <button
      onClick={() => setSound(!on)}
      className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80 text-ink-700 ring-1 ring-ink-300/40"
      aria-label={on ? "كتم الأصوات" : "تشغيل الأصوات"}
      aria-pressed={on}
      title={on ? "الأصوات تعمل" : "الأصوات مكتومة"}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
        {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="m16 9.5 5 5m0-5-5 5" />}
      </svg>
    </button>
  );
}

const STAR = "M0 -9 L2.6 -3 L9 -2.8 L4 1.4 L5.6 8 L0 4.4 L-5.6 8 L-4 1.4 L-9 -2.8 L-2.6 -3 Z";

/**
 * Screen-to-screen transition.
 * The new screen opens as a growing bubble from the exact spot the child tapped, with a soft
 * coloured wave and a sprinkle of stars (a calm fade when the system asks for reduced motion).
 * Only clip-path and opacity are animated (no transforms), so fixed bars stay in place.
 */
/** True once the app has hydrated; transitions only run for in-app navigations after that. */
let hydrated = false;

export function PageTransition({ children }: { children: ReactNode }) {
  const [animateEntry] = useState(() => hydrated);
  useEffect(() => {
    hydrated = true;
  }, []);
  if (!animateEntry) return <>{children}</>;
  return <AnimatedEntry>{children}</AnimatedEntry>;
}

function AnimatedEntry({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [origin] = useState(() => getLastTap());
  const [overlay, setOverlay] = useState(true);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!reduced) playSfx("page");
    const t = setTimeout(() => setOverlay(false), 900);
    return () => clearTimeout(t);
  }, [reduced]);

  if (reduced) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        {children}
      </motion.div>
    );
  }

  const at = `${Math.round(origin.x)}px ${Math.round(origin.y)}px`;
  return (
    <>
      <motion.div
        ref={ref}
        initial={{ clipPath: `circle(0px at ${at})` }}
        animate={{ clipPath: `circle(150% at ${at})` }}
        transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => {
          if (ref.current) ref.current.style.clipPath = "none";
        }}
      >
        {children}
      </motion.div>
      {overlay && (
        <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden>
          {/* soft wave ring */}
          <motion.div
            className="absolute rounded-full"
            style={{ left: origin.x, top: origin.y, width: 40, height: 40, marginLeft: -20, marginTop: -20, border: "10px solid rgba(255, 204, 77, 0.55)" }}
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 40, opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const d = 90 + (i % 3) * 50;
            const colors = ["#ffcc4d", "#1fb3a6", "#a790f3", "#ff9a8b", "#5fb9f2"];
            return (
              <motion.svg
                key={i}
                viewBox="-10 -10 20 20"
                width={16 + (i % 3) * 6}
                height={16 + (i % 3) * 6}
                className="absolute"
                style={{ left: origin.x - 10, top: origin.y - 10 }}
                initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
                animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, scale: [0.2, 1.2, 0.6], opacity: [1, 1, 0], rotate: 180 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <path d={STAR} fill={colors[i % colors.length]} />
              </motion.svg>
            );
          })}
        </div>
      )}
    </>
  );
}
