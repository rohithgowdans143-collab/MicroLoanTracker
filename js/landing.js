/* =============================================
   LANDING PAGE JS
   ============================================= */

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Animated number counters (hero)
function animateCounter(el, target, prefix = '', duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = prefix + Math.floor(start).toLocaleString('en-IN');
  }, 16);
}

// Stats section observer
const statsSection = document.getElementById('stats');
const statNumbers = document.querySelectorAll('.stat-number');
let statsAnimated = false;
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      statNumbers.forEach(el => {
        const target = parseInt(el.dataset.target);
        animateCounter(el, target);
      });
    }
  });
}, { threshold: 0.3 });
if (statsSection) statsObserver.observe(statsSection);

// Hero preview counters
const heroCounters = document.querySelectorAll('[data-count]');
setTimeout(() => {
  heroCounters.forEach(el => {
    const target = parseInt(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    animateCounter(el, target, prefix, 2000);
  });
}, 800);

// Feature cards scroll-in
const featureCards = document.querySelectorAll('.feature-card');
const featureObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => entry.target.classList.add('visible'), parseInt(delay));
    }
  });
}, { threshold: 0.2 });
featureCards.forEach(card => featureObserver.observe(card));

// Check URL for role param
const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get('role');
if (role === 'lender') {
  document.getElementById('go-to-dashboard')?.setAttribute('href', 'dashboard-lender.html');
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    navLinks?.classList.remove('open');
  });
});
