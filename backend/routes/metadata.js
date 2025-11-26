const express = require("express");
const {
  getMetadataByTruckId,
  getMetadataByUserId,
  getProfileMetadataByUserId,
  getSixMonthsDataByUserId
} = require("../controllers/metadata");

const router = express.Router();

router.get("/getMetadataByTruckId", getMetadataByTruckId);
router.get("/getMetadataByUserId", getMetadataByUserId);
router.get("/getProfileMetadataByUserId", getProfileMetadataByUserId);
router.get('/getSixMonthsDataByUserId', getSixMonthsDataByUserId);

module.exports = router;
