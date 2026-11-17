const mongoose = require('mongoose');

const commonFields = {
  id: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
};

const schemaOptions = collection => ({
  collection,
  versionKey: false,
  strict: true
});

const definitions = {
  users: {
    ...commonFields,
    name: { type: String, required: true, trim: true, maxlength: 100 },
    mobile: { type: String, required: true, unique: true, trim: true, match: /^[6-9]\d{9}$/ },
    email: { type: String, trim: true, lowercase: true, maxlength: 100 },
    role: { type: String, required: true, enum: ['borrower', 'lender', 'admin'] },
    passwordHash: { type: String, required: true },
    dob: { type: String, default: null },
    gender: { type: String, maxlength: 20 },
    address: { type: String },
    businessType: { type: String, maxlength: 100 },
    idType: { type: String, enum: ['aadhaar', 'pan', 'voter'] },
    idNumber: { type: String, maxlength: 50 },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    creditScore: { type: Number, min: 300, max: 850, default: 650 },
    walletBalance: { type: Number, min: 0, default: 0 }
  },
  loans: {
    ...commonFields,
    borrowerId: { type: String, required: true, index: true },
    borrowerName: { type: String, required: true },
    borrowerMobile: { type: String },
    businessType: { type: String },
    lenderId: { type: String, default: null, index: true },
    lenderName: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
    tenureWeeks: { type: Number, required: true, min: 1 },
    interestRate: { type: Number, required: true, min: 0 },
    totalRepayable: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, min: 0, default: 0 },
    remainingBalance: { type: Number, required: true, min: 0 },
    weeklyEmi: { type: Number, required: true, min: 0 },
    purpose: { type: String, required: true },
    riskGrade: { type: String, default: 'A', maxlength: 5 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'completed', 'rejected'],
      default: 'pending'
    },
    rejectionReason: { type: String },
    disbursedAt: { type: Date, default: null },
    nextDueDate: { type: String, default: null }
  },
  repayments: {
    ...commonFields,
    receiptNumber: { type: String, required: true, unique: true, trim: true },
    loanId: { type: String, required: true, index: true },
    borrowerId: { type: String, required: true },
    borrowerName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, required: true, enum: ['upi', 'card', 'netbanking', 'cash'] },
    transactionId: { type: String, required: true, unique: true, trim: true },
    balanceAfterPayment: { type: Number, required: true, min: 0 },
    status: { type: String, default: 'success' },
    paidAt: { type: Date, default: Date.now },
    note: { type: String }
  },
  daily_sales: {
    ...commonFields,
    borrowerId: { type: String, required: true, index: true },
    borrowerName: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    salesAmount: { type: Number, required: true, min: 0 },
    expensesAmount: { type: Number, min: 0, default: 0 },
    netProfit: { type: Number, required: true },
    customerCount: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: '' }
  },
  transactions: {
    ...commonFields,
    type: {
      type: String,
      required: true,
      enum: ['disbursement', 'repayment', 'wallet_topup', 'withdrawal']
    },
    loanId: { type: String, default: null, index: true },
    borrowerId: { type: String, default: null },
    lenderId: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, default: 'completed' },
    description: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  otp_records: {
    ...commonFields,
    mobile: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    otp: { type: String, required: true, match: /^\d{6}$/ },
    expiresAt: { type: Date, required: true },
    isVerified: { type: Boolean, default: false }
  }
};

const models = Object.entries(definitions).reduce((result, [collection, definition]) => {
  const modelName = `MicroLoan_${collection}`;
  const schema = new mongoose.Schema(definition, schemaOptions(collection));
  result[collection] = mongoose.models[modelName] || mongoose.model(modelName, schema);
  return result;
}, {});

module.exports = models;
