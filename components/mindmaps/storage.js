// Local storage: IndexedDB (large capacity) with localStorage fallback + migration from v1.
const DB_NAME = 'gate-notebook-mindmaps'; const STORE = 'maps';
export const LEGACY_KEY = 'gate-notebook-mindmaps-v1';
export const META_KEY = 'gate-notebook-mindmaps-meta-v2';

const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
export const readJson = lsGet; export const writeJson = lsSet;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); req.onblocked = () => reject(new Error('blocked'));
  });
}
const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

export async function createStorage() {
  let db = null; try { db = await openDb(); } catch { db = null; }
  const mode = db ? 'indexeddb' : 'localstorage';
  const api = {
    mode,
    async loadAll() {
      if (db) {
        const all = await wrap(db.transaction(STORE).objectStore(STORE).getAll());
        if (all.length) return all;
        const legacy = lsGet(LEGACY_KEY, []); // one-time migration, legacy copy is kept as a safety net
        if (Array.isArray(legacy) && legacy.length) { await api.saveMany(legacy); return legacy; }
        return [];
      }
      const legacy = lsGet(LEGACY_KEY, []); return Array.isArray(legacy) ? legacy : [];
    },
    async saveMany(maps, removeIds = []) {
      if (db) {
        await new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); const s = tx.objectStore(STORE); maps.forEach((m) => s.put(m)); removeIds.forEach((id) => s.delete(id)); tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Storage write aborted')); });
        return;
      }
      const current = lsGet(LEGACY_KEY, []); const byId = new Map(current.map((m) => [m.id, m])); maps.forEach((m) => byId.set(m.id, m)); removeIds.forEach((id) => byId.delete(id));
      if (!lsSet(LEGACY_KEY, [...byId.values()])) throw new Error('Browser storage is full');
    },
  };
  return api;
}
export async function requestPersistence() { try { return (await navigator.storage?.persist?.()) || false; } catch { return false; } }
export async function storageEstimate() { try { const e = await navigator.storage?.estimate?.(); return e ? { used: e.usage || 0, quota: e.quota || 0 } : null; } catch { return null; } }
export const formatBytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
