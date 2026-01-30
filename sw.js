// FILE: service-worker.js
const CACHE_NAME = 'diitku-v2';
const STATIC_CACHE = 'diitku-static-v2';
const DYNAMIC_CACHE = 'diitku-dynamic-v2';
const API_CACHE = 'diitku-api-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'Notifikasi dari Diitku',
    icon: 'icons/Diitku.jpg',
    badge: 'icons/Diitku.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Lihat Detail',
        icon: 'icons/Diitku.jpg'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Diitku', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'explore') {
    // Open the app and navigate to relevant page
    event.waitUntil(
      clients.openWindow('./?tab=dashboard')
    );
  } else {
    // Default action: open the app
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

// Function to sync pending transactions
async function syncPendingTransactions() {
  try {
    // Get pending transactions from IndexedDB
    const pendingTransactions = await getPendingTransactions();

    for (const transaction of pendingTransactions) {
      try {
        // Attempt to sync with server (in a real app, this would be an API call)
        await syncTransactionToServer(transaction);
        // Remove from pending if successful
        await removePendingTransaction(transaction.id);
      } catch (error) {
        console.error('Failed to sync transaction:', transaction.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
function getPendingTransactions() {
  // In a real implementation, this would query IndexedDB
  return Promise.resolve([]);
}

function syncTransactionToServer(transaction) {
  // In a real implementation, this would make an API call
  return Promise.resolve();
}

function removePendingTransaction(id) {
  // In a real implementation, this would remove from IndexedDB
  return Promise.resolve();
}

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

  // Handle goals widget data requests
  if (event.request.url.includes('/widget-goals-data')) {
    event.respondWith(
      new Response(JSON.stringify({
        goals: [],
        totalGoals: 0,
        completedGoals: 0
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
