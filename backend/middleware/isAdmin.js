const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
    try {
        const beare = req.headers.authorization
        if(!beare){
            logger.warn("Admin authentication failed: Bearer header not valid", { ip: req.ip, path: req.path });
            return next(new ErrorHandler("Beare header not valid", 402));
        }

        const token = beare.split(' ')[1]
        if (!token){
            logger.warn("Admin authentication failed: Token not found", { ip: req.ip, path: req.path });
            return next(new ErrorHandler("Token not found", 402));
        }

        const decodedToken = jwt.verify(token, process.env.SECRETKEY)

        if(!decodedToken){
            logger.warn("Admin authentication failed: Token not valid", { ip: req.ip, path: req.path });
            return next(new ErrorHandler("Token not valid", 402));
        }

        if(!decodedToken.isAdmin){
            logger.warn("Admin authentication failed: Admin status not found", { username: decodedToken.username, ip: req.ip, path: req.path });
            return next(new ErrorHandler("Admin status not found", 401));
        }

        logger.info("Admin authenticated successfully", { username: decodedToken.username, path: req.path });
        next()
    } catch (error) {
        logger.error("Admin authentication error", { error: error.message, ip: req.ip, path: req.path });
        next(error);
    }
}