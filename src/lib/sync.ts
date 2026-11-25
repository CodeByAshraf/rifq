import type { BadgeId } from "@/data/badges";
import { getSupabase } from "@/lib/supabase";
import { actions, getState, type ChildData, type ProgressState } from "@/lib/store";
import { sanitizeState } from "@/lib/state-guard";

// Never show raw database errors to users (they can leak schema details).
const FAIL = { ok: false, message: "تعذّرت المزامنة الآن. حاول مرة أخرى لاحقًا." } as const;
function logError(where: string, e: unknown) {
  if (process.env.NODE_ENV !== "production") console.error(`[sync] ${where}`, e);
}

/**
 * Two-way sync between local progress and Supabase.
 * - push(): uploads every local learner profile and its progress (upserts).
 * - pull(): replaces local state with what is stored in the account.
 * All requests run as the signed-in user and are filtered by RLS.
 */

export async function pushProgress(): Promise<{ ok: boolean; message: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, message: "لم يتم إعداد Supabase بعد." };
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false, message: "يجب تسجيل الدخول أولًا." };

  // Validate everything before it leaves the device; the DB re-checks with constraints.
  const state = sanitizeState<ProgressState>(getState());
  if (!state) return FAIL;
  for (const c of state.children) {
    const d = state.data[c.id];
    const row = {
      parent_id: auth.user.id,
      display_name: c.name,
      avatar: c.avatar,
      weekly_days_goal: c.weeklyDaysGoal ?? 5,
      daily_verses: c.dailyVerses ?? 3,
      stars: d.stars,
      active_days: d.activeDays,
    };
    let remoteId = c.remoteId;
    if (remoteId) {
      const { error } = await sb.from("children").update(row).eq("id", remoteId);
      if (error) return logError("children.update", error), FAIL;
    } else {
      const { data, error } = await sb.from("children").insert(row).select("id").single();
      if (error) return logError("children.insert", error), FAIL;
      remoteId = data.id as string;
      actions.updateChildProfile(c.id, { remoteId });
    }

    const verses = Object.entries(d.verses).map(([k, v]) => {
      const [surah, ayah] = k.split(":").map(Number);
      return {
        child_id: remoteId,
        surah,
        ayah,
        state: v.state,
        interval_days: v.interval,
        ease: v.ease,
        reps: v.reps,
        lapses: v.lapses,
        due: v.due,
        last_reviewed: v.lastReviewed,
        first_learned: v.firstLearned,
        updated_at: new Date().toISOString(),
      };
    });
    const ops = [
      verses.length && sb.from("verse_progress").upsert(verses),
      Object.keys(d.lessons).length &&
        sb.from("lesson_progress").upsert(Object.entries(d.lessons).map(([lesson_id, l]) => ({ child_id: remoteId, lesson_id, completed_on: l.completed, quiz_score: l.quizScore }))),
      Object.keys(d.badges).length &&
        sb.from("achievements").upsert(Object.entries(d.badges).map(([badge_id, earned_on]) => ({ child_id: remoteId, badge_id, earned_on }))),
      Object.keys(d.games).length &&
        sb.from("game_scores").upsert(Object.entries(d.games).map(([game_id, g]) => ({ child_id: remoteId, game_id, best: g.best, plays: g.plays }))),
      d.activity.length &&
        sb.from("activity_log").upsert(
          d.activity.map((a) => ({ child_id: remoteId, kind: a.kind, label: a.label, stars: a.stars, created_at: a.at })),
          { onConflict: "child_id,created_at,kind", ignoreDuplicates: true },
        ),
    ].filter(Boolean) as PromiseLike<{ error: { message: string } | null }>[];

    // Bookmarks are replaced as a set.
    await sb.from("bookmarks").delete().eq("child_id", remoteId);
    if (d.bookmarks.length) {
      ops.push(sb.from("bookmarks").insert(d.bookmarks.map((b) => {
        const [surah, ayah] = b.split(":").map(Number);
        return { child_id: remoteId, surah, ayah };
      })));
    }

    for (const r of await Promise.all(ops)) if (r.error) return logError("upsert", r.error), FAIL;
  }
  return { ok: true, message: "تمّت مزامنة التقدّم مع حسابك." };
}

export async function pullProgress(): Promise<{ ok: boolean; message: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, message: "لم يتم إعداد Supabase بعد." };
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false, message: "يجب تسجيل الدخول أولًا." };

  const { data: kids, error } = await sb.from("children").select("*").order("created_at");
  if (error) return logError("children.select", error), FAIL;
  if (!kids?.length) return { ok: false, message: "لا توجد بيانات محفوظة في الحساب بعد." };

  const ids = kids.map((k) => k.id as string);
  const [vp, lp, ach, bm, gs, act] = await Promise.all([
    sb.from("verse_progress").select("*").in("child_id", ids),
    sb.from("lesson_progress").select("*").in("child_id", ids),
    sb.from("achievements").select("*").in("child_id", ids),
    sb.from("bookmarks").select("*").in("child_id", ids),
    sb.from("game_scores").select("*").in("child_id", ids),
    sb.from("activity_log").select("*").in("child_id", ids).order("created_at", { ascending: false }).limit(200),
  ]);
  const err = [vp, lp, ach, bm, gs, act].find((r) => r.error);
  if (err?.error) return logError("select", err.error), FAIL;

  const local = getState();
  const next: ProgressState = { version: 1, mode: local.mode, activeChildId: "", children: [], data: {} };
  for (const k of kids) {
    if (typeof k.id !== "string" || !/^[0-9a-f-]{36}$/i.test(k.id)) continue;
    const id = `r${k.id.replace(/-/g, "").slice(0, 12)}`;
    next.children.push({ id, remoteId: k.id, name: k.display_name, avatar: k.avatar, weeklyGoalMinutes: 60, weeklyDaysGoal: k.weekly_days_goal, dailyVerses: k.daily_verses });
    const d: ChildData = { stars: k.stars, verses: {}, lessons: {}, games: {}, badges: {}, bookmarks: [], activeDays: k.active_days ?? [], activity: [], unlockedDecor: [] };
    vp.data!.filter((r) => r.child_id === k.id).forEach((r) => {
      d.verses[`${r.surah}:${r.ayah}`] = { state: r.state, interval: r.interval_days, ease: r.ease, reps: r.reps, lapses: r.lapses, due: r.due, lastReviewed: r.last_reviewed, firstLearned: r.first_learned };
    });
    lp.data!.filter((r) => r.child_id === k.id).forEach((r) => (d.lessons[r.lesson_id] = { completed: r.completed_on, quizScore: r.quiz_score }));
    ach.data!.filter((r) => r.child_id === k.id).forEach((r) => (d.badges[r.badge_id as BadgeId] = r.earned_on));
    bm.data!.filter((r) => r.child_id === k.id).forEach((r) => d.bookmarks.push(`${r.surah}:${r.ayah}`));
    gs.data!.filter((r) => r.child_id === k.id).forEach((r) => (d.games[r.game_id] = { best: r.best, plays: r.plays }));
    act.data!.filter((r) => r.child_id === k.id).slice(0, 40).forEach((r) => d.activity.push({ at: r.created_at, kind: r.kind, label: r.label, stars: r.stars }));
    next.data[id] = d;
  }
  if (!next.children.length) return FAIL;
  next.activeChildId = next.children[0].id;
  actions.hydrate(next);
  return { ok: true, message: "تمّ تحميل التقدّم من حسابك." };
}
