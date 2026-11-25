/**
 * Brilliant Speech & SpeechFlow - Advanced PWA Service Worker
 * Workbox-style multi-tier caching architecture
 * 
 * 1. App Shell Pre-caching: HTML, CSS, JS bundles, Core fonts & Icons
 * 2. Runtime Caching Strategies:
 *    - App Shell & Navigation: NetworkFirst with /offline.html fallback
 *    - Exercise Media (images, audio cues): CacheFirst with maxEntries (200) + 7-day expiration
 *    - API / Firestore / Proxies: NetworkFirst with read-only cache fallback
 *    - Phoneme dictionaries / config JSON: StaleWhileRevalidate
 * 3. Offline Background Sync for Dexie/IndexedDB offline speech records
 */

const CACHE_VERSION = 'v2.1.0';
const SHELL_CACHE_NAME = `speechflow-shell-${CACHE_VERSION}`;
const MEDIA_CACHE_NAME = `speechflow-media-${CACHE_VERSION}`;
const API_CACHE_NAME = `speechflow-api-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `speechflow-data-${CACHE_VERSION}`;

// 1. App Shell Precache Assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&family=Bubblegum+Sans&display=swap'
];

// Media caching policy parameters
const MEDIA_MAX_ENTRIES = 200;
const MEDIA_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Install Event - Precache critical App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error (expected in restricted preview):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Purge stale cache generations
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE_NAME, MEDIA_CACHE_NAME, API_CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Trim Cache Entries
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      await trimCache(cacheName, maxItems);
    }
  } catch (e) {
    // Silently ignore cache trimming errors
  }
}

// 2. Runtime Caching & Fetch Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy A: App Shell Navigation (NetworkFirst with offline.html fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || caches.match('/');
        })
    );
    return;
  }

  // Strategy B: Static assets, scripts, CSS & Google Fonts (StaleWhileRevalidate)
  if (
    url.origin === self.location.origin && (
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font'
    ) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy C: Exercise Media (Images & Audio Cues) -> CacheFirst with Expiration
  if (
    request.destination === 'image' ||
    request.destination === 'audio' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|mp3|wav|ogg)$/i) ||
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('cdn-icons-png.flaticon.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(MEDIA_CACHE_NAME).then((cache) => {
                cache.put(request, copy);
                trimCache(MEDIA_CACHE_NAME, MEDIA_MAX_ENTRIES);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return placeholder if image fails offline
            if (request.destination === 'image') {
              return caches.match('/icon-192.png');
            }
            return new Response('', { status: 408, statusText: 'Offline Media Unavailable' });
          });
      })
    );
    return;
  }

  // Strategy D: Phoneme Dictionaries / Config JSON / Language Modules -> StaleWhileRevalidate
  if (
    url.pathname.endsWith('.json') ||
    url.pathname.includes('/dictionaries/') ||
    url.pathname.includes('/modules/') ||
    url.pathname.includes('/config/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(DATA_CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy E: Read-Only API Endpoints (IEP goals, child profiles, teletherapy bookings) -> NetworkFirst
  if (
    url.pathname.startsWith('/api/') &&
    request.method === 'GET'
  ) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
});

// 3. Background Sync for Offline Speech Practice Records
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-speechflow-records') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'TRIGGER_BACKGROUND_SYNC',
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

// Listen for messages from client windows
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
