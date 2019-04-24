importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'static1';
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
        .then(function (cache) {
            console.log('[Service Worker] Precaching App Shell');
            cache.addAll(STATIC_FILES);
        })
    )
});

self.addEventListener('activate', function (event) {
    console.log('[serviceWorker] Activating service worker...', event);
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                    console.log('[Service Worker] Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    // network only strategy for specific route here
    const url = 'https://pwagram-6e256.firebaseio.com/posts';
    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(
            // open & store in our dynamic cache
            // caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
            fetch(event.request).then(function (res) {
                // trimCache(CACHE_DYNAMIC_NAME, 20);
                // cache.put(event.request, res.clone());
                const clonedRes = res.clone();
                clearAllData('posts').then(function () {
                    return clonedRes.json();
                }).then(function (data) {
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
            caches.match(event.request).then(function (response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request).then(function (res) {
                        // open & store in our dynamic cache
                        caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                            // trimCache(CACHE_DYNAMIC_NAME, 20);
                            cache.put(event.request.url, res.clone());
                            return res;
                        })
                    })
                        .catch(function (err) {
                            // if we're offline and the user requests text/html resource, serve /offline.html
                            return caches.open(CACHE_STATIC_NAME).then(function (cache) {
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

self.addEventListener('sync', function (event) {
    console.log('[Service Worker] Background syncing', event);
    if (event.tag === 'sync-new-posts') {
        console.log('[Service Worker] Syncing new posts...');
        event.waitUntil(
            readAllData('sync-posts').then(function (data) {
                for (const dt of data) {
                    fetch('https://us-central1-pwagram-6e256.cloudfunctions.net/storePostData', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            id: dt.id,
                            title: dt.value,
                            location: dt.location,
                            image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-6e256.appspot.com/o/sf-boat.jpg?alt=media&token=b9580ef9-e0f6-4e89-bdf1-735b1be6e91e'
                        })
                    }).then(function (res) {
                        console.log('Sent data', res);
                        if (res.ok) {
                            res.json().then(function (resData) {
                                deleteItemFromData('sync-posts', resData.id);
                            })
                        }
                    }).catch(function (err) {
                        console.log('Error while sending data', err);
                    })
                }
            })
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    const notification = event.notification;
    const action = event.action;

    console.log(notification);

    if (action === 'confirm') {
        console.log('confirm was chosen');
    } else {
        console.log(action);
        event.waitUntil(
            clients.matchAll().then(function(clis) {
                const client = clis.find(function(c) {
                    return c.visibilityState === 'visible';
                });
                
                if (client !== undefined) {
                    client.navigate(notification.data.url);
                    client.focus();
                } else {
                    clients.openWindow(notification.data.url);
                }

                notification.close();
            })
        )
    }
})

self.addEventListener('notificationclose', function (event) {
    console.log('notification was closed', event);
})

self.addEventListener('push', function (event) {
    console.log('push notification received', event);

    let data = { title: 'Fallback Message', content: 'Something new happened!', openURL: '/help' };
    if (event.data) {
        data = JSON.parse(event.data.text()); 
    }

    const options = {
        body: data.content,
        icon: '/src/images/icons/apple-icon-96x96.png',
        badge: '/src/images/icons/apple-icon-96x96.png',
        data: {
            url: data.openURL
        }
    } 

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
})