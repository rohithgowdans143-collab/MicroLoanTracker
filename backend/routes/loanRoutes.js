const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Get all loans (filtered by role or query)
router.get('/', authenticateToken, loanController.getLoans);

// Get single loan details
router.get('/:id', authenticateToken, loanController.getLoanById);

// Apply for loan (Borrowers only)
router.post('/apply', authenticateToken, requireRole('borrower'), loanController.applyLoan);

// Approve loan (Lender or Admin)
router.put('/:id/approve', authenticateToken, requireRole('lender', 'admin'), loanController.approveLoan);

// Reject loan
router.put('/:id/reject', authenticateToken, requireRole('lender', 'admin'), loanController.rejectLoan);

// Disburse funds (Lender or Admin)
router.post('/:id/disburse', authenticateToken, requireRole('lender', 'admin'), loanController.disburseLoan);

module.exports = router;
