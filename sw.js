const CACHE = 'lichka-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));
});
self.addEventListener('activate', e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(url.hostname.indexOf('script.google') !== -1 || url.hostname.indexOf('googleusercontent') !== -1) return; // données : laisser passer
  e.respondWith(
    fetch(e.request).then(r=>{
      if(url.origin === location.origin){
        const copy = r.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
      }
      return r;
    }).catch(()=> caches.match(e.request).then(m=> m || caches.match('./index.html')))
  );
});
