/* eslint-disable no-await-in-loop */
var admin = require('firebase-admin');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

var serviceAccount = require('../onsnapshot-failure-firebase-adminsdk-8lgrq-432cce62be.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://onsnapshot-failure.firebaseio.com',
});

const firestore = admin.firestore();
const listeningToCollection = firestore.collection('listeningTo');

function randomString(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function run() {
  let batch = firestore.batch();
  let batchCount = 0;
  for (let i = 0; i < 5000; i++) {
    batchCount++;
    const listeningTo = {
      segmentId: `segment_${(i % 3) + 1}`,
      channelId: `channel_${(i % 50) + 1}`,
      uid: randomString(15),
      listening: Math.random() > 0.5,
    };
    batch.set(listeningToCollection.doc(`${listeningTo.channelId}_${listeningTo.uid}`), listeningTo);

    if (batchCount > 300) {
      await batch.commit();
      await delay(1000);
      batch = firestore.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }
}

run()
  .then((_) => {
    console.log('Done');
    process.exit(0);
    return;
  })
  .catch((err) => {
    console.error('Error: ', err);
    process.exit(1);
  });
