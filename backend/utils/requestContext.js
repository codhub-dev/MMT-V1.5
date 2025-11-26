/**
 * Utility to extract contextual information from HTTP requests for logging
 */

/**
 * Extracts user information from the request
 * @param {Object} req - Express request object
 * @returns {Object} User context information
 */
const getUserContext = (req) => {
    const context = {};

    // Extract user information from various sources
    if (req.username) {
        context.username = req.username;
    }

    if (req.user) {
        context.userId = req.user._id || req.user.id;
        context.username = context.username || req.user.username;
        context.email = req.user.email;
        context.isAdmin = req.user.isAdmin;
    }

    // Extract from request body if available
    if (req.body && req.body.addedBy) {
        context.addedBy = req.body.addedBy;
    }

    return context;
};

/**
 * Extracts system information from the request
 * @param {Object} req - Express request object
 * @returns {Object} System context information
 */
const getSystemContext = (req) => {
    return {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        protocol: req.protocol,
        host: req.get('host')
    };
};

/**
 * Extracts resource-specific information from request
 * @param {Object} req - Express request object
 * @returns {Object} Resource context information
 */
const getResourceContext = (req) => {
    const context = {};

    // Common resource IDs
    if (req.params.id) context.resourceId = req.params.id;
    if (req.params.truckId) context.truckId = req.params.truckId;
    if (req.params.userId) context.targetUserId = req.params.userId;
    if (req.params.username) context.targetUsername = req.params.username;

    // Query parameters
    if (req.query.truckId) context.truckId = req.query.truckId;
    if (req.query.userId) context.userId = req.query.userId;
    if (req.query.selectedDates) context.dateRange = req.query.selectedDates;

    // Body parameters for resources
    if (req.body) {
        if (req.body.truckId) context.truckId = req.body.truckId;
        if (req.body.registrationNo) context.registrationNo = req.body.registrationNo;
        if (req.body.category) context.category = req.body.category;
        if (req.body.amount) context.amount = req.body.amount;
        if (req.body.cost) context.cost = req.body.cost;
        if (req.body.type) context.type = req.body.type;
        if (req.body.priority) context.priority = req.body.priority;
    }

    return context;
};

/**
 * Combines all context information for comprehensive logging
 * @param {Object} req - Express request object
 * @param {Object} additionalContext - Additional context to include
 * @returns {Object} Complete logging context
 */
const getFullContext = (req, additionalContext = {}) => {
    return {
        ...getUserContext(req),
        ...getSystemContext(req),
        ...getResourceContext(req),
        ...additionalContext,
        timestamp: new Date().toISOString()
    };
};

/**
 * Creates a sanitized version of request body for logging (removes sensitive data)
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const getSanitizedBody = (body) => {
    if (!body) return {};

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
};

module.exports = {
    getUserContext,
    getSystemContext,
    getResourceContext,
    getFullContext,
    getSanitizedBody
};
