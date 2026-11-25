import { useId } from "react";
import type { Badge } from "@/data/badges";

const TONES: Record<Badge["tone"], [string, string, string]> = {
  teal: ["#8ff0e4", "#1fb3a6", "#0d7870"],
  sun: ["#fff0b8", "#ffcc4d", "#d9961a"],
  lilac: ["#e2d8ff", "#a790f3", "#6f54cc"],
  mint: ["#d2f7e2", "#6fdca4", "#2fa868"],
  sky: ["#d9f0ff", "#5fb9f2", "#2f86c4"],
  coral: ["#ffe1dc", "#ff9a8b", "#d86858"],
};

const SHAPES: Record<Badge["shape"], string> = {
  star: "M0 -22 L6.5 -7 L22 -6 L10 4 L14 20 L0 11 L-14 20 L-10 4 L-22 -6 L-6.5 -7 Z",
  book: "M-20 -12 Q-10 -18 0 -12 Q10 -18 20 -12 L20 16 Q10 10 0 16 Q-10 10 -20 16 Z M0 -12 L0 16",
  flame: "M0 22 C-14 22 -18 10 -16 2 C-14 -8 -6 -10 -4 -22 C2 -14 4 -8 4 -4 C8 -8 10 -12 10 -14 C16 -6 18 2 16 8 C14 16 8 22 0 22 Z",
  lantern: "M-6 -22 L6 -22 L10 -14 L-10 -14 Z M-12 -14 Q-16 2 -10 16 L10 16 Q16 2 12 -14 Z M-10 16 L10 16 L10 21 L-10 21 Z",
  crown: "M-20 14 L-20 -8 L-10 2 L0 -18 L10 2 L20 -8 L20 14 Z",
  shield: "M0 -22 L18 -14 L18 0 C18 12 10 20 0 23 C-10 20 -18 12 -18 0 L-18 -14 Z",
  leaf: "M-16 16 C-18 -6 -2 -20 18 -20 C18 0 6 18 -16 16 Z M-16 16 L8 -8",
  moon: "M6 -20 A20 20 0 1 0 18 10 A15 15 0 1 1 6 -20 Z",
};

export function BadgeArt({ badge, earned, size = 88 }: { badge: Badge; earned: boolean; size?: number }) {
  const id = useId().replace(/:/g, "");
  const [hi, mid, lo] = earned ? TONES[badge.tone] : ["#f1f4f6", "#d5dee3", "#a6bcc7"];
  return (
    <svg viewBox="-50 -56 100 112" width={size} height={size * 1.12} aria-hidden>
      <defs>
        <radialGradient id={`m${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </radialGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={earned ? "#ffcc4d" : "#d5dee3"} />
          <stop offset="1" stopColor={earned ? "#d9961a" : "#a6bcc7"} />
        </linearGradient>
      </defs>
      {/* ribbons */}
      <path d="M-18 20 L-26 54 L-14 46 L-6 56 L0 24 Z" fill={earned ? "#1fb3a6" : "#c9d5db"} />
      <path d="M18 20 L26 54 L14 46 L6 56 L0 24 Z" fill={earned ? "#12968b" : "#b9c7ce"} />
      {/* scalloped rim */}
      <g>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <circle key={i} cx={Math.round(Math.cos(a) * 3600) / 100} cy={Math.round(Math.sin(a) * 3600) / 100} r="9" fill={`url(#r${id})`} />;
        })}
        <circle r="38" fill={`url(#r${id})`} />
      </g>
      <circle r="30" fill={`url(#m${id})`} />
      <circle r="30" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
      <path d={SHAPES[badge.shape]} fill="#fff" fillOpacity={earned ? 0.95 : 0.7} stroke={lo} strokeOpacity="0.4" strokeWidth="1.5" transform="scale(0.85)" />
      <ellipse cx="-12" cy="-18" rx="10" ry="5" fill="#fff" opacity="0.45" transform="rotate(-30 -12 -18)" />
    </svg>
  );
}
