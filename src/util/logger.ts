import winston from 'winston';
import pmx from '@pm2/io';
const alignedWithColorsAndTime = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.align(),
  winston.format.printf(info => {
    let ts = JSON.stringify(info.timestamp, null, 2) ;
    // if (info.timestamp) {
    //   try {
    //     ts = info.timestamp.slice(0, 19).replace('T', ' ');
    //   } catch (error) {
    //     ts = JSON.stringify(info.timestamp, null, 2) 
    //   }
    // }
    return `${ts} [${info.level}]: ${info.message} ${Object.keys(info.metadata).length ? JSON.stringify(info.metadata, null, 2) : ''}`;
  })
  // winston.format.json()
);
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: alignedWithColorsAndTime
});
const options: winston.LoggerOptions = {
  transports: [consoleTransport]
};

const logger = winston.createLogger(options);

if (process.env.NODE_ENV !== 'production') {
  logger.debug('Logging initialized at debug level');
} else {
  logger.error('Starting in production mode');
}

pmx.action('logLevel', (param: string, reply: Function) => {
  console.log(`Setting log level to: ${param}`);
  consoleTransport.level = param;
  reply(`Set log level to: ${param}`);
});

export default logger;
