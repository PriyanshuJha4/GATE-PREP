/* Service worker: makes the app installable and usable offline.
   `npm run build` (postbuild) fills in VERSION and the list of files to precache. */
const VERSION = '__VERSION__';
const PRECACHE = /*__PRECACHE__*/ [];
const CACHE = `gate-notebook-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok) await cache.put(url, res);
          } catch (e) {
            /* a single failed file must not break the install */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('gate-notebook-') && k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Pages and page data: network first (so new content always wins), cache when offline.
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const home = await cache.match('/');
      if (home) return home;
    }
    return Response.error();
  }
}

// Fingerprinted build files never change: cache first.
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

// Everything else (icons, fonts, manifest): serve cached copy, refresh in background.
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  const update = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return hit || (await update) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;

  const isPageData = req.mode === 'navigate' || url.searchParams.has('_rsc') || url.pathname.endsWith('.txt');
  if (isPageData) event.respondWith(networkFirst(req));
  else if (url.pathname.startsWith('/_next/static/')) event.respondWith(cacheFirst(req));
  else event.respondWith(staleWhileRevalidate(req));
});
