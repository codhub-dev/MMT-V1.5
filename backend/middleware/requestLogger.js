const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');

/**
 * Middleware to log all incoming HTTP requests
 * Provides comprehensive logging for monitoring and debugging
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log incoming request
    logger.info('Incoming request', getFullContext(req, {
        body: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
            ? Object.keys(req.body || {}).length > 0
                ? 'present'
                : 'empty'
            : undefined
    }));

    // Capture response logging
    const originalSend = res.send;
    const originalJson = res.json;

    // Override res.send to log response
    res.send = function(data) {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            username: req.username || req.user?.username
        });
        originalSend.call(this, data);
    };

    // Override res.json to log response
    res.json = function(data) {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            username: req.username || req.user?.username
        });
        originalJson.call(this, data);
    };

    // Handle errors in response
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            const duration = Date.now() - startTime;
            logger.warn('Request completed with error', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                username: req.username || req.user?.username,
                ip: req.ip
            });
        }
    });

    next();
};

module.exports = requestLogger;
