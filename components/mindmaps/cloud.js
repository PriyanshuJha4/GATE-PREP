// Cloudinary (unsigned upload) backup helpers. No secrets are ever used or stored.
import { slug } from './formats';
export const CLOUD_FOLDER = 'gate-notebook-mindmaps';
export const cloudReady = (c) => !!(c?.cloudName?.trim() && c?.uploadPreset?.trim());

export async function uploadBackup(cloud, { name, payload, tags = [] }) {
  const file = new File([JSON.stringify(payload)], `${slug(name)}.json`, { type: 'application/json' });
  if (file.size > 9.5 * 1024 * 1024) throw new Error('This backup is over 9.5 MB (Cloudinary’s free file limit). Back up maps one at a time, or use Export → All maps instead.');
  const form = new FormData(); form.append('file', file); form.append('upload_preset', cloud.uploadPreset.trim());
  form.append('folder', CLOUD_FOLDER); form.append('public_id', `${slug(name)}-${Date.now().toString(36)}.json`); if (tags.length) form.append('tags', tags.join(','));
  let res; try { res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud.cloudName.trim())}/raw/upload`, { method: 'POST', body: form }); }
  catch { throw new Error('Could not reach Cloudinary. Check your internet connection.'); }
  let data = {}; try { data = await res.json(); } catch {}
  if (!res.ok) { const msg = data?.error?.message || ''; throw new Error(/preset/i.test(msg) ? `Cloudinary says: ${msg}. Check the preset name and that it is set to Unsigned.` : msg || `Upload failed (HTTP ${res.status}). Check cloud name and preset.`); }
  return { url: data.secure_url, publicId: data.public_id, bytes: data.bytes || file.size };
}
export async function fetchBackup(url) {
  let u; try { u = new URL(url.trim()); } catch { throw new Error('That does not look like a valid link.'); }
  if (u.protocol !== 'https:') throw new Error('Only https:// links are supported.');
  let res; try { res = await fetch(u.href); } catch { throw new Error('The browser could not download that link (it may block cross-site access). Download the file from Cloudinary and use Import instead.'); }
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`);
  return res.text();
}
// "Setup code" lets you copy the Cloudinary settings to another device (contains no secrets).
export const makeSetupCode = (c) => `gnm1.${btoa(unescape(encodeURIComponent(JSON.stringify({ c: c.cloudName, p: c.uploadPreset }))))}`;
export function parseSetupCode(code) {
  const t = code.trim(); if (!t.startsWith('gnm1.')) throw new Error('This is not a valid setup code.');
  try { const o = JSON.parse(decodeURIComponent(escape(atob(t.slice(5))))); if (!o.c || !o.p) throw new Error(); return { cloudName: o.c, uploadPreset: o.p }; } catch { throw new Error('This is not a valid setup code.'); }
}
