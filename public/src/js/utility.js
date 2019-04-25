const dbPromise = idb.open('posts-store', 1, function (db) {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', { keyPath: 'id' })
    }
});


function writeData(st, data) {
    return dbPromise.then(function (db) {
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.put(data);
        return tx.complete;
    })
}

function readAllData(st) {
    return dbPromise.then(function (db) {
        const tx = db.transaction(st, 'readonly');
        const store = tx.objectStore(st);
        return store.getAll();
    })
}

function clearAllData(st) {
    return dbPromise.then(function (db) {
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.clear();
        return tx.complete;
    })
}

function deleteItemFromData(st, id) {
    return dbPromise.then(function (db) {
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.delete(id);
        return tx.complete;
    }).then(function () {
        console.log('Item deleted.');
    })
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});
    return blob;
  }