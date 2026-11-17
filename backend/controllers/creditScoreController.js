const db = require('../config/db');

// Calculate dynamic credit score and risk grade
const getCreditScoreDetails = async (req, res, next) => {
  try {
    const user = req.user;
    const targetUserId = req.query.borrowerId || user.id;

    const targetUser = await db.findOne('users', u => u.id === targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [loans, repayments, sales] = await Promise.all([
      db.find('loans', l => l.borrowerId === targetUserId),
      db.find('repayments', r => r.borrowerId === targetUserId),
      db.find('daily_sales', s => s.borrowerId === targetUserId)
    ]);

    // Scoring weights
    let score = 550; // Base score

    // 1. Government ID Verification Factor (+80 points)
    const isIdVerified = !!targetUser.isVerified;
    if (isIdVerified) score += 80;

    // 2. Repayment History Factor (up to +130 points)
    const totalRepayments = repayments.length;
    let onTimePercentage = 100;
    if (totalRepayments > 0) {
      const repaymentBonus = Math.min(130, totalRepayments * 15);
      score += repaymentBonus;
    }

    // 3. Vendor Daily Sales Volume Factor (up to +60 points)
    if (sales.length > 0) {
      const avgSales = sales.reduce((sum, s) => sum + s.salesAmount, 0) / sales.length;
      if (avgSales >= 3000) score += 60;
      else if (avgSales >= 1500) score += 40;
      else if (avgSales > 0) score += 20;
    }

    // 4. Completed Loans Bonus (+30 points per completed loan)
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    score += Math.min(60, completedLoans * 30);

    // Bounds: 300 to 850
    score = Math.min(850, Math.max(300, score));

    // Determine Risk Grade
    let riskGrade = 'B';
    let riskLabel = 'Moderate Risk';
    if (score >= 780) { riskGrade = 'A+'; riskLabel = 'Prime / Lowest Risk'; }
    else if (score >= 720) { riskGrade = 'A'; riskLabel = 'Low Risk'; }
    else if (score >= 650) { riskGrade = 'B'; riskLabel = 'Moderate Risk'; }
    else { riskGrade = 'C'; riskLabel = 'High Risk'; }

    return res.status(200).json({
      success: true,
      creditScore: score,
      riskGrade,
      riskLabel,
      factors: [
        {
          name: 'Government ID Verification',
          status: isIdVerified ? 'Verified' : 'Pending',
          impact: isIdVerified ? '+80 pts' : '0 pts',
          type: isIdVerified ? 'positive' : 'neutral'
        },
        {
          name: 'On-Time Repayment Rate',
          status: `${onTimePercentage}% on-time`,
          impact: totalRepayments > 0 ? `+${Math.min(130, totalRepayments * 15)} pts` : 'No history yet',
          type: totalRepayments > 0 ? 'positive' : 'neutral'
        },
        {
          name: 'Daily Vendor Cash Flow',
          status: sales.length > 0 ? `${sales.length} days recorded` : 'Not recorded',
          impact: sales.length > 0 ? '+40-60 pts' : '0 pts',
          type: sales.length > 0 ? 'positive' : 'neutral'
        },
        {
          name: 'Loan Completion Track Record',
          status: `${completedLoans} microloans fully repaid`,
          impact: `+${Math.min(60, completedLoans * 30)} pts`,
          type: completedLoans > 0 ? 'positive' : 'neutral'
        }
      ]
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCreditScoreDetails
};
