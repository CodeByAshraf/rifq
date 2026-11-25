import { useId } from "react";
import type { SceneKind } from "@/data/stories";
import { Cloud, DomeHouse, Flower, Lantern, Palm, RoundTree, Sparkle, Tower } from "./Scenery";

/**
 * Story illustrations. They show places, objects and animals only —
 * no prophet or companion is ever depicted.
 */

type Sky = "day" | "dusk" | "night" | "sea" | "desert";

const SKY: Record<Sky, [string, string]> = {
  day: ["#bfe6ff", "#eaf7ff"],
  dusk: ["#ffd3a8", "#ffeccf"],
  night: ["#2b3f78", "#5b6fb3"],
  sea: ["#9fdcff", "#e2f5ff"],
  desert: ["#ffe2a8", "#fff3d6"],
};

const SCENE_SKY: Record<SceneKind, Sky> = {
  ark: "sea", fire: "dusk", whale: "sea", sea: "night", stars: "night", ants: "day", hoopoe: "day", camel: "desert",
  kaaba: "desert", rain: "day", mihrab: "night", palm: "desert", elephant: "desert", cave: "night", tree: "dusk",
  hira: "night", hijra: "night", mosque: "day", aqsa: "night", bird: "day", well: "desert", adhan: "dusk",
  home: "day", garden: "day", school: "day", dawn: "dusk", iftar: "dusk",
};

function Stars() {
  return (
    <g>
      {[
        [40, 30, 3], [90, 60, 2], [150, 25, 2.5], [220, 50, 2], [300, 22, 3], [350, 70, 2], [270, 90, 1.5], [60, 100, 1.5],
      ].map(([x, y, r], i) => (
        <Sparkle key={i} x={x} y={y} r={r} color="#fff3c0" delay={i * 0.3} />
      ))}
    </g>
  );
}

function Moon({ x = 330, y = 45 }: { x?: number; y?: number }) {
  return <path d={`M${x} ${y - 20} a20 20 0 1 0 14 34 a16 16 0 1 1 -14 -34 z`} fill="#fff1b8" />;
}

function Sun({ x = 330, y = 50, c = "#ffe08a" }: { x?: number; y?: number; c?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="42" fill={c} opacity="0.35" />
      <circle cx={x} cy={y} r="24" fill={c} />
    </g>
  );
}

function Hills({ c1 = "#8ee6b5", c2 = "#5fd598" }: { c1?: string; c2?: string }) {
  return (
    <g>
      <path d="M0 170 Q100 140 200 165 Q300 188 400 158 L400 225 L0 225 Z" fill={c1} />
      <path d="M0 192 Q120 176 230 194 Q320 206 400 188 L400 225 L0 225 Z" fill={c2} />
    </g>
  );
}

function Dunes() {
  return (
    <g>
      <path d="M0 175 Q90 150 190 172 Q300 196 400 166 L400 225 L0 225 Z" fill="#f2cf9c" />
      <path d="M0 198 Q140 180 250 200 Q330 212 400 196 L400 225 L0 225 Z" fill="#e3b67a" />
    </g>
  );
}

function Waves({ y = 170, c1 = "#5fb9f2", c2 = "#3a9de0" }: { y?: number; c1?: string; c2?: string }) {
  return (
    <g>
      <path d={`M0 ${y} Q25 ${y - 10} 50 ${y} T100 ${y} T150 ${y} T200 ${y} T250 ${y} T300 ${y} T350 ${y} T400 ${y} L400 225 L0 225 Z`} fill={c1} />
      <path d={`M0 ${y + 22} Q30 ${y + 12} 60 ${y + 22} T120 ${y + 22} T180 ${y + 22} T240 ${y + 22} T300 ${y + 22} T360 ${y + 22} T420 ${y + 22} L400 225 L0 225 Z`} fill={c2} />
    </g>
  );
}

function Kaaba({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="4" rx="62" ry="10" fill="#1d3a4a" opacity="0.15" />
      <path d="M-44 0 L-44 -70 L16 -82 L16 -12 Z" fill="#26323a" />
      <path d="M16 -12 L16 -82 L48 -70 L48 0 Z" fill="#1a242a" />
      <path d="M-44 -70 L16 -82 L48 -70 L-12 -60 Z" fill="#34424b" />
      <path d="M-44 -54 L16 -64 L16 -56 L-44 -46 Z" fill="#e9b949" />
      <path d="M16 -64 L48 -54 L48 -46 L16 -56 Z" fill="#c9962e" />
      <path d="M-6 -6 L-6 -30 L6 -32 L6 -8 Z" fill="#c9962e" />
    </g>
  );
}

export function StoryScene({ scene, className = "", children }: { scene: SceneKind; className?: string; children?: React.ReactNode }) {
  const id = useId().replace(/:/g, "");
  const sky = SCENE_SKY[scene];
  const [top, bottom] = SKY[sky];
  const night = sky === "night";

  return (
    <svg viewBox="0 0 400 225" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <radialGradient id={`glow${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6c9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6c9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fire${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff9a8b" />
          <stop offset="0.5" stopColor="#ffcc4d" />
          <stop offset="1" stopColor="#fff3c0" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill={`url(#sky${id})`} />
      {night ? (
        <>
          <Stars />
          <Moon />
        </>
      ) : (
        <Sun c={sky === "dusk" ? "#ffb877" : "#ffe08a"} />
      )}
      {!night && (
        <g className="animate-float-slow">
          <Cloud x={30} y={30} s={0.6} />
          <Cloud x={200} y={55} s={0.45} opacity={0.85} />
        </g>
      )}

      {scene === "ark" && (
        <g>
          <Waves y={160} />
          <g className="animate-float" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <path d="M110 150 L290 150 L262 186 L138 186 Z" fill="#b9834d" />
            <path d="M110 150 L290 150 L285 158 L115 158 Z" fill="#d9a066" />
            <rect x="150" y="112" width="100" height="38" rx="6" fill="#f2dcb9" />
            <path d="M142 114 L200 88 L258 114 Z" fill="#c48a55" />
            {[166, 192, 218].map((x) => <rect key={x} x={x} y="124" width="14" height="12" rx="3" fill="#7cc8f5" />)}
            <g transform="translate(250 104)">
              <path d="M0 0 q8 -10 16 0 q-4 2 -8 6 z" fill="#fff" />
            </g>
          </g>
          <path d="M300 40 Q330 10 360 40" stroke="#ff9a8b" strokeWidth="5" fill="none" opacity="0.7" />
          <path d="M296 46 Q330 6 366 46" stroke="#ffcc4d" strokeWidth="5" fill="none" opacity="0.7" />
          <path d="M292 52 Q330 2 372 52" stroke="#7fe0d4" strokeWidth="5" fill="none" opacity="0.7" />
        </g>
      )}

      {scene === "fire" && (
        <g>
          <Hills c1="#a8ecc6" c2="#6fdca4" />
          <circle cx="200" cy="150" r="80" fill={`url(#glow${id})`} />
          <ellipse cx="200" cy="186" rx="80" ry="14" fill="#45c785" />
          {[150, 175, 200, 225, 250].map((x, i) => <Flower key={x} x={x} y={188} c={["#ff9a8b", "#ffcc4d", "#c9b8ff", "#ffcc4d", "#ff9a8b"][i]} />)}
          <path d="M170 170 Q175 130 200 110 Q195 140 215 150 Q230 130 228 112 Q250 140 232 172 Z" fill={`url(#fire${id})`} opacity="0.55" />
          <path d="M184 172 Q190 150 204 136 Q206 154 220 162 Q222 168 218 172 Z" fill="#a8ecc6" opacity="0.9" />
        </g>
      )}

      {scene === "whale" && (
        <g>
          <Waves y={150} />
          <g className="animate-float">
            <path d="M100 168 Q120 120 200 122 Q270 124 300 160 Q310 172 296 176 L120 180 Q100 180 100 168 Z" fill="#3a6fb0" />
            <path d="M120 172 Q200 186 296 172 L296 176 Q200 192 120 180 Z" fill="#cfe6ff" />
            <path d="M300 160 Q330 134 348 140 Q330 150 340 170 Q322 164 300 166 Z" fill="#3a6fb0" />
            <circle cx="140" cy="150" r="5" fill="#fff" />
            <circle cx="141" cy="150" r="2.5" fill="#1d3a4a" />
            <path d="M190 120 Q186 96 176 90 M190 120 Q196 96 208 92" stroke="#bfe6ff" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          <path d="M20 200 Q40 160 70 190" stroke="#45c785" strokeWidth="5" fill="none" />
          <ellipse cx="50" cy="205" rx="50" ry="12" fill="#f2dcb9" />
          <ellipse cx="62" cy="186" rx="16" ry="10" fill="#45c785" />
        </g>
      )}

      {scene === "sea" && (
        <g>
          <path d="M0 225 L0 150 Q90 140 150 70 Q158 60 166 70 L166 225 Z" fill="#3a9de0" />
          <path d="M0 225 L0 170 Q90 160 140 96 L150 225 Z" fill="#5fb9f2" />
          <path d="M150 70 Q158 60 166 70" stroke="#e5f4ff" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M400 225 L400 150 Q310 140 250 70 Q242 60 234 70 L234 225 Z" fill="#3a9de0" />
          <path d="M400 225 L400 170 Q310 160 260 96 L250 225 Z" fill="#5fb9f2" />
          <path d="M250 70 Q242 60 234 70" stroke="#e5f4ff" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M166 225 L166 120 L234 120 L234 225 Z" fill="#f2dcb9" />
          <path d="M180 140 L220 140 M174 170 L226 170 M170 200 L230 200" stroke="#e3b67a" strokeWidth="3" strokeDasharray="6 8" />
        </g>
      )}

      {scene === "stars" && (
        <g>
          <Hills c1="#3d5a8f" c2="#2b4372" />
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (i / 11) * Math.PI;
            return <Sparkle key={i} x={Math.round(200 + Math.cos(a) * 120)} y={Math.round(150 - Math.sin(a) * 90)} r={5} color="#fff1b8" delay={i * 0.2} />;
          })}
          <circle cx="200" cy="110" r="18" fill="#ffd36b" />
          <path d="M235 60 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 z" fill="#fff1b8" />
        </g>
      )}

      {scene === "ants" && (
        <g>
          <Hills />
          {[[60, 196], [90, 200], [120, 194], [150, 200], [180, 196], [210, 200]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <ellipse cx="-6" cy="0" rx="5" ry="4" fill="#5a3d2e" />
              <ellipse cx="2" cy="0" rx="4" ry="3.5" fill="#5a3d2e" />
              <circle cx="9" cy="-1" r="3.5" fill="#5a3d2e" />
              <path d="M11 -4 l4 -5 M8 -4 l1 -6 M-6 3 l-3 5 M0 3 l0 5 M4 3 l3 5" stroke="#5a3d2e" strokeWidth="1.2" />
            </g>
          ))}
          <path d="M250 200 Q290 150 330 200 Z" fill="#b9834d" />
          <ellipse cx="290" cy="196" rx="8" ry="5" fill="#5a3d2e" />
          <RoundTree x={360} y={190} s={0.8} />
        </g>
      )}

      {scene === "hoopoe" && (
        <g>
          <Hills />
          <RoundTree x={300} y={180} s={1.2} />
          <g transform="translate(150 120)" className="animate-float">
            <ellipse cx="0" cy="0" rx="26" ry="16" fill="#e8a05c" />
            <circle cx="22" cy="-10" r="11" fill="#e8a05c" />
            <path d="M32 -10 L54 -6 L32 -6 Z" fill="#5a3d2e" />
            <path d="M16 -18 L10 -40 L18 -24 L20 -44 L24 -24 L30 -40 L28 -18 Z" fill="#e8a05c" stroke="#5a3d2e" strokeWidth="1.5" />
            <path d="M-20 -4 L10 -4 M-20 4 L10 4" stroke="#1d3a4a" strokeWidth="4" strokeDasharray="5 4" />
            <circle cx="25" cy="-12" r="2.2" fill="#1d3a4a" />
            <path d="M-26 0 L-44 -6 L-44 6 Z" fill="#5a3d2e" />
          </g>
        </g>
      )}

      {scene === "camel" && (
        <g>
          <Dunes />
          <path d="M290 175 L290 90 L340 90 L340 175" fill="#d9a066" opacity="0.6" />
          <path d="M300 120 L300 100 Q310 90 320 100 L320 120 Z" fill="#9c6537" opacity="0.6" />
          <g transform="translate(150 180)">
            <path d="M-60 -30 Q-50 -70 -20 -60 Q0 -86 20 -60 Q34 -56 36 -40 L60 -76 Q70 -84 76 -74 L62 -40 Q58 -26 44 -24 L-50 -24 Q-62 -24 -60 -30 Z" fill="#c98a4b" />
            {[-46, -30, 20, 36].map((x) => <rect key={x} x={x} y="-26" width="8" height="28" rx="4" fill="#b0743a" />)}
            <circle cx="70" cy="-74" r="2" fill="#1d3a4a" />
          </g>
        </g>
      )}

      {scene === "kaaba" && (
        <g>
          <Dunes />
          <ellipse cx="200" cy="196" rx="150" ry="18" fill="#fff6e6" />
          <Kaaba x={200} y={190} s={1.1} />
          {[90, 310].map((x) => <Lantern key={x} x={x} y={120} s={0.9} />)}
        </g>
      )}

      {scene === "rain" && (
        <g>
          <Hills />
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={i} d={`M${30 + i * 26} ${40 + (i % 3) * 14} l-4 12`} stroke="#5fb9f2" strokeWidth="3" strokeLinecap="round" />
          ))}
          <path d="M240 150 Q280 70 340 150" stroke="#ff9a8b" strokeWidth="6" fill="none" opacity="0.7" />
          <path d="M248 150 Q280 82 332 150" stroke="#ffcc4d" strokeWidth="6" fill="none" opacity="0.7" />
          <path d="M256 150 Q280 94 324 150" stroke="#7fe0d4" strokeWidth="6" fill="none" opacity="0.7" />
          <RoundTree x={100} y={186} s={0.9} />
          {[150, 180, 210].map((x, i) => <Flower key={x} x={x} y={196} c={["#ff9a8b", "#ffcc4d", "#c9b8ff"][i]} />)}
        </g>
      )}

      {scene === "mihrab" && (
        <g>
          <rect x="0" y="150" width="400" height="75" fill="#3d5a8f" />
          <path d="M140 200 L140 110 Q200 40 260 110 L260 200 Z" fill="#f2dcb9" />
          <path d="M156 200 L156 116 Q200 64 244 116 L244 200 Z" fill="#1fb3a6" />
          <circle cx="200" cy="140" r="40" fill={`url(#glow${id})`} />
          <Lantern x={200} y={110} s={1.2} />
          <rect x="0" y="200" width="400" height="25" fill="#c98a4b" />
        </g>
      )}

      {scene === "palm" && (
        <g>
          <Dunes />
          <Palm x={200} y={196} s={1.7} />
          <ellipse cx="120" cy="204" rx="40" ry="8" fill="#7cc8f5" />
          {[[214, 70], [222, 76], [206, 76]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#9a4f2a" />)}
        </g>
      )}

      {scene === "elephant" && (
        <g>
          <Dunes />
          <Kaaba x={320} y={186} s={0.6} />
          <g transform="translate(130 190)">
            <ellipse cx="0" cy="-36" rx="50" ry="32" fill="#9aa9b5" />
            <circle cx="44" cy="-48" r="22" fill="#9aa9b5" />
            <path d="M60 -40 Q74 -20 64 0" stroke="#9aa9b5" strokeWidth="10" fill="none" strokeLinecap="round" />
            <ellipse cx="36" cy="-48" rx="12" ry="16" fill="#b6c3cc" />
            <circle cx="52" cy="-54" r="2.5" fill="#1d3a4a" />
            {[-34, -14, 10, 30].map((x) => <rect key={x} x={x} y="-12" width="12" height="14" rx="5" fill="#8796a2" />)}
          </g>
          {[[220, 50], [250, 40], [280, 60], [240, 74], [300, 44]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} q6 -6 12 0 q6 -6 12 0`} stroke="#1d3a4a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}

      {scene === "cave" && (
        <g>
          <path d="M0 225 L0 110 Q80 60 200 70 Q320 60 400 110 L400 225 Z" fill="#6d5a8f" />
          <path d="M0 225 L0 140 Q100 100 200 104 Q300 100 400 140 L400 225 Z" fill="#584775" />
          <path d="M150 225 L150 170 Q200 110 250 170 L250 225 Z" fill="#2a2140" />
          <circle cx="200" cy="190" r="34" fill={`url(#glow${id})`} />
          <g transform="translate(268 210)">
            <ellipse cx="0" cy="0" rx="20" ry="8" fill="#c98a4b" />
            <circle cx="18" cy="-6" r="7" fill="#c98a4b" />
            <path d="M14 -12 l-3 -6 l6 3 z" fill="#b0743a" />
            <path d="M22 4 L40 4" stroke="#c98a4b" strokeWidth="5" strokeLinecap="round" />
          </g>
        </g>
      )}

      {scene === "tree" && (
        <g>
          <Hills c1="#c7efb6" c2="#9cdc8a" />
          <g transform="translate(200 196)">
            <path d="M-10 0 L-6 -70 L6 -70 L10 0 Z" fill="#a06b3c" />
            <circle cx="0" cy="-104" r="56" fill="#45c785" />
            <circle cx="-40" cy="-80" r="34" fill="#2fa868" />
            <circle cx="42" cy="-82" r="34" fill="#2fa868" />
            <circle cx="-16" cy="-122" r="14" fill="#fff" opacity="0.25" />
          </g>
          <rect x="250" y="182" width="50" height="8" rx="4" fill="#c98a4b" />
        </g>
      )}

      {scene === "hira" && (
        <g>
          <path d="M60 225 L200 70 L340 225 Z" fill="#7a6a8f" />
          <path d="M120 225 L200 120 L280 225 Z" fill="#62557a" />
          <path d="M186 140 Q200 120 214 140 L214 156 L186 156 Z" fill="#2a2140" />
          <circle cx="200" cy="146" r="40" fill={`url(#glow${id})`} />
          <path d="M200 20 L190 120 L210 120 Z" fill="#fff3c0" opacity="0.25" />
        </g>
      )}

      {scene === "hijra" && (
        <g>
          <Dunes />
          <path d="M40 200 Q120 90 220 200 Z" fill="#9c7a55" />
          <path d="M110 200 L110 168 Q130 148 150 168 L150 200 Z" fill="#3b2a1e" />
          <path d="M240 160 L380 160" stroke="#e3b67a" strokeWidth="3" strokeDasharray="4 8" opacity="0.6" />
        </g>
      )}

      {scene === "mosque" && (
        <g>
          <Hills />
          <Palm x={90} y={196} s={1} />
          <Palm x={320} y={196} s={0.9} />
          <rect x="140" y="140" width="120" height="56" rx="6" fill="#f2dcb9" />
          <rect x="140" y="132" width="120" height="12" rx="4" fill="#c48a55" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={152 + i * 26} y="156" width="14" height="40" rx="2" fill="#c48a55" opacity="0.7" />)}
          {Array.from({ length: 5 }).map((_, i) => <rect key={i} x={150 + i * 22} y="200" width="14" height="10" rx="2" fill="#d9a066" />)}
        </g>
      )}

      {scene === "aqsa" && (
        <g>
          <Hills c1="#3d5a8f" c2="#2b4372" />
          <DomeHouse x={200} y={196} s={0.95} tone="sky" />
          <Tower x={80} y={196} s={0.7} />
        </g>
      )}

      {scene === "bird" && (
        <g>
          <Hills />
          <DomeHouse x={290} y={196} s={0.6} />
          <g transform="translate(150 130)" className="animate-float">
            <ellipse cx="0" cy="0" rx="22" ry="17" fill="#ffcc4d" />
            <circle cx="16" cy="-12" r="11" fill="#ffcc4d" />
            <path d="M26 -12 L36 -9 L26 -6 Z" fill="#f27766" />
            <circle cx="19" cy="-14" r="2" fill="#1d3a4a" />
            <path d="M-6 -4 Q-24 -24 -2 -14 Z" fill="#f5b52e" />
            <path d="M-22 4 L-36 -2 L-34 10 Z" fill="#f5b52e" />
          </g>
        </g>
      )}

      {scene === "well" && (
        <g>
          <Dunes />
          <Palm x={310} y={196} s={1} />
          <g transform="translate(170 196)">
            <ellipse cx="0" cy="0" rx="50" ry="12" fill="#a87443" />
            <path d="M-50 0 L-50 -30 Q0 -40 50 -30 L50 0 Q0 12 -50 0 Z" fill="#d9a066" />
            <ellipse cx="0" cy="-30" rx="50" ry="10" fill="#7cc8f5" />
            <path d="M-40 -30 L-40 -80 M40 -30 L40 -80 M-46 -80 L46 -80" stroke="#9c6537" strokeWidth="6" strokeLinecap="round" />
            <path d="M0 -80 L0 -50" stroke="#5a3d2e" strokeWidth="2" />
            <rect x="-8" y="-52" width="16" height="12" rx="3" fill="#9c6537" />
          </g>
        </g>
      )}

      {scene === "adhan" && (
        <g>
          <Hills c1="#ffd3a8" c2="#f2b98a" />
          <Tower x={200} y={196} s={1.1} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${226 + i * 14} ${60 - i * 4} q10 10 0 20`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity={0.9 - i * 0.25} />
          ))}
          <DomeHouse x={90} y={196} s={0.5} />
          <DomeHouse x={320} y={196} s={0.5} tone="sky" />
        </g>
      )}

      {scene === "home" && (
        <g>
          <Hills />
          <DomeHouse x={300} y={196} s={0.85} />
          <RoundTree x={80} y={196} s={0.8} />
        </g>
      )}

      {scene === "garden" && (
        <g>
          <Hills />
          <RoundTree x={70} y={196} s={0.9} />
          <RoundTree x={340} y={196} s={0.8} tone="teal" />
          {[110, 140, 260, 290, 310].map((x, i) => <Flower key={x} x={x} y={204} c={["#ff9a8b", "#ffcc4d", "#c9b8ff", "#ff9a8b", "#ffcc4d"][i]} />)}
        </g>
      )}

      {scene === "school" && (
        <g>
          <Hills />
          <rect x="230" y="110" width="140" height="86" rx="8" fill="#fff6e6" />
          <path d="M222 112 L300 80 L378 112 Z" fill="#ff9a8b" />
          {[0, 1, 2].map((i) => <rect key={i} x={244 + i * 42} y="128" width="28" height="22" rx="4" fill="#bfe6ff" />)}
          <rect x="288" y="164" width="24" height="32" rx="4" fill="#1fb3a6" />
        </g>
      )}

      {scene === "dawn" && (
        <g>
          <circle cx="200" cy="190" r="60" fill="#ffe08a" opacity="0.6" />
          <Hills c1="#ffc9a3" c2="#f4a98a" />
          <DomeHouse x={300} y={200} s={0.7} />
          <Tower x={360} y={200} s={0.6} />
        </g>
      )}

      {scene === "iftar" && (
        <g>
          <rect x="0" y="160" width="400" height="65" fill="#c98a4b" />
          <rect x="60" y="150" width="280" height="16" rx="8" fill="#fff6e6" />
          {[110, 160, 240, 290].map((x, i) => (
            <g key={x}>
              <ellipse cx={x} cy={148} rx="18" ry="6" fill="#fff" />
              <ellipse cx={x} cy={144} rx="10" ry="5" fill={["#9a4f2a", "#ff9a8b", "#45c785", "#ffcc4d"][i]} />
            </g>
          ))}
          <rect x="190" y="120" width="20" height="28" rx="4" fill="#bfe6ff" />
          {[80, 200, 320].map((x) => <Lantern key={x} x={x} y={60} s={1} />)}
          <path d="M330 30 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 z" fill="#fff1b8" />
        </g>
      )}
      {children}
    </svg>
  );
}
