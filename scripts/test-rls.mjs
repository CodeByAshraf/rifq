// Live RLS check against a real Supabase project (run after applying both migrations).
// Needs two confirmed test accounts. Uses only the public anon key, exactly like the app.
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... \
//   USER_A_EMAIL=... USER_A_PASSWORD=... USER_B_EMAIL=... USER_B_PASSWORD=... \
//   npm run test:rls
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const { SUPABASE_URL, SUPABASE_ANON_KEY, USER_A_EMAIL, USER_A_PASSWORD, USER_B_EMAIL, USER_B_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !USER_A_EMAIL || !USER_B_EMAIL) {
  console.log("test:rls skipped (set SUPABASE_URL, SUPABASE_ANON_KEY and two test users)");
  process.exit(0);
}
const client = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
async function signIn(email, password) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}`);
  return { c, id: data.user.id };
}

const anon = client();
const a = await signIn(USER_A_EMAIL, USER_A_PASSWORD);
const b = await signIn(USER_B_EMAIL, USER_B_PASSWORD);

const ins = await a.c.from("children").insert({ parent_id: a.id, display_name: "اختبار" }).select("id").single();
assert.ifError(ins.error);
const childA = ins.data.id;
try {
  const vp = await a.c.from("verse_progress").insert({ child_id: childA, surah: 1, ayah: 1, state: "good", due: "2030-01-01" });
  assert.ifError(vp.error);

  for (const t of ["profiles", "children", "verse_progress", "lesson_progress", "achievements", "bookmarks", "game_scores", "activity_log"]) {
    const r = await anon.from(t).select("*").limit(1);
    assert.ok(r.error || r.data.length === 0, `anon can read ${t}`);
  }
  assert.equal((await b.c.from("children").select("id").eq("id", childA)).data.length, 0, "B reads A's child");
  assert.equal((await b.c.from("verse_progress").select("*").eq("child_id", childA)).data.length, 0, "B reads A's progress");
  await b.c.from("children").update({ display_name: "hacked" }).eq("id", childA);
  assert.equal((await a.c.from("children").select("display_name").eq("id", childA).single()).data.display_name, "اختبار", "B updated A's child");
  assert.ok((await b.c.from("verse_progress").insert({ child_id: childA, surah: 1, ayah: 2, state: "good", due: "2030-01-01" })).error, "B wrote A's progress");
  assert.ok((await b.c.from("children").insert({ parent_id: a.id, display_name: "x" })).error, "B created child for A");
  assert.ok((await a.c.from("verse_progress").insert({ child_id: childA, surah: 1, ayah: 8, state: "good", due: "2030-01-01" })).error, "invalid verse accepted");
  assert.ok((await a.c.from("children").update({ parent_id: b.id }).eq("id", childA)).error, "ownership transfer allowed");
  console.log("rls: live checks passed");
} finally {
  await a.c.from("children").delete().eq("id", childA);
}
