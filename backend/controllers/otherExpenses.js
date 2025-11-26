const { default: mongoose } = require("mongoose");
const OtherExpense = require("../models/otherExpense-model"); // Adjust the path as needed
const moment = require("moment");
const ExcelJS = require("exceljs");
const TruckExpense = require("../models/truck-model");
const logger = require("../utils/logger");
const { getFullContext } = require("../utils/requestContext");

const otherNameConversions = {
  toll: "Toll",
  pollution: "Pollution",
  insurance: "Insurance",
  "service&Maintenance": "Service & Maintenance",
  "salary&incentives": "Salary & Incentives",
  other: "Other",
};

// Controller to add a new other filling record
const addOtherExpense = async (req, res) => {
  try {
    const { truckId, addedBy, date, category, cost, note, other } = req.body;

    logger.info("Adding new other expense", getFullContext(req, { truckId, addedBy, category, cost }));

    const newOtherExpense = new OtherExpense({
      truckId,
      addedBy,
      other,
      date,
      category,
      cost,
      note,
    });

    const savedOtherExpense = await newOtherExpense.save();
    logger.info("Other expense added successfully", getFullContext(req, {
      expenseId: savedOtherExpense._id,
      truckId,
      category,
      cost
    }));
    res.status(201).json(savedOtherExpense);
  } catch (error) {
    console.error("Error adding other filling:", error);
    logger.error("Failed to add other expense", getFullContext(req, {
      error: error.message,
      stack: error.stack
    }));
    res.status(500).json({ message: "Failed to add other filling" });
  }
};

const updateOtherExpenseByTruckId = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      truckId,
      addedBy,
      other,
      date,
      category,
      cost,
      note,
    } = req.body;
    const file = req.file;

    // Validate the fuel ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid other expense ID attempted: ${id}`);
      return res.status(400).json({ message: "Invalid other expense ID" });
    }

    // Update the invoice URL if a new file is provided
    let invoiceURL = req.body.invoiceURL;
    if (file) {
      invoiceURL = await uploadInvoice(file);
    }

    // Update the def
    const updatedOtherExpense = await OtherExpense.findByIdAndUpdate(
      { _id: id },
      {
        truckId,
        addedBy,
        other,
        date,
        category,
        cost,
        note,
      },
      { new: true } // Return the updated document
    );

    if (!updatedOtherExpense) {
      logger.warn(`Other expense not found for ID: ${id}`);
      return res.status(404).json({ message: "Other expense not found" });
    }

    logger.info(`Other expense updated successfully: ${id}`, {
      userId: addedBy,
      truckId,
      category
    });
    res.status(200).json({
      message: "Other expense updated successfully",
      otherExpense: updatedOtherExpense,
    });
  } catch (error) {
    console.error("Error updating other expense:", error);
    logger.error(`Failed to update other expense: ${error.message}`, {
      expenseId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res
      .status(500)
      .json({ message: "Failed to update other expense", error: error.message });
  }
};

const getAllOtherExpensesByTruckId = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;

    if (!truckId) {
      logger.warn("Get other expenses attempted without truck ID");
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

    const otherExpenses = await OtherExpense.find(query).sort({ date: 1 });

    if (otherExpenses.length === 0) {
      logger.info(`No other expenses found for truck ${truckId}`, {
        truckId,
        dateRange: selectedDates
      });
      return res.status(404).json({
        message:
          "No other expenses found for this truck in the given date range",
      });
    }

    const totalExpense = otherExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    const formattedOtherExpenses = otherExpenses.map((expense, index) => {
      const date = new Date(expense.date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      return {
        ...expense.toObject(), // Convert Mongoose document to plain object
        date: formattedDate,
        category:
          expense.category === "other"
            ? expense.other
            : otherNameConversions[expense.category] || "Other",

        key: index,
      };
    });

    logger.info(`Retrieved ${otherExpenses.length} other expenses for truck ${truckId}`, {
      truckId,
      count: otherExpenses.length,
      totalExpense
    });
    res.status(200).json({
      expenses: formattedOtherExpenses,
      totalExpense,
    });
  } catch (error) {
    console.error("Error retrieving other expenses:", error);
    logger.error(`Failed to retrieve other expenses: ${error.message}`, {
      truckId: req.query.truckId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: "Failed to retrieve other expenses" });
  }
};

const getAllOtherExpensesByUserId = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;

    if (!userId) {
      logger.warn("Get other expenses attempted without user ID");
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
        query.date = { $eq: startDate };
      } else {
        // Match the range between startDate and endDate
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const otherExpenses = await OtherExpense.find(query).sort({ date: 1 });

    if (otherExpenses.length === 0) {
      logger.info(`No other expenses found for user ${userId}`, {
        userId,
        dateRange: selectedDates
      });
      return res.status(404).json({
        message:
          "No other expenses found for this user in the given date range",
      });
    }

    // Prepare the other expenses with registration number
    const formattedOtherExpenses = await Promise.all(
      otherExpenses.map(async (expense, index) => {
        const truck = await TruckExpense.findById(expense.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(expense.date);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        return {
          ...expense.toObject(), // Convert Mongoose document to plain object
          date: formattedDate,
          registrationNo: registrationNo,
          category:
            expense.category === "other"
              ? expense.other
              : otherNameConversions[expense.category] || "Other",
          key: index,
        };
      })
    );

    const totalExpense = formattedOtherExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    logger.info(`Retrieved ${formattedOtherExpenses.length} other expenses for user ${userId}`, {
      userId,
      count: formattedOtherExpenses.length,
      totalExpense
    });
    res.status(200).json({
      expenses: formattedOtherExpenses,
      totalExpense,
    });
  } catch (error) {
    console.error("Error retrieving other expenses:", error);
    logger.error(`Failed to retrieve other expenses for user: ${error.message}`, {
      userId: req.query.userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: "Failed to retrieve other expenses" });
  }
};

const deleteOtherExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid expense ID attempted for deletion: ${id}`);
      return res.status(400).json({ message: "Invalid Expense ID" });
    }

    const deletedTruck = await OtherExpense.findByIdAndDelete(id);

    if (!deletedTruck) {
      logger.warn(`Other expense not found for deletion: ${id}`);
      return res.status(404).json({ message: "Expense not found" });
    }

    logger.info(`Other expense deleted successfully: ${id}`, {
      expenseId: id
    });
    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Error deleting truck:", error);
    logger.error(`Failed to delete other expense: ${error.message}`, {
      expenseId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res
      .status(500)
      .json({ message: "Failed to delete Expense", error: error.message });
  }
};

const downloadOtherExpensesExcel = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;

    if (!truckId) {
      console.log("Truck ID is missing");
      logger.warn("Excel download attempted without truck ID");
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

    const otherExpenses = await OtherExpense.find(query).sort({ date: 1 });
    const truck = await TruckExpense.findById(truckId);

    if (otherExpenses.length === 0) {
      console.log("No expenses found for the given query");
      logger.info(`No other expenses found for Excel download - truck ${truckId}`, {
        truckId,
        dateRange: selectedDates
      });
      return res.status(404).json({
        message: "No other expenses found for this truck in the given date range",
      });
    }

    // Prepare data for Excel
    const data = otherExpenses.map((expense) => {
      const date = new Date(expense.date);
      const formattedDate = date.toISOString().split("T")[0];

      return {
        Date: formattedDate,
        Category: expense.category === "other" ? expense.other : expense.category,
        Cost: expense.cost,
        Note: expense.note || "",
      };
    });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Other Expenses");

    // Main Title
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "Manage My Truck - Other Expenses";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" },
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Truck and Date Range)
    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = `${truck.registrationNo} | ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = ["Date", "Category", "Cost", "Note"];
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
      worksheet.addRow([row.Date, row.Category, row.Cost, row.Note]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 20 },
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

    // Set headers for the response
    logger.info(`Other expenses Excel downloaded for truck ${truckId}`, {
      truckId,
      count: otherExpenses.length,
      dateRange: selectedDates
    });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=otherExpenses.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    logger.error(`Failed to generate other expenses Excel: ${error.message}`, {
      truckId: req.query.truckId,
      error: error.message,
      stack: error.stack
    });
    res
      .status(500)
      .json({ message: "Failed to generate Excel file", error: error.message });
  }
};

const downloadAllOtherExpensesExcel = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;

    if (!userId) {
      console.log("User ID is missing");
      logger.warn("Excel download attempted without user ID");
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

    const otherExpenses = await OtherExpense.find(query).sort({ date: 1 });

    if (otherExpenses.length === 0) {
      console.log("No expenses found for the given query");
      logger.info(`No other expenses found for Excel download - user ${userId}`, {
        userId,
        dateRange: selectedDates
      });
      return res.status(404).json({
        message: "No other expenses found for this user in the given date range",
      });
    }

    // Prepare data for Excel with registration numbers
    const data = await Promise.all(
      otherExpenses.map(async (expense) => {
        const truck = await TruckExpense.findById(expense.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(expense.date);
        const formattedDate = date.toISOString().split("T")[0];

        return {
          Date: formattedDate,
          "Registration No": registrationNo,
          Category: expense.category === "other" ? expense.other : expense.category,
          Cost: expense.cost,
          Note: expense.note || "",
        };
      })
    );

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Other Expenses");

    // Main Title
    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = "Manage My Truck - All Other Expenses";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" },
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Date Range)
    worksheet.mergeCells("A2:E2");
    worksheet.getCell("A2").value = `Date Range: ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = ["Date", "Registration No", "Category", "Cost", "Note"];
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
        row.Category,
        row.Cost,
        row.Note,
      ]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 20 },
      { width: 20 },
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

    // Set headers for the response
    logger.info(`All other expenses Excel downloaded for user ${userId}`, {
      userId,
      count: otherExpenses.length,
      dateRange: selectedDates
    });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=otherExpenses.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    logger.error(`Failed to generate all other expenses Excel: ${error.message}`, {
      userId: req.query.userId,
      error: error.message,
      stack: error.stack
    });
    res
      .status(500)
      .json({ message: "Failed to generate Excel file", error: error.message });
  }
};

module.exports = {
  addOtherExpense,
  getAllOtherExpensesByTruckId,
  getAllOtherExpensesByUserId,
  updateOtherExpenseByTruckId,
  deleteOtherExpenseById,
  downloadOtherExpensesExcel,
  downloadAllOtherExpensesExcel,
};
