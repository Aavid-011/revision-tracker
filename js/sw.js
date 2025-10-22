const CACHE_NAME = 'revision-tracker-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/analytics.html',
    '/css/style.css',
    '/js/script.js',
    '/js/analytics.js',
    '/js/notification.js',
    '/manifest.json',
    '/subjects/economics.json',
    '/subjects/statistical.json',
    '/subjects/history.json',
    '/subjects/communication.json',
    '/subjects/disaster.json',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install a service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Cache and return requests
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Update a service worker
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});