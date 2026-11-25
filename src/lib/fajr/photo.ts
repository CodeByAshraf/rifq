/**
 * "Photograph your sink" challenge. The reference photo never leaves the device and is not
 * stored as a photo: only a tiny fingerprint (64-bit structure hash + colour histogram) and a
 * 96px thumbnail so the user remembers what to photograph.
 */
const KEY = "rifq.fajr.photo.v1";

export interface Fingerprint {
  /** Horizontal + vertical 64-bit difference hashes as 32 hex chars (image structure,
   *  insensitive to brightness). */
  hash: string;
  /** 16-bin colour/brightness histogram, sums to 1. */
  hist: number[];
}

export interface PhotoRef extends Fingerprint {
  thumb: string;
}

// ---------- pure parts (unit-tested) ----------

/** Horizontal and vertical dHash on a 9x9 grayscale grid (row-major). */
/** @public (tests) */
export function dHash(gray9x9: number[]): string {
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += gray9x9[y * 9 + x] < gray9x9[y * 9 + x + 1] ? "1" : "0";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += gray9x9[y * 9 + x] < gray9x9[(y + 1) * 9 + x] ? "1" : "0";
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

/** @public (tests) */
export function hamming(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

/** 12 hue bins weighted by saturation + 4 brightness bins for grey pixels. Input: RGBA bytes. */
/** @public (tests) */
export function colorHist(rgba: ArrayLike<number>): number[] {
  const h = new Array(16).fill(0);
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i] / 255;
    const g = rgba[i + 1] / 255;
    const b = rgba[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.2 || max < 0.12) {
      h[12 + Math.min(3, Math.floor(max * 4))] += 1;
      continue;
    }
    let hue = 0;
    const d = max - min;
    if (max === r) hue = ((g - b) / d + 6) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    h[Math.floor((hue / 6) * 12) % 12] += sat;
    h[12 + Math.min(3, Math.floor(max * 4))] += 1 - sat;
  }
  const total = h.reduce((a, v) => a + v, 0) || 1;
  return h.map((v) => v / total);
}

const W_STRUCTURE = 0.6;
/** 0..1 similarity between two fingerprints. */
export function similarity(a: Fingerprint, b: Fingerprint): number {
  const structure = 1 - hamming(a.hash, b.hash) / (a.hash.length * 4);
  let inter = 0;
  for (let i = 0; i < 16; i++) inter += Math.min(a.hist[i] ?? 0, b.hist[i] ?? 0);
  return W_STRUCTURE * structure + (1 - W_STRUCTURE) * inter;
}

/** Same place if at least this similar. Calibrated in scripts/test-fajr.mjs. */
export const MATCH = 0.7;

/** Base image the fingerprint is computed from: 72x72 RGBA (9x9 blocks of 8x8 pixels). */
/** @public (tests) */
export const BASE_W = 72;
/** @public (tests) */
export const BASE_H = 72;

/** Fingerprint from the 72x72 RGBA base image (shared by the app and the calibration test). */
/** @public (tests) */
export function fingerprintFromPixels(rgba: ArrayLike<number>): Fingerprint {
  const gray: number[] = [];
  for (let by = 0; by < 9; by++)
    for (let bx = 0; bx < 9; bx++) {
      let sum = 0;
      for (let y = by * 8; y < by * 8 + 8; y++)
        for (let x = bx * 8; x < bx * 8 + 8; x++) {
          const i = (y * BASE_W + x) * 4;
          sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
        }
      gray.push(sum / 64);
    }
  return { hash: dHash(gray), hist: colorHist(rgba) };
}

// ---------- browser parts ----------

/** Centre-crops to w:h and scales down by halving steps (a single big downscale aliases badly). */
async function draw(file: Blob, w: number, h: number): Promise<CanvasRenderingContext2D> {
  const bmp = await createImageBitmap(file);
  const scale = Math.max(w / bmp.width, h / bmp.height);
  const sw = w / scale;
  const sh = h / scale;
  let src: CanvasImageSource = bmp;
  let sx = (bmp.width - sw) / 2;
  let sy = (bmp.height - sh) / 2;
  let cw = sw;
  let ch = sh;
  while (cw / 2 >= w && ch / 2 >= h) {
    const step = document.createElement("canvas");
    step.width = Math.round(cw / 2);
    step.height = Math.round(ch / 2);
    const sctx = step.getContext("2d");
    if (!sctx) break;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(src, sx, sy, cw, ch, 0, 0, step.width, step.height);
    src = step;
    sx = 0;
    sy = 0;
    cw = step.width;
    ch = step.height;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, sx, sy, cw, ch, 0, 0, w, h);
  bmp.close();
  return ctx;
}

export async function fingerprint(file: Blob): Promise<Fingerprint> {
  const ctx = await draw(file, BASE_W, BASE_H);
  return fingerprintFromPixels(ctx.getImageData(0, 0, BASE_W, BASE_H).data);
}

export async function makeReference(file: Blob): Promise<PhotoRef> {
  const fp = await fingerprint(file);
  const thumb = (await draw(file, 96, 96)).canvas.toDataURL("image/jpeg", 0.6);
  return { ...fp, thumb };
}

const isRef = (v: unknown): v is PhotoRef => {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.hash === "string" &&
    /^[0-9a-f]{32}$/.test(o.hash) &&
    Array.isArray(o.hist) &&
    o.hist.length === 16 &&
    o.hist.every((x) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1) &&
    typeof o.thumb === "string" &&
    o.thumb.length < 40_000 &&
    o.thumb.startsWith("data:image/jpeg;base64,")
  );
};

export function loadReference(): PhotoRef | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return isRef(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveReference(ref: PhotoRef | null) {
  try {
    if (ref) localStorage.setItem(KEY, JSON.stringify(ref));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage full or unavailable */
  }
}
