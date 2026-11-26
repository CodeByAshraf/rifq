/**
 * Merging account data into this device's data (pull). Nothing on the device is lost:
 * - fields the server does not store (stories, certificates, adhkar, challenges, decor...) stay;
 * - for shared fields, the newer or larger value wins, and sets are united.
 * Pure functions: tested in scripts/test-validation.mjs.
 */
import type { ChildData, ProgressState, VerseProgress } from "@/lib/store";

type Child = ProgressState["children"][number];

const newer = (a: string | undefined, b: string | undefined) => (a ?? "") >= (b ?? "");

function mergeVerse(l: VerseProgress | undefined, r: VerseProgress): VerseProgress {
  if (!l) return r;
  const keep = newer(l.lastReviewed, r.lastReviewed) ? l : r;
  // The first time a verse was learned is the earliest of the two.
  const first = [l.firstLearned, r.firstLearned].filter(Boolean).sort()[0] ?? keep.firstLearned;
  return { ...keep, firstLearned: first };
}

function mergeChildData(local: ChildData | undefined, remote: ChildData): ChildData {
  if (!local) return remote;
  const verses = { ...local.verses };
  for (const [k, v] of Object.entries(remote.verses)) verses[k] = mergeVerse(verses[k], v);

  const lessons = { ...local.lessons };
  for (const [k, v] of Object.entries(remote.lessons)) {
    const l = lessons[k];
    lessons[k] = l ? { completed: [l.completed, v.completed].filter(Boolean).sort()[0] ?? "", quizScore: Math.max(l.quizScore, v.quizScore) } : v;
  }

  const games = { ...local.games };
  for (const [k, v] of Object.entries(remote.games)) {
    const l = games[k];
    games[k] = l ? { best: Math.max(l.best, v.best), plays: Math.max(l.plays, v.plays) } : v;
  }

  const badges = { ...local.badges };
  for (const [k, v] of Object.entries(remote.badges) as [keyof ChildData["badges"], string][]) {
    const l = badges[k];
    badges[k] = l && l < v ? l : v;
  }

  const seen = new Set<string>();
  const activity = [...local.activity, ...remote.activity]
    .filter((a) => {
      const id = `${a.at}|${a.kind}`;
      return seen.has(id) ? false : (seen.add(id), true);
    })
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 40);

  return {
    ...local,
    stars: Math.max(local.stars, remote.stars),
    verses,
    lessons,
    games,
    badges,
    bookmarks: [...new Set([...local.bookmarks, ...remote.bookmarks])],
    activeDays: [...new Set([...local.activeDays, ...remote.activeDays])].sort(),
    activity,
  };
}

/**
 * Merges the account's children into the device state. Children are matched by remoteId;
 * local-only children (not uploaded yet) are kept. Device-only profile settings stay.
 */
export function mergeIntoState(local: ProgressState, remote: { children: Child[]; data: Record<string, ChildData> }): ProgressState {
  const children = [...local.children];
  const data = { ...local.data };
  for (const rc of remote.children) {
    const i = children.findIndex((c) => c.remoteId && c.remoteId === rc.remoteId);
    if (i >= 0) {
      const lc = children[i];
      children[i] = { ...lc, name: rc.name, avatar: rc.avatar, weeklyDaysGoal: rc.weeklyDaysGoal, dailyVerses: rc.dailyVerses };
      data[lc.id] = mergeChildData(data[lc.id], remote.data[rc.id]);
    } else {
      children.push(rc);
      data[rc.id] = remote.data[rc.id];
    }
  }
  const active = children.some((c) => c.id === local.activeChildId) ? local.activeChildId : (children[0]?.id ?? "");
  return { ...local, children, data, activeChildId: active };
}
