import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/components/shell/Link";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { playSfx } from "@/lib/fx";
import { IconStar, IconX } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";

type Tone = "teal" | "mint" | "sun" | "lilac" | "sky" | "coral" | "white";

const sizes = {
  sm: "h-10 px-4 text-sm rounded-2xl",
  md: "h-12 px-6 text-base rounded-2xl",
  lg: "h-14 px-8 text-lg rounded-[1.4rem]",
};

export function Button({
  tone = "teal",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: keyof typeof sizes }) {
  const text = tone === "white" ? "text-ink-900" : tone === "sun" ? "text-ink-900" : "text-white";
  return (
    <button {...rest} className={`clay clay-${tone} ${sizes[size]} ${text} font-display font-bold inline-flex items-center justify-center gap-2 select-none ${className}`}>
      {children}
    </button>
  );
}

export function LinkButton({ href, tone = "teal", size = "md", className = "", children }: { href: string; tone?: Tone; size?: keyof typeof sizes; className?: string; children: ReactNode }) {
  const text = tone === "white" || tone === "sun" ? "text-ink-900" : "text-white";
  return (
    <Link href={href} className={`clay clay-${tone} ${sizes[size]} ${text} font-display font-bold inline-flex items-center justify-center gap-2 select-none ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "", as: As = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <As className={`card-3d ${className}`}>{children}</As>;
}

export function ProgressBar({ value, tone = "teal", className = "", label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const fill = {
    teal: "from-teal-300 to-teal-500",
    mint: "from-mint-300 to-mint-500",
    sun: "from-sun-300 to-sun-500",
    lilac: "from-lilac-200 to-lilac-500",
    sky: "from-sky-300 to-sky-500",
    coral: "from-coral-100 to-coral-400",
    white: "from-white to-white",
  }[tone];
  return (
    <div className={`h-4 rounded-full bg-ink-300/25 p-[3px] shadow-inner ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div
        className={`h-full rounded-full bg-gradient-to-l ${fill} relative overflow-hidden`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      >
        <span className="absolute inset-x-2 top-[2px] h-[3px] rounded-full bg-white/60" />
      </motion.div>
    </div>
  );
}

export function Ring({ value, size = 76, stroke = 9, color = "#1fb3a6", children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e7eef1" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink-900">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-ink-500">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function StarCount({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3 py-1.5 font-display font-bold text-sun-600 ${className}`}>
      <IconStar filled size={18} className="text-sun-500" />
      {n.toLocaleString("ar-EG")}
    </span>
  );
}

export function Modal({ open, onClose, children, title, wide = false }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/30 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`card-3d relative max-h-[92dvh] w-full overflow-y-auto p-6 ${wide ? "max-w-4xl" : "max-w-md"}`}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-cream-200 text-ink-700" aria-label="إغلاق">
              <IconX size={18} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Celebration overlay shown after finishing an activity. */
export function Celebrate({ open, onClose, title, message, stars, actions }: { open: boolean; onClose: () => void; title: string; message: string; stars?: number; actions?: ReactNode }) {
  useEffect(() => {
    if (open) playSfx("win");
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="relative text-center">
        <div className="pointer-events-none absolute inset-x-0 -top-6 h-24 overflow-visible">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-sun-400"
              style={{ left: `${10 + i * 8}%` }}
              initial={{ y: 30, opacity: 0, scale: 0.4 }}
              animate={{ y: [-10, -40 - (i % 3) * 14], opacity: [0, 1, 0], scale: [0.4, 1, 0.8], rotate: i * 36 }}
              transition={{ duration: 1.6, delay: i * 0.06 }}
            >
              <IconStar filled size={16 + (i % 3) * 4} />
            </motion.span>
          ))}
        </div>
        <Mascot size={110} mood="cheer" className="mx-auto" />
        <h3 className="mt-2 font-display text-2xl font-extrabold">{title}</h3>
        <p className="mt-1 text-ink-500">{message}</p>
        {stars != null && (
          <div className="mt-4 flex justify-center">
            <StarCount n={stars} className="text-lg" />
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">{actions ?? <Button onClick={onClose}>متابعة</Button>}</div>
      </div>
    </Modal>
  );
}

export function SampleNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border-2 border-dashed border-lilac-200 bg-lilac-100/60 px-4 py-3 text-sm text-lilac-600">
      <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-lilac-500" />
      <span>{children}</span>
    </div>
  );
}

export function SpeechBubble({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-3xl bg-white px-5 py-3 font-display text-lg font-bold text-ink-900 shadow-soft ${className}`}>
      {children}
      <span className="absolute -bottom-2 right-8 h-5 w-5 rotate-45 rounded-sm bg-white" />
    </div>
  );
}
