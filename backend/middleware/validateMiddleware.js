// Input validation helper routines

const validateMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(String(mobile).trim());
};

const validateAadhaar = (aadhaar) => {
  const clean = String(aadhaar).replace(/\s|-/g, '');
  return /^\d{12}$/.test(clean);
};

const validatePAN = (pan) => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(pan).trim().toUpperCase());
};

module.exports = {
  validateMobile,
  validateAadhaar,
  validatePAN
};
