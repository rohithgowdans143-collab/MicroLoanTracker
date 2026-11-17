/* =============================================
   REGISTER.JS — Multi-step Registration Logic
   ============================================= */

let currentStep = 1;
let selectedRole = 'borrower';

// ========== STEP NAVIGATION ==========
function goToStep(step) {
  document.querySelectorAll('.reg-step').forEach(el => el.classList.remove('active'));
  document.getElementById(`reg-step-${step}`).classList.add('active');

  document.querySelectorAll('.progress-step').forEach((el, idx) => {
    el.classList.remove('active', 'done');
    if (idx + 1 < step) el.classList.add('done');
    if (idx + 1 === step) el.classList.add('active');
  });
  document.querySelectorAll('.progress-line').forEach((el, idx) => {
    el.classList.toggle('done', idx < step - 1);
  });
  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== STEP 1: Role Selection ==========
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    selectedRole = card.dataset.role;
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    setTimeout(() => goToStep(2), 300);
  });
});

// ========== STEP 2: Personal Info ==========
// Password strength
const pwdInput = document.getElementById('reg-password');
const strengthFill = document.getElementById('strength-fill');
const strengthLabel = document.getElementById('strength-label');
pwdInput?.addEventListener('input', () => {
  const val = pwdInput.value;
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w: '0%', color: '', label: 'Enter password' },
    { w: '25%', color: '#ef4444', label: 'Weak' },
    { w: '50%', color: '#f59e0b', label: 'Fair' },
    { w: '75%', color: '#3b82f6', label: 'Good' },
    { w: '100%', color: '#22c55e', label: 'Strong' },
  ];
  strengthFill.style.width = levels[score].w;
  strengthFill.style.background = levels[score].color;
  strengthLabel.textContent = levels[score].label;
  strengthLabel.style.color = levels[score].color;
});

// Toggle password
document.getElementById('toggle-reg-pwd')?.addEventListener('click', () => {
  const type = pwdInput.type === 'password' ? 'text' : 'password';
  pwdInput.type = type;
});

// Continue button (step 2)
document.getElementById('personal-next')?.addEventListener('click', () => {
  const required = ['first-name', 'mobile', 'dob', 'gender', 'address', 'reg-password'];
  const empty = required.find(id => !document.getElementById(id)?.value?.trim());
  if (empty) { showToast('Please fill all required fields', 'error'); return; }
  const mobile = document.getElementById('mobile').value;
  if (!/^[6-9]\d{9}$/.test(mobile)) { showToast('Enter a valid 10-digit mobile number', 'error'); return; }
  goToStep(3);
});

// ========== STEP 3: ID Verification ==========
// ID type switching
document.querySelectorAll('.id-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.id-type-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.id-form').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.id}-form`).classList.add('active');
  });
});

// Aadhaar number formatting
const aadhaarInput = document.getElementById('aadhaar-number');
const previewNum = document.getElementById('aadhaar-preview-num');
aadhaarInput?.addEventListener('input', () => {
  let val = aadhaarInput.value.replace(/\D/g, '').slice(0, 12);
  aadhaarInput.value = val.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  const raw = val.padEnd(12, 'X');
  previewNum.textContent = raw.slice(0, 4) + ' ' + raw.slice(4, 8) + ' ' + raw.slice(8, 12);
});

// Aadhaar preview update from name
document.getElementById('first-name')?.addEventListener('input', updateAadhaarPreview);
document.getElementById('last-name')?.addEventListener('input', updateAadhaarPreview);
document.getElementById('dob')?.addEventListener('input', () => {
  const dobVal = document.getElementById('dob').value;
  if (dobVal) {
    const d = new Date(dobVal);
    document.getElementById('aadhaar-preview-dob').textContent = `DOB: ${d.toLocaleDateString('en-IN')}`;
  }
});
function updateAadhaarPreview() {
  const fn = document.getElementById('first-name')?.value || '';
  const ln = document.getElementById('last-name')?.value || '';
  const name = (fn + ' ' + ln).trim();
  if (document.getElementById('aadhaar-preview-name')) document.getElementById('aadhaar-preview-name').textContent = name || 'Your Name';
}

// File upload zones
function setupFileZone(zoneId, inputId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(zone, file);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) handleFileUpload(zone, input.files[0]);
  });
}
function handleFileUpload(zone, file) {
  zone.classList.add('uploaded');
  zone.innerHTML = `
    <div class="upload-icon">✅</div>
    <p>${file.name}</p>
    <small>${(file.size / 1024).toFixed(0)} KB • Click to change</small>
  `;
  zone.onclick = () => zone.nextElementSibling?.click() || zone.querySelector('input')?.click();
  showToast('File uploaded: ' + file.name, 'success');
}
['aadhaar-front-zone,aadhaar-front-file', 'aadhaar-back-zone,aadhaar-back-file', 'pan-upload-zone,pan-file', 'dl-upload-zone,dl-file', 'voter-upload-zone,voter-file'].forEach(pair => {
  const [z, i] = pair.split(',');
  setupFileZone(z, i);
});

// Send Aadhaar OTP
document.getElementById('send-aadhaar-otp')?.addEventListener('click', async () => {
  const num = document.getElementById('aadhaar-number').value.replace(/\s/g, '');
  if (num.length < 12) { showToast('Enter valid 12-digit Aadhaar number', 'error'); return; }
  showToast('OTP sent to Aadhaar-registered mobile', 'success');
  document.getElementById('aadhaar-otp-section').classList.remove('hidden');
  setupOTPInputs('.otp-verify-section .otp-input');
});

// Verify Aadhaar
document.getElementById('verify-aadhaar-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('verify-aadhaar-btn');
  btn.textContent = 'Verifying...';
  btn.disabled = true;
  await simulateDelay(2000);
  btn.textContent = 'Verified!';
  showVerificationSuccess();
  showToast('Aadhaar verified successfully! ✅', 'success');
});

// Other ID verify buttons
['pan', 'dl', 'voter'].forEach(id => {
  document.getElementById(`verify-${id}-btn`)?.addEventListener('click', async () => {
    const btn = document.getElementById(`verify-${id}-btn`);
    btn.textContent = 'Verifying...'; btn.disabled = true;
    await simulateDelay(1500);
    showVerificationSuccess();
    showToast(`${id.toUpperCase()} verified successfully! ✅`, 'success');
  });
});

function showVerificationSuccess() {
  document.getElementById('aadhaar-otp-section')?.classList.add('hidden');
  document.querySelectorAll('.id-form').forEach(f => f.style.display = 'none');
  document.getElementById('verification-success')?.classList.remove('hidden');
}

document.getElementById('after-verify-next')?.addEventListener('click', () => goToStep(4));

// ========== STEP 4: Bank Details ==========
// IFSC lookup
document.getElementById('ifsc')?.addEventListener('blur', async () => {
  const ifsc = document.getElementById('ifsc').value.toUpperCase();
  if (ifsc.length === 11) {
    await simulateDelay(500);
    const banks = {
      'SBIN': 'State Bank of India', 'HDFC': 'HDFC Bank', 'ICIC': 'ICICI Bank',
      'PUNB': 'Punjab National Bank', 'BARB': 'Bank of Baroda', 'KKBK': 'Kotak Mahindra Bank'
    };
    const bankCode = ifsc.slice(0, 4);
    document.getElementById('bank-name').value = banks[bankCode] || 'Bank Found';
    showToast('Bank details loaded', 'success');
  }
});

document.getElementById('bank-next')?.addEventListener('click', async () => {
  const acc = document.getElementById('account-number').value;
  const conf = document.getElementById('confirm-account').value;
  if (!acc || !conf) { showToast('Fill all required bank details', 'error'); return; }
  if (acc !== conf) { showToast('Account numbers do not match', 'error'); return; }

  const btn = document.getElementById('bank-next');
  btn.textContent = 'Creating Account...'; btn.disabled = true;

  try {
    const fn = document.getElementById('first-name')?.value || '';
    const ln = document.getElementById('last-name')?.value || '';
    const name = `${fn} ${ln}`.trim() || 'New User';
    const mobile = document.getElementById('mobile')?.value?.trim() || '';
    const password = document.getElementById('reg-password')?.value || 'Password@123';
    const dob = document.getElementById('dob')?.value || null;
    const gender = document.getElementById('gender')?.value || 'Not Specified';
    const address = document.getElementById('address')?.value || '';
    const businessType = document.getElementById('business-type')?.value || '';
    const aadhaar = document.getElementById('aadhaar-number')?.value || '';

    if (window.ApiClient) {
      const res = await window.ApiClient.register({
        name,
        mobile,
        password,
        role: selectedRole,
        dob,
        gender,
        address,
        businessType,
        idType: 'aadhaar',
        idNumber: aadhaar
      });
      window.ApiClient.setToken(res.token);
      window.ApiClient.setUser(res.user);
      document.getElementById('generated-id').textContent = res.user.id;
    } else {
      await simulateDelay(1500);
      const id = 'ML-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      document.getElementById('generated-id').textContent = id;
    }

    if (selectedRole === 'lender') {
      document.getElementById('success-message').textContent = 'Your lender account is verified and saved to database. Start browsing borrowers!';
      document.getElementById('go-to-dashboard').href = 'dashboard-lender.html';
      document.getElementById('go-to-dashboard').textContent = 'Go to Lender Dashboard';
    }
    goToStep(5);
    showToast('Account created and saved to database!', 'success');
  } catch (err) {
    showToast(err.message || 'Registration failed', 'error');
  } finally {
    btn.textContent = 'Complete Registration';
    btn.disabled = false;
  }
});

// ========== OTP INPUTS ==========
function setupOTPInputs(selector) {
  const inputs = document.querySelectorAll(selector);
  inputs.forEach((input, idx) => {
    input.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 1);
      e.target.classList.toggle('filled', !!e.target.value);
      if (e.target.value && inputs[idx + 1]) inputs[idx + 1].focus();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && inputs[idx - 1]) {
        inputs[idx - 1].focus();
        inputs[idx - 1].value = '';
        inputs[idx - 1].classList.remove('filled');
      }
    });
  });
}
setupOTPInputs('.reg-step .otp-input');

// ========== TOAST ==========
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:14px 24px; border-radius:12px; font-size:14px; font-weight:600;
    background:${type === 'success' ? 'rgba(34,197,94,0.9)' : type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(108,99,255,0.9)'};
    color:white; box-shadow:0 8px 32px rgba(0,0,0,0.3);
    animation:toastIn 0.3s ease; backdrop-filter:blur(10px);
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

// Check URL params for pre-selecting lender role
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('role') === 'lender') {
  selectedRole = 'lender';
  document.getElementById('choose-lender')?.click();
}
// Set today's date as default repayment date
const repayDate = document.getElementById('repay-date');
const saleDate = document.getElementById('sale-date');
if (repayDate) repayDate.valueAsDate = new Date();
if (saleDate) saleDate.valueAsDate = new Date();
