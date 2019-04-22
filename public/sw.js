const CACHE_STATIC_NAME = 'static-v4';
const CACHE_DYNAMIC_NAME = 'dynamic'

self.addEventListener('install', event => {
    console.log('[serviceWorker] Installing service worker...', event);
    // we use waitUntil to ensure cache is opened before we begin fetching
    event.waitUntil(caches.open(CACHE_STATIC_NAME)
        .then(function(cache) {
            console.log('[Service Worker] Precaching App Shell');
            cache.addAll([
                '/',
                '/index.html',
                '/src/js/app.js',
                '/src/js/feed.js',
                '/src/js/promise.js',
                '/src/js/fetch.js',
                '/src/js/material.min.js',
                '/src/css/app.css',
                '/src/css/feed.css',
                '/src/images/main-image.jpg',
                'https://fonts.googleapis.com/css?family=Roboto:400,700',
                'https://fonts.googleapis.com/icon?family=Material+Icons',
                'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
            ]);
        })
    ) 
});

self.addEventListener('activate', function(event) {
    console.log('[serviceWorker] Activating service worker...', event);
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                    console.log('[Service Worker] Removing old cache:', key);
                    return caches.delete(key);
                } 
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            } else {
                return fetch(event.request).then(function(res) {
                    // open our dynamic cache
                    caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
                        cache.put(event.request.url, res.clone())
                        return res;
                    })
                })
                .catch(function(err) {
                    console.log(err);
                })
            }
        })
    );
});
