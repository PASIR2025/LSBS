self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('calc-v1').then(function(cache) {
      return cache.addAll([
        '/',
        'index.html',
        'manifest.json',
        'service-worker.js',
        'imagenes/logo.png',
        'imagenes/itm.png',
        'imagenes/contactor.png',
        'imagenes/rele.png',
        'imagenes/motor.png',
        'imagenes/diferencial.png'
      ]);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});