import { Link } from "@/components/shell/Link";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/art/GameArt";
import { IconLogout, IconRefresh, IconShield } from "@/components/art/Icons";
import { Mascot } from "@/components/art/Mascot";
import { Button, Card, LinkButton } from "@/components/ui";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { pullProgress, pushProgress } from "@/lib/sync";
import { useProgress } from "@/lib/store";
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  checkPassword,
  clampInt,
  isValidEmail,
  isValidName,
  lockRemaining,
  nextThrottle,
  normalizeEmail,
  passwordScore,
  sanitizeName,
  type Throttle,
} from "@/lib/validation";
import { Turnstile } from "@/components/auth/Turnstile";

const THROTTLE_KEY = "rifq.auth.throttle";
const TURNSTILE_KEY = process.env.RIFQ_TURNSTILE_SITE_KEY;
const isDev = process.env.NODE_ENV !== "production";

function readThrottle(): Throttle {
  try {
    const t = JSON.parse(localStorage.getItem(THROTTLE_KEY) ?? "null");
    if (t && Number.isFinite(t.fails) && Number.isFinite(t.until)) return { fails: clampInt(t.fails, 0, 100), until: clampInt(t.until, 0, Date.now() + 3_600_000) };
  } catch {}
  return { fails: 0, until: 0 };
}
function writeThrottle(t: Throttle) {
  try {
    localStorage.setItem(THROTTLE_KEY, JSON.stringify(t));
  } catch {}
}

/**
 * Email flows use one-time CODES typed in the app (no links), because there is no website for a
 * link to open. Supabase email templates must contain {{ .Token }} (see SECURITY.md).
 *  in      sign in with email + password
 *  up      create an account → a code is emailed → "verify"
 *  verify  type the signup code (signs the user in)
 *  reset   ask for a password-reset code → "recover"
 *  recover type the code + a new password
 */
type Tab = "in" | "up" | "verify" | "reset" | "recover";

/** 6–10 digits, Arabic-Indic or Persian digits accepted. */
function cleanCode(v: string): string | null {
  const d = v
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\s+/g, "");
  return /^\d{6,10}$/.test(d) ? d : null;
}

// One generic message for every credential failure, so attackers cannot tell
// whether an email is registered (no account enumeration).
const GENERIC_FAIL = "البريد أو كلمة المرور غير صحيحة.";

export function Login() {
  const [tab, setTab] = useState<Tab>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [lock, setLock] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const onboarding = useProgress((s) => s.onboarding);
  const startHref = onboarding ? (onboarding.role === "kid" ? "/kids" : onboarding.startHref) : "/kids";

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setUser(data.user?.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setUser(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Live countdown while locked out.
  useEffect(() => {
    const tick = () => setLock(lockRemaining(readThrottle(), Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pw = useMemo(() => checkPassword(password, email), [password, email]);
  const needsStrong = tab === "up" || tab === "recover";

  function fail(text: string) {
    const t = nextThrottle(readThrottle(), Date.now());
    writeThrottle(t);
    setLock(lockRemaining(t, Date.now()));
    setMsg({ ok: false, text });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || busy) return;
    if (lockRemaining(readThrottle(), Date.now()) > 0) return;
    setMsg(null);

    const cleanEmail = normalizeEmail(email);
    if (!isValidEmail(cleanEmail)) return setMsg({ ok: false, text: "اكتب بريدًا إلكترونيًا صحيحًا." });
    const token = cleanCode(code);
    if ((tab === "verify" || tab === "recover") && !token) return setMsg({ ok: false, text: "اكتب الكود المكوّن من ٦ أرقام كما وصلك في البريد." });
    if (needsStrong && !pw.ok) return setMsg({ ok: false, text: "كلمة المرور ضعيفة: " + pw.problems.join("، ") });
    if (needsStrong && password !== password2) return setMsg({ ok: false, text: "كلمتا المرور غير متطابقتين." });
    if (tab === "in" && (password.length < 1 || password.length > PASSWORD_MAX * 4)) return setMsg({ ok: false, text: GENERIC_FAIL });
    const cleanName = sanitizeName(name, 60);
    if (tab === "up" && !isValidName(cleanName, 60)) return setMsg({ ok: false, text: "اكتب اسمًا صحيحًا." });
    if (TURNSTILE_KEY && !captcha) return setMsg({ ok: false, text: "أكمل التحقّق أولًا." });
    const captchaToken = captcha ?? undefined;

    setBusy(true);
    try {
      if (tab === "in") {
        const { error } = await sb.auth.signInWithPassword({ email: cleanEmail, password, options: { captchaToken } });
        if (error && /confirm/i.test(error.message)) {
          setTab("verify");
          return setMsg({ ok: false, text: "أكّد بريدك أولًا: اكتب الكود الذي وصلك، أو اطلب كودًا جديدًا." });
        }
        if (error) return fail(GENERIC_FAIL);
        writeThrottle({ fails: 0, until: 0 });
        setMsg({ ok: true, text: "أهلًا بك!" });
      } else if (tab === "up") {
        const { error } = await sb.auth.signUp({ email: cleanEmail, password, options: { data: { display_name: cleanName }, captchaToken } });
        if (error && /rate|limit|captcha/i.test(error.message)) return fail("محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.");
        // Same answer whether or not the email already exists (no account enumeration).
        setPassword("");
        setPassword2("");
        setCode("");
        setTab("verify");
        setMsg({ ok: true, text: "إن كان البريد صحيحًا فسيصلك كودٌ من ٦ أرقام. اكتبه هنا لتأكيد حسابك." });
      } else if (tab === "verify") {
        const { error } = await sb.auth.verifyOtp({ email: cleanEmail, token: token!, type: "signup", options: { captchaToken } });
        if (error) return fail("الكود غير صحيح أو انتهت صلاحيته. اطلب كودًا جديدًا.");
        writeThrottle({ fails: 0, until: 0 });
        setCode("");
        setTab("in");
        setMsg({ ok: true, text: "تمّ تأكيد حسابك. أهلًا بك!" });
      } else if (tab === "reset") {
        await sb.auth.resetPasswordForEmail(cleanEmail, { captchaToken });
        setCode("");
        setTab("recover");
        setMsg({ ok: true, text: "إن كان هذا البريد مسجّلًا فسيصلك كودٌ من ٦ أرقام. اكتبه مع كلمة المرور الجديدة." });
      } else {
        const { error } = await sb.auth.verifyOtp({ email: cleanEmail, token: token!, type: "recovery", options: { captchaToken } });
        if (error) return fail("الكود غير صحيح أو انتهت صلاحيته. اطلب كودًا جديدًا.");
        const { error: upd } = await sb.auth.updateUser({ password });
        if (upd) return setMsg({ ok: false, text: "تعذّر حفظ كلمة المرور. اطلب كودًا جديدًا وحاول مرّة أخرى." });
        writeThrottle({ fails: 0, until: 0 });
        setPassword("");
        setPassword2("");
        setCode("");
        setTab("in");
        setMsg({ ok: true, text: "تمّ تغيير كلمة المرور، وأنت الآن مسجّل الدخول." });
      }
    } catch {
      setMsg({ ok: false, text: "تعذّر الاتصال. تحقّق من الإنترنت." });
    } finally {
      setBusy(false);
      // Turnstile tokens are single-use: get a fresh one after every attempt.
      setCaptcha(null);
      setCaptchaNonce((n) => n + 1);
    }
  }

  /** Sends a fresh code for the current step (signup confirmation or password reset). */
  async function resend() {
    const sb = getSupabase();
    const cleanEmail = normalizeEmail(email);
    if (!sb || busy || !isValidEmail(cleanEmail)) return;
    if (lockRemaining(readThrottle(), Date.now()) > 0) return;
    if (TURNSTILE_KEY && !captcha) return setMsg({ ok: false, text: "أكمل التحقّق أولًا." });
    setBusy(true);
    try {
      const captchaToken = captcha ?? undefined;
      if (tab === "verify") await sb.auth.resend({ type: "signup", email: cleanEmail, options: { captchaToken } });
      else await sb.auth.resetPasswordForEmail(cleanEmail, { captchaToken });
      // Counts as an attempt, so the button cannot be used to flood someone's inbox.
      const t = nextThrottle(readThrottle(), Date.now());
      writeThrottle(t);
      setLock(lockRemaining(t, Date.now()));
      setMsg({ ok: true, text: "إن كان البريد صحيحًا فسيصلك كودٌ جديد خلال دقيقة." });
    } catch {
      setMsg({ ok: false, text: "تعذّر الاتصال. تحقّق من الإنترنت." });
    } finally {
      setBusy(false);
      setCaptcha(null);
      setCaptchaNonce((n) => n + 1);
    }
  }

  async function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
  }

  async function deleteAccount() {
    const sb = getSupabase();
    if (!sb || busy) return;
    setBusy(true);
    const { error } = await sb.rpc("delete_my_account");
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "تعذّر حذف الحساب الآن. حاول مرّة أخرى." });
    await sb.auth.signOut({ scope: "local" }).catch(() => {});
    setUser(null);
    setConfirmDelete(false);
    setMsg({ ok: true, text: "حُذف حسابك وكلّ بياناته من خوادم رِفق. التقدّم المحفوظ على هذا الجهاز بقي كما هو." });
  }

  async function signOutEverywhere() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut({ scope: "global" });
    setUser(null);
  }

  return (
    <div className="sky-bg grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <Logo size={44} />
          <span className="font-display text-3xl font-extrabold text-teal-700">رِفق</span>
        </Link>
        <Card className="p-7">
          <div className="flex justify-center">
            <Mascot size={80} />
          </div>
          {!supabaseConfigured ? (
            <div className="text-center">
              <h1 className="mt-2 font-display text-2xl font-extrabold">الحساب العائلي</h1>
              <p className="mt-2 text-ink-700">يعمل رِفق الآن على هذا الجهاز، ويُحفظ التقدّم محليًا. سيتوفّر تسجيل الدخول والمزامنة بين الأجهزة بعد ربط قاعدة البيانات.</p>
              {isDev && (
                <div className="mt-4 rounded-2xl bg-cream-100 p-4 text-right text-xs leading-relaxed text-ink-500" dir="ltr">
                  Set <code>RIFQ_SUPABASE_URL</code> and <code>RIFQ_SUPABASE_ANON_KEY</code> in <code>.env.local</code>, then run the SQL in <code>supabase/migrations</code>.
                </div>
              )}
              <LinkButton href={startHref} className="mt-6 w-full">تابع بدون حساب</LinkButton>
            </div>
          ) : user ? (
            <div className="text-center">
              <h1 className="mt-2 font-display text-2xl font-extrabold">مرحبًا</h1>
              <LinkButton href={startHref} className="mt-4 w-full">ابدأ خطّتي</LinkButton>
              <p className="mt-1 text-sm text-ink-500" dir="ltr">{user}</p>
              <div className="mt-6 grid gap-3">
                <Button disabled={busy} onClick={() => run(pushProgress)}>
                  <IconRefresh size={18} /> رفع تقدّم هذا الجهاز إلى الحساب
                </Button>
                <Button tone="white" disabled={busy} onClick={() => run(pullProgress)}>
                  تحميل التقدّم من الحساب
                </Button>
                <Button tone="white" disabled={busy} onClick={() => getSupabase()?.auth.signOut()}>
                  <IconLogout size={18} /> تسجيل الخروج
                </Button>
                <button type="button" disabled={busy} onClick={signOutEverywhere} className="text-sm font-bold text-ink-500 underline-offset-4 hover:underline">
                  تسجيل الخروج من كل الأجهزة
                </button>
              </div>
              <div className="mt-6 rounded-2xl border-2 border-coral-100 p-4 text-right">
                {confirmDelete ? (
                  <>
                    <p className="text-sm font-bold text-ink-700">
                      سيُحذف حسابك وكلّ ما حُفظ فيه على خوادم رِفق (الأطفال والتقدّم والإنجازات) نهائيًا، ولا يمكن التراجع.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button tone="white" disabled={busy} onClick={() => setConfirmDelete(false)}>
                        إلغاء
                      </Button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={deleteAccount}
                        className="h-12 flex-1 rounded-2xl bg-coral-500 font-display font-bold text-white disabled:opacity-50"
                      >
                        نعم، احذف حسابي
                      </button>
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm font-bold text-coral-500 underline-offset-4 hover:underline">
                    حذف حسابي نهائيًا
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {(tab === "in" || tab === "up") && (
                <div className="mt-4 flex gap-2 rounded-2xl bg-cream-100 p-1.5" role="tablist">
                  {([
                    ["in", "تسجيل الدخول"],
                    ["up", "حساب جديد"],
                  ] as const).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={tab === k}
                      onClick={() => {
                        setTab(k);
                        setMsg(null);
                      }}
                      className={`flex-1 rounded-xl py-2 font-display font-bold ${tab === k ? "bg-white shadow-soft" : "text-ink-500"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              {tab === "reset" && <h1 className="mt-4 text-center font-display text-xl font-extrabold">استعادة كلمة المرور</h1>}
              {tab === "recover" && <h1 className="mt-4 text-center font-display text-xl font-extrabold">كلمة مرور جديدة</h1>}
              {tab === "verify" && <h1 className="mt-4 text-center font-display text-xl font-extrabold">تأكيد البريد الإلكتروني</h1>}
              <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
                {tab === "up" && <Field label="اسم وليّ الأمر" value={name} set={setName} maxLength={60} autoComplete="name" />}
                <Field label="البريد الإلكتروني" type="email" value={email} set={setEmail} dir="ltr" maxLength={EMAIL_MAX} autoComplete="email" inputMode="email" />
                {(tab === "verify" || tab === "recover") && (
                  <Field label="الكود (٦ أرقام)" value={code} set={setCode} dir="ltr" maxLength={12} autoComplete="one-time-code" inputMode="numeric" />
                )}
                {(tab === "in" || tab === "up" || tab === "recover") && (
                  <Field
                    label={tab === "recover" ? "كلمة المرور الجديدة" : "كلمة المرور"}
                    type="password"
                    value={password}
                    set={setPassword}
                    dir="ltr"
                    maxLength={PASSWORD_MAX}
                    autoComplete={tab === "in" ? "current-password" : "new-password"}
                  />
                )}
                {needsStrong && (
                  <>
                    <StrengthMeter password={password} problems={password ? pw.problems : []} />
                    <Field label="أعد كتابة كلمة المرور" type="password" value={password2} set={setPassword2} dir="ltr" maxLength={PASSWORD_MAX} autoComplete="new-password" />
                  </>
                )}
                {TURNSTILE_KEY && <Turnstile key={captchaNonce} siteKey={TURNSTILE_KEY} onToken={setCaptcha} />}
                <Button type="submit" disabled={busy || lock > 0} className="w-full">
                  {lock > 0
                    ? `انتظر ${Math.ceil(lock / 1000)} ثانية`
                    : tab === "in"
                      ? "دخول"
                      : tab === "up"
                        ? "إنشاء الحساب"
                        : tab === "verify"
                          ? "تأكيد"
                          : tab === "reset"
                            ? "أرسل كود الاستعادة"
                            : "حفظ كلمة المرور"}
                </Button>
              </form>
              <div className="mt-3 text-center text-sm">
                {tab === "in" ? (
                  <button type="button" onClick={() => { setTab("reset"); setMsg(null); }} className="font-bold text-teal-700 hover:underline">
                    نسيت كلمة المرور؟
                  </button>
                ) : tab === "up" ? null : (
                  <div className="flex justify-center gap-4">
                    {(tab === "verify" || tab === "recover") && (
                      <button type="button" disabled={busy || lock > 0} onClick={resend} className="font-bold text-teal-700 hover:underline disabled:opacity-50">
                        أرسل كودًا جديدًا
                      </button>
                    )}
                    <button type="button" onClick={() => { setTab("in"); setMsg(null); }} className="font-bold text-ink-500 hover:underline">
                      العودة لتسجيل الدخول
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-4 flex gap-2 text-xs text-ink-500">
                <IconShield size={16} className="shrink-0 text-teal-600" />
                الحساب لوليّ الأمر فقط. يضيف الأبناء من لوحة العائلة دون بريدٍ إلكتروني.
              </p>
            </>
          )}
          {msg && <p className={`mt-4 rounded-2xl p-3 text-center text-sm font-bold ${msg.ok ? "bg-mint-100 text-mint-600" : "bg-coral-100 text-coral-500"}`}>{msg.text}</p>}
        </Card>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
  dir?: "ltr";
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "email" | "text" | "numeric";
};

function Field({ label, value, set, type = "text", dir, maxLength, autoComplete, inputMode }: FieldProps) {
  return (
    <label className="block text-sm font-bold text-ink-700">
      {label}
      <input
        required
        type={type}
        dir={dir}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        spellCheck={false}
        autoCapitalize="off"
        onChange={(e) => set(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        className="mt-1 h-12 w-full rounded-2xl border-2 border-cream-300 bg-white px-4 outline-none focus:border-teal-400"
      />
    </label>
  );
}

function StrengthMeter({ password, problems }: { password: string; problems: string[] }) {
  const score = password ? passwordScore(password) : 0;
  const colors = ["bg-coral-400", "bg-coral-400", "bg-sun-400", "bg-mint-500", "bg-mint-500"];
  const labels = ["ضعيفة جدًا", "ضعيفة", "متوسطة", "قوية", "قوية جدًا"];
  return (
    <div aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score] : "bg-cream-200"}`} />
        ))}
      </div>
      {password && (
        <p className="mt-1 text-xs text-ink-500">
          {labels[score]}
          {problems.length > 0 && ` — يلزم: ${problems.join("، ")}`}
        </p>
      )}
    </div>
  );
}
