/**
 * Native features of the Android / iOS app (Capacitor): saving and sharing files, local
 * notifications, status bar, back button. Each helper also has a plain-browser fallback so the
 * screens still run in a desktop browser during development and in the preview.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = (): boolean => Capacitor.isNativePlatform();
const platform = (): "android" | "ios" | "web" => Capacitor.getPlatform() as "android" | "ios" | "web";

/** Store page shared by «شارك التطبيق» (RIFQ_SHARE_URL at build time; may be empty). */
const SHARE_URL = process.env.RIFQ_SHARE_URL ?? "";
const SHARE_TEXT = "رِفق — تطبيقٌ يُحبّب الأطفال في القرآن الكريم، وهو صدقةٌ جارية عن الوالد مجدي. شاركه، فالدالّ على الخير كفاعله.";

/** Shares the app (system share sheet; clipboard in a browser). Returns "shared" | "copied" | "failed". */
export async function shareApp(): Promise<"shared" | "copied" | "failed"> {
  if (await shareText({ title: "رِفق", text: SHARE_TEXT, url: SHARE_URL || undefined })) return "shared";
  try {
    await navigator.clipboard.writeText(SHARE_URL ? `${SHARE_TEXT}\n${SHARE_URL}` : SHARE_TEXT);
    return "copied";
  } catch {
    return "failed";
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Web: classic download. App: write to the app cache and open the share sheet (save to Files / Photos / WhatsApp…). */
export async function saveFile(blob: Blob, fileName: string, title: string): Promise<"saved" | "shared" | "cancelled"> {
  if (!isNative()) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return "saved";
  }
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
  // Android/iOS file names: keep Arabic, drop path separators and characters some apps reject.
  const safe = fileName.replace(/[\\/:*?"<>|]+/g, "-");
  const written = await Filesystem.writeFile({ path: safe, data: await blobToBase64(blob), directory: Directory.Cache });
  try {
    await Share.share({ title, files: [written.uri], dialogTitle: title });
    return "shared";
  } catch {
    return "cancelled";
  }
}

/** Share text and/or a link. Returns false if nothing could be shared (caller may fall back to copying). */
async function shareText(data: { title: string; text: string; url?: string }): Promise<boolean> {
  if (isNative()) {
    const { Share } = await import("@capacitor/share");
    try {
      await Share.share({ ...data, dialogTitle: data.title });
    } catch {
      /* cancelled by the user */
    }
    return true;
  }
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (!nav.share) return false;
  try {
    await nav.share(data);
  } catch {
    /* cancelled */
  }
  return true;
}

// ---------- Daily reminder (app only: real system notifications, even when the app is closed) ----------

const REMINDER_ID = 1001;

export type ReminderResult = "scheduled" | "cancelled" | "denied";

export async function setNativeDailyReminder(time: string, enabled: boolean): Promise<ReminderResult> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {});
  if (!enabled) return "cancelled";
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return "denied";
  const [hour, minute] = time.split(":").map(Number);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: "وقت وِردك مع رِفق",
        body: "بابا مجدي في انتظارك: آياتٌ قليلة كلّ يوم تصنع حافظًا بإذن الله.",
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
        extra: { path: "/memorize" },
      },
    ],
  });
  return "scheduled";
}

/**
 * App start-up: status bar colour, splash hand-off, Android back button, and opening the right
 * screen when a reminder notification is tapped. `go` navigates inside the single-page app.
 */
export async function initNativeShell(go: (path: string) => void): Promise<void> {
  if (!isNative()) return;
  const [{ App }, { StatusBar, Style }, { SplashScreen }, { LocalNotifications }] = await Promise.all([
    import("@capacitor/app"),
    import("@capacitor/status-bar"),
    import("@capacitor/splash-screen"),
    import("@capacitor/local-notifications"),
  ]);
  document.documentElement.classList.add("native", `native-${platform()}`);
  await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  if (platform() === "android") await StatusBar.setBackgroundColor({ color: "#0d7870" }).catch(() => {});

  // Android hardware back: go back inside the app; on the home screen, leave the app.
  App.addListener("backButton", ({ canGoBack }) => {
    // The Fajr wake-up screen cannot be left with "back" while the alarm is ringing.
    if (document.querySelector("[data-wake-lock]")) return;
    const open = document.querySelector("[role=dialog]");
    if (open) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      return;
    }
    const h = location.hash.replace(/^#/, "");
    const atHome = !h || h === "home";
    if (canGoBack && !atHome) history.back();
    else if (!atHome) go("/");
    else App.exitApp();
  });

  LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
    const path = a.notification.extra?.path;
    if (typeof path === "string" && /^\/[a-z-]*$/.test(path)) go(path);
  });

  // Fajr alarm: keep the plan of upcoming notifications fresh, and bring the wake-up screen to
  // the front whenever the alarm is ringing (app opened from the icon, resumed, or already open).
  const fajr = await import("./fajr/alarm");
  const toWake = () => {
    if (fajr.needsWakeScreen() && location.hash.replace(/^#/, "") !== "fajr-wake") go("/fajr-wake");
  };
  LocalNotifications.addListener("localNotificationReceived", (n) => {
    const kind = n.extra?.kind;
    if (kind === "fajr-ring" || kind === "fajr-test" || kind === "fajr-check") toWake();
  });
  App.addListener("appStateChange", ({ isActive }) => {
    if (!isActive) return;
    toWake();
    fajr.applyPlan().catch(() => {});
  });
  toWake();
  fajr.applyPlan().catch(() => {});

  await SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
}
