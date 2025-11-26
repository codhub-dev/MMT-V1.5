const express = require('express');
const router = express.Router();
const { getOneUserByUsername, getAlluser, deleteOneUserByUsername, manageSubscription, deleteTestUsers } = require("../controllers/admin");

router.get('/getAlluser', getAlluser);

router.get('/getOneUserByUsername', getOneUserByUsername);
router.get('/deleteOneUserByUsername', deleteOneUserByUsername);
router.put('/manageSubscription', manageSubscription);
router.delete('/deleteTestUsers', deleteTestUsers);

module.exports = router;
