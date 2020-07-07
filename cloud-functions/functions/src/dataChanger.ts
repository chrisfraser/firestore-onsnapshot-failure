import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const dataChanger = functions.pubsub.schedule('* * * * *').onRun(async () => {
  const firestore = admin.firestore();
  await firestore.collection('pingOfDeath').doc('didYouMissMe').set({ itsOk: new Date().valueOf() });
});
