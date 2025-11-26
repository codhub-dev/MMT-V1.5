const { default: mongoose } = require("mongoose");
const FuelExpense = require("../models/fuelExpense-model");
const moment = require("moment");
const ExcelJS = require("exceljs");
const TruckExpense = require("../models/truck-model");
const logger = require("../utils/logger");
const { getFullContext } = require("../utils/requestContext");

// Controller to add a new fuel filling record
const addFuelExpense = async (req, res) => {
  try {
    const { truckId, addedBy, date, currentKM, litres, cost, note } = req.body;
    logger.info("Adding fuel expense", getFullContext(req, { truckId, addedBy, cost, litres }));

    const newFuelExpense = new FuelExpense({
      truckId,
      addedBy,
      date,
      currentKM,
      litres,
      cost,
      note,
    });

    const savedFuelExpense = await newFuelExpense.save();
    logger.info("Fuel expense added successfully", getFullContext(req, { expenseId: savedFuelExpense._id, truckId, cost }));
    res.status(201).json(savedFuelExpense);
  } catch (error) {
    logger.error("Error adding fuel expense", getFullContext(req, { error: error.message, stack: error.stack }));
    res.status(500).json({ message: "Failed to add fuel filling" });
  }
};

const getAllFuelExpensesByTruckId = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;
    logger.info("Fetching fuel expenses by truck", { truckId, dateRange: selectedDates });

    if (!truckId) {
      logger.warn("Truck ID missing in fuel expenses request");
      return res.status(400).json({ message: "Truck ID is required" });
    }

    // Ensure the dates are in UTC and set the time to 00:00:00 to avoid time zone issues
    const startDate = selectedDates
      ? moment.utc(selectedDates[0]).startOf("day").toDate()
      : null;
    const endDate = selectedDates
      ? moment.utc(selectedDates[1]).endOf("day").toDate()
      : null;

    // Build the query filter
    const query = { truckId };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        // If startDate and endDate are the same, match that specific date
        query.date = {
          $eq: startDate,
        };
      } else {
        // Match the range between startDate and endDate
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Fetch all fuel expenses for the given truckId and date range
    const fuelExpenses = await FuelExpense.find(query).sort({ date: 1 });

    if (fuelExpenses.length === 0) {
      logger.warn("No fuel expenses found", { truckId, dateRange: selectedDates });
      return res.status(404).json({
        message:
          "No fuel expenses found for this truck in the given date range",
      });
    }

    const totalExpense = fuelExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    // Calculate mileage and range, and format the date
    const formattedFuelExpenses = fuelExpenses.map((expense, index) => {
      const date = new Date(expense.date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      const range =
        index > 0 ? expense.currentKM - fuelExpenses[index - 1].currentKM : 0;

      const mileage = range > 0 ? (range / expense.litres).toFixed(2) : 0;

      return {
        ...expense.toObject(),
        date: formattedDate,
        mileage,
        range,
        key: index,
      };
    });

    logger.info("Fuel expenses fetched successfully", { truckId, count: fuelExpenses.length, totalExpense });
    res.status(200).json({
      expenses: formattedFuelExpenses,
      totalExpense,
    });
  } catch (error) {
    logger.error("Error retrieving fuel expenses", { error: error.message, truckId: req.query.truckId });
    res.status(500).json({ message: "Failed to retrieve fuel expenses" });
  }
};

const getAllFuelExpensesByUserId = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;
    logger.info("Fetching fuel expenses by user", { userId, dateRange: selectedDates });

    if (!userId) {
      logger.warn("User ID missing in fuel expenses request");
      return res.status(400).json({ message: "User ID is required" });
    }

    // Ensure the dates are in UTC and set the time to 00:00:00 to avoid time zone issues
    const startDate = selectedDates
      ? moment.utc(selectedDates[0]).startOf("day").toDate()
      : null;
    const endDate = selectedDates
      ? moment.utc(selectedDates[1]).endOf("day").toDate()
      : null;

    // Build the query filter
    const query = { addedBy: userId };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        // If startDate and endDate are the same, match that specific date
        query.date = {
          $eq: startDate,
        };
      } else {
        // Match the range between startDate and endDate
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Fetch all fuel expenses for the given userId and date range
    const fuelExpenses = await FuelExpense.find(query).sort({ date: 1 });

    if (fuelExpenses.length === 0) {
      logger.warn("No fuel expenses found for user", { userId, dateRange: selectedDates });
      return res.status(404).json({
        message: "No fuel expenses found for this user in the given date range",
      });
    }

    // Find registration numbers for each truckId in the fuel expenses
    const formattedFuelExpenses = await Promise.all(
      fuelExpenses.map(async (expense, index) => {
        const truck = await TruckExpense.findById(expense.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(expense.date);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        return {
          ...expense.toObject(),
          date: formattedDate,
          registrationNo,
          key: index,
        };
      })
    );

    const totalExpense = fuelExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    logger.info("Fuel expenses by user fetched successfully", { userId, count: fuelExpenses.length, totalExpense });
    res.status(200).json({
      expenses: formattedFuelExpenses,
      totalExpense,
    });
  } catch (error) {
    logger.error("Error retrieving fuel expenses by user", { error: error.message, userId: req.query.userId });
    res.status(500).json({ message: "Failed to retrieve fuel expenses" });
  }
};

const getAllFuelByTruckHelper = async (truckId) => {
  try {
    // Ensure the dates are in UTC and set the time to 00:00:00 to avoid time zone issues
    const startDate = selectedDates
      ? moment.utc(selectedDates[0]).startOf("day").toDate()
      : null;
    const endDate = selectedDates
      ? moment.utc(selectedDates[1]).endOf("day").toDate()
      : null;

    // Build the query filter
    const query = { truckId };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        // If startDate and endDate are the same, match that specific date
        query.date = {
          $eq: startDate,
        };
      } else {
        // Match the range between startDate and endDate
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Fetch all fuel expenses for the given truckId and date range
    const fuelExpenses = await FuelExpense.find(query).sort({ date: 1 });

    if (fuelExpenses.length === 0) {
      return [];
    }

    const totalExpense = fuelExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    // Calculate mileage and range, and format the date
    const formattedFuelExpenses = fuelExpenses.map((expense, index) => {
      const date = new Date(expense.date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      const range =
        index > 0 ? expense.currentKM - fuelExpenses[index - 1].currentKM : 0;

      const mileage = range > 0 ? (range / expense.litres).toFixed(2) : 0;

      return {
        ...expense.toObject(),
        date: formattedDate,
        mileage,
        range,
        key: index,
      };
    });

    return {
      expenses: formattedFuelExpenses,
      totalExpense,
    };
  } catch (error) {
    console.error("Error retrieving fuel expenses:", error);
    return [];
  }
};

const updateFuelExpenseByTruckId = async (req, res) => {
  try {
    const { id } = req.params;
    const { truckId, addedBy, date, currentKM, litres, cost, note } = req.body;
    logger.info("Updating fuel expense", { expenseId: id, truckId });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn("Invalid fuel expense ID for update", { expenseId: id });
      return res.status(400).json({ message: "Invalid fuel expense ID" });
    }

    // Update the invoice URL if a new file is provided
    let invoiceURL = req.body.invoiceURL;
    const file = req.file;
    if (file) {
      invoiceURL = await uploadInvoice(file);
    }

    // Update the fuel
    const updatedFuel = await FuelExpense.findByIdAndUpdate(
      { _id: id },
      { truckId, addedBy, date, currentKM, litres, cost, note },
      { new: true }
    );

    if (!updatedFuel) {
      logger.warn("Fuel expense not found for update", { expenseId: id });
      return res.status(404).json({ message: "Fuel expense not found" });
    }

    logger.info("Fuel expense updated successfully", { expenseId: id, truckId });
    res.status(200).json({
      message: "Fuel expense updated successfully",
      fuelExpense: updatedFuel,
    });
  } catch (error) {
    logger.error("Error updating fuel expense", { error: error.message, expenseId: req.params.id });
    res.status(500).json({ message: "Failed to update fuel expense", error: error.message });
  }
};

const deleteFuelExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("Deleting fuel expense", { expenseId: id });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn("Invalid fuel expense ID for deletion", { expenseId: id });
      return res.status(400).json({ message: "Invalid Expense ID" });
    }

    const deletedTruck = await FuelExpense.findByIdAndDelete(id);

    if (!deletedTruck) {
      logger.warn("Fuel expense not found for deletion", { expenseId: id });
      return res.status(404).json({ message: "Expense not found" });
    }

    logger.info("Fuel expense deleted successfully", { expenseId: id });
    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    logger.error("Error deleting fuel expense", { error: error.message, expenseId: req.params.id });
    res.status(500).json({ message: "Failed to delete Expense", error: error.message });
  }
};

const downloadFuelExpensesExcel = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;
    logger.info("Generating fuel expenses Excel", { truckId, dateRange: selectedDates });

    if (!truckId) {
      logger.warn("Truck ID missing for Excel download");
      return res.status(400).json({ message: "Truck ID is required" });
    }

    const startDate = selectedDates
      ? moment.utc(selectedDates[0]).startOf("day").toDate()
      : null;
    const endDate = selectedDates
      ? moment.utc(selectedDates[1]).endOf("day").toDate()
      : null;

    const query = { truckId };
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        query.date = { $eq: startDate };
      } else {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const fuelExpenses = await FuelExpense.find(query).sort({ date: 1 });
    const truck = await TruckExpense.findById(truckId);

    if (fuelExpenses.length === 0) {
      logger.warn("No fuel expenses for Excel generation", { truckId, dateRange: selectedDates });
      return res.status(404).json({
        message: "No fuel expenses found for this truck in the given date range",
      });
    }

    // Prepare data for Excel
    const data = fuelExpenses.map((expense, index) => {
      const date = new Date(expense.date);
      const formattedDate = date.toISOString().split("T")[0];
      const range = index > 0 ? expense.currentKM - fuelExpenses[index - 1].currentKM : 0;
      const mileage = range > 0 ? (range / expense.litres).toFixed(2) : 0;
      return {
        Date: formattedDate,
        "Current KM": expense.currentKM,
        Litres: expense.litres,
        Cost: expense.cost,
        Note: expense.note || "",
        Range: range,
        Mileage: mileage,
      };
    });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fuel Expenses");

    // Main Title
    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").value = "Manage My Truck - Fuel Expenses";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" },
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Truck and Date Range)
    worksheet.mergeCells("A2:G2");
    worksheet.getCell("A2").value = `${truck.registrationNo} | ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = [
      "Date",
      "Current KM",
      "Litres",
      "Cost",
      "Note",
      "Range",
      "Mileage",
    ];

    const headerRow = worksheet.addRow(headings);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF57A773" }
      };
    });
    headerRow.alignment = { horizontal: "center" };
    headerRow.height = 24;

    // Add Data Rows
    data.forEach((row) => {
      worksheet.addRow([
        row.Date,
        row["Current KM"],
        row.Litres,
        row.Cost,
        row.Note,
        row.Range,
        row.Mileage,
      ]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 15 },
      { width: 10 },
      { width: 10 },
      { width: 25 },
      { width: 10 },
      { width: 10 },
    ];

    // Add borders and center alignment to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        const existingFill = cell.fill;
        cell.border = {
          top: { style: "thin", color: { argb: "CCCCCC" } },
          left: { style: "thin", color: { argb: "CCCCCC" } },
          bottom: { style: "thin", color: { argb: "CCCCCC" } },
          right: { style: "thin", color: { argb: "CCCCCC" } },
        };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        if (existingFill) {
          cell.fill = existingFill;
        }
      });
    });

    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    logger.info("Fuel expenses Excel generated successfully", { truckId, count: fuelExpenses.length });
    // Set headers for the response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=fuelExpenses.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    logger.error("Error generating fuel expenses Excel", { error: error.message, truckId: req.query.truckId });
    res
      .status(500)
      .json({ message: "Failed to generate Excel file", error: error.message });
  }
};

const downloadAllFuelExpensesExcel = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;
    logger.info("Generating all fuel expenses Excel", { userId, dateRange: selectedDates });

    if (!userId) {
      logger.warn("User ID missing for Excel download");
      return res.status(400).json({ message: "User ID is required" });
    }

    const startDate = selectedDates
      ? moment.utc(selectedDates[0]).startOf("day").toDate()
      : null;
    const endDate = selectedDates
      ? moment.utc(selectedDates[1]).endOf("day").toDate()
      : null;

    const query = { addedBy: userId };
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        query.date = { $eq: startDate };
      } else {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const fuelExpenses = await FuelExpense.find(query).sort({ date: 1 });

    if (fuelExpenses.length === 0) {
      logger.warn("No fuel expenses for user Excel generation", { userId, dateRange: selectedDates });
      return res.status(404).json({
        message: "No fuel expenses found for this user in the given date range",
      });
    }

    // Prepare data for Excel with registration number
    const data = await Promise.all(
      fuelExpenses.map(async (expense, index) => {
        const date = new Date(expense.date);
        const formattedDate = date.toISOString().split("T")[0];

        const truck = await TruckExpense.findById(expense.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        return {
          Date: formattedDate,
          "Registration No": registrationNo,
          "Current KM": expense.currentKM,
          Litres: expense.litres,
          Cost: expense.cost,
          Note: expense.note || "",
        };
      })
    );

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fuel Expenses");

    // Main Title
    worksheet.mergeCells("A1:F1");
    worksheet.getCell("A1").value = "Manage My Truck - All Fuel Expenses";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" },
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Date Range)
    worksheet.mergeCells("A2:F2");
    worksheet.getCell("A2").value = `Date Range: ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };


    // Column Headings
    const headings = [
      "Date",
      "Registration No",
      "Current KM",
      "Litres",
      "Cost",
      "Note",
    ];
    const headerRow = worksheet.addRow(headings);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF57A773" }
      };
    });
    headerRow.alignment = { horizontal: "center" };
    headerRow.height = 24;

    // Add Data Rows
    data.forEach((row) => {
      worksheet.addRow([
        row.Date,
        row["Registration No"],
        row["Current KM"],
        row.Litres,
        row.Cost,
        row.Note,
      ]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 10 },
      { width: 10 },
      { width: 25 },
    ];

    // Add borders and center alignment to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        const existingFill = cell.fill;
        cell.border = {
          top: { style: "thin", color: { argb: "CCCCCC" } },
          left: { style: "thin", color: { argb: "CCCCCC" } },
          bottom: { style: "thin", color: { argb: "CCCCCC" } },
          right: { style: "thin", color: { argb: "CCCCCC" } },
        };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        if (existingFill) {
          cell.fill = existingFill;
        }
      });
    });

    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    logger.info("All fuel expenses Excel generated successfully", { userId, count: fuelExpenses.length });
    // Set headers for the response
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=fuelExpenses.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    logger.error("Error generating all fuel expenses Excel", { error: error.message, userId: req.query.userId });
    res.status(500).json({ message: "Failed to generate Excel file", error: error.message });
  }
};

module.exports = {
  addFuelExpense,
  getAllFuelExpensesByTruckId,
  updateFuelExpenseByTruckId,
  deleteFuelExpenseById,
  downloadFuelExpensesExcel,
  getAllFuelExpensesByUserId,
  downloadAllFuelExpensesExcel,
};
