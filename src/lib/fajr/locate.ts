/** One-off approximate location for Fajr times. The position is rounded and stays on the device. */
import { isNative } from "../native";
import { CITIES, type City } from "./places";

export type LocateError = "denied" | "unavailable" | "timeout";

export async function locate(): Promise<{ lat: number; lng: number } | LocateError> {
  const round = (v: number) => Math.round(v * 100) / 100;
  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 20_000, maximumAge: 3_600_000 });
      return { lat: round(p.coords.latitude), lng: round(p.coords.longitude) };
    } catch (e) {
      const msg = String((e as Error)?.message ?? e).toLowerCase();
      return msg.includes("denied") || msg.includes("permission") ? "denied" : msg.includes("timeout") ? "timeout" : "unavailable";
    }
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) return "unavailable";
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: round(p.coords.latitude), lng: round(p.coords.longitude) }),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable"),
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 3_600_000 },
    );
  });
}

/** Great-circle distance in km. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Nearest listed city (to name the place and suggest the local calculation method). */
export function nearestCity(p: { lat: number; lng: number }): { city: City; km: number } {
  let best = CITIES[0];
  let km = Infinity;
  for (const c of CITIES) {
    const d = distanceKm(p, c);
    if (d < km) {
      km = d;
      best = c;
    }
  }
  return { city: best, km };
}
