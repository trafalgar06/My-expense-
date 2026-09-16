const CACHE_VERSION = 'v21';
const CACHE_NAME = 'denarotrack-' + CACHE_VERSION;
// Relative to the service worker's own location, not the domain root —
// see the matching fix in bootstrap.js's register() call. Absolute paths
// here would try to fetch e.g. https://<host>/dashboard.html even when
// the app actually lives at https://<host>/My-expense-/dashboard.html,
// which 404s under any subpath deployment and fails the whole
// cache.addAll() (it's all-or-nothing), so the app silently never got
// offline support.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './dashboard.html',
    './expenses.html',
    './report.html',
    './setting.html',
    './css/styles.css',
    './js/bootstrap.js',
    './js/theme.js',
    './js/sidebar.js',
    './js/utils.js',
    './js/storage.js',
    './js/audit.js',
    './js/charts.js',
    './js/dashboard.js',
    './js/expenses.js',
    './js/reports.js',
    './js/settings.js',
    './js/modal.js',
    './images/icon-512.png'
];
// Cached separately: cache.addAll() aborts entirely if any single
// request fails, and these are third-party CDN requests outside our
// control (network hiccup, ad-blocker, CDN downtime). One of these
// failing used to take the whole app-shell cache down with it, so a
// flaky CDN request during install could silently cost the entire PWA
// its offline support, not just the chart.
const OPTIONAL_ASSETS_TO_CACHE = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE).then(() =>
                Promise.allSettled(
                    OPTIONAL_ASSETS_TO_CACHE.map((url) =>
                        cache.add(url).catch((err) =>
                            console.warn('SW: optional asset failed to cache', url, err)
                        )
                    )
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('SW: Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Bypass caching for localhost development
    const url = new URL(event.request.url);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache-first strategy for static assets, Network-first for everything else could be complex.
    // Let's use Stale-While-Revalidate for most things for simplicity and freshness.

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Cache the new response
                if (event.request.method === 'GET' && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});
