// Records the story narration with an AI voice (ElevenLabs) into MP3 files.
// Runs in GitHub Actions (.github/workflows/story-audio.yml); the API key is a repository secret
// and is never part of the app.
//
//   ELEVENLABS_API_KEY=... NARRATOR_VOICE_ID=... node scripts/narrate-stories.mjs --out dir [--manifest old.json]
//   node scripts/narrate-stories.mjs --dry      # list the texts and the character count, no API calls
//   ... --only nuh-ark                          # just one story (try a voice first)
//
// Only the retelling is narrated (src/lib/story-clips.ts). Quran verses are never sent to the
// voice: the app plays them from human recitations.
// A clip is recorded again only if its text, voice or model changed (manifest.json keeps hashes).
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const dry = process.argv.includes("--dry");
const outDir = path.resolve(arg("--out") ?? path.join(root, "node_modules/.cache/story-audio"));

const bundled = path.join(root, "node_modules/.cache/narrate.mjs");
await build({
  stdin: { contents: 'export { STORIES } from "./src/data/stories"; export * from "./src/lib/story-clips";', resolveDir: root, loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundled,
  logLevel: "error",
});
const { STORIES, narrationTexts, lineTexts } = await import(bundled);

// --only id1,id2: record just these stories (to try a voice before recording everything).
const only = arg("--only")?.split(",").map((x) => x.trim()).filter(Boolean);
const clips = [...lineTexts(), ...STORIES.filter((s) => !only?.length || only.includes(s.id)).flatMap((s) => narrationTexts(s))];
// Guard: the narrator must never read Quran. Story text is checked to contain no Quranic
// annotation marks (pause signs, small high letters) that only appear in copied verse text.
const QURAN_MARKS = /[ۖ-ࣰۭ-ࣲٱ]/;
for (const c of clips) if (QURAN_MARKS.test(c.text)) throw new Error(`${c.file}: looks like Quran text; it must not be narrated`);

const chars = clips.reduce((n, c) => n + c.text.length, 0);
if (dry) {
  for (const c of clips) console.log(`${c.file}\n  ${c.text.replace(/\n+/g, " ")}`);
  console.log(`\n${clips.length} clips, ${chars} characters`);
  process.exit(0);
}

const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.NARRATOR_VOICE_ID;
const model = process.env.NARRATOR_MODEL || "eleven_multilingual_v2";
if (!key || !voice) {
  console.error("Set ELEVENLABS_API_KEY and NARRATOR_VOICE_ID.");
  process.exit(1);
}
if (!/^[A-Za-z0-9]{10,40}$/.test(voice)) throw new Error("NARRATOR_VOICE_ID looks wrong");

const manifestIn = arg("--manifest");
const old = manifestIn && existsSync(manifestIn) ? JSON.parse(readFileSync(manifestIn, "utf8")) : { clips: {} };
const hash = (text) => createHash("sha256").update(`${model}\n${voice}\n${text}`).digest("hex").slice(0, 16);
mkdirSync(outDir, { recursive: true });

const manifest = { model, clips: { ...(old.clips ?? {}) } };
let made = 0;
for (const c of clips) {
  const h = hash(c.text);
  manifest.clips[c.file] = h;
  if (old.clips?.[c.file] === h) continue;
  // Calm, warm bedtime delivery: a little slower, steady.
  const body = { text: c.text, model_id: model, voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true, speed: 0.9 } };
  let res;
  for (let attempt = 1; attempt <= 4; attempt++) {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    if (res.ok || (res.status !== 429 && res.status < 500)) break;
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  if (!res.ok) {
    // Never print the response headers or the key; the body is the API's error message.
    console.error(`${c.file}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  writeFileSync(path.join(outDir, c.file), Buffer.from(await res.arrayBuffer()));
  made++;
  console.log(`recorded ${c.file}`);
}
writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`${made} new clips (${clips.length} in total, ${chars} characters)`);
