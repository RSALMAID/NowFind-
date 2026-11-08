self.addEventListener('install', function(){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(self.clients.claim());
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
