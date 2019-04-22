self.addEventListener('fetch', event => {
    console.log('[serviceWorker] Fetching something worker...', event);
    event.respondWith(fetch(event.request));
});

window.addEventListener('beforeinstallprompt', function(event) {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;
    return false;
})