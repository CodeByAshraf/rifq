# رِفق | RIFQ — Your Companion on the Journey of the Quran

An Arabic-first (RTL) Quran learning app for children, for Android and iOS:
reading with verse-by-verse recitation and repetition, a 7-step memorization flow,
spaced-repetition revision, a Tajweed academy, six educational mini-games, stories, a journey
map with rewards, a parents' corner (behind a parental gate) for the family account,
children's progress, the reminder and the Fajr alarm, and an adults' corner with the full
Mushaf page by page, the adhkar and an adult Fajr alarm.

## Stack
Capacitor 8 (Android + iOS) · React · TypeScript · Tailwind CSS v4 · Framer Motion · esbuild · Supabase (optional)

There is no website and no server of our own: the app bundles every screen and all content
(`mobile/www`), and only talks to Supabase (optional accounts) and EveryAyah (recitation audio).

## Run
```bash
npm install
npm run dev            # develop in the browser: http://localhost:5173, rebuilds on save
npm run build          # verifies the Quran + adhkar, then builds the app into mobile/www
npm run app:sync       # build + copy into the Android / iOS projects
npm run app:android    # open in Android Studio  (app:ios → Xcode, Mac only)
```
Building, signing and publishing: [MOBILE.md](MOBILE.md).

## Quran text integrity
- Source: `quran-json@3.1.2` — Uthmani text from The Noble Qur'an Encyclopedia (quranenc.com).
- `npm run import:quran` writes `public/quran/{1..114}.json` and SHA-256 checksums to
  `src/data/quran-manifest.json`. Letters are copied unchanged; the only transformation
  (`scripts/quran-text.mjs`) converts the source's legacy KFGQPC font encoding of the open tanween
  (U+0657/U+065E/U+0656, which other fonts draw as an inverted damma, an empty box and a subscript alef)
  to standard Unicode (U+08F0–U+08F2), and applies two ayah fixes from the KFGQPC v3.0 release
  (Al-Baqarah 72: a word split by a thin space; At-Tur 37: small seen below, not above, the sad).
- `npm run verify:quran` (run by every `npm run build`) checks all 6,236 ayahs:
  1. served text = documented transformation of the source, and matches the checksums;
  2. no letter differs from the source;
  3. every ayah is identical to an independent release — King Fahd Complex Uthmanic Hafs v3.0 (2026,
     `@quran.ws/text`, CC BY 4.0) — including every waqf, sakt and sajdah sign;
  4. every code point can be drawn by the app's Quran font (no empty boxes).
  The build fails on any difference.
- A correction reaches users with the next app update (the content is inside the app).
- Credits and licences are shown to users at `/sources` (CC BY-SA 4.0 for the Mushaf text, with the changes listed).
- The UI never builds verse text in code. Words are only produced by splitting the verified string
  on spaces (and rejoined with spaces), for highlighting, hiding and ordering games.
- Tajweed examples (`src/data/tajweed.ts`) are references (surah, ayah, word index). The words come
  from the verified files at runtime.
- Tajweed explanations are marked `review: "pending"` until a qualified teacher approves them.

## Audio
Real recitations are streamed from EveryAyah.com (Alafasy, Al-Husary, Al-Minshawi). Nothing is synthesized.
There is no AI voice grading.

## Supabase (optional)
1. Create a free project and run `supabase/migrations/0001_init.sql` in the SQL editor.
   Then `0002_security.sql` and `0003_account_deletion.sql`.
2. Copy `.env.example` to `.env.local` and fill in `RIFQ_SUPABASE_URL` and `RIFQ_SUPABASE_ANON_KEY`.
3. Email templates must send a 6-digit code, not a link (see SECURITY.md).
4. Parents sign up in the app (More → Account). Children are profiles under the parent account (no email,
   no login). All child data is protected by Row Level Security through `is_parent_of(child_id)`.
5. The service-role key is never used in the app; the build refuses it.

Without Supabase, all progress stays on the phone.

## Structure
```
src/main.tsx        app entry;  src/routes.tsx  every screen by path (hash routing)
src/components/art  SVG illustrations (scene, characters, mascot, badges, icons, game covers)
src/components/ui   design-system primitives (clay buttons, cards, progress, modal, celebration)
src/components/screens  screens
src/lib             store (progress), srs (revision scheduler), quran data, audio player, supabase, sync,
                    native (Capacitor helpers), fajr (Fajr alarm), router
src/data            surah index, Tajweed lessons, badges, journey stations
supabase/migrations database schema + RLS
mobile/             Capacitor projects (android/, ios/), icon masters (assets/), build output (www/)
scripts/            build, content import/verification, tests, native config, store pages
```

## Playful feedback
- Every tap makes a burst of stars and hearts, and buttons bounce when pressed (`src/lib/fx.ts`).
- Moving between screens opens the new screen as a growing bubble from the spot the child tapped (`PageTransition` in `src/components/shell/Fx.tsx`).
- Short UI sounds are made with the Web Audio API (never speech or recitation). A sound on/off button sits in the header.
- All motion is turned off for users who prefer reduced motion.

## Baba Magdy (guide character)
- Two transparent WebP portraits in `public/characters/` (~35 KB each): `magdy-quran.webp` (holding the
  Mushaf) for every static spot, and `magdy.webp` for the animated guide.
- `MagdyAnimated` (`src/components/art/Magdy.tsx`) brings the portrait to life with Framer Motion only:
  breathing, greeting, leaning to point, thinking, jumping for joy, nodding, talking, a 3D tilt that follows
  the pointer, and a happy spin when tapped. No 3D library is loaded.

## Learning extras
- **Certificates** (`/certificates`): earned automatically (each surah, Juz' Amma, each Tajweed lesson, journey
  milestones, streaks, stories, adhkar, Friday Al-Kahf, Ramadan khatma, recordings). Drawn on a canvas on the
  device (`src/lib/certificate.ts`) with the learner's name, Hijri and Gregorian dates and a serial number;
  can be downloaded as PNG, printed (A4 landscape) or shared.
- **Verse meanings**: At-Tafsir Al-Muyassar + word meanings from As-Siraj (`npm run import:tafsir`).
- **Adhkar** (`/adhkar`): curated from Hisn al-Muslim in `scripts/adhkar-source.mjs` (`npm run build:adhkar`), fully
  vocalised, each item attributed, with a note where scholars graded a narration differently. Quran passages are
  references rendered from the verified Mushaf text; `npm run verify:adhkar` fails the build if Quran is typed by hand.
- **My recitation** (`/recite`): records with MediaRecorder, stores only in IndexedDB on the device, compare with reciter.
- **Challenges** (`/challenges`): Friday Al-Kahf, Ramadan khatma, first ten days of Dhul-Hijjah (Umm al-Qura calendar).
- **Reminder** (`/app`): a daily local notification, an in-app reminder, and "delete all data on this device".
- **Adults' corner** (`/adults`): a calm area with its own navigation (no tap effects or sounds).
  - **Mushaf** (`/mushaf`): the Madinah Mushaf page by page (604 pages × 15 lines) in the KFGQPC font, built by
    `npm run build:mushaf` from the KFGQPC Hafs v3.0 data and checked āyah by āyah against the verified text
    (`npm run verify:mushaf`, part of every build). Swipe or buttons to turn pages, an index (surahs, juz', page
    number), automatic last-read page, a bookmark, and a tap on any āyah for its tafsir, word meanings or recitation
    (one āyah, or continuously with page turning). Pages are small local files read on demand.
  - **Adhkar** (`/adults-adhkar`) and the **Fajr alarm** for an adult (arithmetic or memory challenges).
- **Parents' corner** (`/parents`): account, family, reminder, Fajr alarm settings and sharing. These screens open
  only after a multiplication written in words is answered (`src/lib/parental-gate.ts`), as the stores' kids
  rules require; the unlock lasts 5 minutes and is never stored.
- **Baba Magdy page** (`/magdy`): dedication and duas for parents from the verified Quran text (sharing is in the parents' corner).

- **Store pages**: the privacy policy and the account-deletion page that the stores require as public links
  are rendered from the in-app screens by `npm run build:legal` and published to GitHub Pages
  (`.github/workflows/pages.yml`).

## Status
Working: all screens, local progress, memorization flow, revision scheduling, Tajweed lessons
with practice and quizzes, six games, badges, certificates, family profiles, Fajr alarm.
Written but not yet tested against a live project: Supabase auth (email codes) and sync.
Not yet run on a physical phone: native notifications, microphone, share sheet (see MOBILE.md).

### Fajr alarm

`/fajr` holds the settings and `/fajr-wake` is the wake-up screen. It works offline and keeps all its data on the device. `npm run test:fajr` checks the computed times against published timetables, the alarm state machine and the notification plan. Details and limits are in MOBILE.md.
