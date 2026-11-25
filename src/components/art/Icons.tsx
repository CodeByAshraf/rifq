/* Custom rounded icon set for RIFQ (stroke-based, 24px grid). */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 24, props: SVGProps<SVGSVGElement>) => {
  // `filled` is only meaningful for some icons; never forward it to the DOM.
  const { filled: _filled, ...rest } = props as SVGProps<SVGSVGElement> & { filled?: boolean };
  void _filled;
  return {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...rest,
  };
};

export const IconHome = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5h-6v5H5.5A1.5 1.5 0 0 1 4 19z" /></svg>
);
export const IconBook = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" /><path d="M12 6.5v13" /></svg>
);
export const IconMap = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2z" /><path d="M9 4v14M15 6v14" /></svg>
);
export const IconSprout = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 20v-8" /><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z" /></svg>
);
export const IconLantern = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 2.5v2M9 4.5h6l1 2.5H8z" /><path d="M8 7c-1 4-1 8 1 12h6c2-4 2-8 1-12" /><path d="M8.5 19h7v2h-7z" /></svg>
);
export const IconPuzzle = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z" /></svg>
);
export const IconRefresh = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 20v-4h-4" /></svg>
);
export const IconStar = ({ size, filled, ...r }: P & { filled?: boolean }) => (
  <svg {...base(size, r)} fill={filled ? "currentColor" : "none"}><path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z" /></svg>
);
export const IconPlay = ({ size, ...r }: P) => (
  <svg {...base(size, r)} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
);
export const IconPause = ({ size, ...r }: P) => (
  <svg {...base(size, r)} fill="currentColor" stroke="none"><rect x="6" y="5" width="4.5" height="14" rx="1.5" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.5" /></svg>
);
export const IconNext = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="m15 6-6 6 6 6" /></svg>
);
export const IconPrev = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconRepeat = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M17 2.5 20 5.5l-3 3" /><path d="M4 11V9.5a4 4 0 0 1 4-4h12" /><path d="m7 21.5-3-3 3-3" /><path d="M20 13v1.5a4 4 0 0 1-4 4H4" /></svg>
);
export const IconBookmark = ({ size, filled, ...r }: P & { filled?: boolean }) => (
  <svg {...base(size, r)} fill={filled ? "currentColor" : "none"}><path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7z" /></svg>
);
export const IconCheck = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconX = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconLock = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const IconFamily = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><circle cx="8" cy="7" r="2.8" /><circle cx="16.5" cy="8.5" r="2.2" /><path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14a4.5 4.5 0 0 1 4.5 4.5V20" /><path d="M13.5 15.2a3.6 3.6 0 0 1 6.5 2.3V20" /></svg>
);
export const IconFlame = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.3 3.6-8.3.5 1.8 1.6 2.9 2.6 3.4.3-2.7 1.6-5 3.9-6.4-.4 2.8.8 4.6 2 6.3 1 1.4 1.9 3 1.9 5 0 3.6-3.1 6.2-7.5 6.2z" /></svg>
);
export const IconEye = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M3 3l18 18" /><path d="M10.6 5.6A9 9 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a16 16 0 0 1-3 3.7M6.6 6.6A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9" /></svg>
);
export const IconHeadphones = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4.5" height="6.5" rx="2" /><rect x="16.5" y="14" width="4.5" height="6.5" rx="2" /></svg>
);
export const IconChart = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 20h16" /><path d="M7 16v-4M12 16V7M17 16v-6" /></svg>
);
export const IconCalendar = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><rect x="4" y="5.5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3.5v4M15 3.5v4" /></svg>
);
export const IconUser = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></svg>
);
export const IconSparkle = ({ size, ...r }: P) => (
  <svg {...base(size, r)} fill="currentColor" stroke="none"><path d="M12 2.5c.7 4.6 2.9 6.8 7.5 7.5-4.6.7-6.8 2.9-7.5 7.5-.7-4.6-2.9-6.8-7.5-7.5 4.6-.7 6.8-2.9 7.5-7.5zM19 15.5c.3 2 1.2 2.9 3.2 3.2-2 .3-2.9 1.2-3.2 3.2-.3-2-1.2-2.9-3.2-3.2 2-.3 2.9-1.2 3.2-3.2z" /></svg>
);
export const IconVolume = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>
);
export const IconShield = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
);
export const IconLogout = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" /><path d="M10 8l-4 4 4 4M6 12h9" /></svg>
);
export const IconStories = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 5.5C6.5 4.5 9.5 4.6 12 6c2.5-1.4 5.5-1.5 8-.5V19c-2.5-1-5.5-.9-8 .5-2.5-1.4-5.5-1.5-8-.5z" /><path d="M12 6v13.5" /><path d="m7.5 9.5.6 1.2 1.3.2-1 .9.3 1.3-1.2-.7-1.2.7.3-1.3-1-.9 1.3-.2z" /></svg>
);
export const IconAlarm = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4l2.5 2M4 5.5 6.5 3M20 5.5 17.5 3" /></svg>
);
export const IconCamera = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="12.5" r="3.5" /></svg>
);
export const IconPin = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
);
