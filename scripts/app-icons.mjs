// Renders the app icon / splash masters from the logo vector (src/components/art/GameArt.tsx «Logo»)
// into mobile/assets, then: npx capacitor-assets generate --assetPath mobile/assets
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const out = "mobile/assets";
mkdirSync(out, { recursive: true });

const defs = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fd6c8"/><stop offset="1" stop-color="#0d7870"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe39a"/><stop offset="1" stop-color="#f5b52e"/></linearGradient>
</defs>`;
// The logo artwork in a 64×64 box (same shapes as the in-app Logo, without its rounded tile).
const art = `
  <path d="M14 38 Q23 33 32 38 Q41 33 50 38 L50 24 Q41 19 32 24 Q23 19 14 24 Z" fill="#fff"/>
  <path d="M32 24 V38" stroke="#7fe0d4" stroke-width="2"/>
  <path d="M32 8 L34.2 13.4 L40 14 L35.6 17.6 L37 23 L32 20 L27 23 L28.4 17.6 L24 14 L29.8 13.4 Z" fill="url(#gold)"/>
  <path d="M14 44 Q32 52 50 44" stroke="#ffe39a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
// Place the 64-unit artwork centred at `scale` of the canvas width.
const placed = (size, scale) => {
  const s = (size * scale) / 64;
  const off = (size - 64 * s) / 2;
  return `<g transform="translate(${off} ${off + size * 0.01}) scale(${s})">${art}</g>`;
};
const svg = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs}${body}</svg>`;
const png = (s, file) => sharp(Buffer.from(s)).png().toFile(`${out}/${file}`);

await png(svg(1024, `<rect width="1024" height="1024" fill="url(#bg)"/>${placed(1024, 0.78)}`), "icon-only.png");
// Android adaptive icon: artwork inside the safe zone (66% of 108dp ≈ 61%).
await png(svg(1024, placed(1024, 0.56)), "icon-foreground.png");
await png(svg(1024, `<rect width="1024" height="1024" fill="url(#bg)"/>`), "icon-background.png");
await png(svg(2732, `<rect width="2732" height="2732" fill="url(#bg)"/>${placed(2732, 0.24)}`), "splash.png");
await png(svg(2732, `<rect width="2732" height="2732" fill="#0b3f3b"/>${placed(2732, 0.24)}`), "splash-dark.png");
console.log("icon and splash masters written to mobile/assets");
