const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');

module.exports = async (req, res, next) => {
    try {
        const beare = req.headers.authorization
        if(!beare){
            logger.warn("Authentication failed: Bearer header not valid", getFullContext(req));
            return next(new ErrorHandler("Beare header not valid", 402));
        }

        const token = beare.split(' ')[1]
        if (!token){
            logger.warn("Authentication failed: Token not found", getFullContext(req));
            return next(new ErrorHandler("Token not found", 402));
        }

        const decodedToken = jwt.verify(token, process.env.SECRETKEY)

        if(!decodedToken){
            logger.warn("Authentication failed: Token not valid", getFullContext(req));
            return next(new ErrorHandler("Token not valid", 402));
        }

        req.username = decodedToken.username
        req.user = decodedToken;
        logger.info("User authenticated successfully", getFullContext(req, { username: decodedToken.username }));
        next()
    } catch (error) {
        logger.error("Authentication error", getFullContext(req, { error: error.message }));
        next(error);
    }
}