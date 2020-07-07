'use strict';
import logger from './util/logger';
import { Datastore } from './datastore';
import { SEGMENT_ID, FIREBASE_DATABASE_URL, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, DUMP_DIR } from './util/secrets';
import pmx from '@pm2/io';

import fs from 'fs-extra';

let datastore: Datastore;

function main(): void {
  console.log('Starting with segment: ' + SEGMENT_ID);

  datastore = new Datastore(SEGMENT_ID, FIREBASE_DATABASE_URL, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY);

  datastore.start();
  datastore.startChangeCounterMonitoring();
}

pmx.action('dump', (param: string, reply: Function) => {
  fs.pathExists(DUMP_DIR)
    .then((exists) => {
      if (!exists) {
        return fs.mkdirp(DUMP_DIR);
      }
      return;
    })
    .then((_) => {
      logger.warn('Dumping config to ' + DUMP_DIR);
      const timestamp = new Date().valueOf();
      const result = new Map<string, any>();

      datastore.dumpData(timestamp, result);

      Array.from(result.entries()).forEach(([file, data]) => {
        fs.writeFile(DUMP_DIR + file, JSON.stringify(data, null, 2), { encoding: 'utf-8' }, (err) => {
          if (err) {
            logger.error(`Error in writing file: `, err);
          } else {
            logger.warn(`Wrote file: ${file}.json`);
          }
        });
      });
    });

  reply('Dumping config to ' + DUMP_DIR);
});

function exitHandler(options: any) {
  logger.error('Server exitHandler', options);
  if (options.exit) {
    if (options.error) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

process.stdin.resume(); //so the program will not close instantly

process.on('exit', (code) => {
  logger.info(`Server exited with code '${code}.`);
});

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { reason: 'SIGINT', exit: true }));
process.on('SIGTERM', exitHandler.bind(null, { reason: 'SIGTERM', exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { reason: 'SIGUSR1', exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { reason: 'SIGUSR2', exit: true }));

// Deal with warnings
process.on('warning', (warning) => {
  logger.warn(`Warning: ${warning.name}, Message: ${warning.message}`); // Print the warning name
  logger.warn('Warning: ', warning.stack); // Print the stack trace
});

//catches uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception in index thrown', err);
  exitHandler.bind(null, { reason: 'uncaughtException', error: err, exit: true });
});

main();
