const express = require('express');
const {
  addDefExpense,
  getAllDefExpensesByTruckId,
  getAllDefExpensesByUserId,
  deleteDefExpenseById,
  downloadDefExpensesExcel,
  downloadAllDefExpensesExcel,
  updateDefExpenseByTruckId
} = require('../controllers/defExpenses');

const router = express.Router();

router.post('/addDefExpense', addDefExpense);
router.get('/getAllDefExpensesByTruckId', getAllDefExpensesByTruckId);
router.get('/getAllDefExpensesByUserId', getAllDefExpensesByUserId);
router.put('/updateDefExpenseByTruckId/:id', updateDefExpenseByTruckId);
router.delete('/deleteDefExpenseById/:id', deleteDefExpenseById);
router.get('/downloadDefExpensesExcel', downloadDefExpensesExcel);
router.get('/downloadAllDefExpensesExcel', downloadAllDefExpensesExcel);

module.exports = router;
