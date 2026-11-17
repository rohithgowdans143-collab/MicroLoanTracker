const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get transactions ledger
router.get('/', authenticateToken, transactionController.getTransactions);

// Export transactions to CSV
router.get('/export-csv', authenticateToken, transactionController.exportTransactionsCsv);

module.exports = router;
