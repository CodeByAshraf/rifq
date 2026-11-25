# RIFQ mobile apps (Android and iOS)

RIFQ is an app only (no website). It is built with Capacitor 8: the React
screens are bundled **inside** the app (`mobile/www`), so the Quran, tafsir,
adhkar, stories and characters work fully offline. Only the optional account
sync (Supabase) and recitation audio (EveryAyah) use the network.

| Item | Value |
| --- | --- |
| App ID / bundle ID | `app.rifq.quran` (**permanent after the first store upload**) |
| App name | رِفق |
| Android | minSdk 24 (Android 7), target 36 |
| Native projects | `mobile/android`, `mobile/ios` |
| App bundle | `npm run build` (`scripts/build-app.mjs`) → `mobile/www` |
| Store pages | `npm run build:legal` → `legal-site/`, published by `.github/workflows/pages.yml` |

## 1. Configure

Put the public values in `.env.local` (see `.env.example`):

```
RIFQ_CONTACT_EMAIL=you@example.com     # required: shown in the app and on the store pages
RIFQ_SUPABASE_URL=...                   # optional: accounts and sync
RIFQ_SUPABASE_ANON_KEY=...
RIFQ_SHARE_URL=                         # optional: store link for «شارك التطبيق»
```

`build-app.mjs` refuses to build if a service-role / secret key is supplied.

Supabase: run the three migrations. Then set the email templates to send a
6-digit code (see SECURITY.md); the app has no website for an email link to
open. No redirect URLs are needed. If you use Turnstile, add `localhost` to the
widget's allowed hostnames (the WebView origin is `https://localhost` on
Android and `capacitor://localhost` on iOS).

## 2. Build

```
npm ci
npm run dev             # optional: develop in the browser at http://localhost:5173
npm run app:sync        # verify content → build mobile/www → cap sync → native config
npm run app:android     # opens Android Studio  → Run, or Build > Generate Signed Bundle
npm run app:ios         # opens Xcode (Mac only) → Signing & Capabilities → Run / Archive
```

Run `npm run app:sync` after every change to the code or content.
`npm run app:icons` regenerates icons and splash screens from `public/icons`.

### Without Android Studio: GitHub Actions

`.github/workflows/mobile.yml` (run it from the Actions tab, or push a `v*` tag):

- **android**: debug APK as an artifact, which you can install on any phone. If the
  signing secrets exist, it also produces a signed `.aab` for Google Play. The
  versionCode is the run number, so it always increases.
- **ios**: compiles the Xcode project on macOS (unsigned) to prove it builds.

Secrets: `RIFQ_CONTACT_EMAIL`, and optionally `RIFQ_SUPABASE_URL`,
`RIFQ_SUPABASE_ANON_KEY`, `RIFQ_TURNSTILE_SITE_KEY`, `RIFQ_SHARE_URL`, `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

### Android signing key (once)

```
keytool -genkeypair -v -keystore rifq-upload.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias rifq
base64 -w0 rifq-upload.jks   # → ANDROID_KEYSTORE_BASE64 secret
```

Keep the `.jks` file and its passwords in a safe place outside the repo
(`*.jks` is git-ignored). Use Play App Signing, so that if you lose this
upload key, Google can reset it.

Local release build: `RIFQ_KEYSTORE_PATH=/path/rifq-upload.jks
RIFQ_KEYSTORE_PASSWORD=… RIFQ_KEY_ALIAS=rifq RIFQ_KEY_PASSWORD=…
./gradlew bundleRelease` (in `mobile/android`).

## 3. Store pages (privacy policy, account deletion)

Both stores need a public privacy-policy link, and Google Play also needs a
public link where users can ask for account deletion without the app. These
are two static pages (no server, no JavaScript), rendered from the same screens
the app shows, so they always match:

1. GitHub repo → Settings → Pages → Source: **GitHub Actions**.
2. Add the secret `RIFQ_CONTACT_EMAIL`.
3. Run the `store-pages` workflow (it also runs when those texts change).
4. The links are `https://<user>.github.io/<repo>/privacy.html` and
   `https://<user>.github.io/<repo>/delete-account.html`.

## 4. Publish

**Google Play** ($25 one time): create the app, upload the `.aab` to Internal
testing first.
- Privacy policy URL: `…github.io/<repo>/privacy.html`.
- Data deletion: "delete account" URL `…github.io/<repo>/delete-account.html`. The account is deleted in the app (More → Account) or by email.
- Data safety:
  - Data is collected only if the user creates an account: email, name and app activity, used for app functionality.
  - Data is encrypted in transit.
  - Users can request deletion in the app.
  - No data is shared.
  - The microphone is used on device only.
- Target audience: if you include children under 13, the app falls under the
  Families policy. It has no ads, analytics or tracking SDKs. External links are
  hidden inside the app.
- Content rating: answer the questionnaire (reference/education, no violence).

**App Store** ($99 per year, needs a Mac with Xcode):
- In Xcode, set your Team.
- Product → Archive → Distribute → App Store Connect, then submit through TestFlight.
- Privacy labels must match `PrivacyInfo.xcprivacy`: email, name and user content, linked to the user, for app functionality, no tracking.
- For the Kids category, set the age band. The app has no third-party analytics and no external links, and the account and parent area require sign-in, which acts as the parental gate.
- Export compliance: `ITSAppUsesNonExemptEncryption = false` is already set.

## Fajr alarm (`/fajr`, `/fajr-wake`)

- **Fajr time:** computed on the device, offline, with `adhan` (MIT). It is checked in `scripts/test-fajr.mjs` against published timetables for Cairo, Alexandria, Matrouh and Makkah. The location is a city from the list, or the approximate position taken once and rounded to about 1 km; it never leaves the phone.
- **Ringing:** the alarm is a burst of local notifications that use the alarm sound (`mobile/assets/fajr_alarm.wav`, from `npm run app:sound`).
  - Android: every 30 s for 20 min, planned 7 days ahead.
  - iOS: every 60 s for 14 min, planned 3 days ahead, because iOS keeps only 64 pending notifications.
  - The plan is renewed every time the app opens. Solving the challenge cancels the rest of the burst.
- **"Still awake?" check:** comes 5 minutes after solving; if it is not answered within 2 minutes, the alarm rings again.
- **Challenges:**
  - Kids: order the waking dua, using its exact text from `adhkar.json`; count; colour sequence.
  - Adults: arithmetic; memory grid; photo of the wudu place. The photo is matched on the device against a stored fingerprint. After 3 failed attempts it switches to arithmetic.
- **Limits of this version:**
  - Notifications follow the phone's silent and Do Not Disturb settings.
  - The app cannot show a full-screen alarm over the lock screen.
  - Both need native code: an Android alarm-stream foreground service with a full-screen intent, and AlarmKit on iOS 26+. This is the planned next step.
- **Google Play:**
  - `SCHEDULE_EXACT_ALARM` comes from the notifications plugin. On Android 14+ the user grants "Alarms & reminders"; the screen has a button for it.
  - Approximate location is processed on the device only, so in Data safety it is "not collected".
- **App Store:** the camera and location usage texts are set by `npm run app:configure`.

## Native behaviour

- Certificates and recordings are saved through the system share sheet.
- The daily memorisation reminder is a local notification (no server).
- More → "Reminder and your data" can delete everything RIFQ keeps on the phone. Account deletion is under More → Account.
- The Android back button closes dialogs, goes back, and finally exits from the home screen. It is ignored while the Fajr alarm is ringing.
- In a desktop browser (`npm run dev`), the native-only parts show a short note instead: notifications, the alarm, and the share sheet.
