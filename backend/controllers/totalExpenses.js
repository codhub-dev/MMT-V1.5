const { default: mongoose } = require("mongoose");
const FuelExpense = require("../models/fuelExpense-model");
const DefExpense = require("../models/defExpense-model");
const OtherExpense = require("../models/otherExpense-model");
const LoanCalculation = require("../models/calculateLoan-model");
const moment = require("moment");
const ExcelJS = require("exceljs");
const TruckExpense = require("../models/truck-model");
const logger = require("../utils/logger");
const { getFullContext } = require("../utils/requestContext");

const getAllTotalExpensesByUserId = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;

    logger.info("Fetching total expenses by user ID", getFullContext(req, { userId, selectedDates }));

    if (!userId) {
      logger.warn("Get total expenses attempted without user ID", getFullContext(req));
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

    const fuelExpenses = (await FuelExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: "Fuel Expense",
      })
    );

    const defExpenses = (await DefExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: "Def Expense",
      })
    );

    const otherExpenses = (
      await OtherExpense.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: "Other Expense",
    }));

    const loanExpenses = (
      await LoanCalculation.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: "Loan Expense",
    }));

    const allExpenses = [...fuelExpenses, ...defExpenses, ...otherExpenses, ...loanExpenses];

    if (allExpenses.length === 0) {
      logger.info(`No total expenses found for user ${userId}`, {
        userId,
        dateRange: selectedDates,
      });
      return res.status(404).json({
        message: "No expenses found for this user in the given date range",
      });
    }

    const formattedExpenses = await Promise.all(
      allExpenses.map(async (expense) => {
        const truck = await TruckExpense.findById(expense.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(expense.date);
        const formattedDate = moment(date).format("DD-MM-YYYY");

        return {
          ...expense,
          date: formattedDate,
          registrationNo,
        };
      })
    );

    // Sort combined expenses by date
    formattedExpenses.sort(
      (a, b) =>
        new Date(a.date.split("-").reverse().join("-")) -
        new Date(b.date.split("-").reverse().join("-"))
    );

    const totalExpense = formattedExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    logger.info(`Retrieved ${formattedExpenses.length} total expenses for user ${userId}`, {
      userId,
      count: formattedExpenses.length,
      totalExpense,
      dateRange: selectedDates,
    });

    res.status(200).json({
      expenses: formattedExpenses,
      totalExpense,
    });
  } catch (error) {
    console.error("Error retrieving expenses:", error);
    logger.error(`Failed to retrieve total expenses: ${error.message}`, {
      userId: req.query.userId,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Failed to retrieve expenses" });
  }
};

const downloadAllTotalExpensesExcel = async (req, res) => {
  try {
    const { userId, truckId, selectedDates } = req.query;

    if (!userId && !truckId) {
      console.log("User ID or Truck ID is missing");
      logger.warn("Total expenses Excel download attempted without user ID or truck ID");
      return res.status(400).json({ message: "User ID or Truck ID is required" });
    }

    const startDate = selectedDates
      ? moment.utc(selectedDates[0]).startOf("day").toDate()
      : null;
    const endDate = selectedDates
      ? moment.utc(selectedDates[1]).endOf("day").toDate()
      : null;

    const query = truckId ? { truckId } : { addedBy: userId };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        query.date = { $eq: startDate };
      } else {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const fuelExpenses = (await FuelExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: "Fuel Expense",
      })
    );

    const defExpenses = (await DefExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: "Def Expense",
      })
    );

    const otherExpenses = (
      await OtherExpense.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: "Other Expense",
    }));

    const loanExpenses = (
      await LoanCalculation.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: "Loan Expense",
    }));

    const allExpenses = [...fuelExpenses, ...defExpenses, ...otherExpenses, ...loanExpenses];

    if (allExpenses.length === 0) {
      console.log("No expenses found for the given query");
      logger.info(`No total expenses found for Excel download - user ${userId}`, {
        userId,
        truckId,
        dateRange: selectedDates,
      });
      return res.status(404).json({
        message: "No expenses found for this user in the given date range",
      });
    }

    const formattedExpenses = await Promise.all(
      allExpenses.map(async (expense) => {
        const truck = await TruckExpense.findById(expense.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(expense.date);
        const formattedDate = date.toISOString().split("T")[0];

        return {
          ...expense,
          date: formattedDate,
          registrationNo,
        };
      })
    );

    // Sort combined expenses by date
    formattedExpenses.sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    const data = formattedExpenses.map((expense) => ({
      Date: expense.date,
      Registration: expense.registrationNo,
      Type: expense.catalog,
      "Current KM": expense.currentKM || "",
      Litres: expense.litres || "",
      Category: expense.category || "",
      Cost: expense.cost,
      "Additional Charges": expense.additionalCharges || "",
      Note: expense.note || "",
    }));

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Total Expenses");

    // Main Title
    worksheet.mergeCells("A1:I1");
    worksheet.getCell("A1").value = "Manage My Truck - Total Expenses";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" },
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Date Range)
    worksheet.mergeCells("A2:I2");
    worksheet.getCell("A2").value = `Date Range: ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = ["Date", "Registration", "Type", "Current KM", "Litres", "Category", "Cost", "Additional Charges", "Note"];
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
        row.Registration,
        row.Type,
        row["Current KM"],
        row.Litres,
        row.Category,
        row.Cost,
        row["Additional Charges"],
        row.Note,
      ]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },  // Date
      { width: 20 },  // Registration
      { width: 15 },  // Type
      { width: 12 },  // Current KM
      { width: 10 },  // Litres
      { width: 18 },  // Category
      { width: 12 },  // Cost
      { width: 18 },  // Additional Charges
      { width: 30 },  // Note
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

    logger.info(`Total expenses Excel downloaded for user ${userId}`, {
      userId,
      truckId,
      count: allExpenses.length,
      dateRange: selectedDates,
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=totalExpenses.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    logger.error(`Failed to generate total expenses Excel: ${error.message}`, {
      userId: req.query.userId,
      truckId: req.query.truckId,
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to generate Excel file", error: error.message });
  }
};

const getAllTotalExpensesByTruckId = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;

    if (!truckId) {
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

    const fuelExpenses = (await FuelExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: "Fuel Expense",
      })
    );

    const defExpenses = (await DefExpense.find(query).sort({ date: 1 })).map(
      (expense) => ({
        ...expense.toObject(),
        catalog: "Def Expense",
      })
    );

    const otherExpenses = (
      await OtherExpense.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: "Other Expense",
    }));

    const loanExpenses = (
      await LoanCalculation.find(query).sort({ date: 1 })
    ).map((expense) => ({
      ...expense.toObject(),
      catalog: "Loan Expense",
    }));

    const allExpenses = [...fuelExpenses, ...defExpenses, ...otherExpenses, ...loanExpenses];

    if (allExpenses.length === 0) {
      return res.status(404).json({
        message: "No expenses found for this truck in the given date range",
      });
    }

    const formattedExpenses = await Promise.all(
      allExpenses.map(async (expense) => {
        const truck = await TruckExpense.findById(expense.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(expense.date);
        const formattedDate = moment(date).format("DD-MM-YYYY");

        return {
          ...expense,
          date: formattedDate,
          registrationNo,
        };
      })
    );

    // Sort combined expenses by date
    formattedExpenses.sort(
      (a, b) =>
        new Date(a.date.split("-").reverse().join("-")) -
        new Date(b.date.split("-").reverse().join("-"))
    );

    const totalExpense = formattedExpenses.reduce(
      (sum, expense) => sum + expense.cost,
      0
    );

    res.status(200).json({
      expenses: formattedExpenses,
      totalExpense,
    });
  } catch (error) {
    console.error("Error retrieving expenses:", error);
    res.status(500).json({ message: "Failed to retrieve expenses" });
  }
};

module.exports = {
  getAllTotalExpensesByUserId,
  downloadAllTotalExpensesExcel,
  getAllTotalExpensesByTruckId,
};
