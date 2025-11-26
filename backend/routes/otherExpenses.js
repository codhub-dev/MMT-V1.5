const express = require('express');
const {
  addOtherExpense,
  getAllOtherExpensesByTruckId,
  getAllOtherExpensesByUserId,
  deleteOtherExpenseById,
  downloadOtherExpensesExcel,
  downloadAllOtherExpensesExcel,
  updateOtherExpenseByTruckId
} = require('../controllers/otherExpenses');

const router = express.Router();

router.post('/addOtherExpense', addOtherExpense);
router.get('/getAllOtherExpensesByTruckId', getAllOtherExpensesByTruckId);
router.get('/getAllOtherExpensesByUserId', getAllOtherExpensesByUserId);
router.put('/updateOtherExpenseByTruckId/:id', updateOtherExpenseByTruckId);
router.delete('/deleteOtherExpenseById/:id', deleteOtherExpenseById);
router.get('/downloadOtherExpensesExcel', downloadOtherExpensesExcel);
router.get('/downloadAllOtherExpensesExcel', downloadAllOtherExpensesExcel);

module.exports = router;
