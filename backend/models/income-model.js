const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
    truckId: {
        type: String,
        ref: 'Truck',
        required: [true, "Truck ID is required"],
    },
    addedBy: {
        type: String,
        required: [true, "User Id not received"],
    },
    date: {
        type: Date,
        required: [true, "Date of income is required"],
    },
    createdAt: {
        type: Date,
        default: () => new Date(),
    },
    amount: {
        type: Number,
        required: [true, "Income amount is required"],
    },
    note: {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('Income', IncomeSchema);