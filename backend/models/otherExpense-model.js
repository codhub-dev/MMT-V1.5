// models/OtherExpense.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema
const otherExpenseSchema = new Schema({
  truckId: {
    // type: mongoose.Schema.Types.ObjectId,
    type: String,
    ref: "Truck",
    required: [true, "Truck ID is required"],
  },
  addedBy: {
    type: String,
    required: [true, "User Id not recieved"],
  },
  date: {
    type: Date,
    required: [true, "Please choose the date"],
  },
  createdAt: {
    type: Date,
    default: () => new Date(), // Use a function to get the current date and time
  },
  category: {
    type: String,
    required: [true, "Please select a category"],
  },
  other: {
    type: String,
  },
  cost: {
    type: Number,
    required: [true, "Please enter the cost"],
  },
  note: {
    type: String,
    trim: true,
  },
});

// Create the model
const OtherExpense = mongoose.model("OtherExpense", otherExpenseSchema);

module.exports = OtherExpense;
