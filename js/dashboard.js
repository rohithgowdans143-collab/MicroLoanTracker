/* =============================================
   DASHBOARD.JS — Borrower Dashboard Logic
   ============================================= */

// ========== PAGE NAVIGATION ==========
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById(`page-${pageId}`);
  const navItem = document.querySelector(`[data-page="${pageId}"]`);
  const titleEl = document.getElementById('page-title');

  if (page) page.classList.add('active');
  if (navItem) navItem.classList.add('active');

  const titles = {
    'overview': 'Overview', 'my-loans': 'My Loans', 'repayments': 'Repayments',
    'sales': 'Daily Sales', 'lenders': 'Find Lenders', 'transactions': 'Transactions', 'profile': 'My Profile'
  };
  if (titleEl) titleEl.textContent = titles[pageId] || pageId;

  // Close sidebar on mobile
  document.getElementById('sidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Attach nav items
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    showPage(item.dataset.page);
  });
});

// ========== SIDEBAR ==========
document.getElementById('menu-btn')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});
document.getElementById('sidebar-close')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.remove('open');
});
// Close on overlay click
document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menu-btn');
  if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn?.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ========== NOTIFICATIONS ==========
document.getElementById('notification-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('notification-panel')?.classList.toggle('hidden');
});
document.getElementById('close-notif')?.addEventListener('click', () => {
  document.getElementById('notification-panel')?.classList.add('hidden');
});
document.addEventListener('click', e => {
  const panel = document.getElementById('notification-panel');
  const btn = document.getElementById('notification-btn');
  if (panel && !panel.contains(e.target) && !btn?.contains(e.target)) {
    panel.classList.add('hidden');
  }
});

// ========== REPAYMENT FORM ==========
document.getElementById('submit-repayment')?.addEventListener('click', async () => {
  const loan = document.getElementById('repay-loan').value;
  const amount = document.getElementById('repay-amount').value;
  const mode = document.querySelector('input[name="pay-mode"]:checked')?.value;
  const date = document.getElementById('repay-date').value;

  if (!loan || !amount || !date) { showToast('Please fill all required fields', 'error'); return; }
  if (parseFloat(amount) <= 0) { showToast('Enter a valid amount', 'error'); return; }

  const btn = document.getElementById('submit-repayment');
  btn.textContent = 'Processing...'; btn.disabled = true;

  try {
    let receiptData = null;
    if (window.ApiClient) {
      const loanTarget = loan === 'ml001' ? 'ML-2024-001' : (loan === 'ml002' ? 'ML-2024-002' : loan);
      const res = await window.ApiClient.makeRepayment(loanTarget, parseFloat(amount), mode || 'upi');
      receiptData = res.receipt;
    }

    // Show receipt
    const txnId = receiptData ? receiptData.receiptNumber : ('ML-TXN-' + Math.floor(1000 + Math.random() * 9000));
    document.getElementById('receipt-txn-id').textContent = txnId;
    document.getElementById('receipt-amount').textContent = '₹' + parseFloat(amount).toLocaleString('en-IN');
    document.getElementById('receipt-loan').textContent = loan === 'ml001' ? 'Loan #ML-2024-001' : 'Loan #ML-2024-002';
    document.getElementById('receipt-mode').textContent = (mode || 'UPI').toUpperCase();
    document.getElementById('receipt-date').textContent = new Date().toLocaleString('en-IN');
    const bal = receiptData ? receiptData.remainingBalance : (parseFloat(amount) > 0 ? (42500 - parseFloat(amount)) : 42500);
    document.getElementById('receipt-balance').textContent = '₹' + Number(bal).toLocaleString('en-IN');
    document.getElementById('receipt-modal')?.classList.remove('hidden');
    showToast('Repayment processed and recorded in database!', 'success');
  } catch (err) {
    showToast(err.message || 'Payment failed', 'error');
  } finally {
    btn.textContent = 'Process Repayment';
    btn.disabled = false;
  }
});

document.getElementById('close-receipt')?.addEventListener('click', () => {
  document.getElementById('receipt-modal')?.classList.add('hidden');
});
document.getElementById('receipt-overlay')?.addEventListener('click', () => {
  document.getElementById('receipt-modal')?.classList.add('hidden');
});
document.getElementById('download-receipt')?.addEventListener('click', () => {
  showToast('Receipt downloaded!', 'success');
  document.getElementById('receipt-modal')?.classList.add('hidden');
});

// Set today as default date
const repayDate = document.getElementById('repay-date');
if (repayDate) repayDate.valueAsDate = new Date();
const saleDate = document.getElementById('sale-date');
if (saleDate) saleDate.valueAsDate = new Date();

// ========== DAILY SALES FORM ==========
const salesData = [
  { date: 'Oct 27', revenue: 3200, expenses: 1100, profit: 2100, note: 'Regular day' },
  { date: 'Oct 26', revenue: 4500, expenses: 1800, profit: 2700, note: 'Sunday market' },
  { date: 'Oct 25', revenue: 2800, expenses: 900, profit: 1900, note: '—' },
  { date: 'Oct 24', revenue: 5100, expenses: 2200, profit: 2900, note: 'Festive discount' },
];

document.getElementById('submit-sale')?.addEventListener('click', async () => {
  const date = document.getElementById('sale-date').value;
  const amount = document.getElementById('sale-amount').value;
  if (!date || !amount) { showToast('Fill date and sales amount', 'error'); return; }

  const btn = document.getElementById('submit-sale');
  btn.textContent = 'Saving...'; btn.disabled = true;
  await simulateDelay(1000);
  btn.textContent = 'Save Sales Record'; btn.disabled = false;

  const expenses = parseFloat(document.getElementById('sale-expenses').value) || 0;
  const revenue = parseFloat(amount);
  const profit = revenue - expenses;
  const note = document.getElementById('sale-note').value || '—';

  // Add to table
  const table = document.getElementById('sales-table');
  const newRow = document.createElement('div');
  newRow.className = 'table-row';
  const d = new Date(date);
  newRow.innerHTML = `
    <span>${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
    <span class="green">₹${revenue.toLocaleString('en-IN')}</span>
    <span class="red">₹${expenses.toLocaleString('en-IN')}</span>
    <span class="purple">₹${profit.toLocaleString('en-IN')}</span>
    <span>${note}</span>
  `;
  table?.insertBefore(newRow, table.querySelector('.table-row'));
  showToast('Sales record saved!', 'success');

  // Reset form
  document.getElementById('sale-amount').value = '';
  document.getElementById('sale-expenses').value = '';
  document.getElementById('sale-note').value = '';

  // Draw mini chart
  drawSalesChart();
});

// ========== SIMPLE SALES CHART ==========
function drawSalesChart() {
  const canvas = document.getElementById('sales-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const data = [3200, 4500, 2800, 5100, 3200, 4800, 5300];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...data);
  const pad = 20;
  const barW = (w - pad * 2) / data.length;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(108,99,255,0.8)');
  grad.addColorStop(1, 'rgba(62,207,207,0.4)');

  data.forEach((val, i) => {
    const bh = ((val / max) * (h - pad - 20));
    const x = pad + i * barW + barW * 0.15;
    const y = h - pad - bh;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW * 0.7, bh, [4, 4, 0, 0]) : ctx.rect(x, y, barW * 0.7, bh);
    ctx.fill();
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '9px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barW * 0.35, h - 4);
  });
}
drawSalesChart();

// ========== LENDER APPLY ==========
document.querySelectorAll('.lender-apply').forEach(btn => {
  btn.addEventListener('click', () => {
    const lenderName = btn.dataset.lender;
    document.getElementById('apply-lender-name').value = lenderName;
    document.getElementById('loan-apply-modal')?.classList.remove('hidden');
  });
});

document.getElementById('close-loan-modal')?.addEventListener('click', () => {
  document.getElementById('loan-apply-modal')?.classList.add('hidden');
});
document.getElementById('loan-modal-overlay')?.addEventListener('click', () => {
  document.getElementById('loan-apply-modal')?.classList.add('hidden');
});

document.getElementById('submit-loan-apply')?.addEventListener('click', async () => {
  const amount = document.getElementById('loan-amount-apply').value;
  const purpose = document.getElementById('loan-purpose').value;
  const tenure = document.getElementById('loan-tenure').value;
  if (!amount || !purpose || !tenure) { showToast('Fill all required fields', 'error'); return; }

  const btn = document.getElementById('submit-loan-apply');
  btn.textContent = 'Submitting...'; btn.disabled = true;
  await simulateDelay(1500);

  document.getElementById('loan-apply-modal')?.classList.add('hidden');
  showToast('Loan application submitted! Lender will review within 24 hours.', 'success');
  btn.textContent = 'Submit Application'; btn.disabled = false;
});

// ========== EXPORT TRANSACTIONS ==========
document.getElementById('export-txn')?.addEventListener('click', () => {
  const rows = [
    ['Txn ID', 'Date', 'Description', 'Type', 'Amount', 'Balance', 'Status'],
    ['ML-TXN-0043', 'Oct 27', 'EMI Repayment - Loan #ML-001', 'Repayment', '+₹3,000', '₹39,500', 'Completed'],
    ['ML-TXN-0042', 'Oct 15', 'Loan Disbursement - SBI Priya', 'Loan', '-₹20,000', '₹42,500', 'Completed'],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'microlend_transactions.csv';
  a.click();
  showToast('Transactions exported!', 'success');
});

// ========== TOAST ==========
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
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

/* =============================================
   DYNAMIC BORROWER PROFILE
   Display actual logged-in borrower details
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

    const user = window.ApiClient?.getUser();

    // Check login
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Only borrowers can access this dashboard
    if (user.role !== 'borrower') {
        window.location.href = 'login.html';
        return;
    }

    const name = user.name || 'Borrower';

    const initials = name
        .trim()
        .split(/\s+/)
        .map(part => part.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();

    // Sidebar name
    const sidebarName = document.querySelector(
        '.user-info-sidebar strong'
    );

    if (sidebarName) {
        sidebarName.textContent = name;
    }

    // Welcome heading
    const welcomeHeading = document.querySelector(
        '#page-overview .page-header h1'
    );

    if (welcomeHeading) {
        welcomeHeading.textContent = `Good Evening, ${name}! 👋`;
    }

    // Update avatar initials
    document.querySelectorAll(
        '.user-avatar-sidebar, .user-avatar-top, .profile-avatar-large'
    ).forEach(avatar => {
        avatar.textContent = initials;
    });

    // Profile heading
    const profileName = document.querySelector(
        '#page-profile .profile-card h3'
    );

    if (profileName) {
        profileName.textContent = name;
    }

    // Profile details
    document.querySelectorAll(
        '#page-profile .pi'
    ).forEach(item => {

        const label = item.querySelector('span');
        const value = item.querySelector('strong');

        if (!label || !value) return;

        const field = label.textContent.trim().toLowerCase();

        if (field === 'full name') {
            value.textContent = name;
        }

        if (field === 'email' && user.email) {
            value.textContent = user.email;
        }

        if (field === 'mobile' && user.mobile) {
            value.textContent = user.mobile;
        }
    });

    console.log('Borrower dashboard loaded for:', name);

});

