# MicroLend — Backend REST API Documentation

A complete Node.js / Express backend API engineered for **MicroLend (Microloan and Repayment Tracker for Small Vendors)**.

---

## 📁 Backend Directory Structure

```
MicroLoanTracker/backend/
├── server.js                      # Express server entry point, CORS, static serving & error handlers
├── package.json                   # Dependencies (express, bcryptjs, jsonwebtoken, cors, dotenv)
├── .env                           # Environment configuration (MongoDB URI, PORT, JWT_SECRET)
├── config/
│   └── db.js                      # MongoDB connection and collection access
├── models/
│   ├── mongoModels.js             # Mongoose schemas and collection validation
│   └── schema.sql                 # Legacy relational schema reference
├── controllers/
│   ├── authController.js          # Registration, login, OTP auth, Aadhaar/PAN ID verification, profile
│   ├── loanController.js          # Loan application, review, marketplace, approval, and disbursement
│   ├── repaymentController.js     # Repayment processing, EMI computation, instant receipt generation
│   ├── transactionController.js   # Transaction ledger & CSV export
│   ├── salesController.js         # Small vendor daily sales, expense & net profit logging
│   ├── creditScoreController.js   # 4-Pillar dynamic credit scoring engine (300–850)
│   └── lenderController.js        # Lender portfolio analytics, yield, and borrower directory
├── middleware/
│   ├── authMiddleware.js          # JWT verification & role-based access control (Borrower/Lender)
│   ├── errorHandler.js            # Standardized JSON error response handler
│   └── validateMiddleware.js      # Mobile, Aadhaar, and PAN validation routines
├── routes/
│   ├── authRoutes.js              # /api/auth/*
│   ├── loanRoutes.js              # /api/loans/*
│   ├── repaymentRoutes.js         # /api/repayments/*
│   ├── transactionRoutes.js       # /api/transactions/*
│   ├── salesRoutes.js             # /api/sales/*
│   ├── creditRoutes.js            # /api/credit/*
│   └── lenderRoutes.js            # /api/lender/*
├── data/
│   └── seed.js                    # MongoDB seed script with sample borrowers, lenders & loans
```

---

## ⚡ Quickstart Guide

### 1. Configure MongoDB

Install and start MongoDB locally, or create a MongoDB Atlas cluster. Copy
`.env.example` to `.env` and set `MONGODB_URI` to your connection string. The
default URI connects to a local database named `microloan_tracker`.

### 2. Open Terminal and Navigate to Backend
```powershell
cd "c:\Users\Rohith Gowda N S\ROHITH\MicroLoanTracker\backend"
```

### 3. Install Dependencies
```powershell
npm.cmd install
```

### 4. Seed Realistic Demo Data
```powershell
npm.cmd run seed
```

The seed command clears the existing MicroLend collections before inserting
demo data. Do not run it against a database containing data you need to keep.

### 5. Start the API Server
```powershell
npm.cmd start
```
The API connects to MongoDB before it starts listening. The server uses
`PORT` from `.env` (default `5000`) and tries the next port if that port is busy.

## Deploy on Render

The repository includes a Render Blueprint at `render.yaml`. It deploys the
frontend and API together as one web service. MongoDB must be hosted separately,
for example with MongoDB Atlas; Render does not provide a MongoDB database.

1. Push this repository to GitHub.
2. Create a MongoDB Atlas database and a database user. Configure Atlas Network
   Access to allow connections from your Render service. Use a strong password
   and keep the connection string private.
3. In Render, choose **New + → Blueprint**, connect the GitHub repository, and
   select the branch containing `render.yaml`.
4. When prompted, set `MONGODB_URI` to the Atlas connection string. Render
   generates `JWT_SECRET` from the Blueprint; keep it private.
5. Deploy. Render builds from `MicroLoanTracker/backend`, starts `npm start`,
   and checks `/api/health`. Open the service's `onrender.com` URL on your
   computer or phone.

The free Render service may spin down when idle, so the first request after a
period of inactivity can take longer. Seed demo data only against an empty
database: `npm run seed` clears all MicroLend collections before inserting it.

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Name | Mobile | Password | Business Type | ID Verified | Credit Score |
|---|---|---|---|---|---|---|
| **Borrower** | Ramesh Sharma | `9876543210` | `Password@123` | Street Food Vendor | ✅ Aadhaar (`4921 8201 9023`) | 742 |
| **Borrower** | Priya Patel | `9876543211` | `Password@123` | Boutique & Tailoring | ✅ Aadhaar (`6812 3901 8842`) | 710 |
| **Lender** | Ananya Deshmukh | `9123456789` | `Password@123` | Micro-Angel Investor | ✅ PAN (`ABCDE1234F`) | 810 |

---

## 📡 REST API Reference

### 1. Authentication & Verification (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register borrower or lender with ID verification details |
| `POST` | `/api/auth/login` | Public | Login with mobile, password & role (returns JWT) |
| `POST` | `/api/auth/send-otp` | Public | Send 6-digit OTP to mobile (5-min expiry) |
| `POST` | `/api/auth/verify-otp` | Public | Verify OTP and authenticate user |
| `POST` | `/api/auth/verify-id` | Public/Auth | Verify Government ID (Aadhaar / PAN) & boost credit score |
| `GET` | `/api/auth/me` | Protected | Get current user's profile |
| `PUT` | `/api/auth/profile` | Protected | Update profile (address, business type, email) |

#### Register Payload Example:
```json
{
  "name": "Ramesh Sharma",
  "mobile": "9876543210",
  "password": "Password@123",
  "role": "borrower",
  "businessType": "Street Food & Snacks",
  "idType": "aadhaar",
  "idNumber": "4921 8201 9023"
}
```

---

### 2. Loan Management (`/api/loans`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/loans` | Protected | List loans (filtered by role or `?status=active`) |
| `GET` | `/api/loans/:id` | Protected | Get single loan details + repayment schedule |
| `POST` | `/api/loans/apply` | Borrower | Apply for microloan (amount, tenureWeeks, purpose) |
| `PUT` | `/api/loans/:id/approve` | Lender | Approve pending loan application |
| `PUT` | `/api/loans/:id/reject` | Lender | Reject loan application with reason |
| `POST` | `/api/loans/:id/disburse` | Lender | Disburse funds & activate loan |

#### Apply Loan Payload Example:
```json
{
  "amount": 25000,
  "tenureWeeks": 26,
  "interestRate": 8.5,
  "purpose": "Procure extra inventory for Diwali festival season"
}
```

---

### 3. Repayments & Receipts (`/api/repayments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/repayments/pay` | Borrower | Process repayment, recalculate balance, issue receipt & bump credit score |
| `GET` | `/api/repayments/receipt/:receiptNumber` | Protected | Get printable receipt by receipt number (e.g. `ML-TXN-8492`) |
| `GET` | `/api/repayments/loan/:loanId` | Protected | Get all historical repayments for a loan |

#### Repayment Payload Example:
```json
{
  "loanId": "ML-2024-001",
  "amount": 2500,
  "paymentMode": "upi"
}
```

---

### 4. Transactions Ledger & CSV Export (`/api/transactions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | Protected | Audit trail of disbursements & repayments |
| `GET` | `/api/transactions/export-csv` | Protected | Download audit trail as `.csv` file |

---

### 5. Daily Vendor Sales & Cashflow (`/api/sales`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/sales/log` | Borrower | Log daily revenue, expenses & customer count |
| `GET` | `/api/sales/history` | Protected | Get sales analytics & net profit trends for chart |

---

### 6. Credit Scoring Engine (`/api/credit`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/credit/score` | Protected | Dynamic 4-pillar credit score (300–850) & risk grade breakdown |

---

### 7. Lender Portfolio (`/api/lender`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/lender/portfolio` | Lender | Deployed capital, interest earned, and recovery rate |
| `GET` | `/api/lender/borrowers` | Lender | Directory of verified small vendors seeking microloans |

---

The legacy `data/database.json` file is not used by the MongoDB-backed API.
MongoDB documents are validated using the collection schemas in
`models/mongoModels.js`, including required fields, enums, numeric ranges, and
unique identifiers.
