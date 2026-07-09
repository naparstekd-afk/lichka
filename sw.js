const CACHE = 'lichka-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));
});

self.addEventListener('activate', e=>{
  e.waitUntil(Promise.all([
    // Supprime TOUS les anciens caches (dont lichka-v1/v2 périmés)
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  const url = new URL(req.url);
  if(req.method !== 'GET') return;
  // Données Google : laisser passer sans interception
  if(url.hostname.indexOf('script.google') !== -1 || url.hostname.indexOf('googleusercontent') !== -1) return;

  // Navigation (chargement de la page) : TOUJOURS le réseau frais, jamais le cache figé.
  // Repli sur le cache uniquement si hors-ligne.
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(url.origin + '/index.html', {cache:'no-store'}).then(r=>{
        if(url.origin === location.origin){
          const copy = r.clone();
          caches.open(CACHE).then(c=>c.put('./index.html', copy)).catch(()=>{});
        }
        return r;
      }).catch(()=> caches.match('./index.html').then(m=> m || caches.match('./')))
    );
    return;
  }

  // Autres ressources même origine : réseau d'abord, cache en repli.
  e.respondWith(
    fetch(req).then(r=>{
      if(url.origin === location.origin){
        const copy = r.clone();
        caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
      }
      return r;
    }).catch(()=> caches.match(req))
  );
});
