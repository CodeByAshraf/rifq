/**
 * Playful feedback for children: tap bursts, button "boing", and soft synthesized sounds.
 * Sounds are simple UI tones made with the Web Audio API — never recitation or speech.
 */

let lastTap = { x: 0, y: 0, at: 0 };
export const getLastTap = () => {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  // Fall back to the screen centre if the last tap is stale (e.g. browser back button).
  if (Date.now() - lastTap.at > 1500) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  return lastTap;
};

const SOUND_KEY = "rifq.sound";
let soundOn: boolean | null = null;
const soundListeners = new Set<() => void>();

export function isSoundOn() {
  if (soundOn == null) {
    try {
      soundOn = localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      soundOn = true;
    }
  }
  return soundOn;
}
export function setSound(on: boolean) {
  soundOn = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  soundListeners.forEach((l) => l());
}
export const subscribeSound = (l: () => void) => {
  soundListeners.add(l);
  return () => soundListeners.delete(l);
};

let ctx: AudioContext | null = null;
function audio() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, vol = 0.08, type: OscillatorType = "sine", slideTo?: number) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export type Sfx = "tap" | "correct" | "wrong" | "win" | "page" | "flip";

/** Browsers only allow audio after the user has interacted with the page. */
function userHasInteracted() {
  if (typeof navigator === "undefined") return false;
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return ua ? ua.hasBeenActive : interacted;
}
let interacted = false;

export function playSfx(kind: Sfx) {
  if (!isSoundOn() || !userHasInteracted()) return;
  switch (kind) {
    case "tap":
      tone(620, 0, 0.09, 0.045, "sine", 880);
      break;
    case "page":
      tone(420, 0, 0.12, 0.04, "triangle", 760);
      tone(760, 0.08, 0.12, 0.03, "sine", 1100);
      break;
    case "flip":
      tone(500, 0, 0.08, 0.04, "triangle", 300);
      break;
    case "correct":
      tone(660, 0, 0.12, 0.07);
      tone(880, 0.09, 0.12, 0.07);
      tone(1320, 0.18, 0.22, 0.06);
      break;
    case "wrong":
      tone(330, 0, 0.16, 0.05, "triangle", 260);
      break;
    case "win":
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.09, 0.25, 0.06));
      break;
  }
}

// ---------- Tap bursts ----------

const COLORS = ["#ffcc4d", "#1fb3a6", "#a790f3", "#ff9a8b", "#5fb9f2", "#6fdca4"];
const SHAPES = [
  // star
  '<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0 -9 L2.6 -3 L9 -2.8 L4 1.4 L5.6 8 L0 4.4 L-5.6 8 L-4 1.4 L-9 -2.8 L-2.6 -3 Z" fill="{c}"/></svg>',
  // heart
  '<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0 8 C-9 2 -9 -6 -4 -7 C-1.5 -7.5 0 -5 0 -4 C0 -5 1.5 -7.5 4 -7 C9 -6 9 2 0 8 Z" fill="{c}"/></svg>',
  // circle
  '<svg viewBox="-10 -10 20 20" width="100%" height="100%"><circle r="7" fill="{c}"/></svg>',
  // sparkle
  '<svg viewBox="-10 -10 20 20" width="100%" height="100%"><path d="M0 -9 Q1 -1 9 0 Q1 1 0 9 Q-1 1 -9 0 Q-1 -1 0 -9 Z" fill="{c}"/></svg>',
];

let layer: HTMLDivElement | null = null;
function getLayer() {
  if (!layer || !document.body.contains(layer)) {
    layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
    document.body.appendChild(layer);
  }
  return layer;
}

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function burst(x: number, y: number) {
  if (reduced()) return;
  const host = getLayer();

  // soft ring
  const ring = document.createElement("div");
  const ringColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  ring.style.cssText = `position:absolute;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;border:3px solid ${ringColor};`;
  host.appendChild(ring);
  ring.animate([{ transform: "scale(0.2)", opacity: 0.9 }, { transform: "scale(1.6)", opacity: 0 }], { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => ring.remove();

  const n = 8;
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    const size = 10 + Math.random() * 10;
    const color = COLORS[(i + Math.floor(Math.random() * 6)) % COLORS.length];
    el.innerHTML = SHAPES[i % SHAPES.length].replace("{c}", color);
    el.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;`;
    host.appendChild(el);
    const angle = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 34 + Math.random() * 34;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const rot = (Math.random() - 0.5) * 240;
    el.animate(
      [
        { transform: "translate(0,0) scale(0.3) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx * 0.8}px, ${dy * 0.8}px) scale(1.1) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy + 18}px) scale(0.6) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 200, easing: "cubic-bezier(.15,.75,.3,1)" },
    ).onfinish = () => el.remove();
  }
}

const INTERACTIVE = "button, a, [role=button], select, .clay, .card-3d, label";

/** Install global listeners once. Returns a cleanup function. */
export function installTapEffects() {
  const down = (e: PointerEvent) => {
    interacted = true;
    lastTap = { x: e.clientX, y: e.clientY, at: Date.now() };
    burst(e.clientX, e.clientY);
    const target = (e.target as Element | null)?.closest(INTERACTIVE);
    if (target) playSfx("tap");
  };
  const up = (e: PointerEvent) => {
    if (reduced()) return;
    const el = (e.target as Element | null)?.closest<HTMLElement>("button, a, .clay");
    if (!el || (el as HTMLButtonElement).disabled) return;
    el.classList.remove("boing");
    // force reflow so the animation can replay
    void el.offsetWidth;
    el.classList.add("boing");
    el.addEventListener("animationend", () => el.classList.remove("boing"), { once: true });
  };
  document.addEventListener("pointerdown", down, { passive: true });
  document.addEventListener("pointerup", up, { passive: true });
  return () => {
    document.removeEventListener("pointerdown", down);
    document.removeEventListener("pointerup", up);
  };
}
