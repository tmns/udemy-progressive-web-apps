self.addEventListener('install', event => {
    console.log('[serviceWorker] Installing service worker...', event);
});

self.addEventListener('activate', function(event) {
    console.log('[serviceWorker] Activating service worker...', event);
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    console.log('[serviceWorker] Fetching something worker...', event);
    event.respondWith(fetch(event.request));
});
