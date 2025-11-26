const express = require('express');
const {
  addLoanCalculation,
  getAllLoanCalculationsByTruckId,
  getAllLoanCalculationsByUserId,
  deleteLoanCalculationById,
  downloadLoanCalculationsExcel,
  downloadAllLoanCalculationsExcel
} = require('../controllers/calculateLoan');

const router = express.Router();

router.post('/addLoanCalculation', addLoanCalculation);
router.get('/getAllLoanCalculationsByTruckId', getAllLoanCalculationsByTruckId);
router.get('/getAllLoanCalculationsByUserId', getAllLoanCalculationsByUserId);
router.delete('/deleteLoanCalculationById/:id', deleteLoanCalculationById);
router.get('/downloadLoanCalculationExcel', downloadLoanCalculationsExcel);
router.get('/downloadAllLoanCalculationExcel', downloadAllLoanCalculationsExcel);

module.exports = router;
