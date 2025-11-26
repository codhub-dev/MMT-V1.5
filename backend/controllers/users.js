const { catchAsyncError } = require('../middleware/catchAsyncError');
const ErrorHandler = require('../middleware/errorHandlers');
const userModel = require('../models/user-model');
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');

module.exports.getMyProfile = catchAsyncError(async (req, res, next) => {
    const { decodedUser } = req.body;

    if (!decodedUser) {
        logger.warn("Profile request attempted with invalid application id", getFullContext(req));
        return next(new ErrorHandler("Application id not valid", 400));
    }

    const user = await userModel.findOne({
        username: decodedUser.username
    });

    delete user.password;

    logger.info("Profile retrieved successfully", getFullContext(req, {
        username: decodedUser.username,
        userId: user._id
    }));

    res.json({
        code: 200,
        message: 'Profile found',
        user: user,
    });
});