const db = require('../config/db');

// 1. Get Lender Portfolio Summary
const getPortfolioSummary = async (req, res, next) => {
  try {
    const lender = req.user;

    const allLoans = await db.find('loans');
    const fundedLoans = allLoans.filter(l => l.lenderId === lender.id);

    const totalInvested = fundedLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalRecovered = fundedLoans.reduce((sum, l) => sum + (l.totalPaid || 0), 0);
    const totalOutstanding = fundedLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
    const activeLoans = fundedLoans.filter(l => l.status === 'active');
    const completedLoans = fundedLoans.filter(l => l.status === 'completed');

    // Expected returns (principal + interest)
    const totalExpected = fundedLoans.reduce((sum, l) => sum + (l.totalRepayable || 0), 0);
    const estimatedInterestEarned = totalExpected - totalInvested;

    // Marketplace applications awaiting funding
    const pendingApplications = allLoans.filter(l => l.status === 'pending');

    return res.status(200).json({
      success: true,
      portfolio: {
        totalInvested,
        totalRecovered,
        totalOutstanding,
        activeLoansCount: activeLoans.length,
        completedLoansCount: completedLoans.length,
        pendingMarketplaceCount: pendingApplications.length,
        estimatedInterestEarned,
        walletBalance: lender.walletBalance || 250000.00,
        averageAnnualReturn: '12.4%'
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. Browse Borrowers Directory for Lenders
const getBorrowers = async (req, res, next) => {
  try {
    const borrowers = await db.find('users', u => u.role === 'borrower');
    const safeList = await Promise.all(borrowers.map(async b => {
      const { passwordHash, ...rest } = b;
      const bLoans = await db.find('loans', l => l.borrowerId === b.id);
      return {
        ...rest,
        activeLoanCount: bLoans.filter(l => l.status === 'active').length,
        completedLoanCount: bLoans.filter(l => l.status === 'completed').length
      };
    }));

    return res.status(200).json({
      success: true,
      count: safeList.length,
      borrowers: safeList
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPortfolioSummary,
  getBorrowers
};
