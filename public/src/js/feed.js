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
  createPostArea.style.display = 'block';
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
  createPostArea.style.display = 'none';
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

function createCard() {
  let cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  cardWrapper.style.margin = '0 auto';

  let cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';

  cardWrapper.appendChild(cardTitle);

  let cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = 'San Francisco Trip';
  cardTitle.appendChild(cardTitleTextElement);

  let cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = 'In San Francisco';
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

const url = 'https://httpbin.org/get';
let networkDataRecieved = false;

fetch(url).then(function(res) {
  return res.json();
}).then(function(data) {
  console.log('From web', data);
  networkDataRecieved = true;
  clearCards();
  createCard();
});

if ('caches' in window) {
  caches.match(url).then(function(res) {
    if (res) {
      return res.json()
    }
  }).then(function(data) {
    console.log('From cache', data);
    if (!networkDataRecieved) {
      clearCards();
      createCard();
    }
  });
}