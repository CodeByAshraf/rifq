/**
 * Turns the pure plan from times.ts into real system notifications (app only) and records
 * what the user did (solved, confirmed awake, test alarm). Safe to call often: every call
 * replaces all pending Fajr notifications with the current plan.
 */
import { isNative } from "../native";
import { getSettings, setDay, updateSettings } from "./settings";
import { isFajrId, phase, plan, type Planned, type Platform } from "./times";

const ALARM_SOUND = "fajr_alarm.wav";
const CHANNEL = "fajr-alarm-v1";
const WAKE_PATH = "/fajr-wake";

const platform = async (): Promise<Platform> => {
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.getPlatform() === "ios" ? "ios" : "android";
};

function texts(p: Planned): { title: string; body: string } {
  switch (p.kind) {
    case "ring":
      return { title: "حان وقت صلاة الفجر", body: "اصحَ يا بطل! افتح رِفق وحُلّ التحدّي ليسكت المنبّه." };
    case "check":
      return { title: "هل ما زلت مستيقظًا؟", body: "اضغط هنا خلال دقيقتين، وإلّا رنّ المنبّه من جديد." };
    case "renew":
      return { title: "افتح رِفق ليستمرّ منبّه الفجر", body: "افتحوا التطبيق مرّةً كلّ بضعة أيام ليحسب مواعيد الفجر القادمة." };
    case "test":
      return { title: "تجربة منبّه الفجر", body: "هكذا سيوقظك رِفق. افتح التطبيق وحُلّ التحدّي." };
  }
}

let chain: Promise<unknown> = Promise.resolve();
/** Serialises plan updates so two quick calls cannot interleave cancel/schedule. */
const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
};

export type PermissionResult = { notifications: boolean; exact: boolean };

/** Asks for what the alarm needs. Only call from a user action (it may open system screens). */
export async function requestAlarmPermissions(): Promise<PermissionResult> {
  if (!isNative()) return { notifications: false, exact: false };
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
  let exact = true;
  if ((await platform()) === "android") {
    const st = await LocalNotifications.checkExactNotificationSetting().catch(() => ({ exact_alarm: "granted" as const }));
    exact = st.exact_alarm === "granted";
  }
  return { notifications: perm.display === "granted", exact };
}

/** Opens Android's "Alarms & reminders" screen so the alarm can ring on time. */
export async function openExactAlarmSettings(): Promise<boolean> {
  if (!isNative()) return false;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const r = await LocalNotifications.changeExactNotificationSetting().catch(() => null);
  return r?.exact_alarm === "granted";
}

export async function alarmPermissionState(): Promise<PermissionResult> {
  if (!isNative()) return { notifications: false, exact: false };
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions().catch(() => ({ display: "denied" }));
  let exact = true;
  if ((await platform()) === "android") {
    const st = await LocalNotifications.checkExactNotificationSetting().catch(() => ({ exact_alarm: "granted" }));
    exact = st.exact_alarm === "granted";
  }
  return { notifications: perm.display === "granted", exact };
}

/** Replaces every pending Fajr notification with the current plan. Never prompts the user. */
export function applyPlan(now = new Date()): Promise<number> {
  return serial(async () => {
    if (!isNative()) return 0;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const pf = await platform();
    const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] as { id: number }[] }));
    const old = pending.notifications.filter((n) => isFajrId(Number(n.id))).map((n) => ({ id: Number(n.id) }));
    if (old.length) await LocalNotifications.cancel({ notifications: old }).catch(() => {});

    const s = getSettings();
    const list = plan(s, now, pf);
    if (!list.length) return 0;
    const perm = await LocalNotifications.checkPermissions().catch(() => ({ display: "denied" }));
    if (perm.display !== "granted") return 0;

    let exact = true;
    if (pf === "android") {
      await LocalNotifications.createChannel({
        id: CHANNEL,
        name: "منبّه الفجر",
        description: "يرنّ وقت الفجر حتى تحلّ التحدّي في رِفق",
        importance: 5,
        visibility: 1,
        sound: ALARM_SOUND,
        vibration: true,
        lights: true,
        lightColor: "#1fb3a6",
      }).catch(() => {});
      const st = await LocalNotifications.checkExactNotificationSetting().catch(() => ({ exact_alarm: "granted" }));
      exact = st.exact_alarm === "granted";
    }

    await LocalNotifications.schedule({
      notifications: list.map((p) => ({
        id: p.id,
        ...texts(p),
        schedule: { at: new Date(p.at), allowWhileIdle: true },
        channelId: p.kind === "renew" ? undefined : CHANNEL,
        sound: p.kind === "renew" ? undefined : ALARM_SOUND,
        // Never let a background refresh open system settings; the screen offers a button instead.
        isExactNotification: exact,
        extra: { path: p.kind === "renew" ? "/fajr" : WAKE_PATH, kind: `fajr-${p.kind}`, day: p.day },
      })),
    });
    return list.length;
  });
}

/** Removes Fajr notifications still sitting in the notification shade. */
async function clearDelivered() {
  if (!isNative()) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const d = await LocalNotifications.getDeliveredNotifications().catch(() => ({ notifications: [] as { id: number }[] }));
  const mine = d.notifications.filter((n) => isFajrId(Number(n.id)));
  if (mine.length) await LocalNotifications.removeDeliveredNotifications({ notifications: mine as never }).catch(() => {});
}

/** The challenge was solved: stop ringing (and arm the "still awake?" check if enabled). */
export async function markSolved(day: string, now = Date.now()) {
  if (day === "test") updateSettings({ testAt: null });
  else {
    const log = getSettings().log[day] ?? {};
    // A second solve (after a missed check) counts as the confirmation.
    if (log.solvedAt) setDay(day, { confirmedAt: now });
    else setDay(day, { solvedAt: now });
  }
  await clearDelivered();
  await applyPlan(new Date(now));
}

export async function confirmAwake(day: string, now = Date.now()) {
  setDay(day, { confirmedAt: now });
  await clearDelivered();
  await applyPlan(new Date(now));
}

/** A real test: the alarm rings in one minute, exactly as it will at Fajr. */
export async function scheduleTest(now = Date.now()) {
  updateSettings({ testAt: now + 60_000 });
  return applyPlan(new Date(now));
}

export async function cancelTest() {
  updateSettings({ testAt: null });
  await clearDelivered();
  return applyPlan();
}

/** Turn everything off (used by "delete all data on this device"). */
export async function disableAlarm() {
  updateSettings({ enabled: false, testAt: null });
  await clearDelivered();
  return applyPlan();
}

/** Should the wake screen be on top right now? */
export function needsWakeScreen(now = new Date()): boolean {
  const p = phase(getSettings(), now);
  return p.kind === "ringing" || p.kind === "check";
}
