# RIFQ security

RIFQ is an Android / iOS app (Capacitor). There is no website and no server of our own. The app
talks only to Supabase (optional accounts and sync) and to EveryAyah (recitation audio). The two
public store pages (privacy, account deletion) are static HTML with no JavaScript.

## What is enforced in code

| Area | How |
|---|---|
| No secrets in the app | Only public values are embedded (`RIFQ_*`, see `.env.example`). `scripts/build-app.mjs` refuses to build if a Supabase service-role JWT or an `sb_secret_` key is supplied. `.env*` files and signing keys (`*.jks`, `*.keystore`, `*.p12`) are git-ignored. |
| App shell | The WebView loads only bundled files, under a strict CSP: no inline scripts, no `eval`, and only Supabase, EveryAyah and Turnstile as outside hosts. On Android, mixed content and WebView debugging are disabled. External links are not shown inside the app. |
| Debug off | Production bundles strip `console.log/info/debug` and have no source maps. Setup hints appear only in development. Raw database errors are never shown. |
| API keys | Only the **public** anon key is in the app, as Supabase is designed: data is protected by RLS, not by hiding that key. The service-role key is never used anywhere in this repo. |
| Passwords | Supabase Auth hashes them with bcrypt; the app never stores or logs them. Policy: at least 10 characters, letters + digits, not a common password, and not containing the email. |
| Login | <ul><li>Generic error messages, so no one can tell whether an account exists.</li><li>Exponential lock-out after 3 failures (30 s → 15 min); the "resend code" button counts as an attempt.</li><li>Optional Cloudflare Turnstile CAPTCHA.</li><li>Email confirmation and password reset use a **one-time code** typed in the app (no links).</li><li>"Sign out of all devices" and in-app account deletion.</li></ul> |
| Input | `src/lib/validation.ts` and `src/lib/state-guard.ts` clean every name, email, time and id, and the whole saved state, before use or upload. The Fajr settings are validated the same way (`src/lib/fajr/*`). |
| Database | `supabase/migrations/0002_security.sql`: <ul><li>RLS enabled **and forced** on every table, with owner-only policies.</li><li>`parent_id` and `child_id` cannot be changed.</li><li>CHECK constraints on every value; verse references checked against real surah lengths.</li><li>Limits: at most 10 learners per account, plus an activity flood limit.</li><li>Internal functions are not callable through the API, and nothing is granted to `anon`.</li></ul> `0003_account_deletion.sql`: `delete_my_account()` deletes only the caller. |
| SQL injection | All queries go through supabase-js → PostgREST, which sends values as bound parameters. The app contains no hand-built SQL. |
| On-device privacy | Recordings and the Fajr city never leave the phone. The app requests no location permission. |
| Kids rules | Parents-only screens (account, family, settings, alarm setup, sharing) open only after a parental gate. |
| Dependencies | `npm audit` = 0 vulnerabilities. |

## Tests

```bash
npm run test:security   # validators + full DB attack suite (in-process Postgres, all migrations)
npm run test:fajr       # Fajr times, alarm state machine, notification plan, settings validation
npm run test:rls        # same isolation checks against your real Supabase project (needs 2 test users)
npm audit --omit=dev
npm run build
```

## Supabase dashboard checklist (must be done by the project owner)

These are server-side settings that cannot be set from code:

1. **SQL Editor:** run `0001_init.sql`, `0002_security.sql`, then `0003_account_deletion.sql`.
2. **Authentication → Providers → Email:**
   - Turn on **Confirm email**.
   - Set **Minimum password length** to 10.
   - Require letters + digits.
   - Turn on **Leaked password protection**.
   - Set **Email OTP length** to 6.
3. **Authentication → Email Templates:** the app works with codes, not links, so every template must show `{{ .Token }}`.
   - **Confirm signup:** `<h2>تأكيد حسابك في رِفق</h2><p>كود التأكيد: <b>{{ .Token }}</b></p><p>اكتبه في التطبيق. إن لم تطلب حسابًا فتجاهل هذه الرسالة.</p>`
   - **Reset password:** `<h2>استعادة كلمة المرور في رِفق</h2><p>الكود: <b>{{ .Token }}</b></p><p>اكتبه في التطبيق مع كلمة المرور الجديدة. إن لم تطلب ذلك فتجاهل هذه الرسالة.</p>`
4. **Authentication → Rate Limits:** keep the defaults or lower them.
   - Sign-ins: 30 per 5 minutes per IP.
   - Emails: 2–4 per hour.
   - Token verifications: the default.
5. **Authentication → Attack Protection** (optional): enable CAPTCHA with Cloudflare Turnstile.
   - Paste the **secret** key here, and put only the **site** key in `RIFQ_TURNSTILE_SITE_KEY`.
   - In Cloudflare, allow the hostname `localhost` (the app's WebView origin).
6. **Authentication → URL Configuration:** no redirect URLs are needed. Leave the allowlist empty.
7. **Authentication → SMTP:** use a custom SMTP sender, because the built-in one is heavily rate-limited.
8. **Account:** enable MFA on your own Supabase account. Never share or commit the service-role key.

## Reporting

Please report security issues privately to the contact email in the app (More → Privacy policy)
rather than opening a public issue.
