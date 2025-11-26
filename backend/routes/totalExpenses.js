const express = require('express');
const {
  getAllTotalExpensesByUserId,
  downloadAllTotalExpensesExcel,
  getAllTotalExpensesByTruckId
} = require('../controllers/totalExpenses');

const router = express.Router();

router.get('/getAllTotalExpensesByUserId', getAllTotalExpensesByUserId);
router.get('/downloadAllTotalExpensesExcel', downloadAllTotalExpensesExcel);
router.get('/getAllTotalExpensesByTruckId', getAllTotalExpensesByTruckId);

module.exports = router;
