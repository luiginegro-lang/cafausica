// v1772362837 — force update
const CACHE_NAME = 'cafausica-v1772362837';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => self.clients.matchAll())
      .then(cls => cls.forEach(c => c.navigate(c.url)))
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
