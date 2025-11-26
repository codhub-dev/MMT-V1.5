const express = require('express');
const {
    addAlert,
    getAlertById,
    getAllAlertsByUser,
    getAllAlerts,
    updateAlertById,
    markAlertAsRead,
    deleteAlertById,
    permanentDeleteAlertById,
    restoreAlertById,
    getAlertsSummary,
    markRecurringAlertAsDone
} = require('../controllers/alerts');

const router = express.Router();

// Basic CRUD operations
router.post('/addAlert', addAlert);
router.get('/getAlertById/:id', getAlertById);
router.get('/getAllAlertsByUser/:addedBy', getAllAlertsByUser);
router.get('/getAllAlerts', getAllAlerts);
router.put('/updateAlertById/:id', updateAlertById);
router.delete('/deleteAlertById/:id', deleteAlertById);

// Alert status operations
router.put('/markAlertAsRead/:id', markAlertAsRead);
router.put('/markRecurringAlertAsDone/:id', markRecurringAlertAsDone);

// Admin routes
router.delete('/permanentDeleteAlertById/:id', permanentDeleteAlertById);
router.put('/restoreAlertById/:id', restoreAlertById);

// Summary and statistics routes
router.get('/getAlertsSummary/:addedBy', getAlertsSummary);

module.exports = router;
