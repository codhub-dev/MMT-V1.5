const winston = require('winston');

// Console transport configuration with better formatting
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `${timestamp} [${level}] ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    })
  )
});

// Create logger instance with JSON format for structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'mmt-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    consoleTransport
  ]
});

// Only enable Papertrail if explicitly configured via environment variable
if (process.env.ENABLE_PAPERTRAIL === 'true') {
  const PapertrailHTTPSTransport = require('./papertrailHttpsTransport');

  // Papertrail HTTPS transport configuration
  const papertrailTransport = new PapertrailHTTPSTransport({
    endpoint: process.env.PAPERTRAIL_HTTPS_ENDPOINT,
    token: process.env.PAPERTRAIL_TOKEN
  });

  papertrailTransport.on('error', (err) => {
    // Silently fail - don't log verbose errors
  });

  // Try to add Papertrail transport, but don't crash if it fails
  try {
    logger.add(papertrailTransport);
    console.log('Papertrail HTTPS transport added successfully');
  } catch (err) {
    // Silently fail
  }
}

module.exports = logger;
