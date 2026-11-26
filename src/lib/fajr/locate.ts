/** Pure helpers for naming a stored position. The app never reads device location (kids-app policy). */
import { CITIES, type City } from "./places";

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
