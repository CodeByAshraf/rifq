import { useId } from "react";
import type { Avatar } from "@/lib/store";

export const SKIN = ["#f9d9bf", "#eebf97", "#d69b6f", "#a8714a", "#7a4e31"];
export const OUTFIT = [
  { base: "#1fb3a6", dark: "#0d7870", name: "فيروزي" },
  { base: "#8a6fe6", dark: "#5e45b8", name: "بنفسجي" },
  { base: "#f5b52e", dark: "#c98a12", name: "ذهبي" },
  { base: "#5fb9f2", dark: "#2f86c4", name: "سماوي" },
  { base: "#45c785", dark: "#24935a", name: "نعناعي" },
  { base: "#ff9a8b", dark: "#d86858", name: "مرجاني" },
];

/** Friendly chibi-style child character drawn with layered gradients for a soft 3D look. */
export function Character({ avatar, size = 160, wave = false, className = "" }: { avatar: Avatar; size?: number; wave?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  const skin = SKIN[avatar.skin] ?? SKIN[1];
  const o = OUTFIT[avatar.outfit] ?? OUTFIT[0];
  return (
    <svg viewBox="0 0 200 220" width={size} height={(size * 220) / 200} className={className} aria-hidden>
      <defs>
        <radialGradient id={`sk${id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor={skin} />
          <stop offset="1" stopColor={skin} stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`ou${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={o.base} />
          <stop offset="1" stopColor={o.dark} />
        </linearGradient>
        <radialGradient id={`sh${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#1d3a4a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#1d3a4a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`hj${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.3" stopColor={o.base} />
          <stop offset="1" stopColor={o.dark} />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy="208" rx="58" ry="9" fill={`url(#sh${id})`} />

      {/* body (thobe / dress) */}
      <path d="M58 150 Q60 122 100 120 Q140 122 142 150 L150 200 Q100 212 50 200 Z" fill={`url(#ou${id})`} />
      <path d="M70 140 Q100 132 130 140" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M100 128 L100 196" stroke={o.dark} strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />

      {/* arms */}
      <path d="M60 150 Q44 168 52 186" stroke={`url(#ou${id})`} strokeWidth="18" fill="none" strokeLinecap="round" />
      <circle cx="53" cy="188" r="9" fill={skin} />
      {wave ? (
        <g style={{ transformOrigin: "140px 148px" }} className="animate-[float_2.4s_ease-in-out_infinite]">
          <path d="M140 150 Q160 130 160 108" stroke={`url(#ou${id})`} strokeWidth="18" fill="none" strokeLinecap="round" />
          <circle cx="160" cy="102" r="9.5" fill={skin} />
        </g>
      ) : (
        <>
          <path d="M140 150 Q156 168 148 186" stroke={`url(#ou${id})`} strokeWidth="18" fill="none" strokeLinecap="round" />
          <circle cx="147" cy="188" r="9" fill={skin} />
        </>
      )}

      {/* satchel */}
      {avatar.accessory === "satchel" && (
        <g>
          <path d="M70 124 L132 176" stroke="#9a6a3a" strokeWidth="5" strokeLinecap="round" />
          <rect x="118" y="164" width="30" height="24" rx="7" fill="#c98a4b" />
          <rect x="118" y="164" width="30" height="10" rx="5" fill="#b0743a" />
          <circle cx="133" cy="176" r="2.5" fill="#f5d27a" />
        </g>
      )}

      {/* scarf */}
      {avatar.accessory === "scarf" && (
        <g>
          <path d="M70 126 Q100 142 130 126 L130 136 Q100 152 70 136 Z" fill="#ffcc4d" />
          <path d="M116 138 L124 168 L110 166 Z" fill="#f5b52e" />
        </g>
      )}

      {/* head */}
      {avatar.headwear === "hijab" ? (
        <>
          <path d="M44 86 Q44 30 100 28 Q156 30 156 86 Q160 128 120 136 L80 136 Q40 128 44 86 Z" fill={`url(#hj${id})`} />
          <ellipse cx="100" cy="86" rx="38" ry="40" fill={`url(#sk${id})`} />
          <path d="M60 70 Q66 40 100 38 Q134 40 140 70 Q124 54 100 54 Q76 54 60 70 Z" fill={`url(#hj${id})`} />
        </>
      ) : (
        <>
          <ellipse cx="100" cy="82" rx="50" ry="48" fill={`url(#sk${id})`} />
          {avatar.headwear === "none" && (
            <path d="M52 76 Q52 30 100 30 Q148 30 148 76 Q140 56 118 52 Q104 64 78 58 Q60 62 52 76 Z" fill="#4a2f22" />
          )}
          {avatar.headwear === "kufi" && (
            <g>
              <path d="M56 64 Q58 30 100 28 Q142 30 144 64 Q100 54 56 64 Z" fill="#ffffff" />
              <path d="M56 64 Q100 54 144 64 L144 70 Q100 60 56 70 Z" fill="#e8eef1" />
              <path d="M70 46 Q100 38 130 46" stroke="#cfdde4" strokeWidth="2.5" fill="none" strokeDasharray="3 5" strokeLinecap="round" />
            </g>
          )}
          {/* ears */}
          <circle cx="51" cy="88" r="9" fill={skin} />
          <circle cx="149" cy="88" r="9" fill={skin} />
        </>
      )}

      {avatar.accessory === "crown" && (
        <g transform={`translate(0 ${avatar.headwear === "hijab" ? -4 : 0})`}>
          <path d="M74 34 L82 14 L92 28 L100 8 L108 28 L118 14 L126 34 Z" fill="#ffcc4d" stroke="#d9961a" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="100" cy="24" r="3.5" fill="#1fb3a6" />
        </g>
      )}

      {/* face */}
      <g>
        <ellipse cx="82" cy="90" rx="6.5" ry="7.5" fill="#1d3a4a" />
        <ellipse cx="118" cy="90" rx="6.5" ry="7.5" fill="#1d3a4a" />
        <circle cx="84.5" cy="87" r="2.3" fill="#fff" />
        <circle cx="120.5" cy="87" r="2.3" fill="#fff" />
        <ellipse cx="72" cy="104" rx="8" ry="5" fill="#ff8f8f" opacity="0.35" />
        <ellipse cx="128" cy="104" rx="8" ry="5" fill="#ff8f8f" opacity="0.35" />
        <path d="M90 106 Q100 115 110 106" stroke="#1d3a4a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
