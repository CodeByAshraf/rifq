/**
 * The Fajr alarm tune: a soft bell arpeggio that grows louder. Shared by the in-app player
 * (Web Audio) and scripts/fajr-sound.mjs, which renders the same notes to the WAV file the
 * system notifications play. Original, synthesised sound: no recording, no licence needed.
 */
/** [start seconds within the bar, frequency Hz]. @public (scripts/fajr-sound.mjs) */
export const BAR: [number, number][] = [
  [0, 523.25],
  [0.3, 659.25],
  [0.6, 783.99],
  [0.9, 880.0],
  [1.35, 783.99],
  [1.65, 659.25],
];
/** @public (scripts/fajr-sound.mjs) */
export const BAR_SECONDS = 2.6;
/** Bell partials: [frequency multiple, relative amplitude, decay per second]. @public */
export const PARTIALS: [number, number, number][] = [
  [1, 1, 2.2],
  [2, 0.35, 3.5],
  [3, 0.12, 5],
];
/** Loudness of bar i (0-based): gentle at first, full volume after ~8 bars. @public */
export const barGain = (i: number) => Math.min(1, 0.3 + i * 0.09);

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

/** Starts looping the tune in the page. Must be called from a user gesture on iOS. */
export function startTune() {
  stopTune();
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const c = ctx;
  let bar = 0;
  const playBar = () => {
    const t0 = c.currentTime + 0.05;
    const g = barGain(bar++) * 0.5;
    for (const [at, f] of BAR) {
      for (const [mul, amp, decay] of PARTIALS) {
        const o = c.createOscillator();
        const v = c.createGain();
        o.frequency.value = f * mul;
        v.gain.setValueAtTime(0, t0 + at);
        v.gain.linearRampToValueAtTime(g * amp * 0.3, t0 + at + 0.01);
        v.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 4 / decay);
        o.connect(v).connect(c.destination);
        o.start(t0 + at);
        o.stop(t0 + at + 4 / decay + 0.05);
      }
    }
  };
  playBar();
  timer = setInterval(playBar, BAR_SECONDS * 1000);
}

export function stopTune() {
  if (timer) clearInterval(timer);
  timer = null;
  ctx?.close().catch(() => {});
  ctx = null;
}
