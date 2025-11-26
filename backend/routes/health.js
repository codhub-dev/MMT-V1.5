const express = require('express');
const router = express.Router();

router.get('/checkHealth', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Service is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
