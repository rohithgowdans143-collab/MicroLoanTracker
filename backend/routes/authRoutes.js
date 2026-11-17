const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Public / Simulated verification or authenticated verification
router.post('/verify-id', (req, res, next) => {
  // Optional auth
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, () => authController.verifyGovtId(req, res, next));
  }
  return authController.verifyGovtId(req, res, next);
});

// Protected routes
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;
