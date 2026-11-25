/**
 * Baba Magdy — RIFQ's guide.
 * - MagdyImage: the still portrait holding the Mushaf (used wherever the character does not move).
 * - MagdyStanding: the portrait without the Mushaf, with a soft floor shadow.
 * Both are small transparent WebP files (~35 KB); no 3D library is loaded.
 */

const BASE: string = (globalThis as { __RIFQ_DATA_BASE__?: string }).__RIFQ_DATA_BASE__ ?? "";
const SRC_STILL = `${BASE}/characters/magdy-quran.webp`;
const SRC_LIVE = `${BASE}/characters/magdy.webp`;
const RATIO = 349 / 780; // width / height of the artwork

/** Static Baba Magdy holding the Mushaf. `size` is the rendered height in px. */
export function MagdyImage({ size = 160, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC_STILL}
      alt="بابا مجدي"
      width={Math.round(size * RATIO)}
      height={size}
      draggable={false}
      className={`select-none ${className}`}
      style={{ height: size, width: "auto", objectFit: "contain" }}
    />
  );
}

/** Baba Magdy without the Mushaf, standing still (no animation, for performance). `size` is the height in px. */
export function MagdyStanding({ size = 260, onPoke, className = "" }: { size?: number; onPoke?: () => void; className?: string }) {
  const w = Math.round(size * RATIO);
  return (
    <div className={`relative select-none ${className}`} style={{ width: w, height: size + 10 }} onClick={onPoke} role={onPoke ? "button" : undefined} aria-label="بابا مجدي">
      <div className="absolute bottom-0 left-1/2 h-3 -translate-x-1/2 rounded-[50%] bg-ink-900/15 blur-[3px]" style={{ width: w * 0.85 }} aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SRC_LIVE} alt="" draggable={false} decoding="async" style={{ height: size, width: w }} className={`relative block ${onPoke ? "cursor-pointer" : ""}`} />
    </div>
  );
}
