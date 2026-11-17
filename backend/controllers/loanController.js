const db = require('../config/db');

// Calculate EMI and interest
const calculateLoanMetrics = (amount, tenureWeeks, annualInterestRate = 8.5) => {
  const principal = parseFloat(amount);
  const weeks = parseInt(tenureWeeks, 10);
  const weeklyRate = (annualInterestRate / 100) / 52;

  // Simple / Flat weekly microloan calculation common in Indian Microfinance
  const totalInterest = principal * (annualInterestRate / 100) * (weeks / 52);
  const totalRepayable = Math.round(principal + totalInterest);
  const weeklyEmi = Math.round(totalRepayable / weeks);

  return {
    principal,
    tenureWeeks: weeks,
    annualInterestRate,
    totalInterest: Math.round(totalInterest),
    totalRepayable,
    weeklyEmi
  };
};

// 1. Borrower applies for a new loan
const applyLoan = async (req, res, next) => {
  try {
    const { amount, tenureWeeks, purpose, interestRate = 8.5 } = req.body;
    const borrower = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid loan amount is required.' });
    }

    if (!tenureWeeks || tenureWeeks <= 0) {
      return res.status(400).json({ success: false, message: 'Valid tenure in weeks is required.' });
    }

    if (!purpose) {
      return res.status(400).json({ success: false, message: 'Loan purpose is required.' });
    }

    const metrics = calculateLoanMetrics(amount, tenureWeeks, interestRate);

    // Determine Risk Grade from user credit score
    const score = borrower.creditScore || 650;
    let riskGrade = 'B';
    if (score >= 780) riskGrade = 'A+';
    else if (score >= 720) riskGrade = 'A';
    else if (score >= 650) riskGrade = 'B';
    else riskGrade = 'C';

    const loanCount = (await db.find('loans')).length + 1;
    const loanId = `ML-2024-${String(loanCount).padStart(3, '0')}`;

    const newLoan = await db.insert('loans', {
      id: loanId,
      borrowerId: borrower.id,
      borrowerName: borrower.name,
      borrowerMobile: borrower.mobile,
      businessType: borrower.businessType || 'Retail Vendor',
      lenderId: null,
      lenderName: null,
      amount: metrics.principal,
      tenureWeeks: metrics.tenureWeeks,
      interestRate: metrics.annualInterestRate,
      totalRepayable: metrics.totalRepayable,
      totalPaid: 0.00,
      remainingBalance: metrics.totalRepayable,
      weeklyEmi: metrics.weeklyEmi,
      purpose: purpose.trim(),
      riskGrade,
      status: 'pending', // pending -> approved -> active -> completed
      disbursedAt: null,
      nextDueDate: null
    });

    return res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully.',
      loan: newLoan
    });
  } catch (err) {
    next(err);
  }
};

// 2. Get list of loans
const getLoans = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    const user = req.user;

    let loans = [];

    if (user.role === 'borrower') {
      loans = await db.find('loans', l => l.borrowerId === user.id);
    } else if (user.role === 'lender') {
      // Lenders see all marketplace loans or their funded loans
      loans = await db.find('loans');
    } else {
      loans = await db.find('loans');
    }

    if (status) {
      loans = loans.filter(l => l.status === status);
    }

    return res.status(200).json({
      success: true,
      count: loans.length,
      loans
    });
  } catch (err) {
    next(err);
  }
};

// 3. Get single loan details with repayment breakdown
const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = await db.findOne('loans', l => l.id === id);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Authorization check
    if (req.user.role === 'borrower' && loan.borrowerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const repayments = await db.find('repayments', r => r.loanId === id);

    return res.status(200).json({
      success: true,
      loan,
      repayments
    });
  } catch (err) {
    next(err);
  }
};

// 4. Lender/Admin approves a loan application
const approveLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lender = req.user;

    const loan = await db.findOne('loans', l => l.id === id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Loan cannot be approved from current state: '${loan.status}'`
      });
    }

    const updated = await db.update('loans', l => l.id === id, {
      status: 'approved',
      lenderId: lender.id,
      lenderName: lender.name
    });

    return res.status(200).json({
      success: true,
      message: `Loan ${id} approved successfully!`,
      loan: updated
    });
  } catch (err) {
    next(err);
  }
};

// 5. Reject a loan
const rejectLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const loan = await db.findOne('loans', l => l.id === id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    const updated = await db.update('loans', l => l.id === id, {
      status: 'rejected',
      rejectionReason: reason || 'Not meeting risk criteria'
    });

    return res.status(200).json({
      success: true,
      message: `Loan ${id} rejected.`,
      loan: updated
    });
  } catch (err) {
    next(err);
  }
};

// 6. Disburse funds
const disburseLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lender = req.user;

    const loan = await db.findOne('loans', l => l.id === id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    if (loan.status !== 'approved' && loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only approved loans can be disbursed. Current status: ${loan.status}`
      });
    }

    const now = new Date();
    const nextDue = new Date();
    nextDue.setDate(now.getDate() + 7); // First EMI due in 7 days

    const updated = await db.update('loans', l => l.id === id, {
      status: 'active',
      lenderId: lender.id,
      lenderName: lender.name,
      disbursedAt: now.toISOString(),
      nextDueDate: nextDue.toISOString().split('T')[0]
    });

    // Record ledger transaction
    const txnId = `TXN-DISB-${Date.now().toString().slice(-6)}`;
    await db.insert('transactions', {
      id: txnId,
      type: 'disbursement',
      loanId: loan.id,
      borrowerId: loan.borrowerId,
      lenderId: lender.id,
      amount: loan.amount,
      status: 'completed',
      description: `Loan fund disbursement of ₹${loan.amount} for ${loan.borrowerName} (${loan.purpose})`
    });

    return res.status(200).json({
      success: true,
      message: `Funds of ₹${loan.amount} disbursed to ${loan.borrowerName}. Loan is now active!`,
      loan: updated,
      transactionId: txnId
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyLoan,
  getLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  disburseLoan
};
