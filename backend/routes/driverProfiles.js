const express = require('express');
const {
    addDriverProfile,
    getDriverProfileById,
    getAllDriverProfilesByUser,
    getAllDriverProfiles,
    updateDriverProfileById,
    deleteDriverProfileById,
    permanentDeleteDriverProfileById,
    restoreDriverProfileById,
    getDriverStatsByUser
} = require('../controllers/driverProfiles');

const router = express.Router();

// Basic CRUD operations
router.post('/addDriverProfile', addDriverProfile);
router.get('/getDriverProfileById/:id', getDriverProfileById);
router.get('/getAllDriverProfilesByUser/:addedBy', getAllDriverProfilesByUser);
router.get('/getAllDriverProfiles', getAllDriverProfiles);
router.put('/updateDriverProfileById/:id', updateDriverProfileById);
router.delete('/deleteDriverProfileById/:id', deleteDriverProfileById);

// Admin routes
router.delete('/permanentDeleteDriverProfileById/:id', permanentDeleteDriverProfileById);
router.put('/restoreDriverProfileById/:id', restoreDriverProfileById);

// Statistics routes
router.get('/getDriverStatsByUser/:addedBy', getDriverStatsByUser);

module.exports = router;