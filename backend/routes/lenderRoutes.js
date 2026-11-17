const express = require('express');
const router = express.Router();
const lenderController = require('../controllers/lenderController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Get portfolio overview (Lender only)
router.get('/portfolio', authenticateToken, requireRole('lender', 'admin'), lenderController.getPortfolioSummary);

// Browse borrowers directory (Lender only)
router.get('/borrowers', authenticateToken, requireRole('lender', 'admin'), lenderController.getBorrowers);

module.exports = router;
