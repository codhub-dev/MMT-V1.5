const FuelExpense = require('../models/fuelExpense-model');
const DefExpense = require('../models/defExpense-model');
const User = require('../models/user-model');
const Truck = require('../models/truck-model');
const OtherExpense = require('../models/otherExpense-model');
const Income = require('../models/income-model');
const LoanCalculation = require('../models/calculateLoan-model');
const { default: mongoose } = require('mongoose');

const moment = require("moment");
const logger = require("../utils/logger");
const { getFullContext } = require("../utils/requestContext");

const getMetadataByTruckId = async (req, res) => {
    const { truckId } = req.query;

    logger.info("Fetching metadata by truck ID", getFullContext(req, { truckId }));

    if (!mongoose.Types.ObjectId.isValid(truckId)) {
        logger.warn("Invalid truck ID in metadata request", getFullContext(req, { truckId }));
        return res.status(400).json({ error: 'Invalid truck ID' });
    }

    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    try {
        const fuelResult = await FuelExpense.aggregate([
            {
                $match: {
                    truckId: truckId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const fuelTotal = fuelResult.length > 0 ? fuelResult[0].totalCost : 0;

        const defResult = await DefExpense.aggregate([
            {
                $match: {
                    truckId: truckId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const defTotal = defResult.length > 0 ? defResult[0].totalCost : 0;

        const otherResult = await OtherExpense.aggregate([
            {
                $match: {
                    truckId: truckId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const otherTotal = otherResult.length > 0 ? otherResult[0].totalCost : 0;

        const incomeResult = await Income.aggregate([
            {
                $match: {
                    truckId: truckId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
        ]);

        const incomeTotal = incomeResult.length > 0 ? incomeResult[0].totalAmount : 0;

        const totalExpenses = {
            fuelTotal,
            defTotal,
            otherTotal,
            incomeTotal,
            grandTotal: fuelTotal + defTotal + otherTotal
        };

        logger.info(`Metadata retrieved for truck`, {
            truckId,
            grandTotal: totalExpenses.grandTotal
        });

        return res.json(totalExpenses);
    } catch (error) {
        console.error("Error calculating total expenses:", error);
        logger.error(`Failed to get metadata by truck ID`, {
            truckId,
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const getMetadataByUserId = async (req, res) => {
    const { userId } = req.query;


    // if (!mongoose.Types.ObjectId.isValid(userId)) {
        if (!userId) {
        return res.status(400).json({ error: 'Invalid User ID' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
        // Total fuel expenses
        const fuelResult = await FuelExpense.aggregate([
            { $match: { addedBy: userId } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const fuelTotal = fuelResult.length > 0 ? fuelResult[0].totalCost : 0;

        // Total DEF expenses
        const defResult = await DefExpense.aggregate([
            { $match: { addedBy: userId } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const defTotal = defResult.length > 0 ? defResult[0].totalCost : 0;

        // Total other expenses
        const otherResult = await OtherExpense.aggregate([
            { $match: { addedBy: userId } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const otherTotal = otherResult.length > 0 ? otherResult[0].totalCost : 0;

        // Total loan expenses
        const loanResult = await LoanCalculation.aggregate([
            { $match: { addedBy: userId } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const loanTotal = loanResult.length > 0 ? loanResult[0].totalCost : 0;

        // Total fuel used
        const fuelUsedResult = await FuelExpense.aggregate([
            { $match: { addedBy: userId } },
            { $group: { _id: null, totalCost: { $sum: "$litres" } } }
        ]);

        const fuelUsedTotal = fuelUsedResult.length > 0 ? fuelUsedResult[0].totalCost : 0;

        // Monthly fuel expenses
        const fuelMonthlyResult = await FuelExpense.aggregate([
            { $match: { addedBy: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const fuelMonthlyTotal = fuelMonthlyResult.length > 0 ? fuelMonthlyResult[0].totalCost : 0;

        // Monthly DEF expenses
        const defMonthlyResult = await DefExpense.aggregate([
            { $match: { addedBy: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const defMonthlyTotal = defMonthlyResult.length > 0 ? defMonthlyResult[0].totalCost : 0;

        // Monthly other expenses
        const otherMonthlyResult = await OtherExpense.aggregate([
            { $match: { addedBy: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const otherMonthlyTotal = otherMonthlyResult.length > 0 ? otherMonthlyResult[0].totalCost : 0;

        // Monthly loan expenses
        const loanMonthlyResult = await LoanCalculation.aggregate([
            { $match: { addedBy: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } }
        ]);

        const loanMonthlyTotal = loanMonthlyResult.length > 0 ? loanMonthlyResult[0].totalCost : 0;

        // Monthly fuel used
        const fuelUsedMonthlyResult = await FuelExpense.aggregate([
            { $match: { addedBy: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, totalCost: { $sum: "$litres" } } }
        ]);

        const fuelUsedMonthlyTotal = fuelUsedMonthlyResult.length > 0 ? fuelUsedMonthlyResult[0].totalCost : 0;

        // Total income
        const incomeResult = await Income.aggregate([
            { $match: { addedBy: userId } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
        ]);

        const incomeTotal = incomeResult.length > 0 ? incomeResult[0].totalAmount : 0;

        // Monthly income
        const incomeMonthlyResult = await Income.aggregate([
            { $match: { addedBy: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
        ]);

        const incomeMonthlyTotal = incomeMonthlyResult.length > 0 ? incomeMonthlyResult[0].totalAmount : 0;

        // Combine results
        const totalExpenses = {
            fuelTotal,
            defTotal,
            otherTotal,
            loanTotal,
            fuelUsedTotal,
            incomeTotal,
            grandTotal: fuelTotal + defTotal + otherTotal + loanTotal,
            monthlyExpenses: {
                fuel: fuelMonthlyTotal,
                def: defMonthlyTotal,
                other: otherMonthlyTotal,
                loan: loanMonthlyTotal,
                fuelUsed: fuelUsedMonthlyTotal,
                income: incomeMonthlyTotal,
                monthlyGrandTotal: fuelMonthlyTotal + defMonthlyTotal + otherMonthlyTotal + loanMonthlyTotal
            }
        };

        logger.info(`Metadata retrieved for user`, {
            userId,
            grandTotal: totalExpenses.grandTotal,
            monthlyGrandTotal: totalExpenses.monthlyExpenses.monthlyGrandTotal
        });

        return res.json(totalExpenses);
    } catch (error) {
        console.error("Error calculating total expenses:", error);
        logger.error(`Failed to get metadata by user ID`, {
            userId,
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getProfileMetadataByUserId = async (req, res) => {
    const { userId } = req.query;

    try {
        // Calculate total kilometers from FuelExpense collection
        const kmResult = await FuelExpense.aggregate([
            { $match: { addedBy: userId } }, // Match records for the specific user
            { $sort: { truckId: 1, date: -1 } }, // Sort by truckId and date in descending order

            // Group by truckId to find the latest currentKM
            {
                $group: {
                    _id: "$truckId",
                    latestKM: { $first: "$currentKM" } // Get the latest currentKM (most recent entry)
                }
            },

            // Group all records together to calculate total kilometers
            {
                $group: {
                    _id: null, // Group all records into one group
                    totalKM: { $sum: "$latestKM" } // Sum the latest KM values
                }
            },

            // Format the output
            {
                $project: {
                    _id: 0, // Exclude _id from the output
                    totalKM: 1 // Include totalKM in the output
                }
            }
        ]);

        // Handle case where no fuel entries are found
        const totalKM = kmResult.length > 0 ? kmResult[0].totalKM : 0;

        // Step 2: Calculate total number of trucks from Truck collection
        const truckCount = await Truck.countDocuments({ addedBy: userId });

        // Find the user and calculate the number of days since the user was created
        const user = await User.findOne({ googleId: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const createdAt = user.createdAt; // Assume `createdAt` is a Date object
        const today = new Date();
        const daysSinceCreation = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));

        // Combine results to pass to the client
        const result = {
            totalKM,
            totalTrucks: truckCount,
            totalDays: daysSinceCreation + 1
        };

        logger.info(`Profile metadata retrieved`, {
            userId,
            totalKM,
            totalTrucks: truckCount
        });

        res.json(result);
    } catch (error) {
        console.error('Error retrieving total kilometers and total trucks:', error);
        logger.error(`Failed to get profile metadata`, {
            userId: req.query.userId,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'An error occurred while retrieving total kilometers and total trucks.' });
    }
};

const getSixMonthsDataByUserId = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Invalid User ID' });
    }

    try {
        // Get the last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = moment().subtract(i, 'months').startOf('month').toDate();
            const monthEnd = moment().subtract(i, 'months').endOf('month').toDate();
            const monthName = moment().subtract(i, 'months').format('MMM');

            months.push({
                name: monthName,
                start: monthStart,
                end: monthEnd
            });
        }

        const expensesData = [];
        const incomeData = [];

        // Process each month
        for (const month of months) {
            // Fuel expenses
            const fuelResult = await FuelExpense.aggregate([
                {
                    $match: {
                        addedBy: userId,
                        date: { $gte: month.start, $lte: month.end }
                    }
                },
                { $group: { _id: null, totalCost: { $sum: "$cost" } } }
            ]);
            const fuelTotal = fuelResult.length > 0 ? fuelResult[0].totalCost : 0;

            // DEF expenses
            const defResult = await DefExpense.aggregate([
                {
                    $match: {
                        addedBy: userId,
                        date: { $gte: month.start, $lte: month.end }
                    }
                },
                { $group: { _id: null, totalCost: { $sum: "$cost" } } }
            ]);
            const defTotal = defResult.length > 0 ? defResult[0].totalCost : 0;

            // Other expenses
            const otherResult = await OtherExpense.aggregate([
                {
                    $match: {
                        addedBy: userId,
                        date: { $gte: month.start, $lte: month.end }
                    }
                },
                { $group: { _id: null, totalCost: { $sum: "$cost" } } }
            ]);
            const otherTotal = otherResult.length > 0 ? otherResult[0].totalCost : 0;

            // Loan expenses
            const loanResult = await LoanCalculation.aggregate([
                {
                    $match: {
                        addedBy: userId,
                        date: { $gte: month.start, $lte: month.end }
                    }
                },
                { $group: { _id: null, totalCost: { $sum: "$cost" } } }
            ]);
            const loanTotal = loanResult.length > 0 ? loanResult[0].totalCost : 0;

            // Income
            const incomeResult = await Income.aggregate([
                {
                    $match: {
                        addedBy: userId,
                        date: { $gte: month.start, $lte: month.end }
                    }
                },
                { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
            ]);
            const incomeTotal = incomeResult.length > 0 ? incomeResult[0].totalAmount : 0;

            // Add to expensesData array
            expensesData.push(
                { time: month.name, value: fuelTotal, type: 'Fuel' },
                { time: month.name, value: defTotal, type: 'Def' },
                { time: month.name, value: otherTotal, type: 'Other' },
                { time: month.name, value: loanTotal, type: 'Loan' }
            );

            // Add to incomeData array
            incomeData.push({
                time: month.name,
                Income: incomeTotal
            });
        }

        const result = {
            expensesData,
            incomeData
        };

        logger.info(`Six months data retrieved`, {
            userId,
            monthsCount: months.length,
            expenseRecords: expensesData.length,
            incomeRecords: incomeData.length
        });

        return res.json(result);
    } catch (error) {
        console.error("Error calculating six months data:", error);
        logger.error(`Failed to get six months data`, {
            userId,
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getMetadataByTruckId,
    getMetadataByUserId,
    getProfileMetadataByUserId,
    getSixMonthsDataByUserId
};
