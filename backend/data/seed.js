/**
 * MicroLend Database Seed Script
 * Pre-populates realistic data for Borrowers, Lenders, Active Loans,
 * Repayment Receipts, Daily Sales, and Transaction Ledgers.
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const db = require('../config/db');

async function seedData() {
  console.log('🌱 Starting MicroLend Database Seeding...');

  // Reset collections
  await db.clear('users');
  await db.clear('loans');
  await db.clear('repayments');
  await db.clear('daily_sales');
  await db.clear('transactions');
  await db.clear('otp_records');

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password@123', salt);

  // 1. Seed Users
  const borrower1 = await db.insert('users', {
    id: 'usr_borrower_01',
    name: 'Ramesh Sharma',
    mobile: '9876543210',
    email: 'ramesh.vendor@gmail.com',
    role: 'borrower',
    passwordHash: commonPasswordHash,
    dob: '1988-04-12',
    gender: 'Male',
    address: 'Shop #14, Gandhi Bazaar, Bengaluru, Karnataka',
    businessType: 'Street Food & Snacks Vendor',
    idType: 'aadhaar',
    idNumber: '4921 8201 9023',
    isVerified: true,
    verifiedAt: '2024-01-10T10:00:00.000Z',
    creditScore: 742,
    walletBalance: 4200.00
  });

  const borrower2 = await db.insert('users', {
    id: 'usr_borrower_02',
    name: 'Priya Patel',
    mobile: '9876543211',
    email: 'priya.tailor@gmail.com',
    role: 'borrower',
    passwordHash: commonPasswordHash,
    dob: '1992-08-23',
    gender: 'Female',
    address: 'Flat 202, Shivajinagar, Pune, Maharashtra',
    businessType: 'Boutique & Tailoring Services',
    idType: 'aadhaar',
    idNumber: '6812 3901 8842',
    isVerified: true,
    verifiedAt: '2024-02-15T11:30:00.000Z',
    creditScore: 710,
    walletBalance: 1500.00
  });

  const lender1 = await db.insert('users', {
    id: 'usr_lender_01',
    name: 'Ananya Deshmukh',
    mobile: '9123456789',
    email: 'ananya.invest@capital.org',
    role: 'lender',
    passwordHash: commonPasswordHash,
    dob: '1984-11-05',
    gender: 'Female',
    address: '101 Horizon Towers, Indiranagar, Bengaluru',
    businessType: 'Individual Micro-Angel Investor',
    idType: 'pan',
    idNumber: 'ABCDE1234F',
    isVerified: true,
    verifiedAt: '2023-11-01T09:00:00.000Z',
    creditScore: 810,
    walletBalance: 350000.00
  });

  console.log('✅ Users seeded: 2 Borrowers, 1 Lender');

  // 2. Seed Loans
  const loan1 = await db.insert('loans', {
    id: 'ML-2024-001',
    borrowerId: borrower1.id,
    borrowerName: borrower1.name,
    borrowerMobile: borrower1.mobile,
    businessType: borrower1.businessType,
    lenderId: lender1.id,
    lenderName: lender1.name,
    amount: 50000,
    tenureWeeks: 40,
    interestRate: 8.5,
    totalRepayable: 53269,
    totalPaid: 10769,
    remainingBalance: 42500,
    weeklyEmi: 1332,
    purpose: 'Procure bulk raw ingredients & electric cart setup',
    riskGrade: 'A',
    status: 'active',
    disbursedAt: '2024-01-15T14:30:00.000Z',
    nextDueDate: '2024-11-04'
  });

  const loan2 = await db.insert('loans', {
    id: 'ML-2024-002',
    borrowerId: borrower1.id,
    borrowerName: borrower1.name,
    borrowerMobile: borrower1.mobile,
    businessType: borrower1.businessType,
    lenderId: lender1.id,
    lenderName: lender1.name,
    amount: 20000,
    tenureWeeks: 20,
    interestRate: 7.5,
    totalRepayable: 20577,
    totalPaid: 20577,
    remainingBalance: 0,
    weeklyEmi: 1029,
    purpose: 'Digital payment QR scanner & inventory expansion',
    riskGrade: 'A+',
    status: 'completed',
    disbursedAt: '2023-08-01T10:00:00.000Z',
    nextDueDate: null
  });

  const loan3 = await db.insert('loans', {
    id: 'ML-2024-003',
    borrowerId: borrower2.id,
    borrowerName: borrower2.name,
    borrowerMobile: borrower2.mobile,
    businessType: borrower2.businessType,
    lenderId: null,
    lenderName: null,
    amount: 25000,
    tenureWeeks: 26,
    interestRate: 9.0,
    totalRepayable: 26125,
    totalPaid: 0,
    remainingBalance: 26125,
    weeklyEmi: 1005,
    purpose: 'Heavy-duty industrial stitching machine',
    riskGrade: 'A',
    status: 'pending',
    disbursedAt: null,
    nextDueDate: null
  });

  console.log('✅ Loans seeded: 1 Active, 1 Completed, 1 Pending');

  // 3. Seed Repayments
  await db.insert('repayments', {
    receiptNumber: 'ML-TXN-8492',
    loanId: loan1.id,
    borrowerId: borrower1.id,
    borrowerName: borrower1.name,
    amount: 5000,
    paymentMode: 'upi',
    transactionId: 'UPI-77894102',
    balanceAfterPayment: 42500,
    status: 'success',
    paidAt: '2024-10-20T11:20:00.000Z',
    note: 'October Installment 3'
  });

  await db.insert('repayments', {
    receiptNumber: 'ML-TXN-7910',
    loanId: loan1.id,
    borrowerId: borrower1.id,
    borrowerName: borrower1.name,
    amount: 5769,
    paymentMode: 'upi',
    transactionId: 'UPI-66129841',
    balanceAfterPayment: 47500,
    status: 'success',
    paidAt: '2024-10-12T16:45:00.000Z',
    note: 'October Installment 2'
  });

  console.log('✅ Repayments seeded');

  // 4. Seed Daily Sales (7 days)
  const salesRecords = [
    { date: '2024-10-21', salesAmount: 3800, expensesAmount: 1400, netProfit: 2400, customerCount: 85 },
    { date: '2024-10-22', salesAmount: 4200, expensesAmount: 1600, netProfit: 2600, customerCount: 92 },
    { date: '2024-10-23', salesAmount: 3950, expensesAmount: 1350, netProfit: 2600, customerCount: 88 },
    { date: '2024-10-24', salesAmount: 4500, expensesAmount: 1700, netProfit: 2800, customerCount: 104 },
    { date: '2024-10-25', salesAmount: 5100, expensesAmount: 1900, netProfit: 3200, customerCount: 118 },
    { date: '2024-10-26', salesAmount: 5600, expensesAmount: 2100, netProfit: 3500, customerCount: 130 },
    { date: '2024-10-27', salesAmount: 4800, expensesAmount: 1750, netProfit: 3050, customerCount: 110 }
  ];

  for (const s of salesRecords) {
    await db.insert('daily_sales', {
      borrowerId: borrower1.id,
      borrowerName: borrower1.name,
      ...s,
      notes: 'Evening peak festival crowd'
    });
  }

  console.log('✅ Daily Sales seeded for 7 days');

  // 5. Seed Transactions Ledger
  await db.insert('transactions', {
    id: 'TXN-DISB-001',
    type: 'disbursement',
    loanId: loan1.id,
    borrowerId: borrower1.id,
    lenderId: lender1.id,
    amount: 50000,
    status: 'completed',
    description: `Loan fund disbursement of ₹50,000 to Ramesh Sharma`,
    timestamp: '2024-01-15T14:30:00.000Z'
  });

  await db.insert('transactions', {
    id: 'TXN-REP-001',
    type: 'repayment',
    loanId: loan1.id,
    borrowerId: borrower1.id,
    lenderId: lender1.id,
    amount: 5000,
    status: 'completed',
    description: `EMI Repayment of ₹5,000 for ML-2024-001 via UPI`,
    timestamp: '2024-10-20T11:20:00.000Z'
  });

  console.log('✅ Global Transaction Ledger seeded');
  console.log('🎉 Seeding completed successfully!');
}

db.connect()
  .then(seedData)
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error('Database seeding failed:', err);
    process.exitCode = 1;
  });
