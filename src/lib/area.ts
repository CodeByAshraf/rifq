/**
 * The app has two areas: the children's world (playful: tap bursts, sounds, bubble transitions)
 * and the adults' corner (calm: no effects). The area follows the current route.
 */
const ADULT_ROUTES = new Set(["/adults", "/mushaf", "/adults-adhkar", "/adults-fajr"]);
export const isAdultArea = (path: string) => ADULT_ROUTES.has(path);

/** Marks the document so global effects (src/lib/fx.ts) can stay quiet in the adults' corner. */
export const setArea = (path: string) => {
  document.documentElement.dataset.area = isAdultArea(path) ? "adult" : "kids";
};
export const inAdultArea = () => typeof document !== "undefined" && document.documentElement.dataset.area === "adult";
