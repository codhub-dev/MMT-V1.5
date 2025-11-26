const logger = require('../utils/logger');

class ErrorHandler extends Error{
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, ErrorHandler)
        
        logger.error("Error Handler triggered", {
            message,
            statusCode,
            stack: this.stack
        });
    }
  }
  
  module.exports = ErrorHandler