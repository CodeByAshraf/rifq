import { motion } from "framer-motion";
import { useRouter } from "@/lib/router";
import { useState } from "react";
import { Character } from "@/components/art/Character";
import { IconBook, IconCheck, IconLock, IconSprout, IconStar } from "@/components/art/Icons";
import { Cloud, DomeHouse, Flower, Lantern, Palm, RoundTree, Sparkle, Tower } from "@/components/art/Scenery";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Modal, ProgressBar } from "@/components/ui";
import type { Station } from "@/data/journey";
import { stationStatus } from "@/lib/learning";
import { surahMeta, toArabicDigits } from "@/lib/quran";
import { actions, useChild, verseKey } from "@/lib/store";

const W = 400;
const STEP = 190;

function SceneArt({ scene }: { scene: Station["scene"] }) {
  return (
    <svg viewBox="-80 -120 160 140" className="h-full w-full" aria-hidden>
      <ellipse cx="0" cy="4" rx="74" ry="16" fill="#5fd598" />
      <ellipse cx="0" cy="0" rx="70" ry="13" fill="#8ee6b5" />
      {scene === "gate" && (
        <g>
          <rect x="-34" y="-80" width="14" height="80" rx="4" fill="#fff6e6" />
          <rect x="20" y="-80" width="14" height="80" rx="4" fill="#fff6e6" />
          <path d="M-36 -78 Q0 -122 36 -78" stroke="#1fb3a6" strokeWidth="12" fill="none" strokeLinecap="round" />
          <circle cx="0" cy="-104" r="6" fill="#ffcc4d" />
          <Flower x={-50} y={4} />
          <Flower x={50} y={4} c="#c9b8ff" />
        </g>
      )}
      {scene === "garden" && (
        <g>
          <RoundTree x={-26} y={0} s={0.8} />
          <RoundTree x={30} y={2} s={0.6} tone="teal" />
          <Flower x={0} y={6} c="#ffcc4d" />
          <Flower x={-54} y={6} />
        </g>
      )}
      {scene === "palm" && (
        <g>
          <Palm x={-14} y={2} s={0.85} />
          <Palm x={34} y={4} s={0.6} />
        </g>
      )}
      {scene === "lantern" && (
        <g>
          <path d="M-50 0 Q0 -70 50 0 Z" fill="#a8ecc6" />
          <Lantern x={0} y={-58} s={1.4} />
          <Sparkle x={-40} y={-90} r={4} />
        </g>
      )}
      {scene === "pond" && (
        <g>
          <ellipse cx="0" cy="-4" rx="46" ry="10" fill="#7cc8f5" />
          <ellipse cx="-6" cy="-6" rx="28" ry="5" fill="#bfe6ff" />
          <RoundTree x={52} y={0} s={0.5} />
        </g>
      )}
      {scene === "fountain" && (
        <g transform="translate(0 -6)">
          <ellipse cx="0" cy="0" rx="40" ry="11" fill="#7cc8f5" />
          <rect x="-5" y="-40" width="10" height="38" rx="5" fill="#fff6e6" />
          <path d="M0 -42 Q-20 -66 -30 -30 M0 -42 Q20 -66 30 -30" stroke="#92d2fb" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      )}
      {scene === "tower" && <Tower x={0} y={2} s={0.65} />}
      {scene === "house" && <DomeHouse x={0} y={2} s={0.55} tone="lilac" />}
    </svg>
  );
}

export function JourneyMap() {
  const { child, data } = useChild();
  const router = useRouter();
  const stations = stationStatus(data.verses);
  const [open, setOpen] = useState<number | null>(null);
  const sel = open != null ? stations[open] : null;

  const pts = stations.map((_, i) => ({ x: i % 2 === 0 ? W * 0.28 : W * 0.72, y: 110 + i * STEP }));
  const height = pts[pts.length - 1].y + 140;
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const my = (prev.y + p.y) / 2;
    return `${acc} C${prev.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`;
  }, "");

  const done = stations.filter((s) => s.status === "done").length;

  function start(surah: number) {
    const m = surahMeta(surah);
    let a = 1;
    for (; a <= m.verses; a++) {
      const v = data.verses[verseKey(surah, a)];
      if (!v || v.state === "not_started") break;
    }
    actions.setFocus(surah, Math.min(a, m.verses));
    router.push("/memorize");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="card-3d flex items-center gap-4 p-5">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-b from-sky-200 to-mint-100">
            <Character avatar={child.avatar} size={64} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-extrabold">خريطة رحلتي</h1>
            <p className="text-sm text-ink-500">
              أتممتَ {toArabicDigits(done)} من {toArabicDigits(stations.length)} محطة
            </p>
            <ProgressBar value={done / stations.length} tone="mint" className="mt-2" />
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-sky-100 via-mint-100 to-cream-100" style={{ height }}>
          <svg viewBox={`0 0 ${W} ${height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
            <path d={d} stroke="#fff" strokeWidth="34" fill="none" strokeLinecap="round" />
            <path d={d} stroke="#f2dcb9" strokeWidth="16" fill="none" strokeLinecap="round" strokeDasharray="3 20" />
          </svg>
          <svg viewBox={`0 0 ${W} ${height}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            {pts.map((p, i) => (i % 3 === 1 ? <Cloud key={i} x={i % 2 ? 10 : 260} y={p.y - 60} s={0.6} opacity={0.85} /> : null))}
          </svg>

          {stations.map((st, i) => {
            const p = pts[i];
            const m = surahMeta(st.surah);
            const leftPct = (p.x / W) * 100;
            return (
              <motion.div
                key={st.surah}
                className="absolute"
                style={{ left: `${leftPct}%`, top: p.y }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <button
                  onClick={() => setOpen(i)}
                  className={`group relative -translate-x-1/2 -translate-y-1/2 text-center ${st.status === "locked" ? "grayscale-[0.7]" : ""}`}
                  aria-label={`محطة ${st.place} — سورة ${m.name}`}
                >
                  <div className="relative mx-auto h-28 w-36 transition group-hover:-translate-y-1">
                    <SceneArt scene={st.scene} />
                    <span
                      className={`absolute -bottom-1 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border-4 border-white font-display text-lg font-extrabold text-white shadow-[0_5px_0_rgba(0,0,0,0.12)] ${
                        st.status === "done" ? "bg-mint-500" : st.status === "current" ? "bg-sun-500" : "bg-ink-300"
                      }`}
                    >
                      {st.status === "done" ? <IconCheck size={22} /> : st.status === "locked" ? <IconLock size={20} /> : toArabicDigits(i + 1)}
                    </span>
                    {st.status === "current" && (
                      <span className="absolute -top-14 left-1/2 w-14 -translate-x-1/2 animate-float">
                        <Character avatar={child.avatar} size={56} />
                      </span>
                    )}
                  </div>
                  <div className="mt-3 rounded-2xl bg-white/90 px-3 py-1.5 shadow-soft">
                    <div className="font-display text-base font-extrabold">سورة {m.name}</div>
                    <div className="text-[11px] font-bold text-ink-500">{st.place}</div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Modal open={!!sel} onClose={() => setOpen(null)} title={sel ? sel.place : ""}>
        {sel && (
          <div className="text-center">
            <div className="mx-auto h-36 w-48">
              <SceneArt scene={sel.scene} />
            </div>
            <div className="text-sm font-bold text-teal-600">{sel.place}</div>
            <h3 className="font-display text-3xl font-extrabold">سورة {surahMeta(sel.surah).name}</h3>
            <p className="mt-1 text-ink-500">
              {toArabicDigits(surahMeta(sel.surah).verses)} آيات · {surahMeta(sel.surah).type === "meccan" ? "مكّية" : "مدنية"}
            </p>
            <ProgressBar value={sel.pct} tone="sun" className="mt-4" />
            <p className="mt-2 text-sm text-ink-500">
              حفظتَ {toArabicDigits(sel.learned)} من {toArabicDigits(sel.total)}
            </p>
            {sel.status === "locked" ? (
              <p className="mt-5 rounded-2xl bg-cream-100 p-4 text-ink-700">
                <IconLock size={18} className="inline" /> أتمّ المحطة السابقة لتفتح هذه المحطة.
              </p>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button onClick={() => start(sel.surah)}>
                  <IconSprout size={20} /> {sel.status === "done" ? "راجع الحفظ" : "ابدأ الحفظ"}
                </Button>
                <Button tone="white" onClick={() => { actions.setFocus(sel.surah, 1); router.push("/quran"); }}>
                  <IconBook size={20} /> اقرأ واستمع
                </Button>
              </div>
            )}
            {sel.status === "done" && (
              <p className="mt-4 flex items-center justify-center gap-1 font-bold text-sun-600">
                <IconStar filled size={18} /> محطةٌ مكتملة، بارك الله فيك!
              </p>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
