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

// customize when & how the install banner is shown
let deferredPrompt;
let userAlreadyDeclined = false;
const btnAdd2HS = document.querySelector('.add2hs-button');

window.addEventListener('beforeinstallprompt', event => {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    if (!userAlreadyDeclined) {
        deferredPrompt = event;
        btnAdd2HS.style.display = 'block';
    }
});

btnAdd2HS.addEventListener('click', event => {
    btnAdd2HS.style.display = 'none';
    deferredPrompt.prompt();
    deferredPrompt.userChoice
        .then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted A2HS prompt');
            } else {
                console.log('User dismissed A2HS prompt');
                userAlreadyDeclined = true;
            }
            deferredPrompt = null;
        });
});