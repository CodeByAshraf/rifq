// Builds the RIFQ app (Android / iOS via Capacitor) into mobile/www.
//
//   npm run build      # production bundle, then: npx cap sync   (npm run app:sync does both)
//   npm run dev        # development: http://localhost:5173, rebuilds on every change
//
// Everything is bundled for offline use: Quran text, tafsir, images and the self-hosted fonts.
// Only recitation audio streams. Public settings come from the environment or .env.local
// (see .env.example): RIFQ_SUPABASE_URL, RIFQ_SUPABASE_ANON_KEY, RIFQ_TURNSTILE_SITE_KEY,
// RIFQ_CONTACT_EMAIL, RIFQ_SHARE_URL.
import { build, context } from "esbuild";
import { execSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "mobile/www");
const dev = process.argv.includes("--dev");

// .env.local / .env (simple KEY=VALUE lines); real environment variables win.
for (const f of [".env.local", ".env"]) {
  const p = path.join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const PUBLIC = ["RIFQ_SUPABASE_URL", "RIFQ_SUPABASE_ANON_KEY", "RIFQ_TURNSTILE_SITE_KEY", "RIFQ_CONTACT_EMAIL", "RIFQ_SHARE_URL"];
// Never ship a secret: refuse a Supabase service-role key (a JWT whose role is "service_role")
// or a new-style secret key in any of the embedded public values.
for (const k of PUBLIC) {
  const v = process.env[k] ?? "";
  if (/^sb_secret_/.test(v)) throw new Error(`${k} holds a Supabase SECRET key. Use the public (anon / publishable) key.`);
  const parts = v.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      if (payload.role === "service_role") throw new Error(`${k} holds the Supabase SERVICE ROLE key. Never put it in the app.`);
    } catch (e) {
      if (String(e).includes("SERVICE ROLE")) throw e;
    }
  }
}
if (!dev && !process.env.RIFQ_CONTACT_EMAIL) console.warn("! RIFQ_CONTACT_EMAIL is not set: the stores require a contact email (privacy policy, account deletion).");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1) JavaScript (separate file, so the CSP needs no 'unsafe-inline' for scripts).
const jsOptions = {
  entryPoints: [path.join(root, "src/main.tsx")],
  bundle: true,
  minify: !dev,
  sourcemap: dev ? "inline" : false,
  format: "iife",
  target: ["es2020", "safari15", "chrome100"],
  jsx: "automatic",
  outfile: path.join(out, "app.js"),
  banner: { js: 'window.__RIFQ_DATA_BASE__=".";' },
  alias: { "@": path.join(root, "src") },
  define: {
    ...Object.fromEntries(PUBLIC.map((k) => [`process.env.${k}`, JSON.stringify(process.env[k] ?? "")])),
    "process.env.NODE_ENV": dev ? '"development"' : '"production"',
  },
  drop: dev ? [] : ["debugger"],
  pure: dev ? [] : ["console.log", "console.debug", "console.info"],
  loader: { ".json": "json" },
  logLevel: "warning",
};

// 2) Fonts: self-hosted, no request to any font service.
await build({
  entryPoints: [path.join(root, "src/styles/fonts.css")],
  bundle: true,
  minify: true,
  outfile: path.join(out, "fonts.css"),
  loader: { ".woff2": "file", ".woff": "file", ".ttf": "file" },
  assetNames: "fonts/[name]-[hash]",
  logLevel: "warning",
});

// 3) Page. CSP: only our own files, EveryAyah audio, Supabase, and Turnstile (if enabled).
const csp = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob: https://everyayah.com https://github.com https://objects.githubusercontent.com https://release-assets.githubusercontent.com",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com${dev ? " ws://localhost:*" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

writeFileSync(
  path.join(out, "index.html"),
  `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="theme-color" content="#0d7870" />
<meta name="format-detection" content="telephone=no" />
<title>رِفق</title>
<link rel="icon" href="icons/icon-32.png" />
<link rel="stylesheet" href="fonts.css" />
<link rel="stylesheet" href="app.css" />
</head>
<body>
<div id="root"></div>
<script src="app.js"></script>
${dev ? '<script src="dev-reload.js"></script>\n' : ""}</body>
</html>
`,
);

for (const dir of ["quran", "tafsir", "mushaf", "characters", "icons"]) cpSync(path.join(root, "public", dir), path.join(out, dir), { recursive: true });

if (dev) {
  // Live reload through esbuild's change events (a separate file keeps the CSP strict).
  writeFileSync(path.join(out, "dev-reload.js"), 'new EventSource("/esbuild").addEventListener("change", () => location.reload());\n');
  const css = spawn("npx", ["@tailwindcss/cli", "-i", "src/styles/globals.css", "-o", "mobile/www/app.css", "--watch"], { cwd: root, stdio: "inherit" });
  const ctx = await context(jsOptions);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: out, port: 5173, host: "127.0.0.1" });
  console.log(`RIFQ dev: http://localhost:${port}  (Ctrl+C to stop)`);
  process.on("SIGINT", () => {
    css.kill();
    void ctx.dispose().then(() => process.exit(0));
  });
} else {
  await build(jsOptions);
  execSync("npx @tailwindcss/cli -i src/styles/globals.css -o mobile/www/app.css --minify", { cwd: root, stdio: "inherit" });
  const size = (f) => (readFileSync(path.join(out, f)).length / 1024).toFixed(0);
  console.log(`App ready in mobile/www — app.js ${size("app.js")} KB, app.css ${size("app.css")} KB. Next: npx cap sync`);
}
