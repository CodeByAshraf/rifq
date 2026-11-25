import { MagdyImage } from "@/components/art/Magdy";

/**
 * Baba Magdy in static spots (celebrations, games, stories, loaders): the still portrait
 * holding the Mushaf. `size` keeps roughly the same on-screen height as the earlier mascot.
 * `mood` is kept for API compatibility.
 */
export function Mascot({ size = 120, className = "" }: { size?: number; mood?: "happy" | "cheer" | "think"; className?: string }) {
  return <MagdyImage size={Math.round(size * 1.25)} className={className} />;
}
