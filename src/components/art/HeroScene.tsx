import { useId } from "react";
import { BookOnStand, Cloud, DomeHouse, Flower, Lantern, Palm, RoundTree, Sparkle, Tower } from "./Scenery";

/** The RIFQ world: a floating garden island with a glowing book at its heart. */
export function HeroScene({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 900 620" className={className} role="img" aria-label="عالم رِفق: جزيرة حديقة طافية فيها كتابٌ مضيء وبيوتٌ صغيرة">
      <defs>
        <linearGradient id={`grass${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9cebbf" />
          <stop offset="0.5" stopColor="#5fd598" />
          <stop offset="1" stopColor="#36b878" />
        </linearGradient>
        <linearGradient id={`soil${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2cf9c" />
          <stop offset="0.5" stopColor="#d9a86e" />
          <stop offset="1" stopColor="#b9834d" />
        </linearGradient>
        <linearGradient id={`hill${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bdf3dc" />
          <stop offset="1" stopColor="#7fe0d4" />
        </linearGradient>
        <linearGradient id={`path${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3dc" />
          <stop offset="1" stopColor="#f2dcb9" />
        </linearGradient>
        <radialGradient id={`sun${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6c9" />
          <stop offset="0.5" stopColor="#ffdf80" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffdf80" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`water${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe6ff" />
          <stop offset="1" stopColor="#7cc8f5" />
        </linearGradient>
      </defs>

      {/* sun glow */}
      <circle cx="700" cy="110" r="140" fill={`url(#sun${id})`} />
      <circle cx="700" cy="110" r="46" fill="#ffe9a6" />

      {/* stars */}
      <Sparkle x={140} y={90} r={7} delay={0} />
      <Sparkle x={560} y={60} r={5} color="#c9b8ff" delay={0.8} />
      <Sparkle x={820} y={240} r={6} delay={1.4} />
      <Sparkle x={70} y={300} r={5} color="#9fe6ff" delay={2} />
      <Sparkle x={380} y={40} r={4} delay={1.1} />

      {/* clouds */}
      <g className="animate-float-slow">
        <Cloud x={60} y={120} s={1.2} />
      </g>
      <g className="animate-float" style={{ animationDelay: "1.5s" }}>
        <Cloud x={600} y={210} s={0.9} opacity={0.95} />
      </g>
      <Cloud x={420} y={90} s={0.6} opacity={0.8} />

      {/* the floating island */}
      <g className="animate-float-slow">
        {/* island underside */}
        <path d="M110 430 Q450 470 800 430 Q770 520 640 560 Q520 610 450 600 Q330 600 240 556 Q130 510 110 430 Z" fill={`url(#soil${id})`} />
        <path d="M200 520 Q260 540 300 530 M520 560 Q580 556 620 530 M380 580 Q420 590 470 584" stroke="#a87443" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M430 598 Q440 620 452 640" stroke="#b9834d" strokeWidth="6" strokeLinecap="round" />
        {/* grass top */}
        <ellipse cx="455" cy="430" rx="350" ry="62" fill={`url(#grass${id})`} />
        <path d="M110 430 Q130 452 170 458" stroke="#2fa868" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.4" />

        {/* back hills */}
        <path d="M150 420 Q230 330 330 400 Q400 340 470 396 L470 430 L150 430 Z" fill={`url(#hill${id})`} opacity="0.9" />
        <path d="M520 410 Q620 320 740 412 L740 430 L520 430 Z" fill={`url(#hill${id})`} opacity="0.8" />

        {/* pond */}
        <ellipse cx="650" cy="452" rx="70" ry="16" fill={`url(#water${id})`} />
        <path d="M610 450 Q630 446 650 450" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

        {/* path to the book */}
        <path d="M455 488 Q420 470 440 452 Q470 438 452 420" stroke={`url(#path${id})`} strokeWidth="30" fill="none" strokeLinecap="round" />

        {/* buildings */}
        <Tower x={250} y={420} s={0.8} />
        <DomeHouse x={330} y={420} s={0.72} />
        <DomeHouse x={640} y={414} s={0.62} tone="sky" />

        {/* trees */}
        <Palm x={190} y={444} s={0.9} />
        <RoundTree x={560} y={420} s={0.95} />
        <RoundTree x={740} y={436} s={0.8} tone="teal" />
        <RoundTree x={170} y={420} s={0.6} tone="teal" />
        <Palm x={720} y={446} s={0.7} />

        {/* the glowing book */}
        <BookOnStand x={455} y={414} s={0.9} />

        {/* flowers */}
        {[
          [230, 470, "#ff9a8b"],
          [262, 478, "#c9b8ff"],
          [600, 476, "#ffcc4d"],
          [540, 482, "#ff9a8b"],
          [380, 478, "#ffcc4d"],
          [700, 470, "#c9b8ff"],
        ].map(([x, y, c], i) => (
          <Flower key={i} x={x as number} y={y as number} c={c as string} />
        ))}

        <Lantern x={300} y={300} s={1} />
      </g>
    </svg>
  );
}
