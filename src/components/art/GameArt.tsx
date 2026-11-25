import { useId } from "react";

/** Small illustrated covers for each game card. */
export type GameArtKind = "complete" | "tajweed" | "letters" | "arrange" | "memory" | "listen";

const BG: Record<GameArtKind, [string, string]> = {
  complete: ["#d3f5f0", "#7fe0d4"],
  tajweed: ["#efeaff", "#ddd3ff"],
  letters: ["#fff4d1", "#ffdf80"],
  arrange: ["#e5f4ff", "#92d2fb"],
  memory: ["#e2f9ec", "#a8ecc6"],
  listen: ["#ffe7e5", "#ffc2b8"],
};

function Tile({ x, y, w = 40, h = 40, c = "#fff", edge = "#cfdde4", children, r = 10, rot = 0 }: { x: number; y: number; w?: number; h?: number; c?: string; edge?: string; children?: React.ReactNode; r?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-h / 2 + 5} width={w} height={h} rx={r} fill={edge} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={c} />
      <rect x={-w / 2 + 5} y={-h / 2 + 4} width={w - 10} height={6} rx={3} fill="#fff" opacity="0.5" />
      {children}
    </g>
  );
}

export function GameArt({ kind, className = "" }: { kind: GameArtKind; className?: string }) {
  const id = useId().replace(/:/g, "");
  const [a, b] = BG[kind];
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="240" height="150" fill={`url(#bg${id})`} />
      <circle cx="200" cy="26" r="40" fill="#fff" opacity="0.35" />
      <circle cx="30" cy="140" r="50" fill="#fff" opacity="0.25" />

      {kind === "complete" && (
        <>
          <Tile x={78} y={70} w={96} h={30} c="#fff">
            <path d="M-34 0 H34" stroke="#a6bcc7" strokeWidth="5" strokeLinecap="round" />
          </Tile>
          <Tile x={78} y={112} w={96} h={30} c="#1fb3a6" edge="#0d7870">
            <path d="M-34 0 H10" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          </Tile>
          <Tile x={176} y={90} w={50} h={50} c="#ffcc4d" edge="#d9961a" rot={8}>
            <path d="M-8 -10 Q8 -14 8 -2 Q8 6 0 8 L0 12 M0 18 L0 19" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
          </Tile>
        </>
      )}
      {kind === "tajweed" && (
        <>
          <Tile x={120} y={78} w={150} h={54} c="#fff">
            <rect x="-58" y="-10" width="34" height="20" rx="8" fill="#ffcc4d" />
            <rect x="-16" y="-10" width="30" height="20" rx="8" fill="#a790f3" />
            <rect x="22" y="-10" width="36" height="20" rx="8" fill="#7fe0d4" />
          </Tile>
          <g transform="translate(186 40)">
            <circle r="20" fill="#fff" stroke="#8a6fe6" strokeWidth="6" />
            <path d="M14 14 L28 28" stroke="#8a6fe6" strokeWidth="8" strokeLinecap="round" />
          </g>
        </>
      )}
      {kind === "letters" && (
        <>
          {[
            [60, 60, "#fff", "ب"],
            [120, 50, "#1fb3a6", "ع"],
            [180, 62, "#fff", "ق"],
          ].map(([x, y, c, l], i) => (
            <Tile key={i} x={x as number} y={y as number} w={46} h={46} c={c as string} edge={c === "#fff" ? "#e9d6b3" : "#0d7870"} rot={i === 1 ? -6 : 5}>
              <text y="12" textAnchor="middle" fontSize="30" fontWeight="700" fill={c === "#fff" ? "#1d3a4a" : "#fff"} fontFamily="Baloo Bhaijaan 2, sans-serif">
                {l}
              </text>
            </Tile>
          ))}
          <path d="M60 92 Q90 128 120 100 Q150 128 180 94" stroke="#d9961a" strokeWidth="4" strokeDasharray="2 8" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === "arrange" && (
        <>
          {[0, 1, 2].map((i) => (
            <Tile key={i} x={110 + (i === 1 ? 18 : 0)} y={42 + i * 36} w={130} h={26} c={i === 1 ? "#5fb9f2" : "#fff"} edge={i === 1 ? "#2f86c4" : "#cfdde4"} r={9}>
              <circle cx="50" cy="0" r="8" fill={i === 1 ? "#fff" : "#e5f4ff"} />
              <text x="50" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2f86c4">{["١", "٢", "٣"][i]}</text>
              <path d="M-50 0 H30" stroke={i === 1 ? "#fff" : "#cfdde4"} strokeWidth="5" strokeLinecap="round" />
            </Tile>
          ))}
        </>
      )}
      {kind === "memory" && (
        <>
          {[
            [62, 54, false],
            [116, 54, true],
            [170, 54, false],
            [62, 106, true],
            [116, 106, false],
            [170, 106, false],
          ].map(([x, y, open], i) => (
            <Tile key={i} x={x as number} y={y as number} w={44} h={42} c={open ? "#fff" : "#45c785"} edge={open ? "#cfdde4" : "#2fa868"}>
              {open ? <circle r="9" fill="#ffcc4d" /> : <path d="M0 -9 L3 -3 L9 -2 L4 2 L6 9 L0 5 L-6 9 L-4 2 L-9 -2 L-3 -3 Z" fill="#fff" opacity="0.8" />}
            </Tile>
          ))}
        </>
      )}
      {kind === "listen" && (
        <>
          <g transform="translate(86 78)">
            <circle r="38" fill="#fff" />
            <circle r="38" fill="none" stroke="#ff9a8b" strokeWidth="6" />
            <path d="M-8 -14 L16 0 L-8 14 Z" fill="#f27766" />
          </g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={148 + i * 14} y={78 - [14, 26, 36, 22, 12][i]} width="8" height={[14, 26, 36, 22, 12][i] * 2} rx="4" fill="#f27766" opacity={0.5 + i * 0.1} />
          ))}
        </>
      )}
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4fd6c8" />
          <stop offset="1" stopColor="#0d7870" />
        </linearGradient>
        <linearGradient id={`lgo${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe39a" />
          <stop offset="1" stopColor="#f5b52e" />
        </linearGradient>
      </defs>
      <rect x="4" y="7" width="56" height="54" rx="18" fill="#0a6660" />
      <rect x="4" y="4" width="56" height="54" rx="18" fill={`url(#lg${id})`} />
      {/* open book */}
      <path d="M14 38 Q23 33 32 38 Q41 33 50 38 L50 24 Q41 19 32 24 Q23 19 14 24 Z" fill="#fff" />
      <path d="M32 24 V38" stroke="#7fe0d4" strokeWidth="2" />
      {/* star above */}
      <path d="M32 8 L34.2 13.4 L40 14 L35.6 17.6 L37 23 L32 20 L27 23 L28.4 17.6 L24 14 L29.8 13.4 Z" fill={`url(#lgo${id})`} />
      <path d="M14 44 Q32 52 50 44" stroke="#ffe39a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
