const express = require('express');
const {
  addIncome,
  getAllIncomesByTruckId,
  getAllIncomesByUserId,
  updateIncomeById,
  deleteIncomeById,
  downloadIncomesExcel,
  downloadAllIncomesExcel
} = require('../controllers/income');

const router = express.Router();

router.post('/addIncome', addIncome);
router.get('/getAllIncomesByTruckId', getAllIncomesByTruckId);
router.get('/getAllIncomesByUserId', getAllIncomesByUserId);
router.put('/updateIncomeByTruckId/:id', updateIncomeById);
router.delete('/deleteIncomeById/:id', deleteIncomeById);
router.get('/downloadIncomesExcel', downloadIncomesExcel);
router.get('/downloadAllIncomesExcel', downloadAllIncomesExcel);

module.exports = router;