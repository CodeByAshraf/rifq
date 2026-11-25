// Hash-based routing for the app (Capacitor serves one index.html; screens live after the #).
import { useSyncExternalStore } from "react";

export const toHash = (href: string) => {
  const path = href.split("#")[0];
  if (href.startsWith("#")) return href;
  return path === "/" || path === "" ? "#home" : `#${path.replace(/^\//, "").replace(/\/$/, "")}`;
};
const currentPath = () => {
  const h = (typeof location !== "undefined" ? location.hash : "").replace(/^#/, "");
  return !h || h === "home" ? "/" : `/${h}`;
};
const sub = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
export const usePathname = () => useSyncExternalStore(sub, currentPath, () => "/");
export const navigate = (href: string) => {
  // In-page anchors on the home page (e.g. #games) scroll instead of routing.
  if (href.startsWith("#") && document.getElementById(href.slice(1))) {
    document.getElementById(href.slice(1))!.scrollIntoView({ behavior: "smooth" });
    return;
  }
  location.hash = toHash(href);
  window.scrollTo(0, 0);
};
export const useRouter = () => ({ push: navigate, replace: navigate, back: () => history.back() });
