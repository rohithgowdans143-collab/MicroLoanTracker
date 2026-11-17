/* =============================================
   LENDER-DASHBOARD.JS — Lender Dashboard Logic
   ============================================= */

// ========== PAGE NAVIGATION ==========
function lShowPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById(`page-${pageId}`);
  const navItem = document.querySelector(`[data-page="${pageId}"]`);
  const titleEl = document.getElementById('l-page-title');

  if (page) page.classList.add('active');
  if (navItem) navItem.classList.add('active');

  const titles = {
    'l-overview': 'Portfolio Overview', 'l-borrowers': 'Browse Borrowers',
    'l-applications': 'Loan Applications', 'l-active-loans': 'Active Loans',
    'l-repayments': 'Repayment Tracking', 'l-analytics': 'Analytics', 'l-profile': 'My Profile'
  };
  if (titleEl) titleEl.textContent = titles[pageId] || pageId;
  document.getElementById('sidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    lShowPage(item.dataset.page);
  });
});

// ========== SIDEBAR ==========
document.getElementById('l-menu-btn')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});
document.getElementById('sidebar-close')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.remove('open');
});

// ========== NOTIFICATIONS ==========
document.getElementById('l-notification-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  // Toggle notification panel if it exists
  let panel = document.getElementById('l-notif-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'l-notif-panel';
    panel.className = 'notification-panel';
    panel.innerHTML = `
      <div class="notif-header"><h3>Notifications</h3><button onclick="document.getElementById('l-notif-panel').classList.add('hidden')">✕</button></div>
      <div class="notif-list">
        <div class="notif-item unread"><div class="notif-icon green">₹</div><div><p>Repayment received from Rajesh Kumar</p><small>2 hours ago</small></div></div>
        <div class="notif-item unread"><div class="notif-icon purple">📄</div><div><p>New loan application from Priya Sharma</p><small>5 hours ago</small></div></div>
        <div class="notif-item"><div class="notif-icon orange">⚠️</div><div><p>Overdue payment: Amit Singh (Loan ML-004)</p><small>1 day ago</small></div></div>
      </div>
    `;
    document.body.appendChild(panel);
  }
  panel.classList.toggle('hidden');
});

// ========== APPLICATION APPROVAL ==========
function approveApp(btn) {
  const item = btn.closest('.pending-app-item');
  if (item) {
    item.style.opacity = '0.5';
    item.style.transition = 'opacity 0.3s';
    showToast('Loan application approved! Borrower will be notified.', 'success');
    setTimeout(() => item.remove(), 500);
    updateAppBadge(-1);
  }
}

function rejectApp(btn) {
  const item = btn.closest('.pending-app-item');
  if (item) {
    item.style.opacity = '0.5';
    showToast('Application rejected. Borrower notified.', 'error');
    setTimeout(() => item.remove(), 500);
    updateAppBadge(-1);
  }
}

function approveFullApp(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const borrowerName = card.querySelector('.app-borrower h4')?.textContent;
  const amount = card.querySelector('.loan-amount-header')?.textContent;

  card.style.borderColor = 'rgba(34,197,94,0.5)';
  card.style.background = 'rgba(34,197,94,0.04)';
  card.querySelector('.app-footer').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;color:var(--green);font-weight:700;font-size:14px;">
      ✅ Loan Approved! ${amount} for ${borrowerName}
    </div>
    <button class="btn-sm outline" onclick="sendDisbursement('${cardId}')">Disburse Funds</button>
  `;
  showToast(`✅ Loan approved for ${borrowerName}!`, 'success');
  updateAppBadge(-1);
}

function rejectFullApp(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.style.opacity = '0.5';
  card.style.pointerEvents = 'none';
  showToast('Application rejected. Borrower will be notified.', 'error');
  updateAppBadge(-1);
}

function sendDisbursement(cardId) {
  showToast('Funds disbursed! Transfer initiated to borrower\'s bank account.', 'success');
}

function sendReminder(btn) {
  const row = btn.closest('.table-row');
  const borrower = row?.querySelector('span:first-child')?.textContent;
  showToast(`Reminder sent to ${borrower || 'borrower'}!`, 'success');
  btn.textContent = 'Reminder Sent ✓';
  btn.disabled = true;
  btn.style.opacity = '0.6';
}

function fundBorrower(name) {
  showToast(`Opening loan offer for ${name}...`, 'info');
  setTimeout(() => lShowPage('l-applications'), 1000);
}

function updateAppBadge(delta) {
  const badge = document.querySelector('.nav-badge');
  if (badge) {
    const current = parseInt(badge.textContent) || 0;
    const newVal = Math.max(0, current + delta);
    badge.textContent = newVal;
    if (newVal === 0) badge.style.display = 'none';
  }
}

// ========== EXPORT REPORT ==========
document.getElementById('l-export')?.addEventListener('click', () => {
  const rows = [
    ['Loan ID', 'Borrower', 'Amount', 'Interest', 'EMI', 'Paid', 'Status'],
    ['ML-2024-001', 'Rajesh Kumar', '24000', '14%', '2160', '6480', 'Active'],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'microlend_portfolio.csv';
  a.click();
  showToast('Portfolio report exported!', 'success');
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

/* =============================================
   LOAD LOGGED-IN LENDER DETAILS
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

    const user = window.ApiClient?.getUser();

    if (!user) {
        console.warn('No logged-in user found.');
        window.location.href = 'login.html';
        return;
    }

    if (user.role !== 'lender') {
        window.location.href = 'login.html';
        return;
    }

    const name = user.name || 'Lender';

    // Generate initials
    const initials = name
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    // Sidebar name
    const sidebarName =
        document.querySelector('.user-info-sidebar strong');

    if (sidebarName) {
        sidebarName.textContent = name;
    }

    // Welcome message
    const welcomeHeading =
        document.querySelector('#page-l-overview .page-header h1');

    if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome, ${name}! 💰`;
    }

    // Profile name
    const profileName =
        document.querySelector('#page-l-profile .profile-card h3');

    if (profileName) {
        profileName.textContent = name;
    }

    // Update avatar initials
    document.querySelectorAll(
        '.user-avatar-sidebar, .user-avatar-top, .profile-avatar-large'
    ).forEach(avatar => {
        avatar.textContent = initials;
    });

    // Update profile information
    document.querySelectorAll('#page-l-profile .pi').forEach(item => {
        const label = item.querySelector('span');

        if (label && label.textContent.trim() === 'Full Name') {
            item.querySelector('strong').textContent = name;
        }

        if (label && label.textContent.trim() === 'Email' && user.email) {
            item.querySelector('strong').textContent = user.email;
        }

        if (label && label.textContent.trim() === 'Mobile' && user.mobile) {
            item.querySelector('strong').textContent = user.mobile;
        }
    });

});

