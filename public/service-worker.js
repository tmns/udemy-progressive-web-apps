importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new WorkboxSW();

workboxSW.router.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, workboxSW.strategies
    .staleWhileRevalidate({
        cacheName: 'google-fonts',
        cacheExpiration: {
            maxEntries: 3,
            maxAgeSeconds: 60 * 60 * 24 * 30
        }
    })
);

workboxSW.router.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', workboxSW.strategies
    .staleWhileRevalidate({
        cacheName: 'material-css'
    })
);

workboxSW.router.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, workboxSW.strategies
    .staleWhileRevalidate({
        cacheName: 'post-images'
    })
);

workboxSW.router.registerRoute('https://pwagram-6e256.firebaseio.com/posts.json', args => {
    return fetch(args.event.request).then(res => {
        const clonedRes = res.clone();
        clearAllData('posts').then(() => {
            return clonedRes.json();
        }).then(data => {
            for (const key in data) {
                writeData('posts', data[key]);
            }
        })
        return res;
    })
})

workboxSW.router.registerRoute(routeData => {
    return (routeData.event.request.headers.get('accept').includes('text/html'));
}, args => {
    return caches.match(args.event.request).then(response => {
        if (response) {
            return response;
        } else {
            return fetch(args.event.request).then(res => {
                // open & store in our dynamic cache
                return caches.open('dynamic').then(cache => {
                    // trimCache(CACHE_DYNAMIC_NAME, 20);
                    cache.put(args.event.request.url, res.clone());
                    return res;
                })
            })
            .catch(err => {
                // if we're offline and the user requests text/html resource, serve /offline.html
                return caches.match('/offline.html').then(res => {
                    return res;
                })
            })
        }
    })
})

workboxSW.precache([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "a27267c701179c934ac938bb6bbac7d9"
  },
  {
    "url": "manifest.json",
    "revision": "4a36f63faa8d7cd83276e410c8e25e6e"
  },
  {
    "url": "offline.html",
    "revision": "7d65cf25645d9626ce0dadb3c989bfec"
  },
  {
    "url": "service-worker.js",
    "revision": "7f4e11e53c23cff573b53b8c61e27839"
  },
  {
    "url": "src/css/app.css",
    "revision": "976f0e698894d10b02b26e3783e65595"
  },
  {
    "url": "src/css/feed.css",
    "revision": "a1c5fef23bae607a38ecbed5c6019cd6"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "7312962a8e48da449c75a17d0c210feb"
  },
  {
    "url": "src/js/feed.js",
    "revision": "3917bbf7ed550c17af4190f4b03df0e1"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "2dc7d84dfc9665b641cc36819e1e5ca7"
  },
  {
    "url": "sw-base.js",
    "revision": "c2882c24ff5f7025edf2fa2734dacf2e"
  },
  {
    "url": "sw.js",
    "revision": "a071c426df89b3fb6d2dec38d5796feb"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "1ab6d9fb18524de1548d1babd9db9846"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

// background sync and push logic

self.addEventListener('sync', function (event) {
    console.log('[Service Worker] Background syncing', event);
    if (event.tag === 'sync-new-posts') {
        console.log('[Service Worker] Syncing new posts...');
        event.waitUntil(
            readAllData('sync-posts').then(function (data) {
                for (const dt of data) {

                    const postData = new FormData();
                    postData.append('id', dt.id);
                    postData.append('title', dt.title);
                    postData.append('location', dt.location);
                    postData.append('file', dt.picture, dt.id + '.png')
                    poostData.append('rawLocationLat', dt.rawLocation.lat);
                    poostData.append('rawLocationLng', dt.rawLocation.lng);

                    fetch('https://us-central1-pwagram-6e256.cloudfunctions.net/storePostData', {
                        method: 'POST',
                        body: postData
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