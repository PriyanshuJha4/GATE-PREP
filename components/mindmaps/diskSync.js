// Save maps as real files in a folder on the computer (File System Access API: Chrome / Edge / Opera desktop).
import { slug } from './formats';
import { readJson, writeJson } from './storage';
export const DISK_KEY = 'gate-notebook-mindmaps-disk-v1';
export const diskSupported = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

const HDB = 'gate-notebook-mindmaps-handles';
function openH() { return new Promise((res, rej) => { const r = indexedDB.open(HDB, 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
export async function saveHandle(handle) { const db = await openH(); await new Promise((res, rej) => { const tx = db.transaction('h', 'readwrite'); tx.objectStore('h').put(handle, 'dir'); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
export async function loadHandle() { try { const db = await openH(); return await new Promise((res) => { const g = db.transaction('h').objectStore('h').get('dir'); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); }); } catch { return null; } }
export async function clearHandle() { try { const db = await openH(); await new Promise((res) => { const tx = db.transaction('h', 'readwrite'); tx.objectStore('h').delete('dir'); tx.oncomplete = res; tx.onerror = res; }); } catch {} }

export async function pickFolder() { return window.showDirectoryPicker({ id: 'gate-mindmaps', mode: 'readwrite', startIn: 'documents' }); }
export async function permission(handle, request = false) {
  if (!handle) return 'none'; const opts = { mode: 'readwrite' };
  try { if (!handle.queryPermission) return 'granted'; let p = await handle.queryPermission(opts); if (p !== 'granted' && request) p = await handle.requestPermission(opts); return p; } catch { return 'denied'; }
}
export const fileNameFor = (m) => `${slug(m.title)}-${String(m.id).slice(-8)}.mindmap.json`;
export const getNames = () => readJson(DISK_KEY, {}).names || {};

// Write the given maps; renames remove the old file. Returns number of files written.
export async function writeMaps(dir, maps) {
  const names = { ...getNames() }; let n = 0;
  for (const m of maps) {
    const fname = fileNameFor(m); const payload = JSON.stringify({ format: 'gate-notebook-mindmap', version: 1, exportedAt: new Date().toISOString(), map: m }, null, 2);
    const fh = await dir.getFileHandle(fname, { create: true }); const w = await fh.createWritable(); await w.write(payload); await w.close(); n++;
    if (names[m.id] && names[m.id] !== fname) { try { await dir.removeEntry(names[m.id]); } catch {} }
    names[m.id] = fname;
  }
  writeJson(DISK_KEY, { names, folder: dir.name }); return n;
}
export async function readFolder(dir) {
  const out = []; for await (const [name, h] of dir.entries()) { if (h.kind === 'file' && /\.json$/i.test(name)) { try { out.push({ name, text: await (await h.getFile()).text() }); } catch {} } } return out;
}
