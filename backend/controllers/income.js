const { default: mongoose } = require("mongoose");
const Income = require("../models/income-model");
const moment = require("moment");
const ExcelJS = require("exceljs");
const TruckExpense = require("../models/truck-model");
const FuelExpense = require("../models/fuelExpense-model");
const DefExpense = require("../models/defExpense-model");
const OtherExpense = require("../models/otherExpense-model");
const LoanCalculation = require("../models/calculateLoan-model");
const logger = require("../utils/logger");
const { getFullContext } = require("../utils/requestContext");

// Controller to add a new income record
const addIncome = async (req, res) => {
  try {
    const { truckId, addedBy, date, amount, note } = req.body;

    logger.info("Adding new income", getFullContext(req, { truckId, addedBy, amount, date }));

    const newIncome = new Income({
      truckId,
      addedBy,
      date,
      amount,
      note,
    });

    const savedIncome = await newIncome.save();

    logger.info("Income added successfully", getFullContext(req, {
      incomeId: savedIncome._id,
      truckId,
      addedBy,
      amount,
      date,
    }));

    res.status(201).json(savedIncome);
  } catch (error) {
    console.error("Error adding income:", error);
    logger.error("Failed to add income", getFullContext(req, {
      error: error.message,
      stack: error.stack
    }));
    res.status(500).json({ message: "Failed to add income" });
  }
};

const getAllIncomesByTruckId = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;

    logger.info("Fetching incomes by truck ID", getFullContext(req, { truckId, selectedDates }));

    if (!truckId) {
      logger.warn("Truck ID missing in income fetch request", getFullContext(req));
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
        query.date = {
          $eq: startDate,
        };
      } else {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Fetch all incomes for the given truckId and date range
    const incomes = await Income.find(query).sort({ date: 1 });

    if (incomes.length === 0) {
      return res.status(404).json({
        message: "No incomes found for this truck in the given date range",
      });
    }

    const totalIncome = incomes.reduce(
      (sum, income) => sum + income.amount,
      0
    );

    // Fetch truck details to check if it's financed
    const truck = await TruckExpense.findById(truckId);
    const isFinanced = truck ? truck.isFinanced : false;

    // Fetch all expenses for the same truck and date range
    const expenseQuery = { truckId };
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        expenseQuery.date = { $eq: startDate };
      } else {
        expenseQuery.date = { $gte: startDate, $lte: endDate };
      }
    }

    const fuelExpenses = await FuelExpense.find(expenseQuery);
    const defExpenses = await DefExpense.find(expenseQuery);
    const otherExpenses = await OtherExpense.find(expenseQuery);
    const loanExpenses = isFinanced ? await LoanCalculation.find(expenseQuery) : [];

    const totalExpenses =
      fuelExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      defExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      otherExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      loanExpenses.reduce((sum, expense) => sum + expense.cost, 0);

    const totalProfit = totalIncome - totalExpenses;

    // Format the date
    const formattedIncomes = incomes.map((income, index) => {
      const date = new Date(income.date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      return {
        ...income.toObject(),
        date: formattedDate,
        key: index,
      };
    });

    res.status(200).json({
      expenses: formattedIncomes,
      totalExpense: totalIncome,
      totalProfit: totalProfit,
    });
  } catch (error) {
    console.error("Error retrieving incomes:", error);
    res.status(500).json({ message: "Failed to retrieve incomes" });
  }
};

const getAllIncomesByUserId = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;

    if (!userId) {
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
        query.date = {
          $eq: startDate,
        };
      } else {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Fetch all incomes for the given userId and date range
    const incomes = await Income.find(query).sort({ date: 1 });

    if (incomes.length === 0) {
      return res.status(404).json({
        message: "No incomes found for this user in the given date range",
      });
    }

    // Find registration numbers for each truckId in the incomes
    const formattedIncomes = await Promise.all(
      incomes.map(async (income, index) => {
        const truck = await TruckExpense.findById(income.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(income.date);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        return {
          ...income.toObject(),
          date: formattedDate,
          registrationNo,
          key: index,
        };
      })
    );

    const totalIncome = incomes.reduce(
      (sum, income) => sum + income.amount,
      0
    );

    // Fetch all trucks for the user to check which are financed
    const userTrucks = await TruckExpense.find({ addedBy: userId });
    const financedTruckIds = userTrucks
      .filter(truck => truck.isFinanced)
      .map(truck => truck._id.toString());

    // Fetch all expenses for the same user and date range
    const expenseQuery = { addedBy: userId };
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        expenseQuery.date = { $eq: startDate };
      } else {
        expenseQuery.date = { $gte: startDate, $lte: endDate };
      }
    }

    const fuelExpenses = await FuelExpense.find(expenseQuery);
    const defExpenses = await DefExpense.find(expenseQuery);
    const otherExpenses = await OtherExpense.find(expenseQuery);

    // Only fetch loan expenses for financed trucks
    const loanExpenseQuery = { ...expenseQuery };
    if (financedTruckIds.length > 0) {
      loanExpenseQuery.truckId = { $in: financedTruckIds };
    }
    const loanExpenses = financedTruckIds.length > 0
      ? await LoanCalculation.find(loanExpenseQuery)
      : [];

    const totalExpenses =
      fuelExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      defExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      otherExpenses.reduce((sum, expense) => sum + expense.cost, 0) +
      loanExpenses.reduce((sum, expense) => sum + expense.cost, 0);

    const totalProfit = totalIncome - totalExpenses;

    res.status(200).json({
      expenses: formattedIncomes,
      totalExpense: totalIncome,
      totalProfit: totalProfit,
    });
  } catch (error) {
    console.error("Error retrieving incomes:", error);
    res.status(500).json({ message: "Failed to retrieve incomes" });
  }
};

const updateIncomeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { truckId, addedBy, date, amount, note } = req.body;

    // Validate the income ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid income ID" });
    }

    // Update the income
    const updatedIncome = await Income.findByIdAndUpdate(
      { _id: id },
      {
        truckId,
        addedBy,
        date,
        amount,
        note,
      },
      { new: true }
    );

    if (!updatedIncome) {
      return res.status(404).json({ message: "Income not found" });
    }

    logger.info(`Income updated successfully`, {
      incomeId: id,
      truckId,
      addedBy,
      amount,
    });

    res.status(200).json({
      message: "Income updated successfully",
      expense: updatedIncome,
    });
  } catch (error) {
    console.error("Error updating income:", error);
    logger.error(`Failed to update income`, {
      incomeId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to update income", error: error.message });
  }
};

const deleteIncomeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Income ID" });
    }

    const deletedIncome = await Income.findByIdAndDelete(id);

    if (!deletedIncome) {
      return res.status(404).json({ message: "Income not found" });
    }

    logger.info(`Income deleted successfully`, {
      incomeId: id,
      truckId: deletedIncome.truckId,
      amount: deletedIncome.amount,
    });

    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Error deleting income:", error);
    logger.error(`Failed to delete income`, {
      incomeId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to delete income", error: error.message });
  }
};

const downloadIncomesExcel = async (req, res) => {
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

    const incomes = await Income.find(query).sort({ date: 1 });
    const truck = await TruckExpense.findById(truckId);

    if (incomes.length === 0) {
      return res.status(404).json({
        message: "No incomes found for this truck in the given date range",
      });
    }

    // Prepare data for Excel
    const data = incomes.map((income) => {
      const date = new Date(income.date);
      const formattedDate = date.toISOString().split("T")[0];

      return {
        Date: formattedDate,
        Amount: income.amount,
        Note: income.note || "",
      };
    });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Incomes");

    // Main Title
    worksheet.mergeCells("A1:C1");
    worksheet.getCell("A1").value = "Manage My Truck - Incomes";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" },
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Truck and Date Range)
    worksheet.mergeCells("A2:C2");
    worksheet.getCell("A2").value = `${truck.registrationNo} | ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = ["Date", "Amount", "Note"];
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
      worksheet.addRow([row.Date, row.Amount, row.Note]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 15 },
      { width: 30 },
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

    logger.info(`Income Excel downloaded`, {
      truckId,
      dateRange: selectedDates,
      recordCount: incomes.length,
    });

    // Set headers for the response
    res.setHeader("Content-Disposition", "attachment; filename=incomes.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    logger.error(`Failed to generate income Excel`, {
      truckId: req.query.truckId,
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to generate Excel file", error: error.message });
  }
};

const downloadAllIncomesExcel = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;

    if (!userId) {
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

    const incomes = await Income.find(query).sort({ date: 1 });

    if (incomes.length === 0) {
      return res.status(404).json({
        message: "No incomes found for this user in the given date range",
      });
    }

    // Prepare data for Excel with registration number
    const data = await Promise.all(
      incomes.map(async (income) => {
        const date = new Date(income.date);
        const formattedDate = date.toISOString().split("T")[0];

        const truck = await TruckExpense.findById(income.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        return {
          Date: formattedDate,
          "Registration No": registrationNo,
          Amount: income.amount,
          Note: income.note || "",
        };
      })
    );

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Incomes");

    // Main Title
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "Manage My Truck - All Incomes";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" },
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Date Range)
    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = `Date Range: ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = ["Date", "Registration No", "Amount", "Note"];
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
        row.Amount,
        row.Note,
      ]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 30 },
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

    logger.info(`All incomes Excel downloaded`, {
      userId,
      dateRange: selectedDates,
      recordCount: incomes.length,
    });

    // Set headers for the response
    res.setHeader("Content-Disposition", "attachment; filename=incomes.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    logger.error(`Failed to generate all incomes Excel`, {
      userId: req.query.userId,
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to generate Excel file", error: error.message });
  }
};

module.exports = {
  addIncome,
  getAllIncomesByTruckId,
  getAllIncomesByUserId,
  updateIncomeById,
  deleteIncomeById,
  downloadIncomesExcel,
  downloadAllIncomesExcel,
};