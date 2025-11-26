const { default: mongoose } = require('mongoose');
const Alert = require('../models/alert-model');
const { catchAsyncError } = require('../middleware/catchAsyncError');
const ErrorHandler = require('../middleware/errorHandlers');
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');

// Add a new alert
const addAlert = catchAsyncError(async (req, res, next) => {
    try {
        const { addedBy, title, description, alertDate, type, priority, truckId, driverId, isRecurring, recurringType } = req.body;

        logger.info('Creating new alert', getFullContext(req, {
            addedBy,
            title,
            type,
            priority,
            truckId,
            driverId,
            isRecurring,
            recurringType
        }));

        const newAlert = new Alert({
            addedBy,
            title,
            description,
            alertDate: new Date(alertDate),
            type,
            priority,
            truckId,
            driverId,
            isRecurring: isRecurring || false,
            recurringType: recurringType || 'none'
        });

        const savedAlert = await newAlert.save();

        logger.info('Alert created successfully', getFullContext(req, {
            alertId: savedAlert._id,
            addedBy,
            title: savedAlert.title,
            type: savedAlert.type,
            priority: savedAlert.priority,
            isRecurring: savedAlert.isRecurring
        }));

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: savedAlert
        });
    } catch (error) {
        console.error('Error adding alert:', error);
        logger.error('Failed to create alert', getFullContext(req, {
            error: error.message,
            stack: error.stack
        }));
        if (error.name === 'ValidationError') {
            return next(new ErrorHandler(Object.values(error.errors)[0].message, 400));
        }
        return next(new ErrorHandler('Failed to add alert', 500));
    }
});

// Get alert by ID
const getAlertById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info('Fetching alert by ID', getFullContext(req, { alertId: id }));

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID provided', getFullContext(req, { alertId: id }));
            return next(new ErrorHandler('Invalid alert ID', 400));
        }

        const alert = await Alert.findById(id)
            .populate('truckId', 'registrationNo make model')
            .populate('driverId', 'name license');

        if (!alert) {
            logger.warn('Alert not found', getFullContext(req, { alertId: id }));
            return next(new ErrorHandler('Alert not found', 404));
        }

        logger.info('Alert retrieved successfully', getFullContext(req, {
            alertId: id,
            title: alert.title,
            type: alert.type
        }));

        res.status(200).json({
            success: true,
            message: 'Alert found',
            data: alert
        });
    } catch (error) {
        console.error('Error fetching alert by ID:', error);
        logger.error('Failed to fetch alert by ID', {
            error: error.message,
            alertId: req.params.id
        });
        return next(new ErrorHandler('Failed to fetch alert', 500));
    }
});

// Get all alerts by user
const getAllAlertsByUser = catchAsyncError(async (req, res, next) => {
    try {
        const { addedBy } = req.params;
        const {
            isRead,
            type,
            priority,
            page = 1,
            limit = 20,
            sortBy = 'alertDate',
            sortOrder = 'asc',
            dateFilter
        } = req.query;

        logger.info('Fetching alerts by user', {
            addedBy,
            filters: { isRead, type, priority, dateFilter },
            page,
            limit
        });

        // Build query
        let query = { addedBy, isActive: true };

        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }

        if (type) {
            query.type = type;
        }

        if (priority) {
            query.priority = priority;
        }

        // Date filters
        if (dateFilter) {
            const now = new Date();
            switch (dateFilter) {
                case 'overdue':
                    query.alertDate = { $lt: now };
                    query.isRead = false;
                    break;
                case 'today':
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    query.alertDate = { $gte: startOfDay, $lt: endOfDay };
                    break;
                case 'upcoming':
                    query.alertDate = { $gte: now };
                    break;
                case 'week':
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    query.alertDate = { $gte: now, $lte: weekFromNow };
                    break;
            }
        }

        // Sort configuration
        const sortConfig = {};
        sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Add secondary sort by priority and creation date
        if (sortBy !== 'priority') {
            const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
            sortConfig.priority = -1;
        }
        if (sortBy !== 'createdAt') {
            sortConfig.createdAt = -1;
        }

        const alerts = await Alert.find(query)
            .populate('truckId', 'registrationNo make model')
            .populate('driverId', 'name license')
            .sort(sortConfig)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Alert.countDocuments(query);

        // Get statistics
        const stats = await Alert.aggregate([
            { $match: { addedBy, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalAlerts: { $sum: 1 },
                    unreadAlerts: {
                        $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
                    },
                    overdueAlerts: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $lt: ["$alertDate", new Date()] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    urgentAlerts: {
                        $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] }
                    },
                    highAlerts: {
                        $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] }
                    }
                }
            }
        ]);

        logger.info('Alerts fetched successfully', {
            addedBy,
            count: alerts.length,
            total,
            page
        });

        res.status(200).json({
            success: true,
            message: `Found ${alerts.length} alerts`,
            data: alerts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalCount: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            statistics: stats[0] || {
                totalAlerts: 0,
                unreadAlerts: 0,
                overdueAlerts: 0,
                urgentAlerts: 0,
                highAlerts: 0
            }
        });
    } catch (error) {
        console.error('Error fetching alerts by user:', error);
        logger.error('Failed to fetch alerts by user', {
            error: error.message,
            addedBy: req.params.addedBy
        });
        return next(new ErrorHandler('Failed to fetch alerts', 500));
    }
});

// Get all alerts (admin only)
const getAllAlerts = catchAsyncError(async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '', type, priority } = req.query;

        logger.info('Fetching all alerts (admin)', {
            filters: { search, type, priority },
            page,
            limit
        });

        let query = { isActive: true };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (type) {
            query.type = type;
        }

        if (priority) {
            query.priority = priority;
        }

        const alerts = await Alert.find(query)
            .populate('truckId', 'registrationNo make model')
            .populate('driverId', 'name license')
            .populate('addedBy', 'name email')
            .sort({ alertDate: 1, priority: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Alert.countDocuments(query);

        logger.info('All alerts fetched successfully', {
            count: alerts.length,
            total,
            page
        });

        res.status(200).json({
            success: true,
            message: 'Alerts retrieved successfully',
            data: alerts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalCount: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all alerts:', error);
        logger.error('Failed to fetch all alerts', {
            error: error.message
        });
        return next(new ErrorHandler('Failed to fetch alerts', 500));
    }
});

// Update alert by ID
const updateAlertById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, alertDate, type, priority, truckId, driverId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for update', { alertId: id });
            return next(new ErrorHandler('Invalid alert ID', 400));
        }

        logger.info('Updating alert', {
            alertId: id,
            updates: { title, type, priority, truckId, driverId }
        });

        const updateData = { title, description, type, priority, truckId, driverId };

        if (alertDate) {
            const newAlertDate = new Date(alertDate);
            if (newAlertDate < new Date()) {
                logger.warn('Attempt to set past alert date', {
                    alertId: id,
                    alertDate: newAlertDate
                });
                return next(new ErrorHandler('Alert date cannot be in the past', 400));
            }
            updateData.alertDate = newAlertDate;
        }

        const updatedAlert = await Alert.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('truckId', 'registrationNo make model')
         .populate('driverId', 'name license');

        if (!updatedAlert) {
            logger.warn('Alert not found for update', { alertId: id });
            return next(new ErrorHandler('Alert not found', 404));
        }

        logger.info('Alert updated successfully', {
            alertId: id,
            title: updatedAlert.title,
            type: updatedAlert.type,
            priority: updatedAlert.priority
        });

        res.status(200).json({
            success: true,
            message: 'Alert updated successfully',
            data: updatedAlert
        });
    } catch (error) {
        console.error('Error updating alert:', error);
        logger.error('Failed to update alert', {
            error: error.message,
            alertId: req.params.id,
            updates: req.body
        });
        if (error.name === 'ValidationError') {
            return next(new ErrorHandler(Object.values(error.errors)[0].message, 400));
        }
        return next(new ErrorHandler('Failed to update alert', 500));
    }
});

// Mark alert as read/unread
const markAlertAsRead = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isRead = true } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for read status update', { alertId: id });
            return next(new ErrorHandler('Invalid alert ID', 400));
        }

        logger.info('Marking alert as read/unread', {
            alertId: id,
            isRead
        });

        const updatedAlert = await Alert.findByIdAndUpdate(
            id,
            { isRead: Boolean(isRead) },
            { new: true }
        );

        if (!updatedAlert) {
            logger.warn('Alert not found for read status update', { alertId: id });
            return next(new ErrorHandler('Alert not found', 404));
        }

        logger.info('Alert read status updated successfully', {
            alertId: id,
            isRead,
            title: updatedAlert.title
        });

        res.status(200).json({
            success: true,
            message: `Alert marked as ${isRead ? 'read' : 'unread'}`,
            data: updatedAlert
        });
    } catch (error) {
        console.error('Error marking alert:', error);
        logger.error('Failed to update alert read status', {
            error: error.message,
            alertId: req.params.id
        });
        return next(new ErrorHandler('Failed to update alert status', 500));
    }
});

// Soft delete alert by ID
const deleteAlertById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for deletion', { alertId: id });
            return next(new ErrorHandler('Invalid alert ID', 400));
        }

        logger.info('Soft deleting alert', { alertId: id });

        const deletedAlert = await Alert.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!deletedAlert) {
            logger.warn('Alert not found for deletion', { alertId: id });
            return next(new ErrorHandler('Alert not found', 404));
        }

        logger.info('Alert soft deleted successfully', {
            alertId: id,
            title: deletedAlert.title,
            type: deletedAlert.type
        });

        res.status(200).json({
            success: true,
            message: 'Alert deleted successfully',
            data: deletedAlert
        });
    } catch (error) {
        console.error('Error deleting alert:', error);
        logger.error('Failed to delete alert', {
            error: error.message,
            alertId: req.params.id
        });
        return next(new ErrorHandler('Failed to delete alert', 500));
    }
});

// Permanently delete alert by ID (admin only)
const permanentDeleteAlertById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for permanent deletion', { alertId: id });
            return next(new ErrorHandler('Invalid alert ID', 400));
        }

        logger.warn('Permanently deleting alert', { alertId: id });

        const deletedAlert = await Alert.findByIdAndDelete(id);

        if (!deletedAlert) {
            logger.warn('Alert not found for permanent deletion', { alertId: id });
            return next(new ErrorHandler('Alert not found', 404));
        }

        logger.warn('Alert permanently deleted', {
            alertId: id,
            title: deletedAlert.title,
            type: deletedAlert.type,
            addedBy: deletedAlert.addedBy
        });

        res.status(200).json({
            success: true,
            message: 'Alert permanently deleted',
            data: deletedAlert
        });
    } catch (error) {
        console.error('Error permanently deleting alert:', error);
        logger.error('Failed to permanently delete alert', {
            error: error.message,
            alertId: req.params.id
        });
        return next(new ErrorHandler('Failed to permanently delete alert', 500));
    }
});

// Restore soft deleted alert
const restoreAlertById = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for restoration', { alertId: id });
            return next(new ErrorHandler('Invalid alert ID', 400));
        }

        logger.info('Restoring alert', { alertId: id });

        const restoredAlert = await Alert.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true }
        );

        if (!restoredAlert) {
            logger.warn('Alert not found for restoration', { alertId: id });
            return next(new ErrorHandler('Alert not found', 404));
        }

        logger.info('Alert restored successfully', {
            alertId: id,
            title: restoredAlert.title,
            type: restoredAlert.type
        });

        res.status(200).json({
            success: true,
            message: 'Alert restored successfully',
            data: restoredAlert
        });
    } catch (error) {
        console.error('Error restoring alert:', error);
        logger.error('Failed to restore alert', {
            error: error.message,
            alertId: req.params.id
        });
        return next(new ErrorHandler('Failed to restore alert', 500));
    }
});

// Get alerts summary/dashboard data
const getAlertsSummary = catchAsyncError(async (req, res, next) => {
    try {
        const { addedBy } = req.params;
        const now = new Date();

        logger.info('Fetching alerts summary', { addedBy });

        const summary = await Alert.aggregate([
            { $match: { addedBy, isActive: true } },
            {
                $facet: {
                    counts: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
                                overdue: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $lt: ["$alertDate", now] },
                                                    { $eq: ["$isRead", false] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                dueToday: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $gte: ["$alertDate", new Date(now.getFullYear(), now.getMonth(), now.getDate())] },
                                                    { $lt: ["$alertDate", new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    byType: [
                        { $group: { _id: "$type", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    byPriority: [
                        { $group: { _id: "$priority", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    upcoming: [
                        { $match: { alertDate: { $gte: now }, isRead: false } },
                        { $sort: { alertDate: 1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: 'trucks',
                                localField: 'truckId',
                                foreignField: '_id',
                                as: 'truck'
                            }
                        },
                        {
                            $lookup: {
                                from: 'driverprofiles',
                                localField: 'driverId',
                                foreignField: '_id',
                                as: 'driver'
                            }
                        }
                    ]
                }
            }
        ]);

        const result = summary[0];

        logger.info('Alerts summary fetched successfully', {
            addedBy,
            total: result.counts[0]?.total || 0,
            unread: result.counts[0]?.unread || 0,
            overdue: result.counts[0]?.overdue || 0
        });

        res.status(200).json({
            success: true,
            message: 'Alerts summary retrieved successfully',
            data: {
                counts: result.counts[0] || { total: 0, unread: 0, overdue: 0, dueToday: 0 },
                byType: result.byType,
                byPriority: result.byPriority,
                upcoming: result.upcoming
            }
        });
    } catch (error) {
        console.error('Error fetching alerts summary:', error);
        logger.error('Failed to fetch alerts summary', {
            error: error.message,
            addedBy: req.params.addedBy
        });
        return next(new ErrorHandler('Failed to fetch alerts summary', 500));
    }
});

// Mark recurring alert as done and update date for next occurrence
const markRecurringAlertAsDone = catchAsyncError(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('Invalid alert ID for recurring completion', { alertId: id });
            return next(new ErrorHandler('Invalid alert ID', 400));
        }

        logger.info('Marking recurring alert as done', { alertId: id });

        const alert = await Alert.findById(id);

        if (!alert) {
            logger.warn('Alert not found for recurring completion', { alertId: id });
            return next(new ErrorHandler('Alert not found', 404));
        }

        if (!alert.isRecurring || alert.recurringType === 'none') {
            logger.warn('Alert is not recurring', { alertId: id });
            return next(new ErrorHandler('Alert is not a recurring alert', 400));
        }

        // Calculate next occurrence date based on recurring type
        let nextAlertDate = new Date(alert.alertDate);

        if (alert.recurringType === 'monthly') {
            // Add one month to the current alert date
            nextAlertDate.setMonth(nextAlertDate.getMonth() + 1);
        }

        // Update the existing alert with new date and reset read status
        alert.alertDate = nextAlertDate;
        alert.isRead = false;
        alert.lastRecurredDate = new Date();

        const updatedAlert = await alert.save();

        logger.info('Recurring alert updated with next occurrence date', {
            alertId: id,
            previousDate: alert.alertDate,
            nextAlertDate: nextAlertDate,
            recurringType: alert.recurringType
        });

        res.status(200).json({
            success: true,
            message: 'Recurring alert updated with next occurrence date.',
            data: updatedAlert
        });
    } catch (error) {
        console.error('Error marking recurring alert as done:', error);
        logger.error('Failed to mark recurring alert as done', {
            error: error.message,
            alertId: req.params.id
        });
        return next(new ErrorHandler('Failed to process recurring alert', 500));
    }
});

module.exports = {
    addAlert,
    getAlertById,
    getAllAlertsByUser,
    getAllAlerts,
    updateAlertById,
    markAlertAsRead,
    deleteAlertById,
    permanentDeleteAlertById,
    restoreAlertById,
    getAlertsSummary,
    markRecurringAlertAsDone
};
