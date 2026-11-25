// Renders the Fajr alarm tune (src/lib/fajr/tune.ts) to mobile/assets/fajr_alarm.wav.
// iOS plays notification sounds of at most 30 seconds, so the file is 27 s long.
// Run: node --no-warnings scripts/fajr-sound.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { BAR, BAR_SECONDS, PARTIALS, barGain } = await import(join(root, "src/lib/fajr/tune.ts"));

const RATE = 22050;
const SECONDS = 27;
const n = RATE * SECONDS;
const buf = new Float32Array(n);

for (let bar = 0; bar * BAR_SECONDS < SECONDS; bar++) {
  const g = barGain(bar);
  for (const [at, f] of BAR) {
    const start = Math.round((bar * BAR_SECONDS + at) * RATE);
    for (const [mul, amp, decay] of PARTIALS) {
      const len = Math.min(n - start, Math.round((4 / decay) * RATE));
      for (let i = 0; i < len; i++) {
        const t = i / RATE;
        const attack = Math.min(1, t / 0.01);
        buf[start + i] += g * amp * 0.3 * attack * Math.exp(-decay * t) * Math.sin(2 * Math.PI * f * mul * t);
      }
    }
  }
}
// Fade the last 0.5 s and normalise to -1 dBFS.
for (let i = n - RATE / 2; i < n; i++) buf[i] *= (n - i) / (RATE / 2);
let peak = 0;
for (const v of buf) peak = Math.max(peak, Math.abs(v));

const data = Buffer.alloc(n * 2);
for (let i = 0; i < n; i++) data.writeInt16LE(Math.round((buf[i] / peak) * 0.89 * 32767), i * 2);
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const out = join(root, "mobile/assets/fajr_alarm.wav");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([header, data]));
console.log(`fajr_alarm.wav: ${SECONDS}s, ${(44 + data.length) / 1024 | 0} KB`);
