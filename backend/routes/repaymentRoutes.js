const express = require('express');
const router = express.Router();
const repaymentController = require('../controllers/repaymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Make a repayment
router.post('/pay', authenticateToken, repaymentController.makeRepayment);

// Get receipt details
router.get('/receipt/:receiptNumber', authenticateToken, repaymentController.getReceipt);

// Get repayment history for a specific loan
router.get('/loan/:loanId', authenticateToken, repaymentController.getLoanRepayments);

module.exports = router;
