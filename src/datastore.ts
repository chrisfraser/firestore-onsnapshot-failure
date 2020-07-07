import * as admin from 'firebase-admin';

import { ListeningTo } from './models/listening-to';
import { timer, Subscription } from 'rxjs';
import { map, repeat } from 'rxjs/operators';
import firestoreLogger from './util/firestoreLogger';
import logger from './util/logger';

const NO_UPDATE_THRESHOLD: number = 3;

export class Datastore {
  firestore: FirebaseFirestore.Firestore;
  listeningTos: Map<string, ListeningTo> = new Map();

  listeningToSubscription?: Function;

  private _changeCounterMonitor?: Subscription;
  private _testListeningTo: ListeningTo;
  private _noUpdateCounter: number = 0;
  listeningToChangeCounter: number = 0;

  constructor(private segmentId: string, databaseURL: string, projectId: string, clientEmail: string, privateKey: string) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: databaseURL,
    });

    admin.firestore.setLogFunction((msg) => {
      if (msg.includes('RST_STREAM')) {
        logger.error('Firestore Error RST_STREAM: ', msg);
      }

      firestoreLogger.debug(msg);
    });

    this.firestore = admin.firestore();

    const testUid = `---testUser_${segmentId}`;
    this._testListeningTo = new ListeningTo({
      id: `${testUid}_test`,
      segmentId: segmentId,
      channelId: 'test',
      uid: testUid,
      listening: false,
    });

    logger.warn(`testListeningTo Id: ${this._testListeningTo.id}`);
  }

  start() {

    const listeningToQuery = this.firestore.collection('listeningTo').where('segmentId', '==', this.segmentId);

    this.listeningToSubscription = listeningToQuery.onSnapshot(
      (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          this.listeningToChangeCounter++;
          const listeningTo = ListeningTo.fromSnapshot(change.doc.id, change.doc.data());
          if (listeningTo.uid === this._testListeningTo.uid) {
            logger.warn(`testListeningTo updated: ${this._testListeningTo.uid} -> ${listeningTo.listening}`);
            this._testListeningTo = listeningTo;
          } else {
            if (change.type === 'added' || change.type === 'modified') {
              this.updateListeningTo(listeningTo);
            }
            if (change.type === 'removed') {
              this.removeListeningTo(listeningTo);
            }
          }
        });
      },
      (error) => {
        logger.error('Error in listeningToSubscription: ', error);
      }
    );
  }


  updateListeningTo(listeningTo: ListeningTo) {
    try {
      this.listeningTos.set(listeningTo.id, listeningTo);
    } catch (error) {
      logger.error('Error in updateListeningTo: ', error);
    }
  }

  removeListeningTo(listeningTo: ListeningTo) {
    logger.debug(`removeListeningTo: ${JSON.stringify(listeningTo, null, 2)}`);
    try {
      this.listeningTos.delete(listeningTo.id);

    } catch (error) {
      logger.error('Error in removeListeningTo: ', error);
    }
  }

  startChangeCounterMonitoring() {
    this._changeCounterMonitor = timer(60000)
      .pipe(
        map(async () => {
          logger.warn(`================================================`);
          logger.warn(`listeningToChanges: ${this.listeningToChangeCounter}`);

          // Test updates if we have not got one for a bit
          if (this.listeningToChangeCounter == 0) {
            this._noUpdateCounter++;
            if (this._noUpdateCounter == NO_UPDATE_THRESHOLD) {
              try {
                logger.warn('noUpdateThreshold reached, setting test data');
                await this.sendDummyData();
              } catch (error) {
                logger.error('Error setting test data');
                logger.error('Error: ', error);
                setTimeout(() => {
                  process.exit(1);
                }, 2000);
              }
            }
            if (this._noUpdateCounter > NO_UPDATE_THRESHOLD + 1) {
              logger.error('Error: noUpdateThreshold exceeded, restarting server');
              setTimeout(() => {
                process.exit(1);
              }, 2000);
            }
          } else {
            this._noUpdateCounter = 0;
          }

          this.listeningToChangeCounter = 0;
        }),
        repeat()
      )
      .subscribe(
        () => {},
        (error) => {
          logger.error('Error in ChangeCounterMonitoring', error);
        }
      );
  }

  stopChangeCounterMonitoring() {
    logger.warn('stopChangeCounterMonitoring');
    if (this._changeCounterMonitor) {
      this._changeCounterMonitor.unsubscribe();
    }
  }

  async sendDummyData() {
    await this.firestore.collection('listeningTo').doc(this._testListeningTo.id).set({
      segmentId: this._testListeningTo.segmentId,
      channelId: this._testListeningTo.channelId,
      uid: this._testListeningTo.uid,
      listening: !this._testListeningTo.listening,
    });
  }

  dumpData(timestamp: number, result: Map<string, any>) {
    const listeningTos = [...this.listeningTos.values()].map((l) => l.toJson());
    result.set(`datastore_listeningTos_${timestamp}.json`, listeningTos);
  }
}
