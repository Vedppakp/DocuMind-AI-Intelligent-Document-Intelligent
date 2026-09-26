const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMetrics } = require('../controllers/adminController');

router.get('/metrics', authenticate, getMetrics);

module.exports = router;
