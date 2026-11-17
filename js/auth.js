/* =============================================
   AUTH.JS — Login Page Logic
   ============================================= */

// Role tab switching
const tabs = document.querySelectorAll('.role-tab');
let currentRole = 'borrower';
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentRole = tab.dataset.role;
  });
});

// Password toggle
const togglePwd = document.getElementById('toggle-pwd');
const pwdInput = document.getElementById('login-password');
togglePwd?.addEventListener('click', () => {
  const type = pwdInput.type === 'password' ? 'text' : 'password';
  pwdInput.type = type;
});

// OTP Input navigation
function setupOTPInputs(containerSelector) {
  const inputs = document.querySelectorAll(containerSelector);
  inputs.forEach((input, idx) => {
    input.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val;
      if (val && inputs[idx + 1]) inputs[idx + 1].focus();
      e.target.classList.toggle('filled', !!val);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && inputs[idx - 1]) {
        inputs[idx - 1].focus();
        inputs[idx - 1].value = '';
        inputs[idx - 1].classList.remove('filled');
      }
    });
    input.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      [...text].forEach((ch, i) => {
        if (inputs[i]) { inputs[i].value = ch; inputs[i].classList.add('filled'); }
      });
      if (inputs[text.length]) inputs[text.length].focus();
    });
  });
}
setupOTPInputs('.otp-section .otp-input');

// Mobile OTP Login
const mobileOTPLogin = document.getElementById('mobile-otp-login');
const otpSection = document.getElementById('otp-section');
let otpTimerInterval;
mobileOTPLogin?.addEventListener('click', () => {
  const mobile = document.getElementById('login-mobile').value;
  if (!mobile) { showToast('Enter your mobile number first', 'error'); return; }
  otpSection?.classList.remove('hidden');
  startOTPTimer();
  showToast('OTP sent to your registered mobile number', 'success');
});

function startOTPTimer() {
  let seconds = 30;
  const timerEl = document.getElementById('otp-timer');
  const resendBtn = document.getElementById('resend-otp');
  if (resendBtn) resendBtn.disabled = true;
  clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    seconds--;
    if (timerEl) timerEl.textContent = `(${seconds}s)`;
    if (seconds <= 0) {
      clearInterval(otpTimerInterval);
      if (timerEl) timerEl.textContent = '';
      if (resendBtn) { resendBtn.disabled = false; resendBtn.textContent = 'Resend OTP'; }
    }
  }, 1000);
}

// Resend OTP
document.getElementById('resend-otp')?.addEventListener('click', () => {
  showToast('New OTP sent!', 'success');
  startOTPTimer();
});

// Form Submission
const loginForm = document.getElementById('login-form');
const loginSubmit = document.getElementById('login-submit');
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mobile = document.getElementById('login-mobile').value;
  const password = document.getElementById('login-password').value;
  if (!mobile || !password) { showToast('Please fill in all fields', 'error'); return; }

  const btn = loginSubmit;
  const span = btn.querySelector('span');
  const loader = btn.querySelector('.btn-loader');
  try {
    if (window.ApiClient) {
      const res = await window.ApiClient.login(mobile, password, currentRole);
      window.ApiClient.setToken(res.token);
      window.ApiClient.setUser(res.user);
      showToast(`Welcome back, ${res.user.name}! Redirecting...`, 'success');
    } else {
      await simulateDelay(1000);
      showToast('Login successful! Redirecting...', 'success');
    }

    setTimeout(() => {
      window.location.href = currentRole === 'lender' ? 'dashboard-lender.html' : 'dashboard-borrower.html';
    }, 1000);
  } catch (err) {
    showToast(err.message || 'Login failed. Please check your credentials.', 'error');
  } finally {
    span.classList.remove('hidden');
    loader.classList.add('hidden');
    btn.disabled = false;
  }
});

// Forgot Password
document.getElementById('forgot-pwd-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  showToast('Password reset link sent to your registered email/mobile', 'info');
});

// Google Login (Demo)
document.getElementById('google-login')?.addEventListener('click', () => {
  showToast('Google authentication — demo mode', 'info');
  setTimeout(() => window.location.href = 'dashboard-borrower.html', 1500);
});

// URL params
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('role') === 'lender') {
  document.getElementById('tab-lender')?.click();
}

// ===================== TOAST =====================
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:14px 24px; border-radius:12px; font-size:14px; font-weight:600;
    background:${type === 'success' ? 'rgba(34,197,94,0.9)' : type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(108,99,255,0.9)'};
    color:white; box-shadow:0 8px 32px rgba(0,0,0,0.3);
    animation:toastIn 0.3s ease;
    backdrop-filter:blur(10px);
  `;
  document.body.appendChild(toast);
  if (!document.getElementById('toast-anim')) {
    const style = document.createElement('style');
    style.id = 'toast-anim';
    style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(style);
  }
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; setTimeout(() => toast.remove(), 400); }, 3500);
}
function simulateDelay(ms) { return new Promise(r => setTimeout(r, ms)); }
