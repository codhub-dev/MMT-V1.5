const { default: mongoose } = require('mongoose');
const DriverProfile = require('../models/driverProfiles-model');
const { catchAsyncError } = require('../middleware/catchAsyncError');
const ErrorHandler = require('../middleware/errorHandlers');
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');

// Add a new driver profile
const addDriverProfile = catchAsyncError(async (req, res, next) => {
    try {
        const { addedBy, name, contact, age, experience, license, gender, photo } = req.body;

        logger.info('Adding new driver profile', getFullContext(req, { addedBy, name, license, age }));

        // Check if license number already exists
        const existingDriver = await DriverProfile.findOne({ license });
        if (existingDriver) {
            logger.warn('Driver creation failed - license already exists', getFullContext(req, { license }));
            return next(new ErrorHandler("Driver with this license number already exists", 400));
        }

        const newDriver = new DriverProfile({
            addedBy,
            name,
            contact,
            age,
            experience,
            license,
            gender,
            photo: photo || '/driver.png'
        });

        const savedDriver = await newDriver.save();

        logger.info('Driver profile created successfully', getFullContext(req, {
            driverId: savedDriver._id,
            addedBy,
            name,
            license
        }));

        res.status(201).json({
            success: true,
            message: 'Driver profile created successfully',
            data: savedDriver
        });
    } catch (error) {
        console.error('Error adding driver profile:', error);
        logger.error('Failed to add driver profile', getFullContext(req, {
            error: error.message,
            stack: error.stack
        }));
        return next(new ErrorHandler('Failed to add driver profile', 500));
    }
});

// Get driver profile by ID
const getDriverProfileById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info('Fetching driver profile by ID', getFullContext(req, { driverId: id }));

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid driver profile ID', getFullContext(req, { driverId: id }));
            return next(new ErrorHandler('Invalid driver profile ID', 400));
        }

        const driver = await DriverProfile.findById(id);

        if (!driver) {
            logger.warn('Driver profile not found', getFullContext(req, { driverId: id }));
            return next(new ErrorHandler('Driver profile not found', 404));
        }

        logger.info('Driver profile retrieved successfully', getFullContext(req, { driverId: id, name: driver.name }));

        res.status(200).json({
            success: true,
            message: 'Driver profile found',
            data: driver
        });
    } catch (error) {
        console.error('Error fetching driver profile by ID:', error);
        return next(new ErrorHandler('Failed to fetch driver profile', 500));
    }
});

// Get all driver profiles by user
const getAllDriverProfilesByUser = catchAsyncError(async (req, res, next) => {
    try {
        const { addedBy } = req.params;

        logger.info('Fetching driver profiles by user', getFullContext(req, { userId: addedBy }));

        const drivers = await DriverProfile.find({
            addedBy,
            isActive: true
        }).sort({ createdAt: -1 });

        logger.info('Driver profiles retrieved successfully', getFullContext(req, { userId: addedBy, count: drivers.length }));

        res.status(200).json({
            success: true,
            message: `Found ${drivers.length} driver profiles`,
            data: drivers,
            count: drivers.length
        });
    } catch (error) {
        console.error('Error fetching driver profiles by user:', error);
        return next(new ErrorHandler('Failed to fetch driver profiles', 500));
    }
});

// Get all driver profiles (admin only)
const getAllDriverProfiles = catchAsyncError(async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', isActive } = req.query;

        logger.info('Fetching all driver profiles (admin)', getFullContext(req, { page, limit, search, isActive }));

        // Build search query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { license: { $regex: search, $options: 'i' } },
                { contact: { $regex: search, $options: 'i' } }
            ];
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const drivers = await DriverProfile.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await DriverProfile.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Driver profiles retrieved successfully',
            data: drivers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalCount: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all driver profiles:', error);
        return next(new ErrorHandler('Failed to fetch driver profiles', 500));
    }
});

// Update driver profile by ID
const updateDriverProfileById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, contact, age, experience, license, gender, photo } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new ErrorHandler('Invalid driver profile ID', 400));
        }

        // Check if license number already exists for another driver
        if (license) {
            const existingDriver = await DriverProfile.findOne({
                license,
                _id: { $ne: id }
            });
            if (existingDriver) {
                return next(new ErrorHandler("Another driver with this license number already exists", 400));
            }
        }

        const updatedDriver = await DriverProfile.findByIdAndUpdate(
            id,
            { name, contact, age, experience, license, gender, photo },
            { new: true, runValidators: true }
        );

        if (!updatedDriver) {
            return next(new ErrorHandler('Driver profile not found', 404));
        }

        logger.info(`Driver profile updated`, {
            driverId: id,
            name: updatedDriver.name,
            license: updatedDriver.license
        });

        res.status(200).json({
            success: true,
            message: 'Driver profile updated successfully',
            data: updatedDriver
        });
    } catch (error) {
        console.error('Error updating driver profile:', error);
        logger.error(`Failed to update driver profile`, {
            driverId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        return next(new ErrorHandler('Failed to update driver profile', 500));
    }
});

// Soft delete driver profile by ID
const deleteDriverProfileById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new ErrorHandler('Invalid driver profile ID', 400));
        }

        const deletedDriver = await DriverProfile.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!deletedDriver) {
            return next(new ErrorHandler('Driver profile not found', 404));
        }

        logger.info(`Driver profile soft deleted`, {
            driverId: id,
            name: deletedDriver.name,
            license: deletedDriver.license
        });

        res.status(200).json({
            success: true,
            message: 'Driver profile deleted successfully',
            data: deletedDriver
        });
    } catch (error) {
        console.error('Error deleting driver profile:', error);
        logger.error(`Failed to delete driver profile`, {
            driverId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        return next(new ErrorHandler('Failed to delete driver profile', 500));
    }
});

// Permanently delete driver profile by ID (admin only)
const permanentDeleteDriverProfileById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new ErrorHandler('Invalid driver profile ID', 400));
        }

        const deletedDriver = await DriverProfile.findByIdAndDelete(id);

        if (!deletedDriver) {
            return next(new ErrorHandler('Driver profile not found', 404));
        }

        logger.warn(`Driver profile permanently deleted`, {
            driverId: id,
            name: deletedDriver.name,
            license: deletedDriver.license
        });

        res.status(200).json({
            success: true,
            message: 'Driver profile permanently deleted',
            data: deletedDriver
        });
    } catch (error) {
        console.error('Error permanently deleting driver profile:', error);
        logger.error(`Failed to permanently delete driver profile`, {
            driverId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        return next(new ErrorHandler('Failed to permanently delete driver profile', 500));
    }
});

// Restore soft deleted driver profile
const restoreDriverProfileById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new ErrorHandler('Invalid driver profile ID', 400));
        }

        const restoredDriver = await DriverProfile.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true }
        );

        if (!restoredDriver) {
            return next(new ErrorHandler('Driver profile not found', 404));
        }

        logger.info(`Driver profile restored`, {
            driverId: id,
            name: restoredDriver.name,
            license: restoredDriver.license
        });

        res.status(200).json({
            success: true,
            message: 'Driver profile restored successfully',
            data: restoredDriver
        });
    } catch (error) {
        console.error('Error restoring driver profile:', error);
        logger.error(`Failed to restore driver profile`, {
            driverId: req.params.id,
            error: error.message,
            stack: error.stack
        });
        return next(new ErrorHandler('Failed to restore driver profile', 500));
    }
});

// Get driver statistics by user
const getDriverStatsByUser = catchAsyncError(async (req, res, next) => {
    try {
        const { addedBy } = req.params;

        const stats = await DriverProfile.aggregate([
            { $match: { addedBy } },
            {
                $group: {
                    _id: null,
                    totalDrivers: { $sum: 1 },
                    activeDrivers: {
                        $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                    },
                    inactiveDrivers: {
                        $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
                    },
                    avgAge: { $avg: "$age" },
                    maleCount: {
                        $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] }
                    },
                    femaleCount: {
                        $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] }
                    },
                    otherCount: {
                        $sum: { $cond: [{ $eq: ["$gender", "Other"] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalDrivers: 0,
            activeDrivers: 0,
            inactiveDrivers: 0,
            avgAge: 0,
            maleCount: 0,
            femaleCount: 0,
            otherCount: 0
        };

        res.status(200).json({
            success: true,
            message: 'Driver statistics retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error fetching driver statistics:', error);
        return next(new ErrorHandler('Failed to fetch driver statistics', 500));
    }
});

module.exports = {
    addDriverProfile,
    getDriverProfileById,
    getAllDriverProfilesByUser,
    getAllDriverProfiles,
    updateDriverProfileById,
    deleteDriverProfileById,
    permanentDeleteDriverProfileById,
    restoreDriverProfileById,
    getDriverStatsByUser
};