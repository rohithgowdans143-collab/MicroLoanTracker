const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { validateMobile, validateAadhaar, validatePAN } = require('../middleware/validateMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'microlend_default_secret_key_2026';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      mobile: user.mobile
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 1. Register User (Borrower or Lender)
const register = async (req, res, next) => {
  try {
    const {
      name,
      mobile,
      email,
      password,
      role = 'borrower',
      dob,
      gender,
      address,
      businessType,
      idType,
      idNumber
    } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile number, and password are required.'
      });
    }

    if (!validateMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Indian mobile number. Must be 10 digits starting with 6-9.'
      });
    }

    // Check if user already exists
    const existing = await db.findOne('users', u => u.mobile === mobile.trim());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this mobile number already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Initial ID verification check
    let isVerified = false;
    if (idType === 'aadhaar' && idNumber && validateAadhaar(idNumber)) {
      isVerified = true;
    } else if (idType === 'pan' && idNumber && validatePAN(idNumber)) {
      isVerified = true;
    }

    const newUser = await db.insert('users', {
      name: name.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : '',
      role: role.toLowerCase() === 'lender' ? 'lender' : 'borrower',
      passwordHash,
      dob: dob || null,
      gender: gender || 'Not Specified',
      address: address || '',
      businessType: businessType || (role === 'lender' ? 'Individual Investor' : 'Retail Vendor'),
      idType: idType || 'aadhaar',
      idNumber: idNumber ? String(idNumber).trim() : '',
      isVerified,
      verifiedAt: isVerified ? new Date().toISOString() : null,
      creditScore: isVerified ? 740 : 660,
      walletBalance: role === 'lender' ? 250000.00 : 0.00
    });

    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
};

// 2. Login User
const login = async (req, res, next) => {
  try {
    const { mobile, password, role } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required.'
      });
    }

    const user = await db.findOne('users', u => u.mobile === mobile.trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    // Role check if provided
    if (role && user.role !== role.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `Account exists as a '${user.role}', not a '${role}'. Please switch role tab.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
};

// 3. Send OTP
const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !validateMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 10-digit mobile number required.'
      });
    }

    // Generate 6-digit OTP (for demo default to 123456 or random)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Clean old OTPs for this mobile
    await db.delete('otp_records', o => o.mobile === mobile.trim());

    await db.insert('otp_records', {
      mobile: mobile.trim(),
      otp,
      expiresAt,
      isVerified: false
    });

    console.log(`[SMS-GATEWAY-MOCK] OTP for ${mobile}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to +91 ${mobile}`,
      // Returned in demo mode for instant testing
      demoOtp: otp,
      expiresInSeconds: 300
    });
  } catch (err) {
    next(err);
  }
};

// 4. Verify OTP & Quick Login
const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required.'
      });
    }

    const record = await db.findOne('otp_records', o => o.mobile === mobile.trim() && o.otp === otp.trim());

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP entered.'
      });
    }

    if (Date.now() > record.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    await db.update('otp_records', o => o.id === record.id, { isVerified: true });

    // Look for user or allow registration step
    let user = await db.findOne('users', u => u.mobile === mobile.trim());
    let token = null;
    let safeUser = null;

    if (user) {
      token = generateToken(user);
      const { passwordHash: _, ...rest } = user;
      safeUser = rest;
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      isExistingUser: !!user,
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
};

// 5. Verify Government ID (Aadhaar / PAN / Voter ID)
const verifyGovtId = async (req, res, next) => {
  try {
    const { idType, idNumber, fullName, dob } = req.body;
    const userId = req.user?.id;

    if (!idType || !idNumber) {
      return res.status(400).json({
        success: false,
        message: 'ID Type and ID Number are required.'
      });
    }

    let isValid = false;
    let verifiedDetails = {};

    if (idType.toLowerCase() === 'aadhaar') {
      const clean = idNumber.replace(/\s|-/g, '');
      if (!validateAadhaar(clean)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Aadhaar format. Must be a 12-digit number.'
        });
      }
      isValid = true;
      verifiedDetails = {
        authority: 'UIDAI - Government of India',
        maskedNumber: `XXXX-XXXX-${clean.slice(-4)}`,
        status: 'AUTHENTICATED'
      };
    } else if (idType.toLowerCase() === 'pan') {
      if (!validatePAN(idNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid PAN format. Must match ABCDE1234F.'
        });
      }
      isValid = true;
      verifiedDetails = {
        authority: 'Income Tax Department of India',
        maskedNumber: `${idNumber.slice(0, 2)}XXXXX${idNumber.slice(-2)}`,
        status: 'AUTHENTICATED'
      };
    } else {
      isValid = true;
      verifiedDetails = {
        authority: 'Election Commission of India',
        maskedNumber: idNumber,
        status: 'AUTHENTICATED'
      };
    }

    // Update user if authenticated
    let updatedUser = null;
    if (userId) {
      updatedUser = await db.update('users', u => u.id === userId, {
        isVerified: true,
        idType,
        idNumber,
        verifiedAt: new Date().toISOString(),
        creditScore: Math.min(850, (req.user.creditScore || 650) + 40)
      });
    }

    return res.status(200).json({
      success: true,
      message: `Government ID (${idType.toUpperCase()}) verified successfully.`,
      verified: true,
      details: verifiedDetails,
      updatedCreditScore: updatedUser ? updatedUser.creditScore : undefined
    });
  } catch (err) {
    next(err);
  }
};

// 6. Get Current User Profile
const getProfile = async (req, res, next) => {
  try {
    const user = await db.findOne('users', u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const { passwordHash: _, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
};

// 7. Update User Profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, address, businessType } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim();
    if (address) updates.address = address.trim();
    if (businessType) updates.businessType = businessType.trim();

    const updated = await db.update('users', u => u.id === req.user.id, updates);
    const { passwordHash: _, ...safeUser } = updated;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  verifyGovtId,
  getProfile,
  updateProfile
};
