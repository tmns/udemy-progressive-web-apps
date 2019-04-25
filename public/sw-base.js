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

workboxSW.precache([]);

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