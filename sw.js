/* The Cafausica Brew Guide — service worker v20261025
   La pagina arriva sempre dalla rete quando c'è; la copia salvata serve solo offline.
   React, caratteri e icone restano salvati sul telefono.
   A ogni aggiornamento dell'app cambia VERSION: le copie vecchie vengono cancellate. */
var VERSION = "cafausica-v20261026b";
var CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./react.production.min.js",
  "./react-dom.production.min.js",
  "./atkinson-next.woff2",
  "./literata.woff2",
  "./literata-italic.woff2",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

var ROOT = new URL("./", self.location).pathname; // es. /cafausica/

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      // un file mancante non blocca l'installazione
      return Promise.all(CORE.map(function (url) {
        return cache.add(new Request(url, { cache: "reload" })).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// una risposta rediretta non può servire una pagina: la si ricopia in una risposta semplice
function plain(res) {
  if (!res || !res.redirected) return Promise.resolve(res);
  return res.blob().then(function (body) {
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Spotify, YouTube, moduli, CDN: li gestisce il browser

  var isPage = req.mode === "navigate" || url.pathname.slice(-1) === "/" || url.pathname.slice(-5) === ".html";

  if (isPage) {
    event.respondWith(
      fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" }))
        .then(plain)
        .then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            var isMain = url.pathname === ROOT || url.pathname === ROOT + "index.html";
            caches.open(VERSION).then(function (c) {
              // la pagina principale si apre sia da "./" sia da "./index.html": tengo aggiornate entrambe le copie
              if (isMain) return Promise.all([c.put(ROOT, copy.clone()), c.put(ROOT + "index.html", copy)]);
              return c.put(req.url, copy);
            });
          }
          return res;
        })
        .catch(function () {
          return caches.match(req, { ignoreSearch: true })
            .then(function (hit) { return hit || caches.match("./index.html"); })
            .then(function (hit) { return hit || caches.match("./"); });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
