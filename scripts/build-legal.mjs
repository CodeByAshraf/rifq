// Builds the two public pages the app stores require into legal-site/ (static HTML, no
// JavaScript, no server): the privacy policy and how to delete an account. They are rendered
// from the same React components the app shows, so the texts can never drift apart.
// Published by .github/workflows/pages.yml to GitHub Pages.
//
//   npm run build:legal
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "legal-site");

for (const f of [".env.local", ".env"]) {
  const p = path.join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const contact = process.env.RIFQ_CONTACT_EMAIL ?? "";
if (!/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(contact)) {
  throw new Error("Set RIFQ_CONTACT_EMAIL (a real address): Google Play needs it on the account-deletion page.");
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const bundle = path.join(root, "node_modules/.cache/legal.mjs");
await build({
  stdin: {
    contents: `
      import { renderToStaticMarkup } from "react-dom/server";
      import { PrivacyContent } from "./src/components/screens/Privacy";
      import { DeleteAccountInfo } from "./src/components/screens/DeleteAccountInfo";
      export const privacy = () => renderToStaticMarkup(<PrivacyContent where="web" />);
      export const deletion = () => renderToStaticMarkup(<DeleteAccountInfo />);`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  outfile: bundle,
  external: ["react", "react-dom", "react/*", "react-dom/*", "framer-motion", "@capacitor/*"],
  alias: { "@": path.join(root, "src") },
  define: { "process.env.RIFQ_CONTACT_EMAIL": JSON.stringify(contact), "process.env.NODE_ENV": '"production"' },
  loader: { ".json": "json" },
  logLevel: "error",
});
const pages = await import(bundle);

const csp = "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'";
const page = (title, body) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="referrer" content="no-referrer" />
<title>${title} | رِفق</title>
<link rel="icon" href="icon.png" />
<link rel="stylesheet" href="fonts.css" />
<link rel="stylesheet" href="app.css" />
</head>
<body class="bg-cream-100">
<main class="mx-auto max-w-3xl px-4 py-8">
<header class="mb-6 flex items-center gap-3"><img src="icon.png" alt="" width="48" height="48" class="rounded-2xl" /><span class="font-display text-2xl font-extrabold text-teal-700">رِفق</span></header>
${body}
<footer class="mt-10 flex gap-4 text-sm font-bold text-ink-500"><a href="privacy.html">سياسة الخصوصية</a><a href="delete-account.html">حذف الحساب</a></footer>
</main>
</body>
</html>
`;

writeFileSync(path.join(out, "privacy.html"), page("سياسة الخصوصية", pages.privacy()));
writeFileSync(path.join(out, "delete-account.html"), page("حذف الحساب", pages.deletion()));
writeFileSync(
  path.join(out, "index.html"),
  page(
    "تطبيق رِفق",
    `<h1 class="font-display text-3xl font-extrabold">رِفق — رفيقك في رحلة القرآن</h1>
<p class="mt-3 leading-relaxed text-ink-700">تطبيقٌ لتعليم الأطفال والكبار تلاوة القرآن الكريم وتجويده وحفظه، صدقةٌ جارية عن الوالد مجدي.</p>
<p class="mt-3 leading-relaxed text-ink-700">للتواصل: <a dir="ltr" class="font-bold text-teal-700" href="mailto:${contact}">${contact}</a></p>`,
  ),
);
// GitHub Pages: serve files as they are (no Jekyll processing).
writeFileSync(path.join(out, ".nojekyll"), "");
cpSync(path.join(root, "public/icons/icon-192.png"), path.join(out, "icon.png"));

execSync("npx @tailwindcss/cli -i src/styles/globals.css -o legal-site/app.css --minify", { cwd: root, stdio: "ignore" });
await build({
  entryPoints: [path.join(root, "src/styles/fonts.css")],
  bundle: true,
  minify: true,
  outfile: path.join(out, "fonts.css"),
  loader: { ".woff2": "file", ".woff": "file", ".ttf": "file" },
  assetNames: "fonts/[name]-[hash]",
  logLevel: "warning",
});
console.log("legal-site/: index.html, privacy.html, delete-account.html");
