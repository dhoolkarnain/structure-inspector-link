/*
 * Offline cache for the app's own files (GitHub Pages copy), so it starts instantly next time.
 * - /assets/*  (file names change with every build): cache first, kept for good
 * - models / images: cache first
 * - the page itself: network first, cached copy when offline
 * Server data (/api on the tunnel) is never cached here.
 */
const CACHE = 'si-app-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope).pathname;
  const path = url.pathname;
  if (path.endsWith('link.txt')) return; // always fresh: the server's current address
  const cacheFirst = path.includes('/assets/') || path.includes('/models/') || path.includes('/draco/');
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      if (cacheFirst) {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }
      try {
        const res = await fetch(e.request);
        if (res.ok && (path === scope || path.endsWith('.html'))) cache.put(e.request, res.clone());
        return res;
      } catch {
        return (await cache.match(e.request)) || (await cache.match(scope)) || Response.error();
      }
    })
  );
});
