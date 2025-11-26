const { catchAsyncError } = require('../middleware/catchAsyncError');
const ErrorHandler = require('../middleware/errorHandlers');
const userModel = require('../models/user-model');
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');

module.exports.getAlluser = catchAsyncError(async (req, res, next) => {
    logger.info('Admin fetching all users', getFullContext(req, { admin: req.user?.username || req.username || 'unknown' }));

    const users = await userModel.find({})

    if(!users){
        logger.error('Failed to fetch all users');
        return next(new ErrorHandler("Failed to create user", 500));
    }

    logger.info(`Successfully fetched ${users.length} users`);

    res.status(200).json({
        message: "All user",
        users: users
    })
});

module.exports.getOneUserByUsername = catchAsyncError(async (req, res, next) => {
    logger.info('Admin fetching user by username', getFullContext(req, {
        admin: req.user?.username || req.username || 'unknown',
        targetUsername: req.params.username
    }));

    const user = await userModel.findOne({
        username: req.params.username
    })

    if(!user){
        logger.error('User not found', { username: req.params.username });
        return next(new ErrorHandler("Failed to create user", 500));
    }

    logger.info('User found successfully', { username: req.params.username });

    res.status(200).json({
        message: "User found",
        user: user
    })
});

module.exports.deleteOneUserByUsername = catchAsyncError(async (req, res, next) => {
    logger.info('Admin attempting to delete user', getFullContext(req, {
        admin: req.user?.username || req.username || 'unknown',
        targetUsername: req.params.username
    }));

    const user = await userModel.findOneAndDelete({
        username: req.params.username
    })

    if(!user){
        logger.error('Failed to delete user - user not found', { username: req.params.username });
        return next(new ErrorHandler("Failed to create user", 500));
    }

    logger.info('User deleted successfully', {
        username: req.params.username,
        deletedBy: req.user?.username || 'unknown'
    });

    res.status(200).json({
        message: "User found",
        user: user
    })
});

module.exports.manageSubscription = catchAsyncError(async (req, res, next) => {
    const { userId } = req.body;

    logger.info('Admin managing subscription', getFullContext(req, {
        admin: req.user?.username || req.username || 'unknown',
        userId
    }));

    const user = await userModel.findById(userId);

    if (!user) {
        logger.error('User not found for subscription management', { userId });
        return next(new ErrorHandler("User not found", 404));
    }

    user.isSubscribed = !user.isSubscribed;
    await user.save();

    logger.info('Subscription status updated', {
        userId,
        username: user.username,
        newStatus: user.isSubscribed ? 'subscribed' : 'unsubscribed',
        updatedBy: req.user?.username || 'unknown'
    });

    res.status(200).json({
        message: `User ${user.isSubscribed ? "subscribed" : "unsubscribed"} successfully`,
        user,
    });
});

module.exports.deleteTestUsers = catchAsyncError(async (req, res, next) => {
    logger.info('Admin attempting to delete test users', getFullContext(req, {
        admin: req.user?.username || req.username || 'unknown'
    }));

    // Find all users with email starting with 'testuser_'
    const testUsers = await userModel.find({
        email: { $regex: /^testuser_/i }
    });

    if (testUsers.length === 0) {
        logger.info('No test users found to delete');
        return res.status(200).json({
            message: "No test users found",
            deletedCount: 0
        });
    }

    // Delete all test users
    const result = await userModel.deleteMany({
        email: { $regex: /^testuser_/i }
    });

    logger.info('Test users deleted successfully', {
        deletedCount: result.deletedCount,
        deletedBy: req.user?.username || 'unknown'
    });

    res.status(200).json({
        message: `Successfully deleted ${result.deletedCount} test users`,
        deletedCount: result.deletedCount
    });
});