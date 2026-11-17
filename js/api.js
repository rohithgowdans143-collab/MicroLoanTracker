
/**
 * MicroLend API Client
 * Frontend connection to Node.js + Express + MongoDB
 */

// Change this only if your backend terminal shows another port.
const API_BASE_URL = 'http://localhost:5002/api';

const ApiClient = {

  // Token management
  getToken() {
    return localStorage.getItem('microlend_token');
  },

  setToken(token) {
    localStorage.setItem('microlend_token', token);
  },

  setUser(user) {
    localStorage.setItem('microlend_user', JSON.stringify(user));
  },

  getUser() {
    const raw = localStorage.getItem('microlend_user');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem('microlend_token');
    localStorage.removeItem('microlend_user');
    window.location.href = 'login.html';
  },

  // Main API request function
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers
        }
      );

      const responseText = await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Invalid server response (${response.status}). Check backend URL and server logs.`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed with status ${response.status}`
        );
      }

      return data;

    } catch (error) {
      console.error(
        `API Error [${endpoint}]:`,
        error
      );

      throw error;
    }
  },

  // Authentication APIs
  login(mobile, password, role) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        mobile,
        password,
        role
      })
    });
  },

  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  sendOtp(mobile) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile })
    });
  },

  verifyOtp(mobile, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp })
    });
  },

  verifyGovtId(idType, idNumber) {
    return this.request('/auth/verify-id', {
      method: 'POST',
      body: JSON.stringify({
        idType,
        idNumber
      })
    });
  },

  getProfile() {
    return this.request('/auth/me');
  },

  // Loan APIs
  getLoans(status) {
    const query = status
      ? `?status=${encodeURIComponent(status)}`
      : '';

    return this.request(`/loans${query}`);
  },

  getLoanById(id) {
    return this.request(`/loans/${id}`);
  },

  applyLoan(loanData) {
    return this.request('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(loanData)
    });
  },

  approveLoan(id) {
    return this.request(`/loans/${id}/approve`, {
      method: 'PUT'
    });
  },

  rejectLoan(id, reason) {
    return this.request(`/loans/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  disburseLoan(id) {
    return this.request(`/loans/${id}/disburse`, {
      method: 'POST'
    });
  },

  // Repayment APIs
  makeRepayment(loanId, amount, paymentMode) {
    return this.request('/repayments/pay', {
      method: 'POST',
      body: JSON.stringify({
        loanId,
        amount,
        paymentMode
      })
    });
  },

  getReceipt(receiptNumber) {
    return this.request(
      `/repayments/receipt/${encodeURIComponent(receiptNumber)}`
    );
  },

  // Transaction APIs
  getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();

    return this.request(
      `/transactions${query ? '?' + query : ''}`
    );
  },

  getTransactionsCsvUrl() {
    return `${API_BASE_URL}/transactions/export-csv`;
  },

  // Sales APIs
  logDailySales(salesData) {
    return this.request('/sales/log', {
      method: 'POST',
      body: JSON.stringify(salesData)
    });
  },

  getSalesHistory() {
    return this.request('/sales/history');
  },

  // Credit score APIs
  getCreditScore() {
    return this.request('/credit/score');
  },

  // Lender APIs
  getLenderPortfolio() {
    return this.request('/lender/portfolio');
  },

  getBorrowersDirectory() {
    return this.request('/lender/borrowers');
  }
};

// Make API client available to all frontend scripts
window.ApiClient = ApiClient;
