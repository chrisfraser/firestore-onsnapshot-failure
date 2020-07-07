import winston from 'winston';
const alignedWithColorsAndTime = winston.format.combine(
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(info => {
    const { timestamp, level, message, ...args } = info;

    const ts = timestamp.slice(0, 19).replace('T', ' ');
    return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
  })
);

const options: winston.LoggerOptions = {
  transports: [
    new winston.transports.File({
      format: winston.format.printf(info => info.message),
      filename: 'firestore.log',
      level: 'debug'
    })
  ]
};

const firestoreLogger = winston.createLogger(options);

export default firestoreLogger;