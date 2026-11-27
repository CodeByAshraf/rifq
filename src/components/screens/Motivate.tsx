import { useCallback, useEffect, useRef, useState } from "react";
import { IconCheck, IconPause, IconPlay, IconX } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Button, Card, ProgressBar } from "@/components/ui";
import { rewardProgress, type RewardKind } from "@/lib/motivation";
import { deleteMessage, getMessage, MAX_SECONDS, messageId, OCCASIONS, saveMessage, type FamilyMessage, type Occasion } from "@/lib/messages";
import { PICKER_SURAHS, toArabicDigits } from "@/lib/quran";
import { pickMime } from "@/lib/recordings";
import { actions, useProgress } from "@/lib/store";

const field = "h-12 w-full rounded-2xl bg-cream-100 px-4 outline-none focus:ring-2 focus:ring-teal-300";
const KINDS: { id: RewardKind; label: string }[] = [
  { id: "verses", label: "عدد آيات جديدة" },
  { id: "surah", label: "ختم سورة" },
  { id: "days", label: "أيام مهمّة اليوم" },
];

/** Parents' corner: a promised reward and family voice messages for one child. */
export function Motivate() {
  const children = useProgress((s) => s.children);
  const active = useProgress((s) => s.activeChildId);
  const [childId, setChildId] = useState(active);
  const child = children.find((c) => c.id === childId) ?? children[0];

  return (
    <AppShell>
      <p className="text-sm font-bold text-teal-600">ركن الوالدين</p>
      <h1 className="font-display text-4xl font-extrabold">تحفيز طفلك</h1>
      <p className="mt-2 text-ink-500">هديةٌ تعدونه بها، ورسالةٌ بأصواتكم تفرحه عندما يصل.</p>

      {children.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {children.map((c) => (
            <button key={c.id} onClick={() => setChildId(c.id)} className={`rounded-2xl px-4 py-2 font-bold ${c.id === child.id ? "bg-teal-500 text-white" : "bg-white text-ink-700 shadow-soft"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <RewardCard childId={child.id} name={child.name} />
      <MessagesCard childId={child.id} name={child.name} />
    </AppShell>
  );
}

function RewardCard({ childId, name }: { childId: string; name: string }) {
  const data = useProgress((s) => s.data[childId]);
  const reward = data?.reward;
  const [editing, setEditing] = useState(!reward);
  const [text, setText] = useState(reward?.text ?? "");
  const [kind, setKind] = useState<RewardKind>(reward?.kind ?? "verses");
  const [n, setN] = useState(reward?.n ?? 20);
  useEffect(() => setEditing(!reward), [childId, reward]);

  const save = () => {
    actions.setReward(childId, { text, kind, n });
    setEditing(false);
  };
  const p = data && reward ? rewardProgress(data, reward) : null;

  return (
    <Card className="mt-6 p-5">
      <h2 className="font-display text-2xl font-extrabold">🎁 هدية من بابا وماما</h2>
      {!editing && reward && p ? (
        <div className="mt-3">
          <div className="font-display text-xl font-extrabold text-teal-700">{reward.text}</div>
          <div className="mt-1 text-ink-500">الهدف: {p.goal}</div>
          <ProgressBar value={p.target ? p.cur / p.target : 0} tone="mint" className="mt-3" label="التقدّم نحو الهدية" />
          <div className="mt-1 text-sm font-bold text-ink-500">
            {toArabicDigits(p.cur)} من {toArabicDigits(p.target)}
          </div>
          {reward.reached ? (
            <div className="mt-4 rounded-2xl bg-mint-100 p-4">
              <p className="font-display text-lg font-extrabold text-mint-600">وصل {name} إلى الهدف! 🎉</p>
              <p className="text-sm text-ink-500">بعد أن تعطيه هديته، اضغط «سلّمتها» لتبدأ هدفًا جديدًا.</p>
              <Button className="mt-3" onClick={() => actions.clearReward(childId)}>
                <IconCheck size={18} /> سلّمتها
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <Button tone="white" onClick={() => setEditing(true)}>
                تغيير
              </Button>
              <Button tone="white" onClick={() => actions.clearReward(childId)}>
                إلغاء الهدية
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">الهدية</span>
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={60} placeholder="مثلًا: نزهة إلى الحديقة" className={field} />
          </label>
          <div>
            <span className="mb-1 block text-sm font-bold">متى يستحقّها؟</span>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    setKind(k.id);
                    setN(k.id === "surah" ? 67 : k.id === "days" ? 7 : 20);
                  }}
                  className={`rounded-2xl px-4 py-2 font-bold ${kind === k.id ? "bg-teal-500 text-white" : "bg-cream-100 text-ink-700"}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          {kind === "surah" ? (
            <select value={n} onChange={(e) => setN(Number(e.target.value))} className={field} aria-label="السورة">
              {PICKER_SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  سورة {s.name} ({toArabicDigits(s.verses)} آية)
                </option>
              ))}
            </select>
          ) : (
            <label className="block">
              <span className="mb-1 block text-sm font-bold">{kind === "days" ? "عدد الأيام" : "عدد الآيات الجديدة"}</span>
              <input type="number" inputMode="numeric" min={1} max={kind === "days" ? 365 : 6236} value={n} onChange={(e) => setN(Number(e.target.value) || 1)} className={field} />
            </label>
          )}
          <div className="flex gap-2">
            <Button onClick={save} disabled={text.trim().length < 2}>
              حفظ الهدية
            </Button>
            {reward && (
              <Button tone="white" onClick={() => setEditing(false)}>
                رجوع
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-500">يرى {name} الهدية وشريط التقدّم في صفحته، وتُحسب الآيات والأيام من اليوم فقط.</p>
        </div>
      )}
    </Card>
  );
}

function MessagesCard({ childId, name }: { childId: string; name: string }) {
  return (
    <Card className="mt-6 p-5">
      <h2 className="font-display text-2xl font-extrabold">🎙️ رسالة من العائلة</h2>
      <p className="mt-1 text-ink-500">
        سجّلوا رسالةً قصيرة بأصواتكم (حتى دقيقة). تُفتح لـ{name} عندما يصل، وتبقى على هذا الهاتف فقط.
      </p>
      <div className="mt-4 space-y-4">
        {OCCASIONS.map((o) => (
          <MessageSlot key={o.id} childId={childId} occasion={o.id} title={o.title} when={o.when} />
        ))}
      </div>
    </Card>
  );
}

const SENDERS = ["بابا", "ماما", "جدو", "تيتة"];

function MessageSlot({ childId, occasion, title, when }: { childId: string; occasion: Occasion; title: string; when: string }) {
  const id = messageId(childId, occasion);
  const [msg, setMsg] = useState<FamilyMessage | null>(null);
  const [from, setFrom] = useState("بابا");
  const [state, setState] = useState<"idle" | "recording">("idle");
  const [secs, setSecs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(() => {
    getMessage(id)
      .then((m) => {
        setMsg(m);
        if (m) setFrom(m.from);
      })
      .catch(() => setMsg(null));
  }, [id]);
  useEffect(load, [load]);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
      audio.current?.pause();
    },
    [],
  );

  const stop = () => rec.current?.state === "recording" && rec.current.stop();

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return setError("التسجيل غير مدعوم على هذا الجهاز.");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = pickMime();
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      const t0 = Date.now();
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = async () => {
        s.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
        setState("idle");
        const duration = (Date.now() - t0) / 1000;
        if (duration < 1) return;
        const blob = new Blob(chunks, { type: r.mimeType || mime || "audio/webm" });
        await saveMessage({ id, from, mime: blob.type, duration, at: new Date().toISOString(), blob }).catch(() => setError("تعذّر حفظ الرسالة."));
        load();
      };
      rec.current = r;
      setSecs(0);
      timer.current = setInterval(() => {
        setSecs((x) => {
          if (x + 1 >= MAX_SECONDS) stop();
          return x + 1;
        });
      }, 1000);
      r.start();
      setState("recording");
    } catch {
      setError("اسمح لرِفق باستخدام الميكروفون من إعدادات الهاتف.");
    }
  }

  const play = () => {
    if (!msg) return;
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    const url = URL.createObjectURL(msg.blob);
    const a = new Audio(url);
    audio.current = a;
    a.onended = () => {
      setPlaying(false);
      URL.revokeObjectURL(url);
    };
    void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  return (
    <div className="rounded-2xl bg-cream-100 p-4">
      <div className="font-display text-lg font-extrabold">{title}</div>
      <div className="text-sm text-ink-500">{when}</div>
      {msg ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button tone="white" onClick={play}>
            {playing ? <IconPause size={18} /> : <IconPlay size={18} />} رسالة من {msg.from} ({toArabicDigits(Math.round(msg.duration))} ث)
          </Button>
          <Button
            tone="white"
            onClick={() => {
              audio.current?.pause();
              void deleteMessage(id).then(load);
            }}
          >
            <IconX size={18} /> حذف
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {SENDERS.map((s) => (
              <button key={s} onClick={() => setFrom(s)} className={`rounded-xl px-3 py-1.5 text-sm font-bold ${from === s ? "bg-teal-500 text-white" : "bg-white text-ink-700"}`}>
                {s}
              </button>
            ))}
          </div>
          {state === "recording" ? (
            <Button className="mt-3" tone="coral" onClick={stop}>
              ⏹ إيقاف وحفظ ({toArabicDigits(secs)} / {toArabicDigits(MAX_SECONDS)} ث)
            </Button>
          ) : (
            <Button className="mt-3" onClick={start}>
              🎙️ سجّل رسالة من {from}
            </Button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm font-bold text-coral-500">{error}</p>}
    </div>
  );
}
