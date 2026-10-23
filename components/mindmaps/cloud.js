// Cloud sync client. Credentials are entered in this browser session; Cloudinary
// API credentials stay exclusively in the server-side API route.
export const CLOUD_FOLDER = 'gate-notebook-mindmaps-sync';
export const cloudReady = (c) => !!(c?.syncPassword && c.syncPassword.trim());

async function apiRequest(cloud, url, options = {}) {
  if (!cloudReady(cloud)) throw new Error('Enter your Mind Maps sync password first.');
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${cloud.syncPassword.trim()}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
      cache: 'no-store',
    });
  } catch {
    throw new Error('Could not reach the sync service. Check your internet connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Cloud sync failed (HTTP ${res.status}).`);
  return data;
}

export async function uploadBackup(cloud, { name, payload }) {
  return apiRequest(cloud, '/api/mindmaps', { method: 'POST', body: JSON.stringify({ name, payload }) });
}
export async function listCloudMaps(cloud) {
  const data = await apiRequest(cloud, '/api/mindmaps');
  return Array.isArray(data.maps) ? data.maps : [];
}
export async function loadCloudMap(cloud, id) {
  const data = await apiRequest(cloud, `/api/mindmaps?id=${encodeURIComponent(id)}`);
  return data.payload;
}
export async function deleteCloudMap(cloud, id) {
  return apiRequest(cloud, `/api/mindmaps?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Legacy public-link import remains available for backups created by the old patch.
export async function fetchBackup(url) {
  let u; try { u = new URL(url.trim()); } catch { throw new Error('That does not look like a valid link.'); }
  if (u.protocol !== 'https:') throw new Error('Only https:// links are supported.');
  let res; try { res = await fetch(u.href); } catch { throw new Error('Could not download this backup link. Download the file from Cloudinary and use Import instead.'); }
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`);
  return res.text();
}
