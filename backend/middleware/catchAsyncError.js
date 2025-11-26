const logger = require('../utils/logger');

module.exports.catchAsyncError= (asyncFunction)=>(req, res, next)=>{
  Promise.resolve(asyncFunction(req, res, next)).catch((error) => {
    logger.error('Async error caught in middleware', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    next(error);
  })
}