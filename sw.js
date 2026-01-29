// FILE: service-worker.js
const CACHE_NAME = 'diitku-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Handle share target POST requests
  if (event.request.method === 'POST' && event.request.url.includes('/share')) {
    event.respondWith(
      event.request.formData().then((formData) => {
        const sharedData = {
          title: formData.get('title'),
          text: formData.get('text'),
          url: formData.get('url'),
          files: formData.getAll('files')
        };
        // Store shared data in IndexedDB or send to main thread
        return new Response(JSON.stringify({ success: true, data: sharedData }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Handle file handler requests
  if (event.request.url.includes('/handle-file')) {
    event.respondWith(
      new Response('File handled', { status: 200 })
    );
    return;
  }

  // Handle widget data requests
  if (event.request.url.includes('/widget-data')) {
    event.respondWith(
      new Response(JSON.stringify({
        balance: 0,
        income: 0,
        expense: 0
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }

  // Default cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
