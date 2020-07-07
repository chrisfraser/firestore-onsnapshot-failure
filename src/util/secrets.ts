import logger from './logger';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) {
  logger.debug('Using .env file to supply config environment variables');
  dotenv.config({ path: '.env' });
} else {
  logger.debug('Using .env.example file to supply config environment variables');
  dotenv.config({ path: '.env.example' }); // you can delete this after you create your own .env file!
}

export const ENVIRONMENT = process.env.NODE_ENV;
logger.debug(`Current Environment: ${ENVIRONMENT}`);

export const SEGMENT_ID = process.env['SEGMENT_ID'] || '';

export const FIREBASE_DATABASE_URL = process.env['FIREBASE_DATABASE_URL'] || '';
export const FIREBASE_PROJECT_ID = process.env['FIREBASE_PROJECT_ID'] || '';
export const FIREBASE_CLIENT_EMAIL = process.env['FIREBASE_CLIENT_EMAIL'] || '';
export const FIREBASE_PRIVATE_KEY = process.env['FIREBASE_PRIVATE_KEY'] || '';

export const DUMP_DIR = process.env['DUMP_DIR'] || './dump/';

if (!SEGMENT_ID) {
  logger.error('No SEGMENT_ID. Set SEGMENT_ID environment variable.');
  process.exit(1);
}

if (!FIREBASE_DATABASE_URL) {
  logger.error('No FIREBASE_DATABASE_URL. Set FIREBASE_DATABASE_URL environment variable.');
  process.exit(1);
}

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  logger.error('No FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL OR FIREBASE_PRIVATE_KEY . Set in environment variable.');
  process.exit(1);
}
