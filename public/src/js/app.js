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

// notifications logic
const enableNotificationButtons = document.querySelectorAll('.enable-notifications');

function displayConfirmNotification() {
    if ('serviceWorker' in navigator) {
        const options = {
            body: 'You successfully subscribed to our notification service!',
            icon: '/src/images/icons/app-icon-96x96.png',
            vibrate: [100, 50, 200],
            badge: '/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            actions: [
                { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
                { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
            ]
        }
        navigator.serviceWorker.ready.then(function(swreg) {
            swreg.showNotification('Successfully subscribed!', options);
        })
    }
}

function configurePushSub() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    let reg;
    navigator.serviceWorker.ready.then(function(swreg) {
        reg = swreg;
        return swreg.pushManager.getSubscription();
    }).then(function(sub) {
        if (sub === null) {
            // create a new sub
            const vapidPubKey = 'BDV8RWTkrIu4ZOQ_NJCtNrS_E4nq9dsRxaYo3j72uP00GsyK8Z1_wZTZ90oN2fUeQVopOiTsLcH_dwseLEIfNQo';
            const convertedVapidPubKey = urlBase64ToUint8Array(vapidPubKey);
            return reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidPubKey
            });
        } else {
            // we already have one
        }
    }).then(function(newSub) {
        return fetch('https://pwagram-6e256.firebaseio.com/subscriptions.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(newSub)
        })
    }).then(function(res) {
        if (res.ok) {
            displayConfirmNotification();
        }
    }).catch(function(err) {
        console.log(err);
    })

}

function askForNotificationPermission() {
    Notification.requestPermission(function(result) {
        console.log('User choice', result);
        if (result !== 'granted') {
            console.log('User did not grant notification permissions');
        } else {
            configurePushSub();
            // displayConfirmNotification();
        }
    })
}

if ('Notification' in window && 'serviceWorker' in navigator) {
    for (let i = 0; i < enableNotificationButtons.length; i++) {
        enableNotificationButtons[i].style.display = 'block';
        enableNotificationButtons[i].addEventListener('click', askForNotificationPermission);
    }
}