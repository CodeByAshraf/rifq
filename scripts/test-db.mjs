// Runs both Supabase migrations in an in-process Postgres (PGlite) with a stub of
// Supabase's auth schema, then attacks the schema as different users.
// Usage: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const db = new PGlite({ extensions: { pgcrypto } });
process.on("unhandledRejection", (e) => {
  console.error("FAIL:", e?.message ?? e, e?.where ?? "");
  process.exit(1);
});
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

// --- Supabase-like environment -------------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  -- Supabase grants table privileges to API roles by default; RLS is what protects data.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
for (const f of ["0001_init.sql", "0002_security.sql", "0003_account_deletion.sql"]) await db.exec(readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8"));

// Sign-ups (trigger creates profiles).
await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'a@x.com', '{"display_name":"<b>Parent A</b>"}'), ($2, 'b@x.com', '{}')`, [A, B]);

// --- helpers --------------------------------------------------------------
async function as(user, fn) {
  await db.exec("begin");
  try {
    if (user) {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user]);
      await db.exec("set local role authenticated");
    } else {
      await db.query(`select set_config('request.jwt.claim.sub', '', true)`);
      await db.exec("set local role anon");
    }
    const r = await fn();
    await db.exec("commit");
    return r;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
const q = (sql, p) => db.query(sql, p);
// Only security-relevant failures count; a typo or syntax error must fail the test.
const EXPECTED = new Set(["42501", "23514", "54000", "23503", "22P02", "23502"]);
async function denied(user, sql, p, why) {
  try {
    await as(user, () => q(sql, p));
  } catch (e) {
    if (!EXPECTED.has(e.code)) throw new Error(`${why}: unexpected error ${e.code} ${e.message}`);
    if (process.env.VERBOSE) console.log(`      ${e.code} ${why}: ${e.message}`);
    return;
  }
  throw new Error(`${why}: was NOT rejected`);
}
let passed = 0;
const ok = (name) => (passed++, console.log("  ✓", name));

// --- tests ----------------------------------------------------------------
const prof = await q("select display_name from public.profiles where id = $1", [A]);
assert.equal(prof.rows[0].display_name, "bParent A/b");
ok("sign-up trigger strips markup from display_name");

const childA = (await as(A, () => q(`insert into public.children (parent_id, display_name) values ($1, 'سارة') returning id`, [A]))).rows[0].id;
const childA2 = (await as(A, () => q(`insert into public.children (parent_id, display_name) values ($1, 'عمر') returning id`, [A]))).rows[0].id;
await as(A, () => q(`insert into public.verse_progress (child_id, surah, ayah, state, due) values ($1, 1, 7, 'good', current_date)`, [childA]));
await as(A, () => q(`insert into public.bookmarks (child_id, surah, ayah) values ($1, 2, 255)`, [childA]));
ok("owner can create children and progress");

// Isolation: B sees nothing of A.
for (const t of ["profiles", "children", "verse_progress", "bookmarks"]) {
  const r = await as(B, () => q(`select count(*)::int n from public.${t} where ${t === "profiles" ? "id" : t === "children" ? "parent_id" : "child_id"} = $1`, [t === "profiles" || t === "children" ? A : childA]));
  assert.equal(r.rows[0].n, 0, t);
}
ok("user B cannot read any of A's rows");

const upd = await as(B, () => q(`update public.children set display_name = 'hacked' where id = $1`, [childA]));
assert.equal(upd.affectedRows ?? 0, 0);
const del = await as(B, () => q(`delete from public.verse_progress where child_id = $1`, [childA]));
assert.equal(del.affectedRows ?? 0, 0);
assert.equal((await q(`select display_name from public.children where id = $1`, [childA])).rows[0].display_name, "سارة");
ok("user B cannot update or delete A's rows");

await denied(B, `insert into public.children (parent_id, display_name) values ($1, 'x')`, [A], "insert child for A");
await denied(B, `insert into public.verse_progress (child_id, surah, ayah, state, due) values ($1, 1, 1, 'good', current_date)`, [childA], "write A's progress");
await denied(B, `insert into public.bookmarks (child_id, surah, ayah) values ($1, 1, 1)`, [childA], "write A's bookmarks");
ok("user B cannot write into A's account");

await denied(A, `update public.children set parent_id = $1 where id = $2`, [B, childA], "transfer ownership");
const childB = (await as(B, () => q(`insert into public.children (parent_id, display_name) values ($1, 'زياد') returning id`, [B]))).rows[0].id;
await denied(A, `update public.verse_progress set child_id = $1 where child_id = $2`, [childB, childA], "move rows to B's child");
await denied(A, `update public.verse_progress set child_id = $1 where child_id = $2`, [childA2, childA], "move rows between own children");
ok("ownership and child_id are immutable");

for (const t of ["profiles", "children", "verse_progress", "lesson_progress", "achievements", "bookmarks", "game_scores", "activity_log", "surah_lengths"]) {
  await denied(null, `select * from public.${t}`, [], `anon select ${t}`);
}
await denied(null, `insert into public.children (parent_id, display_name) values ($1, 'x')`, [A], "anon insert");
ok("anonymous visitors have no access to any table");

const bad = [
  [`insert into public.verse_progress (child_id, surah, ayah, state, due) values ($1, 1, 8, 'good', current_date)`, "Al-Fatihah has 7 verses"],
  [`insert into public.verse_progress (child_id, surah, ayah, state, due) values ($1, 112, 5, 'good', current_date)`, "Al-Ikhlas has 4 verses"],
  [`insert into public.verse_progress (child_id, surah, ayah, state, due) values ($1, 2, 1, 'hacked', current_date)`, "bad state"],
  [`insert into public.verse_progress (child_id, surah, ayah, state, due, ease) values ($1, 2, 2, 'good', current_date, 99)`, "bad ease"],
  [`insert into public.bookmarks (child_id, surah, ayah) values ($1, 114, 7)`, "An-Nas has 6 verses"],
  [`insert into public.lesson_progress (child_id, lesson_id, completed_on, quiz_score) values ($1, 'x''; drop table children;--', current_date, 1)`, "injection-shaped id"],
  [`insert into public.lesson_progress (child_id, lesson_id, completed_on, quiz_score) values ($1, 'noon', current_date, 500)`, "score > 100"],
  [`insert into public.achievements (child_id, badge_id, earned_on) values ($1, '<script>', current_date)`, "bad badge id"],
  [`insert into public.game_scores (child_id, game_id, best, plays) values ($1, 'match', -1, 1)`, "negative score"],
  [`insert into public.activity_log (child_id, kind, label) values ($1, 'read', '<img src=x onerror=alert(1)>')`, "markup in label"],
  [`insert into public.activity_log (child_id, kind, label) values ($1, 'pwn', 'x')`, "bad kind"],
  [`update public.children set display_name = '<script>' where id = $1`, "markup in child name"],
  [`update public.children set display_name = '${"ع".repeat(21)}' where id = $1`, "name too long"],
  [`update public.children set avatar = '[1,2,3]' where id = $1`, "avatar must be an object"],
  [`update public.children set stars = -5 where id = $1`, "negative stars"],
];
for (const [sql, why] of bad) await denied(A, sql, [childA], why);
ok(`malformed values rejected by constraints (${bad.length} cases)`);

// SQL injection through parameters is inert.
const inj = "سارة'); delete from public.children; --";
await denied(A, `update public.children set display_name = $1 where id = $2`, [inj, childA], "too long anyway");
const inj2 = "x' or '1'='1";
const r = await as(A, () => q(`select count(*)::int n from public.children where display_name = $1`, [inj2]));
assert.equal(r.rows[0].n, 0);
assert.equal((await q(`select count(*)::int n from public.children`)).rows[0].n, 3);
ok("parameterized values cannot change the query");

// Quota: max 10 learner profiles.
for (let i = 0; i < 8; i++) await as(A, () => q(`insert into public.children (parent_id, display_name) values ($1, $2)`, [A, `طفل${i}`]));
await denied(A, `insert into public.children (parent_id, display_name) values ($1, 'زيادة')`, [A], "11th child");
ok("max 10 learner profiles per account");

// Activity flood limit.
await as(A, async () => {
  for (let i = 0; i < 300; i++) await q(`insert into public.activity_log (child_id, kind, label, created_at) values ($1, 'read', 'x', now() - ($2 || ' seconds')::interval)`, [childA, String(i)]);
});
await denied(A, `insert into public.activity_log (child_id, kind, label) values ($1, 'read', 'flood')`, [childA], "flood");
ok("activity insert flood limit (300/hour)");

// Privileges on internals.
await denied(A, `select public.handle_new_user()`, [], "call trigger fn");
await denied(A, `insert into public.profiles (id) values ($1)`, ["33333333-3333-3333-3333-333333333333"], "insert profile");
await denied(A, `delete from public.profiles where id = $1`, [A], "delete profile");
await denied(A, `update public.profiles set id = $1 where id = $2`, [B, A], "change profile id");
await denied(A, `insert into public.surah_lengths values (1, 286) on conflict (surah) do update set verses = 286`, [], "tamper surah lengths");
await denied(A, `truncate public.children`, [], "truncate");
const pu = await as(A, () => q(`update public.profiles set display_name = 'أبو سارة' where id = $1`, [A]));
assert.equal(pu.affectedRows, 1);
ok("internal functions and identity columns are locked; own name still editable");

const sl = await q(`select sum(verses)::int n, count(*)::int c from public.surah_lengths`);
assert.deepEqual(sl.rows[0], { n: 6236, c: 114 });
ok("surah_lengths has 114 surahs / 6236 verses");

const rls = await q(`select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and not (relrowsecurity and relforcerowsecurity)`);
assert.deepEqual(rls.rows, []);
ok("every public table has RLS enabled and forced");

// Account deletion: anon cannot call it; B deletes only B; everything of B is gone, A untouched.
await denied(null, `select public.delete_my_account()`, [], "anon delete account");
const before = (await q(`select count(*)::int n from public.children where parent_id = $1`, [A])).rows[0].n;
await as(B, () => q(`select public.delete_my_account()`));
assert.equal((await q(`select count(*)::int n from auth.users where id = $1`, [B])).rows[0].n, 0);
assert.equal((await q(`select count(*)::int n from public.profiles where id = $1`, [B])).rows[0].n, 0);
assert.equal((await q(`select count(*)::int n from public.children where parent_id = $1`, [B])).rows[0].n, 0);
assert.equal((await q(`select count(*)::int n from public.children where parent_id = $1`, [A])).rows[0].n, before);
assert.equal((await q(`select count(*)::int n from auth.users where id = $1`, [A])).rows[0].n, 1);
ok("in-app account deletion removes only the caller's account and all of its data");

console.log(`db: ${passed} checks passed`);
await db.close();
