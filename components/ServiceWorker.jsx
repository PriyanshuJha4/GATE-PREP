'use client';

import { useEffect } from 'react';

// Production: register the service worker (offline support + installability).
// Development: remove any old worker so you never see stale pages while editing.
export default function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    } else {
      navigator.serviceWorker.getRegistrations().then((list) => list.forEach((r) => r.unregister()));
    }
  }, []);
  return null;
}
