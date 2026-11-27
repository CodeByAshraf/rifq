import { motion } from "framer-motion";
import { Link } from "@/components/shell/Link";
import { useEffect, useState } from "react";
import { BadgeArt } from "@/components/art/BadgeArt";
import { Character, OUTFIT, SKIN } from "@/components/art/Character";
import { IconBook, IconCheck, IconFlame, IconLantern, IconMap, IconPuzzle, IconRefresh, IconSprout, IconStar } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { MagdyStanding } from "@/components/art/Magdy";
import { Cloud, DomeHouse, Flower, Lantern, Palm, RoundTree, Sparkle } from "@/components/art/Scenery";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, LinkButton, Modal, ProgressBar, Ring, SectionTitle, SpeechBubble } from "@/components/ui";
import { BADGES, DECOR } from "@/data/badges";
import { storyOfTheDay } from "@/data/stories";
import { StoryScene } from "@/components/art/StoryScene";
import { dailyMissions, dueVerses, learnedTotal, relativeDay, stationStatus } from "@/lib/learning";
import { surahMeta, toArabicDigits } from "@/lib/quran";
import { actions, streak, useChild, type Avatar } from "@/lib/store";
import { ladder, rewardProgress } from "@/lib/motivation";

const KIND_ICON = { memorize: IconSprout, revise: IconRefresh, lesson: IconLantern, game: IconPuzzle, read: IconBook };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء النور";
  return "مساء الخير";
}

export function KidsDashboard() {
  const { child, data } = useChild();
  const [editing, setEditing] = useState(false);
  // The animated guide is shown on wide screens, where the welcome banner has room for him.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const due = dueVerses(data.verses);
  const stations = stationStatus(data.verses);
  const current = stations.find((s) => s.status === "current") ?? stations[0];
  const winStart = Math.max(0, Math.min(stations.length - 8, stations.indexOf(current) - 2));
  const missions = dailyMissions(data);
  const learned = learnedTotal(data.verses);
  const s = streak(data.activeDays);
  const earnedBadges = BADGES.filter((b) => data.badges[b.id]);
  const L = ladder(learned);
  const reward = data.reward;
  const rp = reward ? rewardProgress(data, reward) : null;

  return (
    <AppShell>
      {/* ---------- Welcome garden ---------- */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-b from-sky-200 via-sky-100 to-mint-100 shadow-lift">
        <svg viewBox="0 0 1000 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
          <Cloud x={620} y={30} s={0.9} />
          <Cloud x={80} y={60} s={0.6} opacity={0.8} />
          <Sparkle x={500} y={50} r={5} />
          <Sparkle x={900} y={120} r={4} color="#c9b8ff" delay={1} />
          <path d="M0 230 Q250 190 500 222 Q760 252 1000 212 L1000 300 L0 300 Z" fill="#8ee6b5" />
          <path d="M0 256 Q300 232 560 258 Q800 278 1000 250 L1000 300 L0 300 Z" fill="#5fd598" />
          <RoundTree x={930} y={246} s={0.9} />
          {data.stars >= DECOR[0].stars && <Palm x={820} y={250} s={0.8} />}
          {data.stars >= DECOR[2].stars && <Lantern x={700} y={170} s={1.1} />}
          {data.stars >= DECOR[4].stars && <DomeHouse x={100} y={262} s={0.55} />}
          {data.stars >= DECOR[3].stars && [60, 220, 640, 760].map((x, i) => <Flower key={x} x={x} y={272} c={["#ff9a8b", "#ffcc4d", "#c9b8ff", "#ff9a8b"][i]} />)}
          {data.stars >= DECOR[1].stars && (
            <g transform="translate(240 250)">
              <ellipse cx="0" cy="6" rx="46" ry="10" fill="#1d3a4a" opacity="0.12" />
              <ellipse cx="0" cy="0" rx="44" ry="13" fill="#7cc8f5" />
              <ellipse cx="0" cy="-3" rx="30" ry="7" fill="#bfe6ff" />
              <rect x="-5" y="-34" width="10" height="32" rx="5" fill="#fff6e6" />
              <path d="M0 -36 Q-14 -54 -22 -30 M0 -36 Q14 -54 22 -30" stroke="#92d2fb" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          )}
        </svg>

        {wide && (
          <div className="absolute bottom-0 left-6 z-10">
            <MagdyStanding size={230} />
          </div>
        )}
        <div className="relative grid items-end gap-4 p-6 pb-0 sm:grid-cols-[auto_1fr] sm:p-8 sm:pb-0">
          <div className="order-2 flex justify-center sm:order-1">
            <div className="relative">
              <Character avatar={child.avatar} size={190} wave />
            </div>
          </div>
          <div className="order-1 pb-6 sm:order-2 sm:pb-12">
            <p className="font-display text-lg font-bold text-teal-700">{greeting()}</p>
            <h1 className="font-display text-4xl font-extrabold text-ink-900 sm:text-5xl">أهلًا يا {child.name}</h1>
            <SpeechBubble className="mt-4 inline-block max-w-md">
              {learned === 0 ? "هيّا نبدأ رحلتنا بأول آية من سورة الفاتحة!" : due.length ? `عندك ${toArabicDigits(due.length)} آيات تنتظر المراجعة. أنت قادرٌ عليها!` : "أحسنت! آياتك مرتّبة، هيّا نتعلّم شيئًا جديدًا."}
            </SpeechBubble>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/memorize" size="lg" className="min-w-48">
                متابعة التعلّم
              </LinkButton>
              <Button size="lg" tone="white" onClick={() => setEditing(true)}>
                غيّر شخصيتي
              </Button>
              {due.length > 0 && (
                <LinkButton href="/revision" size="lg" tone="sun">
                  راجع الآن ({toArabicDigits(due.length)})
                </LinkButton>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ---------- Quick access to new sections ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/bedtime", label: "قبل النوم", sub: "حكايات مسموعة", c: "from-[#0b1736] to-[#1d2f5c] text-white" },
          { href: "/certificates", label: "شهاداتي", sub: `${toArabicDigits(Object.keys(data.certificates ?? {}).length)} شهادة`, c: "from-sun-300 to-sun-500 text-ink-900" },
          { href: "/adhkar", label: "الأذكار", sub: "الصباح والمساء", c: "from-teal-400 to-teal-600 text-white" },
          { href: "/recite", label: "تلاوتي", sub: "سجّل صوتك", c: "from-coral-400 to-coral-500 text-white" },
          { href: "/challenges", label: "التحديات", sub: "الكهف ورمضان", c: "from-lilac-400 to-lilac-600 text-white" },
        ].map((t) => (
          <Link key={t.href} href={t.href} className={`rounded-[1.5rem] bg-gradient-to-br p-4 shadow-soft transition hover:-translate-y-1 ${t.c}`}>
            <div className="font-display text-xl font-extrabold">{t.label}</div>
            <div className="text-sm opacity-85">{t.sub}</div>
          </Link>
        ))}
      </div>

      {/* ---------- Motivation: the ladder and the promised reward ---------- */}
      <div className={`mt-6 grid gap-3 ${reward ? "sm:grid-cols-2" : ""}`}>
        <Link href="/irtaqi" className="rounded-[1.6rem] bg-gradient-to-br from-teal-500 to-teal-700 p-5 text-white shadow-soft transition hover:-translate-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-sm font-bold text-teal-100">اقرأ وارتقِ</span>
            <span className="rounded-xl bg-white/20 px-2 py-0.5 text-xs font-bold">الدرجة {toArabicDigits(L.level + 1)}</span>
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold">{L.title}</div>
          <ProgressBar value={L.pct} tone="sun" className="mt-3" label="التقدّم إلى الدرجة التالية" />
          <div className="mt-1 text-sm text-teal-50">{L.next ? `باقي ${toArabicDigits(L.toNext)} آية لـ«${L.next.title}»` : "بلغتَ القمّة!"}</div>
        </Link>
        {reward && rp && (
          <div className="rounded-[1.6rem] bg-gradient-to-br from-sun-200 to-sun-400 p-5 text-ink-900 shadow-soft">
            <div className="font-display text-sm font-bold">🎁 هدية من بابا وماما</div>
            <div className="mt-1 font-display text-2xl font-extrabold">{reward.text}</div>
            <ProgressBar value={rp.target ? rp.cur / rp.target : 0} tone="mint" className="mt-3" label="التقدّم نحو الهدية" />
            <div className="mt-1 text-sm font-bold">
              {reward.reached ? "استحققتها! أخبر بابا وماما 🎉" : `${rp.goal}: ${toArabicDigits(rp.cur)} من ${toArabicDigits(rp.target)}`}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Stats ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: IconStar, label: "نجومي", value: data.stars, c: "bg-sun-100 text-sun-600" },
          { icon: IconFlame, label: "أيام متتالية", value: s, c: "bg-coral-100 text-coral-500" },
          { icon: IconSprout, label: "آيات حفظتها", value: learned, c: "bg-mint-100 text-mint-600" },
          { icon: IconLantern, label: "أوسمتي", value: earnedBadges.length, c: "bg-lilac-100 text-lilac-600" },
        ].map((x, i) => (
          <motion.div key={x.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Card className="flex items-center gap-3 p-4">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${x.c}`}>
                <x.icon size={24} filled />
              </span>
              <div>
                <div className="font-display text-2xl font-extrabold leading-none">{x.value.toLocaleString("ar-EG")}</div>
                <div className="mt-1 text-xs font-bold text-ink-500">{x.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* ---------- Daily mission ---------- */}
        <Card className="p-6">
          <SectionTitle title="مهمّة اليوم" hint="ثلاث خطوات صغيرة، وتكتمل مهمّتك" />
          <div className="space-y-3">
            {missions.map((m, i) => (
              <Link key={m.id} href={m.href} className={`flex items-center gap-4 rounded-2xl p-3 transition ${m.done ? "bg-mint-100" : "bg-cream-100 hover:bg-cream-200"}`}>
                <span className={`grid h-11 w-11 place-items-center rounded-2xl font-display text-lg font-extrabold ${m.done ? "bg-mint-500 text-white" : "bg-white text-ink-500 shadow-soft"}`}>
                  {m.done ? <IconCheck size={22} /> : toArabicDigits(i + 1)}
                </span>
                <span className={`flex-1 font-display text-lg font-bold ${m.done ? "text-mint-600" : ""}`}>{m.label}</span>
                <span className="flex items-center gap-1 text-sm font-bold text-sun-600">
                  +{toArabicDigits(m.stars)} <IconStar filled size={16} />
                </span>
              </Link>
            ))}
          </div>
          <ProgressBar value={missions.filter((m) => m.done).length / missions.length} tone="mint" className="mt-5" label="تقدّم مهمة اليوم" />
        </Card>

        {/* ---------- Current surah progress ---------- */}
        <Card className="flex flex-col p-6">
          <SectionTitle title="سورتي الحالية" />
          <div className="flex items-center gap-5">
            <Ring value={current.pct} size={110} stroke={12}>
              <div className="text-center">
                <div className="font-display text-2xl font-extrabold">{toArabicDigits(Math.round(current.pct * 100))}٪</div>
              </div>
            </Ring>
            <div>
              <div className="font-display text-2xl font-extrabold">سورة {surahMeta(current.surah).name}</div>
              <div className="mt-1 text-ink-500">
                {toArabicDigits(current.learned)} من {toArabicDigits(current.total)} آيات
              </div>
              <div className="mt-1 text-sm font-bold text-teal-600">{current.place}</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5" aria-label="حالة آيات السورة">
            {Array.from({ length: current.total }, (_, i) => {
              const v = data.verses[`${current.surah}:${i + 1}`];
              const c = !v || v.state === "not_started" ? "bg-cream-200 text-ink-300" : v.state === "needs_revision" ? "bg-coral-400 text-white" : v.state === "learning" ? "bg-sky-400 text-white" : "bg-mint-500 text-white";
              return (
                <span key={i} className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-bold ${c}`} title={`الآية ${i + 1}`}>
                  {toArabicDigits(i + 1)}
                </span>
              );
            })}
          </div>
          <div className="mt-auto pt-5">
            <LinkButton href="/journey" tone="white" className="w-full">
              <IconMap size={20} /> افتح خريطة الرحلة
            </LinkButton>
          </div>
        </Card>
      </div>

      {/* ---------- Journey preview ---------- */}
      <Card className="mt-6 overflow-hidden p-6">
        <SectionTitle title="رحلتي" hint="كلّ سورةٍ تتمّها تفتح المحطة التالية" action={<Link href="/journey" className="text-sm font-bold text-teal-600">عرض الكل</Link>} />
        <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
          {stations.slice(winStart, winStart + 8).map((st, j) => { const i = winStart + j; return (
            <div key={st.surah} className={`w-36 shrink-0 rounded-3xl p-3 text-center ${st.status === "current" ? "bg-sun-100 ring-2 ring-sun-400" : st.status === "done" ? "bg-mint-100" : "bg-cream-100 opacity-70"}`}>
              <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full font-display text-lg font-extrabold text-white ${st.status === "done" ? "bg-mint-500" : st.status === "current" ? "bg-sun-500" : "bg-ink-300"}`}>
                {st.status === "done" ? <IconCheck size={22} /> : toArabicDigits(i + 1)}
              </div>
              <div className="mt-2 font-display text-base font-extrabold">{surahMeta(st.surah).name}</div>
              <div className="text-[11px] font-bold text-ink-500">{st.place}</div>
            </div>
          ); })}
        </div>
      </Card>

      {/* ---------- Story of the day ---------- */}
      <Link href="/stories" className="group mt-6 block">
        <div className="relative overflow-hidden rounded-[1.75rem] shadow-lift">
          <StoryScene scene={storyOfTheDay().scene} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-l from-ink-900/70 via-ink-900/30 to-transparent" />
          <div className="relative flex min-h-40 flex-col justify-end p-6 text-white">
            <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">قصة اليوم</span>
            <div className="mt-2 font-display text-3xl font-extrabold">{storyOfTheDay().title}</div>
            <div className="text-sm text-white/85">اضغط لتقرأ القصة وتجمع النجوم</div>
          </div>
        </div>
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ---------- Achievements ---------- */}
        <Card className="p-6">
          <SectionTitle title="أوسمتي" hint={`${toArabicDigits(earnedBadges.length)} من ${toArabicDigits(BADGES.length)}`} />
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map((b) => (
              <div key={b.id} className="flex flex-col items-center text-center" title={b.description}>
                <BadgeArt badge={b} earned={!!data.badges[b.id]} size={62} />
                <span className={`mt-1 text-[11px] font-bold leading-tight ${data.badges[b.id] ? "text-ink-900" : "text-ink-300"}`}>{b.title}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ---------- Recent activity ---------- */}
        <Card className="p-6">
          <SectionTitle title="آخر ما أنجزته" />
          {data.activity.length === 0 ? (
            <div className="flex items-center gap-4 rounded-2xl bg-cream-100 p-4">
              <Mascot size={60} mood="think" />
              <p className="text-ink-500">لم تبدأ بعد. أوّل إنجاز ينتظرك في مركز الحفظ!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.activity.slice(0, 5).map((a, i) => {
                const I = KIND_ICON[a.kind];
                return (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-cream-100 p-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-teal-600 shadow-soft">
                      <I size={20} />
                    </span>
                    <span className="flex-1 text-sm font-bold">{a.label}</span>
                    <span className="text-xs text-ink-500">{relativeDay(a.at)}</span>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-sun-600">
                      +{toArabicDigits(a.stars)} <IconStar filled size={13} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------- Garden decorations ---------- */}
      <Card className="mt-6 p-6">
        <SectionTitle title="حديقتي" hint="اجمع النجوم لتزيّن حديقتك" />
        <div className="grid grid-cols-5 gap-2">
          {DECOR.map((d) => {
            const open = data.stars >= d.stars;
            return (
              <div key={d.id} className={`rounded-2xl p-3 text-center ${open ? "bg-mint-100" : "bg-cream-100"}`}>
                <div className={`font-display text-sm font-extrabold ${open ? "text-mint-600" : "text-ink-300"}`}>{d.title}</div>
                <div className="mt-1 flex items-center justify-center gap-0.5 text-xs font-bold text-sun-600">
                  {toArabicDigits(d.stars)} <IconStar filled size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <AvatarEditor open={editing} onClose={() => setEditing(false)} avatar={child.avatar} name={child.name} childId={child.id} />
    </AppShell>
  );
}

function AvatarEditor({ open, onClose, avatar, name, childId }: { open: boolean; onClose: () => void; avatar: Avatar; name: string; childId: string }) {
  const [n, setN] = useState(name);
  const { data } = useChild();
  const accessories: { id: Avatar["accessory"]; label: string; stars: number }[] = [
    { id: "none", label: "بدون", stars: 0 },
    { id: "satchel", label: "حقيبة", stars: 0 },
    { id: "scarf", label: "وشاح", stars: 20 },
    { id: "crown", label: "تاج النجوم", stars: 80 },
  ];
  return (
    <Modal open={open} onClose={onClose} title="شخصيتي">
      <h3 className="font-display text-2xl font-extrabold">شخصيتي</h3>
      <div className="mt-2 flex justify-center rounded-3xl bg-gradient-to-b from-sky-100 to-mint-100 pt-3">
        <Character avatar={avatar} size={150} />
      </div>
      <label className="mt-4 block text-sm font-bold text-ink-700">
        اسمي
        <input
          value={n}
          maxLength={20}
          onChange={(e) => setN(e.target.value)}
          onBlur={() => n.trim() && actions.updateChildProfile(childId, { name: n.trim() })}
          className="mt-1 h-12 w-full rounded-2xl border-2 border-cream-300 bg-white px-4 font-display text-lg outline-none focus:border-teal-400"
        />
      </label>
      <div className="mt-4 text-sm font-bold text-ink-700">لون البشرة</div>
      <div className="mt-2 flex gap-2">
        {SKIN.map((c, i) => (
          <button key={c} onClick={() => actions.setAvatar({ skin: i })} className={`h-9 w-9 rounded-full ring-offset-2 ${avatar.skin === i ? "ring-3 ring-teal-500" : ""}`} style={{ background: c }} aria-label={`لون ${i + 1}`} />
        ))}
      </div>
      <div className="mt-4 text-sm font-bold text-ink-700">لون الملابس</div>
      <div className="mt-2 flex gap-2">
        {OUTFIT.map((o, i) => (
          <button key={o.base} onClick={() => actions.setAvatar({ outfit: i })} className={`h-9 w-9 rounded-full ring-offset-2 ${avatar.outfit === i ? "ring-3 ring-teal-500" : ""}`} style={{ background: o.base }} aria-label={o.name} />
        ))}
      </div>
      <div className="mt-4 text-sm font-bold text-ink-700">غطاء الرأس</div>
      <div className="mt-2 flex gap-2">
        {([
          ["kufi", "طاقية"],
          ["hijab", "حجاب"],
          ["none", "بدون"],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => actions.setAvatar({ headwear: k })} className={`rounded-2xl px-4 py-2 text-sm font-bold ${avatar.headwear === k ? "bg-teal-500 text-white" : "bg-cream-100"}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="mt-4 text-sm font-bold text-ink-700">إكسسوارات</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {accessories.map((a) => {
          const locked = data.stars < a.stars;
          return (
            <button
              key={a.id}
              disabled={locked}
              onClick={() => actions.setAvatar({ accessory: a.id })}
              className={`rounded-2xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${avatar.accessory === a.id ? "bg-teal-500 text-white" : "bg-cream-100"}`}
            >
              {a.label}
              {locked && ` · ${toArabicDigits(a.stars)} نجمة`}
            </button>
          );
        })}
      </div>
      <Button className="mt-6 w-full" onClick={() => { if (n.trim()) actions.updateChildProfile(childId, { name: n.trim() }); onClose(); }}>
        حفظ
      </Button>
    </Modal>
  );
}
