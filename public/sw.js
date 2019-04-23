importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'staticv';
const CACHE_DYNAMIC_NAME = 'dynamic';

const STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/idb.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'   
];

// example function for enforcing a limit on the # of dynamically cached items
// function trimCache(cacheName, maxItems) {
//     caches.open(cacheName).then(function(cache) {
//         return cache.keys().then(function(keys) {
//             if (keys.length > maxItems) {
//                 cache.delete(keys[0]).then(trimCache(cacheName, maxItems))
//             }
//         })
//     })
// }

self.addEventListener('install', event => {
    console.log('[serviceWorker] Installing service worker...', event);
    // we use waitUntil to ensure cache is opened before we begin fetching
    event.waitUntil(caches.open(CACHE_STATIC_NAME)
        .then(function(cache) {
            console.log('[Service Worker] Precaching App Shell');
            cache.addAll(STATIC_FILES);
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
    // network only strategy for specific route here
    const url = 'https://pwagram-6e256.firebaseio.com/posts';
    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(
            // open & store in our dynamic cache
            // caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
            fetch(event.request).then(function(res) {
                // trimCache(CACHE_DYNAMIC_NAME, 20);
                // cache.put(event.request, res.clone());
                const clonedRes = res.clone();
                clearAllData('posts').then(function() {
                    return clonedRes.json();                    
                }).then(function(data) {
                    for (const key in data) {
                        writeData('posts', data[key]);
                    }
                })
                return res;
            })
        )
    } else if (STATIC_FILES.includes(event.request.url)) {
        // cache only strategy here (for our staticly cached files)
        event.respondWith(caches.match(event.request));
    } else {
        // cache then network strategy here
        event.respondWith(
            caches.match(event.request).then(function(response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request).then(function(res) {
                        // open & store in our dynamic cache
                        caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
                            // trimCache(CACHE_DYNAMIC_NAME, 20);
                            cache.put(event.request.url, res.clone());
                            return res;
                        })
                    })
                    .catch(function(err) {
                        // if we're offline and the user requests text/html resource, serve /offline.html
                        return caches.open(CACHE_STATIC_NAME).then(function(cache) {
                            if (event.request.headers.get('accept').includes('text/html')) {
                                return cache.match('/offline.html');
                            }
                        })
                    })
                }
            })
        )
    }
});
