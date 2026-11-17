const express = require('express');
const router = express.Router();
const creditScoreController = require('../controllers/creditScoreController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get credit score and 4-factor breakdown
router.get('/score', authenticateToken, creditScoreController.getCreditScoreDetails);

module.exports = router;
