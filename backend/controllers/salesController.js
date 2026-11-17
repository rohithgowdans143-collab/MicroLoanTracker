const db = require('../config/db');

// 1. Log Daily Vendor Sales
const logSales = async (req, res, next) => {
  try {
    const { date, salesAmount, expensesAmount = 0, customerCount = 0, notes } = req.body;
    const borrower = req.user;

    const sales = parseFloat(salesAmount);
    const expenses = parseFloat(expensesAmount);

    if (isNaN(sales) || sales < 0) {
      return res.status(400).json({ success: false, message: 'Valid daily sales amount is required.' });
    }

    const netProfit = Math.round(sales - expenses);
    const recordDate = date || new Date().toISOString().split('T')[0];

    const record = await db.insert('daily_sales', {
      borrowerId: borrower.id,
      borrowerName: borrower.name,
      date: recordDate,
      salesAmount: sales,
      expensesAmount: expenses,
      netProfit,
      customerCount: parseInt(customerCount, 10) || 0,
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Daily sales recorded successfully.',
      salesRecord: record
    });
  } catch (err) {
    next(err);
  }
};

// 2. Get Sales History & Vendor Analytics
const getSalesHistory = async (req, res, next) => {
  try {
    const user = req.user;
    const targetUserId = req.query.borrowerId || user.id;

    const salesList = await db.find('daily_sales', s => s.borrowerId === targetUserId);

    // Sort by date ascending for charts
    salesList.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalSales = salesList.reduce((acc, curr) => acc + (curr.salesAmount || 0), 0);
    const totalExpenses = salesList.reduce((acc, curr) => acc + (curr.expensesAmount || 0), 0);
    const totalNetProfit = totalSales - totalExpenses;
    const averageDailySales = salesList.length ? Math.round(totalSales / salesList.length) : 0;

    return res.status(200).json({
      success: true,
      count: salesList.length,
      summary: {
        totalSales,
        totalExpenses,
        totalNetProfit,
        averageDailySales,
        daysTracked: salesList.length
      },
      sales: salesList
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  logSales,
  getSalesHistory
};
