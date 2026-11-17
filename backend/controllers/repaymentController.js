const db = require('../config/db');

// 1. Process a loan repayment
const makeRepayment = async (req, res, next) => {
  try {
    const { loanId, amount, paymentMode = 'upi', note } = req.body;
    const borrower = req.user;

    if (!loanId) {
      return res.status(400).json({ success: false, message: 'Loan ID is required.' });
    }

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    const loan = await db.findOne('loans', l => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Permission check
    if (borrower.role === 'borrower' && loan.borrowerId !== borrower.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized loan repayment.' });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot repay loan with status '${loan.status}'. Only active loans accept repayments.`
      });
    }

    // Calculate new balances
    const newTotalPaid = Math.round((loan.totalPaid || 0) + payAmount);
    const newRemaining = Math.max(0, Math.round(loan.remainingBalance - payAmount));
    const isFullyPaid = newRemaining === 0;

    // Advance next due date by 7 days if active
    let nextDue = loan.nextDueDate;
    if (!isFullyPaid && loan.nextDueDate) {
      const d = new Date(loan.nextDueDate);
      d.setDate(d.getDate() + 7);
      nextDue = d.toISOString().split('T')[0];
    } else if (isFullyPaid) {
      nextDue = null;
    }

    // Update Loan record
    const updatedLoan = await db.update('loans', l => l.id === loanId, {
      totalPaid: newTotalPaid,
      remainingBalance: newRemaining,
      status: isFullyPaid ? 'completed' : 'active',
      nextDueDate: nextDue
    });

    // Create unique receipt number and transaction ID
    const receiptNumber = `ML-TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    const transactionId = `UPI-${Date.now().toString().slice(-8)}`;

    const repayment = await db.insert('repayments', {
      receiptNumber,
      loanId: loan.id,
      borrowerId: loan.borrowerId,
      borrowerName: loan.borrowerName,
      amount: payAmount,
      paymentMode: paymentMode.toLowerCase(),
      transactionId,
      balanceAfterPayment: newRemaining,
      status: 'success',
      paidAt: new Date().toISOString(),
      note: note || 'Microloan installment payment'
    });

    // Record in global transaction ledger
    await db.insert('transactions', {
      id: transactionId,
      type: 'repayment',
      loanId: loan.id,
      borrowerId: loan.borrowerId,
      lenderId: loan.lenderId,
      amount: payAmount,
      status: 'completed',
      description: `Repayment of ₹${payAmount} for ${loan.id} via ${paymentMode.toUpperCase()}`
    });

    // Boost borrower's credit score for successful timely repayment
    const user = await db.findOne('users', u => u.id === loan.borrowerId);
    if (user) {
      const currentScore = user.creditScore || 680;
      const bonus = isFullyPaid ? 25 : 5;
      const updatedScore = Math.min(850, currentScore + bonus);
      await db.update('users', u => u.id === loan.borrowerId, { creditScore: updatedScore });
    }

    return res.status(200).json({
      success: true,
      message: isFullyPaid ? '🎉 Congratulations! Loan has been fully repaid.' : 'Repayment recorded successfully.',
      receipt: {
        receiptNumber,
        transactionId,
        loanId: loan.id,
        borrowerName: loan.borrowerName,
        amount: payAmount,
        paymentMode: paymentMode.toUpperCase(),
        paidAt: repayment.paidAt,
        remainingBalance: newRemaining,
        loanStatus: updatedLoan.status
      },
      updatedLoan
    });
  } catch (err) {
    next(err);
  }
};

// 2. Get Receipt by Receipt Number
const getReceipt = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;
    const repayment = await db.findOne('repayments', r => r.receiptNumber === receiptNumber);

    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    const loan = await db.findOne('loans', l => l.id === repayment.loanId);

    return res.status(200).json({
      success: true,
      receipt: repayment,
      loan
    });
  } catch (err) {
    next(err);
  }
};

// 3. Get all repayments for a loan
const getLoanRepayments = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const repayments = await db.find('repayments', r => r.loanId === loanId);

    return res.status(200).json({
      success: true,
      count: repayments.length,
      repayments
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  makeRepayment,
  getReceipt,
  getLoanRepayments
};
