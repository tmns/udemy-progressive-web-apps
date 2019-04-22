// check if we need to use polyfill
if (!window.Promise) {
    window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    .then(function() {
        console.log('serviceWorker registered')
    })
    .catch(function(error) {
        console.log(error);
    });
}

// customize when the install banner is shown
window.addEventListener('beforeinstallprompt', function(event) {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;
    return false;
})