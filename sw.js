// v20260302-v24 - force cache clear
self.addEventListener("install", function() { self.skipWaiting(); });
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(ks) {
      return Promise.all(ks.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function(e) {
  e.respondWith(fetch(e.request).catch(function() {
    return caches.match(e.request);
  }));
});
