/**
 * «رسالة من جدو»: short voice messages a parent or grandparent records for a child, played when
 * the child reaches a goal. Stored only on this device (IndexedDB), never uploaded or synced.
 */
export type Occasion = "goal" | "ladder" | "reward";

export const OCCASIONS: { id: Occasion; title: string; when: string }[] = [
  { id: "goal", title: "مهمّة اليوم", when: "كل يوم يُتمّ فيه مهمّة اليوم" },
  { id: "ladder", title: "درجة جديدة في «اقرأ وارتقِ»", when: "عندما يرتقي درجةً جديدة" },
  { id: "reward", title: "الهدية", when: "عندما يصل إلى هدف الهدية" },
];

export interface FamilyMessage {
  id: string; // `${childId}:${occasion}`
  from: string;
  mime: string;
  duration: number;
  at: string;
  blob: Blob;
}

/** Longest message, in seconds. */
export const MAX_SECONDS = 60;

const DB = "rifq-messages";
const STORE = "msgs";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export const messageId = (childId: string, o: Occasion) => `${childId}:${o}`;
export const saveMessage = (m: FamilyMessage) => tx("readwrite", (s) => s.put(m));
export const deleteMessage = (id: string) => tx("readwrite", (s) => s.delete(id));
export const clearMessages = () => tx("readwrite", (s) => s.clear());
export const getMessage = async (id: string) => ((await tx("readonly", (s) => s.get(id))) as FamilyMessage | undefined) ?? null;
