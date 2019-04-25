const sharedMomentsArea = document.querySelector('#shared-moments');
const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');

// example of unregistering service workers
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then(function(registrations) {
//     for (let i = 0; i < registrations.length; i++) {
//       registrations[i].unregister();
//     }
//   });
// }

let fetchedLocation = { lat: 0, lng: 0 };
let sawAlert;
locationBtn.addEventListener('click', event => {
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(position => {
    locationBtn.style.display = 'none';
    locationLoader.style.display = 'none';
    // dummy data, should use a geo api for real app
    fetchedLocation = { lat: position.coords.latitude, lng: 0 };
    locationInput.value = 'In Athens';
    document.querySelector('#manual-location').classList.add('is-focused');
  }, err => {
    console.log(err);
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    if (!sawAlert) {
      alert('We couldn\'t find your location, please enter manually!');
      sawAlert = true;
    }
    fetchedLocation = { lat: 0, lng: 0 };
  }, { timeout: 5000 });
})

function initializeLocation() {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
}

function initializeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  // custom polyfill for browsers that dont support getUserMedia
  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      })
    }
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(function (err) {
      imagePickerArea.style.display = 'block';
    })
}

let picture;
captureButton.addEventListener('click', function (event) {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';

  const context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));

  videoPlayer.srcObject.getVideoTracks().forEach(track => track.stop());

  picture = dataURItoBlob(canvasElement.toDataURL());
})

imagePicker.addEventListener('change', (event) => {
  picture = event.target.files[0];
})

function openCreatePostModal() {
  captureButton.style.display = 'block';
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);
  initializeMedia();
  initializeLocation();
  // if (deferredPrompt) {
  //   deferredPrompt.prompt();
  //   deferredPrompt.userChoice.then(function(choiceResult) {
  //     console.log(choiceResult.outcome);
  //     if (choiceResult.outcome === 'dismissed') {
  //       console.log('user cancelled installation');
  //     } else {
  //       console.log('user added app to home screen');
  //     }
  //   });
  //   deferredPrompt = null;
  // }
}

function closeCreatePostModal() {
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(track => {
      track.stop();
    })
  }
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(100vh)';    
  }, 1)
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
  while (sharedMomentsArea.hasChildNodes()) {
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

fetch(url).then(function (res) {
  return res.json();
}).then(function (data) {
  console.log('From web', data);
  networkDataRecieved = true;
  updateUI(data);
});

if ('indexedDB' in window) {
  readAllData('posts').then(function (data) {
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

function sendData() {

  const id = new Date().toISOString();
  const postData = new FormData();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('file', picture, id + '.png');
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);

  fetch('https://us-central1-pwagram-6e256.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData
  }).then(function (res) {
    console.log('Sent data', res);
    updateUI();
  })
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please Enter Valid Data')
    return;
  }

  closeCreatePostModal();

  if ('serviceworker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(function (sw) {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
      };
      writeData('sync-posts', post).then(function () {
        return sw.sync.register('sync-new-posts');
      }).then(function () {
        const snackbarContainer = document.querySelector('#confirmation-toast');
        const data = { message: 'Your post has been saved for syncing!' };
        snackbarContainer.MaterialSnackbar.showShackbar(data);
      }).catch(function (err) {
        console.log(err);
      })
    });
  } else {
    sendData();
  }

});

