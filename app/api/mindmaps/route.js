import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOLDER = 'gate-notebook-mindmaps-sync';
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });

function config() {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret, MINDMAP_SYNC_PASSWORD: password } = process.env;
  if (!cloud || !key || !secret || !password) throw new Error('Sync service is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET and MINDMAP_SYNC_PASSWORD in your deployment environment.');
  return { cloud, key, secret, password };
}
function authorized(request, cfg) {
  const supplied = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(supplied); const b = Buffer.from(cfg.password);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function authHeader(cfg) { return `Basic ${Buffer.from(`${cfg.key}:${cfg.secret}`).toString('base64')}`; }
function publicId(id) {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id || '')) throw new Error('Invalid map ID.');
  return `${FOLDER}/${id}.json`;
}
function signParams(params, secret) {
  const text = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  return crypto.createHash('sha1').update(`${text}${secret}`).digest('hex');
}
function encryptPayload(payload, password) {
  const salt = 'gate-notebook-mindmaps-sync-v1';
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return JSON.stringify({ encrypted: true, v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') });
}
function decryptPayload(text, password) {
  const envelope = JSON.parse(text);
  if (!envelope?.encrypted) return envelope; // migrate legacy unencrypted map backups
  if (envelope.v !== 1) throw new Error('Unsupported encrypted backup version.');
  const key = crypto.scryptSync(password, 'gate-notebook-mindmaps-sync-v1', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const clear = Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64')), decipher.final()]).toString('utf8');
  return JSON.parse(clear);
}
async function cloudRequest(cfg, path, options = {}) {
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/${path}`, {
    ...options,
    headers: { Authorization: authHeader(cfg), ...(options.headers || {}) },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Cloudinary API returned HTTP ${res.status}.`);
  return data;
}
async function allResources(cfg) {
  const resources = [];
  let cursor = '';
  for (let page = 0; page < 10; page += 1) {
    const query = new URLSearchParams({ prefix: `${FOLDER}/`, max_results: '500' });
    if (cursor) query.set('next_cursor', cursor);
    const data = await cloudRequest(cfg, `resources/raw/upload?${query.toString()}`);
    resources.push(...(data.resources || []));
    cursor = data.next_cursor || '';
    if (!cursor) break;
  }
  return resources.filter((r) => r.public_id?.startsWith(`${FOLDER}/`) && r.public_id.endsWith('.json'));
}
async function getPayloadFromResource(resource, cfg) {
  const res = await fetch(resource.secure_url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not download cloud map ${resource.public_id}.`);
  return decryptPayload(await res.text(), cfg.password);
}

export async function GET(request) {
  let cfg;
  try { cfg = config(); } catch (e) { return json({ error: e.message }, 503); }
  if (!authorized(request, cfg)) return json({ error: 'Incorrect sync password.' }, 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    const resources = await allResources(cfg);
    if (id) {
      const wanted = publicId(id);
      const resource = resources.find((r) => r.public_id === wanted);
      if (!resource) return json({ error: 'This mind map was not found in your cloud library.' }, 404);
      const payload = await getPayloadFromResource(resource, cfg);
      return json({ payload, map: { id, bytes: resource.bytes, modifiedAt: resource.modified_at || resource.created_at } });
    }
    const maps = [];
    for (const resource of resources) {
      try {
        const payload = await getPayloadFromResource(resource, cfg);
        const map = payload?.map || payload;
        if (map && typeof map === 'object') maps.push({ id: map.id || resource.public_id.split('/').pop().replace(/\.json$/, ''), title: map.title || resource.public_id.split('/').pop().replace(/\.json$/, ''), updatedAt: map.updatedAt || resource.modified_at || resource.created_at, createdAt: map.createdAt || resource.created_at, bytes: resource.bytes || 0, publicId: resource.public_id });
      } catch { /* A damaged/old asset should not hide the rest of the library. */ }
    }
    maps.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return json({ maps });
  } catch (e) { return json({ error: e.message || 'Could not read the Cloudinary library.' }, 502); }
}

export async function POST(request) {
  let cfg;
  try { cfg = config(); } catch (e) { return json({ error: e.message }, 503); }
  if (!authorized(request, cfg)) return json({ error: 'Incorrect sync password.' }, 401);
  try {
    const body = await request.json();
    const payload = body?.payload;
    const map = payload?.map || payload;
    if (!payload || typeof payload !== 'object' || !map?.id || !map?.title) return json({ error: 'A valid mind map payload is required.' }, 400);
    const id = String(map.id);
    const pid = publicId(id);
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { overwrite: 'true', public_id: pid, timestamp: String(timestamp) };
    const signature = signParams(params, cfg.secret);
    const form = new FormData();
    form.append('file', new Blob([encryptPayload(payload, cfg.password)], { type: 'application/json' }), `${id}.json`);
    form.append('api_key', cfg.key); form.append('timestamp', String(timestamp)); form.append('public_id', pid); form.append('overwrite', 'true'); form.append('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/raw/upload`, { method: 'POST', body: form, cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: data?.error?.message || `Cloudinary upload failed (HTTP ${res.status}).` }, 502);
    return json({ ok: true, id, publicId: data.public_id, url: data.secure_url, bytes: data.bytes || 0, modifiedAt: data.created_at });
  } catch (e) { return json({ error: e.message || 'Could not save this mind map.' }, 502); }
}

export async function DELETE(request) {
  let cfg;
  try { cfg = config(); } catch (e) { return json({ error: e.message }, 503); }
  if (!authorized(request, cfg)) return json({ error: 'Incorrect sync password.' }, 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    const pid = publicId(id);
    const body = new URLSearchParams(); body.append('public_ids[]', pid);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/resources/raw/upload`, { method: 'DELETE', headers: { Authorization: authHeader(cfg), 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: data?.error?.message || `Cloudinary delete failed (HTTP ${res.status}).` }, 502);
    return json({ ok: true, deleted: data.deleted || {} });
  } catch (e) { return json({ error: e.message || 'Could not delete the cloud map.' }, 502); }
}
