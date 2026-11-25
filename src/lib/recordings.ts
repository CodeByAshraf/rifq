/** Learner recordings, stored only on this device (IndexedDB). Never uploaded. */
export interface Recording {
  id: string;
  surah: number;
  from: number;
  to: number;
  at: string;
  duration: number;
  mime: string;
  blob: Blob;
}

const DB = "rifq-recordings";
const STORE = "recs";

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

export const saveRecording = (r: Recording) => tx("readwrite", (s) => s.put(r));
export const deleteRecording = (id: string) => tx("readwrite", (s) => s.delete(id));
export const clearRecordings = () => tx("readwrite", (s) => s.clear());
export const listRecordings = async () => ((await tx("readonly", (s) => s.getAll())) as Recording[]).sort((a, b) => b.at.localeCompare(a.at));

export function pickMime() {
  const opts = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const o of opts) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(o)) return o;
  return "";
}
