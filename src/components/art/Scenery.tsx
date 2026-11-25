import { useId } from "react";

/* Reusable illustrated scenery pieces (pure SVG, soft-3D cartoon style). */

export function Cloud({ x = 0, y = 0, s = 1, opacity = 1 }: { x?: number; y?: number; s?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <ellipse cx="60" cy="52" rx="58" ry="14" fill="#9ccfe8" opacity="0.35" />
      <path d="M10 46 Q8 26 30 24 Q36 4 60 8 Q78 -4 94 14 Q118 12 116 36 Q124 48 108 52 L20 52 Q6 52 10 46 Z" fill="#ffffff" />
      <path d="M14 48 Q40 40 60 46 Q86 40 112 48 L108 52 L20 52 Z" fill="#e3f1fb" />
      <ellipse cx="44" cy="22" rx="14" ry="7" fill="#fff" opacity="0.9" />
    </g>
  );
}

export function Sparkle({ x, y, r = 6, color = "#ffd76a", delay = 0 }: { x: number; y: number; r?: number; color?: string; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${-r * 2} Q${r * 0.3} ${-r * 0.3} ${r * 2} 0 Q${r * 0.3} ${r * 0.3} 0 ${r * 2} Q${-r * 0.3} ${r * 0.3} ${-r * 2} 0 Q${-r * 0.3} ${-r * 0.3} 0 ${-r * 2} Z`}
        fill={color}
        className="animate-twinkle"
        style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${delay}s` }}
      />
    </g>
  );
}

export function RoundTree({ x, y, s = 1, tone = "mint" }: { x: number; y: number; s?: number; tone?: "mint" | "teal" }) {
  const id = useId().replace(/:/g, "");
  const c = tone === "mint" ? ["#a8ecc6", "#45c785", "#2fa868"] : ["#7fe0d4", "#1fb3a6", "#0d7870"];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`t${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="0.55" stopColor={c[1]} />
          <stop offset="1" stopColor={c[2]} />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="4" rx="26" ry="6" fill="#1d3a4a" opacity="0.15" />
      <path d="M-5 0 L-4 -30 L4 -30 L5 0 Z" fill="#b07a4f" />
      <circle cx="0" cy="-52" r="30" fill={`url(#t${id})`} />
      <circle cx="-10" cy="-62" r="8" fill="#fff" opacity="0.35" />
    </g>
  );
}

export function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="3" rx="22" ry="5" fill="#1d3a4a" opacity="0.15" />
      <path d="M-4 0 Q-8 -40 4 -78 L10 -76 Q2 -40 6 0 Z" fill="#c48a55" />
      <path d="M-2 -20 L8 -22 M-4 -40 L7 -42 M-2 -58 L8 -60" stroke="#a06b3c" strokeWidth="2" />
      {[
        "M6 -78 Q-30 -96 -52 -70 Q-26 -84 6 -74 Z",
        "M6 -78 Q40 -98 62 -70 Q36 -84 6 -74 Z",
        "M6 -78 Q-14 -112 -36 -108 Q-12 -100 6 -76 Z",
        "M6 -78 Q26 -114 48 -104 Q24 -100 6 -76 Z",
      ].map((d, i) => (
        <path key={i} d={d} fill={i % 2 ? "#2fa868" : "#45c785"} />
      ))}
      <circle cx="2" cy="-74" r="4" fill="#9a6a3a" />
      <circle cx="10" cy="-72" r="4" fill="#9a6a3a" />
    </g>
  );
}

/** Small house with a dome, arched door and window — gentle Islamic architectural cues. */
export function DomeHouse({ x, y, s = 1, tone = "cream" }: { x: number; y: number; s?: number; tone?: "cream" | "sky" | "lilac" }) {
  const id = useId().replace(/:/g, "");
  const wall = tone === "cream" ? ["#fffaf0", "#f2dcb9"] : tone === "sky" ? ["#eef8ff", "#bfe1f7"] : ["#f6f2ff", "#d9cdfb"];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={wall[0]} />
          <stop offset="1" stopColor={wall[1]} />
        </linearGradient>
        <radialGradient id={`d${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#8ff0e4" />
          <stop offset="0.5" stopColor="#1fb3a6" />
          <stop offset="1" stopColor="#0d7870" />
        </radialGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe39a" />
          <stop offset="1" stopColor="#d9961a" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="4" rx="70" ry="10" fill="#1d3a4a" opacity="0.14" />
      <rect x="-56" y="-70" width="112" height="72" rx="10" fill={`url(#w${id})`} />
      <rect x="-60" y="-76" width="120" height="12" rx="6" fill="#f7e5c6" />
      <path d="M-38 -76 Q-38 -128 0 -132 Q38 -128 38 -76 Z" fill={`url(#d${id})`} />
      <path d="M-24 -108 Q-18 -122 -4 -126" stroke="#fff" strokeOpacity="0.6" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M0 -132 L0 -146" stroke={`url(#g${id})`} strokeWidth="3" />
      <path d="M0 -158 a7 7 0 1 0 6 10 a5.5 5.5 0 1 1 -6 -10 z" fill={`url(#g${id})`} />
      {/* arched door */}
      <path d="M-14 2 L-14 -30 Q0 -48 14 -30 L14 2 Z" fill="#12968b" />
      <path d="M-10 2 L-10 -28 Q0 -41 10 -28 L10 2 Z" fill="#0d7870" />
      <circle cx="6" cy="-14" r="2" fill="#ffcc4d" />
      {/* windows */}
      {[-38, 38].map((wx) => (
        <g key={wx}>
          <path d={`M${wx - 9} -26 L${wx - 9} -44 Q${wx} -56 ${wx + 9} -44 L${wx + 9} -26 Z`} fill="#bfe6ff" />
          <path d={`M${wx - 9} -26 L${wx - 9} -44 Q${wx} -56 ${wx + 9} -44 L${wx + 9} -26 Z`} fill="none" stroke="#f5b52e" strokeWidth="2.5" />
          <path d={`M${wx - 4} -40 L${wx + 2} -48`} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        </g>
      ))}
    </g>
  );
}

/** A small tower with balcony and dome (decorative, not a specific building). */
export function Tower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="3" rx="22" ry="5" fill="#1d3a4a" opacity="0.14" />
      <rect x="-12" y="-120" width="24" height="122" rx="4" fill="#fff6e6" />
      <rect x="-12" y="-120" width="8" height="122" fill="#f2dcb9" opacity="0.6" />
      <rect x="-18" y="-96" width="36" height="8" rx="4" fill="#f5b52e" />
      <path d="M-5 -60 L-5 -72 Q0 -80 5 -72 L5 -60 Z" fill="#1fb3a6" />
      <path d="M-12 -120 Q-12 -146 0 -150 Q12 -146 12 -120 Z" fill="#1fb3a6" />
      <path d="M0 -150 L0 -162" stroke="#f5b52e" strokeWidth="2.5" />
      <circle cx="0" cy="-165" r="3.5" fill="#f5b52e" />
    </g>
  );
}

/** Open book resting on a wooden stand, emitting soft light. Pages show only abstract lines. */
export function BookOnStand({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`l${id}`} cx="50%" cy="60%" r="60%">
          <stop offset="0" stopColor="#fff7cf" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffe08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`p${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f6ead3" />
        </linearGradient>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#14a093" />
          <stop offset="1" stopColor="#0d6f68" />
        </linearGradient>
        <linearGradient id={`wd${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a066" />
          <stop offset="1" stopColor="#9c6537" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="-60" rx="150" ry="120" fill={`url(#l${id})`} />
      {/* light rays */}
      {[-50, -25, 0, 25, 50].map((a, i) => (
        <path key={i} d="M0 -70 L-10 -190 L10 -190 Z" fill="#fff3c0" opacity="0.35" transform={`rotate(${a} 0 -70)`} />
      ))}
      <ellipse cx="0" cy="6" rx="78" ry="12" fill="#1d3a4a" opacity="0.16" />
      {/* stand (X-shaped rehal) */}
      <path d="M-62 0 L44 -52 L56 -44 L-50 8 Z" fill={`url(#wd${id})`} />
      <path d="M62 0 L-44 -52 L-56 -44 L50 8 Z" fill={`url(#wd${id})`} />
      {/* cover */}
      <path d="M-88 -58 Q-44 -74 0 -60 Q44 -74 88 -58 L84 -46 Q42 -60 0 -46 Q-42 -60 -84 -46 Z" fill={`url(#c${id})`} />
      {/* pages */}
      <path d="M-82 -62 Q-42 -82 -2 -64 L-2 -118 Q-42 -136 -82 -116 Z" fill={`url(#p${id})`} />
      <path d="M82 -62 Q42 -82 2 -64 L2 -118 Q42 -136 82 -116 Z" fill={`url(#p${id})`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} stroke="#cdb894" strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
          <path d={`M-70 ${-108 + i * 9} Q-42 ${-122 + i * 9} -14 ${-106 + i * 9}`} fill="none" />
          <path d={`M70 ${-108 + i * 9} Q42 ${-122 + i * 9} 14 ${-106 + i * 9}`} fill="none" />
        </g>
      ))}
      <path d="M-82 -116 Q-42 -136 -2 -118" stroke="#f5b52e" strokeWidth="2" fill="none" />
      <path d="M82 -116 Q42 -136 2 -118" stroke="#f5b52e" strokeWidth="2" fill="none" />
    </g>
  );
}

export function Flower({ x, y, c = "#ff9a8b" }: { x: number; y: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L0 -12" stroke="#2fa868" strokeWidth="2" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-18" rx="3.2" ry="5" fill={c} transform={`rotate(${a} 0 -14)`} />
      ))}
      <circle cx="0" cy="-14" r="2.6" fill="#ffcc4d" />
    </g>
  );
}

export function Lantern({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -40 L0 -16" stroke="#d9961a" strokeWidth="2" />
      <circle cx="0" cy="6" r="22" fill="#ffe08a" opacity="0.35" />
      <path d="M-8 -16 L8 -16 L12 -8 L-12 -8 Z" fill="#1fb3a6" />
      <path d="M-12 -8 Q-16 6 -10 20 L10 20 Q16 6 12 -8 Z" fill="#ffe7a0" stroke="#1fb3a6" strokeWidth="3" />
      <rect x="-12" y="19" width="24" height="5" rx="2.5" fill="#f5b52e" />
    </g>
  );
}
