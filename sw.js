/* NowFind - service worker
   Abre o app mesmo sem internet (guarda a "casca" do app) e mantém os lembretes. */
var CACHE = 'nowfind-shell-v1';
var CASCA = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];
 
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE)
      .then(function(cache){
        return Promise.all(CASCA.map(function(url){
          return cache.add(url).catch(function(){});
        }));
      })
      .then(function(){ return self.skipWaiting(); })
  );
});
 
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys()
      .then(function(chaves){
        return Promise.all(chaves
          .filter(function(c){ return c.indexOf('nowfind-shell-') === 0 && c !== CACHE; })
          .map(function(c){ return caches.delete(c); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});
 
self.addEventListener('fetch', function(event){
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
 
  /* o app em si: sempre tenta a versão mais nova na internet;
     só usa a cópia guardada quando estiver sem conexão */
  if (req.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(
      fetch(req)
        .then(function(res){
          if (res && res.ok) {
            var copia = res.clone();
            caches.open(CACHE).then(function(c){ c.put('/index.html', copia); });
          }
          return res;
        })
        .catch(function(){
          return caches.match('/index.html').then(function(emCache){
            return emCache || caches.match('/');
          });
        })
    );
    return;
  }
 
  /* ícones e manifest: usa o que está guardado e atualiza em segundo plano */
  if (CASCA.indexOf(url.pathname) >= 0) {
    event.respondWith(
      caches.match(req).then(function(emCache){
        var rede = fetch(req)
          .then(function(res){
            if (res && res.ok) {
              var copia = res.clone();
              caches.open(CACHE).then(function(c){ c.put(req, copia); });
            }
            return res;
          })
          .catch(function(){ return emCache; });
        return emCache || rede;
      })
    );
  }
});
 
self.addEventListener('push', function(event){
  event.waitUntil(
    self.registration.showNotification('NowFind', {
      body: 'Você tem um lembrete.',
      icon: 'icon-192.png',
      tag: 'nowfind-lembrete',
      renotify: true
    })
  );
});
 
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(lista){
        if (lista.length){
          return lista[0].focus();
        }
        return self.clients.openWindow('/');
      })
  );
});
 
