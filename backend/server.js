const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve frontend static files (HTML, CSS, JS) from parent directory
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/repayments', require('./routes/repaymentRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/credit', require('./routes/creditRoutes'));
app.use('/api/lender', require('./routes/lenderRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    project: 'MicroLend API — Microloan & Repayment Tracker',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handling
app.use(require('./middleware/errorHandler'));

// Start server with fallback if port is busy

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log("====================================================");
    console.log("🚀 MicroLend Backend Server is running!");
    console.log(`📡 API Base URL:      http://localhost:${port}/api`);
    console.log(`🌐 Web App Frontend:  http://localhost:${port}/index.html`);
    console.log(`📄 Health Check:      http://localhost:${port}/api/health`);
    console.log("====================================================");
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;

      if (nextPort >= 65536) {
        console.error('No available ports!');
        process.exit(1);
        return;
      }

      console.warn(`Port ${port} is busy. Trying ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
};


db.connect()
  .then(() => startServer(PORT))
  .catch(err => {
    console.error('Unable to connect to MongoDB:', err.message);
    process.exitCode = 1;
  });

module.exports = app;
