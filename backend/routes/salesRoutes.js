const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Log daily vendor sales (Borrower only)
router.post('/log', authenticateToken, requireRole('borrower'), salesController.logSales);

// Get sales history and profit summary
router.get('/history', authenticateToken, salesController.getSalesHistory);

module.exports = router;
