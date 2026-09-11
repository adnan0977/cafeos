// CafeOS Service Worker v1.0.0
// Caches application shell for offline operations & handles Background Sync

const CACHE_NAME = 'cafeos-cache-v1';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/favicon.ico',
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Precache essential assets, don't fail entire install if some asset is missing in dev
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[ServiceWorker] Some assets failed to precache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate with Offline Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Exclude WebSocket or dev server hot reload requests
  if (request.url.includes('/@vite/') || request.url.includes('__vite_ping')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response immediately if available, while fetching fresh in background
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is for navigation, fallback to root cached index.html
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync Event (Standard W3C Background Sync API)
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync event triggered with tag:', event.tag);

  if (event.tag === 'cafeos-sync-queue' || event.tag === 'sync-transactions') {
    event.waitUntil(
      notifyClientsToSync()
    );
  }
});

// Helper to notify all open clients (windows/tabs) to drain their IndexedDB offline queue
async function notifyClientsToSync() {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) {
    client.postMessage({
      type: 'CAFEOS_TRIGGER_BACKGROUND_SYNC',
      source: 'service-worker-sync',
      timestamp: new Date().toISOString(),
    });
  }
}

// Message Listener for window communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'PING') {
    event.ports[0]?.postMessage({ status: 'PONG', version: CACHE_NAME });
  }

  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    notifyClientsToSync();
  }
});
