let sharedMomentsArea = document.querySelector('#shared-moments');
let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');

// example of unregistering service workers
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then(function(registrations) {
//     for (let i = 0; i < registrations.length; i++) {
//       registrations[i].unregister();
//     }
//   });
// }

function openCreatePostModal() {
  createPostArea.style.transform = 'translateY(0)';
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);
      if (choiceResult.outcome === 'dismissed') {
        console.log('user cancelled installation');
      } else {
        console.log('user added app to home screen');
      }
    });
    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// an example of caching on event (eg when a user clicks a button to 'save' an article)
// function onSaveButtonClick() {
//   if ('caches' in window) {
//     caches.open('user-requested').then(function(cache) {
//       cache.add('https://httpbin.org/get');
//       cache.add('/src/images/sf-boat.jpg');
//     })
//   }
// }

function createCard(data) {
  let cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

  let cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = 'cover';

  cardWrapper.appendChild(cardTitle);

  let cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);

  let cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';

  // let cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClick);
  // cardSupportingText.appendChild(cardSaveButton);

  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function updateUI(data) {
  clearCards();

  let dataArray = [];
  if (!Array.isArray(data)) {
    for (const key in data) {
      dataArray.push(data[key]);
    }
  } else {
    dataArray = data.slice(0); // or [...data] or Array.from(data) or...
  }

  for (let i = 0; i < dataArray.length; i++) {
    createCard(dataArray[i]);
  }
}

const url = 'https://pwagram-6e256.firebaseio.com/posts.json';
let networkDataRecieved = false;

fetch(url).then(function(res) {
  return res.json();
}).then(function(data) {
  console.log('From web', data);
  networkDataRecieved = true;
  updateUI(data);
});

if ('indexedDB' in window) {
  readAllData('posts').then(function(data) {
    if (!networkDataRecieved) {
      console.log('From indexeddb', data)
      updateUI(data);
    }
  })
} 

// legacy code for chaching dynamic data (before use of indexeddb)
// if ('caches' in window) {
//   caches.match(url).then(function(res) {
//     if (res) {
//       return res.json()
//     }
//   }).then(function(data) {
//     console.log('From cache', data);
//     if (!networkDataRecieved) {
//       updateUI(data);
//     }
//   });
// }