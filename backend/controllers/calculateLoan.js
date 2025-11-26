const { default: mongoose } = require("mongoose");
const LoanCalculation = require("../models/calculateLoan-model");
const moment = require("moment");
const ExcelJS = require("exceljs");
const Truck = require("../models/truck-model");

// Use global logger (which already handles Papertrail HTTPS + console)
const logger = require("../utils/logger");
const { getFullContext } = require("../utils/requestContext");

// Controller to add a new loan filling record
const addLoanCalculation = async (req, res) => {
  try {
    const { truckId, addedBy, date, cost, additionalCharges, note } = req.body;

    logger.info("Adding new loan calculation", getFullContext(req, {
      truckId,
      addedBy,
      date,
      cost,
      additionalCharges
    }));

    const newLoanCalculation = new LoanCalculation({
      truckId,
      addedBy,
      date,
      cost,
      additionalCharges,
      note
    });

    const savedLoanCalculation = await newLoanCalculation.save();

    logger.info("Loan calculation added successfully", getFullContext(req, {
      calculationId: savedLoanCalculation._id,
      truckId,
      cost
    }));

    res.status(201).json(savedLoanCalculation);
  } catch (error) {
    console.error("Error adding loan filling:", error);
    logger.error("Failed to add loan calculation", {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: "Failed to add loan filling" });
  }
};

const getAllLoanCalculationsByTruckId = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;

    if (!truckId) {
      logger.warn("Missing truck ID for loan calculation fetch");
      return res.status(400).json({ message: "Truck ID is required" });
    }

    logger.info("Fetching loan calculations by truck ID", {
      truckId,
      selectedDates
    });

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

    const loanCalculations = await LoanCalculation.find(query).sort({ date: 1 });

    const totalCalculation = loanCalculations.reduce(
      (sum, calculation) => sum + calculation.cost,
      0
    );

    const truck = await Truck.findOne({ _id: truckId });
    const totalFinanceAmount = truck ? truck.financeAmount : 0;

    const recentPayment = await LoanCalculation.findOne({ truckId }).sort({
      createdAt: -1
    });

    const totalPaid = await LoanCalculation.aggregate([
      { $match: { truckId } },
      { $group: { _id: null, totalPaid: { $sum: "$cost" } } }
    ]);

    const totalPaidAmount = totalPaid.length > 0 ? totalPaid[0].totalPaid : 0;

    const additionalChargesResult = await LoanCalculation.aggregate([
      { $match: { truckId } },
      {
        $group: {
          _id: null,
          totalAdditionalCharges: { $sum: "$additionalCharges" }
        }
      }
    ]);

    const totalAdditionalCharges =
      additionalChargesResult.length > 0
        ? additionalChargesResult[0].totalAdditionalCharges
        : 0;

    const paymentLeft =
      totalFinanceAmount + totalAdditionalCharges - totalPaidAmount;

    const formattedLoanCalculations = loanCalculations.map((calculation, index) => {
      const date = new Date(calculation.date);
      const formattedDate = date.toISOString().split("T")[0];

      return {
        ...calculation.toObject(),
        date: formattedDate,
        key: index
      };
    });

    logger.info("Loan calculations retrieved successfully", {
      truckId,
      count: loanCalculations.length,
      totalCalculation,
      paymentLeft
    });

    res.status(200).json({
      calculations: formattedLoanCalculations,
      totalCalculation,
      totalFinanceAmount,
      recentPayment,
      paymentLeft,
      totalAdditionalCharges
    });
  } catch (error) {
    console.error("Error retrieving loan calculations:", error);
    logger.error("Failed to retrieve loan calculations by truck ID", {
      error: error.message,
      truckId: req.query.truckId
    });
    res.status(500).json({ message: "Failed to retrieve loan calculations" });
  }
};

const getAllLoanCalculationsByUserId = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;

    if (!userId) {
      logger.warn("Missing user ID for loan calculation fetch");
      return res.status(400).json({ message: "User ID is required" });
    }

    logger.info("Fetching loan calculations by user ID", {
      userId,
      selectedDates
    });

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

    const loanCalculations = await LoanCalculation.find(query).sort({ date: 1 });

    if (loanCalculations.length === 0) {
      return res.status(404).json({
        message: "No loan calculations found for this user in the given date range"
      });
    }

    const formattedLoanCalculations = await Promise.all(
      loanCalculations.map(async (calculation, index) => {
        const truck = await Truck.findById(calculation.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(calculation.date);
        const formattedDate = moment(date).format("DD-MM-YYYY");

        return {
          ...calculation.toObject(),
          date: formattedDate,
          registrationNo,
          key: index
        };
      })
    );

    const totalCalculation = loanCalculations.reduce(
      (sum, calculation) => sum + calculation.cost,
      0
    );

    logger.info("Loan calculations retrieved successfully by user ID", {
      userId,
      count: loanCalculations.length,
      totalCalculation
    });

    res.status(200).json({
      calculations: formattedLoanCalculations,
      totalCalculation
    });
  } catch (error) {
    console.error("Error retrieving loan calculations:", error);
    logger.error("Failed to retrieve loan calculations by user ID", {
      error: error.message,
      userId: req.query.userId
    });
    res.status(500).json({ message: "Failed to retrieve loan calculations" });
  }
};

const deleteLoanCalculationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn("Invalid loan calculation ID for deletion", { id });
      return res.status(400).json({ message: "Invalid Calculation ID" });
    }

    logger.info("Deleting loan calculation", { calculationId: id });

    const deletedCalculation = await LoanCalculation.findByIdAndDelete(id);

    if (!deletedCalculation) {
      logger.warn("Loan calculation not found for deletion", { calculationId: id });
      return res.status(404).json({ message: "Calculation not found" });
    }

    logger.info("Loan calculation deleted successfully", {
      calculationId: id,
      truckId: deletedCalculation.truckId
    });

    res.status(200).json({ message: "Calculation deleted" });
  } catch (error) {
    console.error("Error deleting loan calculation:", error);
    logger.error("Failed to delete loan calculation", {
      error: error.message,
      calculationId: req.params.id
    });
    res.status(500).json({ message: "Failed to delete Calculation", error: error.message });
  }
};

const downloadLoanCalculationsExcel = async (req, res) => {
  try {
    const { truckId, selectedDates } = req.query;

    if (!truckId) {
      return res.status(400).json({ message: "Truck ID is required" });
    }

    logger.info("Generating loan calculations Excel file", {
      truckId,
      selectedDates
    });

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

    const loanCalculations = await LoanCalculation.find(query).sort({ date: 1 });
    const truck = await Truck.findById(truckId);

    if (loanCalculations.length === 0) {
      return res.status(404).json({
        message: "No loan calculations found for this truck in the given date range"
      });
    }

    const data = loanCalculations.map(calculation => {
      const date = new Date(calculation.date);
      const formattedDate = date.toISOString().split("T")[0];

      return {
        Date: formattedDate,
        Cost: calculation.cost,
        AdditionalCharges: calculation.additionalCharges || 0,
        Note: calculation.note || ""
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Loan Calculations");

    // Main Title
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "Manage My Truck - Loan Calculations";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" }
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Truck and Date Range)
    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = `${truck.registrationNo} | ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = ["Date", "Cost", "Additional Charges", "Note"];
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
    data.forEach(row => {
      worksheet.addRow([row.Date, row.Cost, row.AdditionalCharges, row.Note]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 15 },
      { width: 20 },
      { width: 25 }
    ];

    // Add borders and center alignment to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        const existingFill = cell.fill;
        cell.border = {
          top: { style: "thin", color: { argb: "CCCCCC" } },
          left: { style: "thin", color: { argb: "CCCCCC" } },
          bottom: { style: "thin", color: { argb: "CCCCCC" } },
          right: { style: "thin", color: { argb: "CCCCCC" } }
        };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        if (existingFill) {
          cell.fill = existingFill;
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=loanCalculations.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    logger.info("Loan calculations Excel generated successfully", {
      truckId,
      recordCount: loanCalculations.length
    });

    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    logger.error("Failed to generate loan calculations Excel", {
      error: error.message,
      truckId: req.query.truckId
    });
    res.status(500).json({
      message: "Failed to generate Excel file",
      error: error.message
    });
  }
};

const downloadAllLoanCalculationsExcel = async (req, res) => {
  try {
    const { userId, selectedDates } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    logger.info("Generating Excel for all loan calculations by user", {
      userId,
      selectedDates
    });

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

    const loanCalculations = await LoanCalculation.find(query).sort({ date: 1 });

    if (loanCalculations.length === 0) {
      return res.status(404).json({
        message: "No loan calculations found for this user in the selected range"
      });
    }

    const data = await Promise.all(
      loanCalculations.map(async calculation => {
        const truck = await Truck.findById(calculation.truckId);
        const registrationNo = truck ? truck.registrationNo : "Unknown";

        const date = new Date(calculation.date);
        const formattedDate = date.toISOString().split("T")[0];

        return {
          Date: formattedDate,
          RegistrationNo: registrationNo,
          Cost: calculation.cost,
          Note: calculation.note || ""
        };
      })
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Loan Calculations");

    // Main Title
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "Manage My Truck - All Loan Calculations";
    worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C4736" }
    };
    worksheet.getRow(1).height = 36;

    // Subtitle (Date Range)
    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = `Date Range: ${selectedDates[0]} to ${selectedDates[1]}`;
    worksheet.getCell("A2").font = { size: 12, bold: true, color: { argb: "333333" } };
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };

    // Column Headings
    const headings = ["Date", "Registration No", "Cost", "Note"];
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
    data.forEach(row => {
      worksheet.addRow([row.Date, row.RegistrationNo, row.Cost, row.Note]);
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 25 }
    ];

    // Add borders and center alignment to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        const existingFill = cell.fill;
        cell.border = {
          top: { style: "thin", color: { argb: "CCCCCC" } },
          left: { style: "thin", color: { argb: "CCCCCC" } },
          bottom: { style: "thin", color: { argb: "CCCCCC" } },
          right: { style: "thin", color: { argb: "CCCCCC" } }
        };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        if (existingFill) {
          cell.fill = existingFill;
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=loanCalculations.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    logger.info("All loan calculations Excel generated successfully", {
      userId,
      recordCount: loanCalculations.length
    });

    res.send(buffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    logger.error("Failed to generate all loan calculations Excel", {
      error: error.message,
      userId: req.query.userId
    });
    res.status(500).json({
      message: "Failed to generate Excel file",
      error: error.message
    });
  }
};

module.exports = {
  addLoanCalculation,
  getAllLoanCalculationsByTruckId,
  deleteLoanCalculationById,
  downloadLoanCalculationsExcel,
  getAllLoanCalculationsByUserId,
  downloadAllLoanCalculationsExcel
};
