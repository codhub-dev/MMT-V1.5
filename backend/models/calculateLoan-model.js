const mongoose = require('mongoose');

const LoanCalculationSchema = new mongoose.Schema({
    truckId: {
        // type: mongoose.Schema.Types.ObjectId,
        type: String,
        ref: 'Truck',
        required: [true, "Truck ID is required"],
    },
    addedBy: {
        type: String,
        required: [true, "User Id not recieved"],
      },
    date: {
        type: Date,
        required: [true, "Date of payment is required"],
    },
    cost: {
        type: Number,
        required: [true, "cost is required"],
    },
    createdAt: {
        type: Date,
        default: () => new Date(), // Use a function to get the current date and time
      },
    additionalCharges: {
        type: Number,
    },
    note: {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('LoanCalculation', LoanCalculationSchema);
