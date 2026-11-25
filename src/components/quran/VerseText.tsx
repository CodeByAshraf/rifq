import { Fragment } from "react";
import { toArabicDigits, words } from "@/lib/quran";

/**
 * Renders verified verse text. Words are produced only by splitting the original
 * string on spaces and are rejoined with spaces, so the visible text is identical
 * to the source. Highlights are applied around whole words, never inside them.
 */
export function VerseText({
  text,
  highlight = {},
  hidden = [],
  className = "",
  onWordClick,
}: {
  text: string;
  /** word index -> tailwind classes */
  highlight?: Record<number, string>;
  /** word indexes to visually mask (memorization) */
  hidden?: number[];
  className?: string;
  onWordClick?: (i: number) => void;
}) {
  const list = words(text);
  return (
    <span className={`quran ${className}`}>
      {list.map((w, i) => {
        const isHidden = hidden.includes(i);
        const hl = highlight[i];
        return (
          <Fragment key={i}>
            <span
              onClick={onWordClick ? () => onWordClick(i) : undefined}
              className={`rounded-xl transition-all duration-300 ${hl ? `${hl} px-1` : ""} ${onWordClick ? "cursor-pointer" : ""} ${
                isHidden ? "select-none bg-teal-100 text-transparent [text-shadow:none]" : ""
              }`}
              style={isHidden ? { filter: "blur(0)" } : undefined}
              aria-hidden={isHidden || undefined}
            >
              {w}
            </span>
            {i < list.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </span>
  );
}

/** Decorative verse-number medallion (not part of the Quranic text). */
export function AyahMark({ n, active = false }: { n: number; active?: boolean }) {
  return (
    <span className="mx-1 inline-grid h-9 w-9 translate-y-1 place-items-center align-middle" aria-label={`الآية ${n}`}>
      <svg viewBox="0 0 40 40" className="col-start-1 row-start-1 h-9 w-9">
        <path
          d="M20 2 L24 8 L31 7 L32 14 L38 18 L34 24 L36 31 L29 32 L26 38 L20 35 L14 38 L11 32 L4 31 L6 24 L2 18 L8 14 L9 7 L16 8 Z"
          fill={active ? "#ffcc4d" : "#fff7e3"}
          stroke={active ? "#d9961a" : "#e2c48c"}
          strokeWidth="1.5"
        />
      </svg>
      <span className="col-start-1 row-start-1 font-display text-sm font-bold text-ink-700">{toArabicDigits(n)}</span>
    </span>
  );
}
