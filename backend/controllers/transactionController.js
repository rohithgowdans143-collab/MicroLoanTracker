const db = require('../config/db');

// 1. Get transactions ledger
const getTransactions = async (req, res, next) => {
  try {
    const { type, loanId, limit = 50 } = req.query;
    const user = req.user;

    let txns = await db.find('transactions');

    // Role filtering
    if (user.role === 'borrower') {
      txns = txns.filter(t => t.borrowerId === user.id);
    } else if (user.role === 'lender') {
      txns = txns.filter(t => t.lenderId === user.id || !t.lenderId);
    }

    if (type) {
      txns = txns.filter(t => t.type === type.toLowerCase());
    }

    if (loanId) {
      txns = txns.filter(t => t.loanId === loanId);
    }

    // Sort newest first
    txns.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

    return res.status(200).json({
      success: true,
      count: txns.length,
      transactions: txns.slice(0, parseInt(limit, 10))
    });
  } catch (err) {
    next(err);
  }
};

// 2. Export transactions to CSV
const exportTransactionsCsv = async (req, res, next) => {
  try {
    const user = req.user;
    let txns = await db.find('transactions');

    if (user.role === 'borrower') {
      txns = txns.filter(t => t.borrowerId === user.id);
    } else if (user.role === 'lender') {
      txns = txns.filter(t => t.lenderId === user.id || !t.lenderId);
    }

    // CSV Headers
    const headers = ['Transaction ID', 'Date & Time', 'Type', 'Loan ID', 'Amount (INR)', 'Status', 'Description'];
    const rows = txns.map(t => [
      t.id,
      t.timestamp || t.createdAt,
      t.type.toUpperCase(),
      t.loanId || 'N/A',
      t.amount,
      t.status.toUpperCase(),
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=MicroLend_Transactions_${Date.now()}.csv`);

    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTransactions,
  exportTransactionsCsv
};
