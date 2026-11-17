-- ==========================================================
-- MicroLend Relational Database Schema (PostgreSQL / MySQL compatible)
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('borrower', 'lender', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    dob DATE,
    gender VARCHAR(20),
    address TEXT,
    business_type VARCHAR(100),
    id_type VARCHAR(20) CHECK (id_type IN ('aadhaar', 'pan', 'voter')),
    id_number VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    credit_score INT DEFAULT 650,
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Loans Table
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(50) PRIMARY KEY,
    borrower_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lender_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    tenure_weeks INT NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    total_repayable DECIMAL(12, 2) NOT NULL,
    total_paid DECIMAL(12, 2) DEFAULT 0.00,
    remaining_balance DECIMAL(12, 2) NOT NULL,
    weekly_emi DECIMAL(12, 2) NOT NULL,
    purpose TEXT NOT NULL,
    risk_grade VARCHAR(5) DEFAULT 'A',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected')),
    disbursed_at TIMESTAMP,
    next_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Repayments Table
CREATE TABLE IF NOT EXISTS repayments (
    id VARCHAR(50) PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    loan_id VARCHAR(50) NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    borrower_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('upi', 'card', 'netbanking', 'cash')),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    balance_after_payment DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'success',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Daily Sales & Vendor Finances Table
CREATE TABLE IF NOT EXISTS daily_sales (
    id VARCHAR(50) PRIMARY KEY,
    borrower_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sales_date DATE NOT NULL,
    sales_amount DECIMAL(10, 2) NOT NULL,
    expenses_amount DECIMAL(10, 2) DEFAULT 0.00,
    net_profit DECIMAL(10, 2) NOT NULL,
    customer_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Transactions Ledger
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(30) NOT NULL CHECK (type IN ('disbursement', 'repayment', 'wallet_topup', 'withdrawal')),
    loan_id VARCHAR(50) REFERENCES loans(id) ON DELETE SET NULL,
    borrower_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    lender_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. OTP Verification Table
CREATE TABLE IF NOT EXISTS otp_records (
    id VARCHAR(50) PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_lender ON loans(lender_id);
CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_sales_borrower ON daily_sales(borrower_id);
CREATE INDEX IF NOT EXISTS idx_txns_loan ON transactions(loan_id);
