const CACHE_NAME = 'denarotrack-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/expenses.html',
    '/categories.html',
    '/goals.html',
    '/report.html',
    '/setting.html',
    '/period-selection.html',
    '/css/styles.css',
    '/js/bootstrap.js',
    '/js/theme.js',
    '/js/sidebar.js',
    '/js/utils.js',
    '/js/storage.js',
    '/js/audit.js',
    '/js/charts.js',
    '/js/dashboard.js',
    '/js/expenses.js',
    '/js/categories.js',
    '/js/goals.js',
    '/js/reports.js',
    '/js/settings.js',
    '/js/period.js',
    '/js/modal.js',
    '/images/icon-512.png',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
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
