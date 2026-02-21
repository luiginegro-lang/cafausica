const CACHE='cafausica-v6';

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./afa-manifesto.pdf','./icon-192.png','./icon-512.png','./apple-touch-icon.png']))
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.mode==='navigate'||url.pathname==='/'||url.pathname==='/index.html'){
    e.respondWith(
      fetch(e.request).then(res=>{
        const clone=res.clone();
        caches.open(CACHE).then(c=>{c.put(e.request,clone);});
        return res;
      }).catch(()=>caches.match('./')||caches.match('./index.html'))
    );
  }else{
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
        const clone=res.clone();
        caches.open(CACHE).then(c=>{c.put(e.request,clone);});
        return res;
      })).catch(()=>new Response('Offline',{status:503}))
    );
  }
});
