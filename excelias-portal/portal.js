/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   XCELIAS PORTAL â€” NAVIGATION + PARTICLE SYSTEM + EFFECTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = String(s ?? '');
  return d.innerHTML;
}

const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const PROJECTS = {
  activities: {
    name: 'Training Academy',
    url: '/activities/',
    mode: 'iframe',
  },
  content: {
    name: 'Training Manual',
    url: '/content/',
    mode: 'iframe',
  },
  avaria: {
    name: 'Academy Operations',
    url: IS_LOCAL ? 'http://localhost:3005' : 'https://lms.xcelias.com',
    mode: 'tab',
  },
  reports: {
    name: 'Report Generator',
    url: '/reports/',
    mode: 'iframe',
  },
  studyguide: {
    name: 'Study Guide',
    url: '/studyguide/',
    mode: 'iframe',
  },
  website: {
    name: 'Property Explorer',
    url: '/website/',
    mode: 'iframe',
  },
};

/* â”€â”€â”€ State â”€â”€â”€ */
let activeProject = null;
let currentIframeUrl = null;

/* â”€â”€â”€ Auth State â”€â”€â”€ */
let xcPortalUser = null;
// Keys not listed = accessible to any logged-in user
const XCP_ROLE_MAP = {
  website: ['admin', 'agent'],
};

/* â”€â”€â”€ DOM refs â”€â”€â”€ */
const homeView = document.getElementById('home-view');
const projectView = document.getElementById('project-view');
const iframe = document.getElementById('project-iframe');
const topbarTitle = document.getElementById('topbar-title');
const topbarNewTab = document.getElementById('topbar-newtab');
const iframeLoader = document.getElementById('iframe-loading');

/* ── Topbar button handlers (no inline onclick for CSP) ── */
document.getElementById('topbar-back').addEventListener('click', function () {
  goHome();
});
topbarNewTab.addEventListener('click', function () {
  openInNewTab();
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PARTICLE SYSTEM (ambient floating particles)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  // Respect reduced motion preference
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionQuery.matches) return;

  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];

  // Fewer particles on mobile for performance
  const isMobile = window.innerWidth <= 768;
  const PARTICLE_COUNT = isMobile ? 25 : 60;
  const LINE_DISTANCE = isMobile ? 100 : 150;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.hue = Math.random() > 0.5 ? 230 : 280; // purple or pink
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > W) this.speedX *= -1;
      if (this.y < 0 || this.y > H) this.speedY *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINE_DISTANCE) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(102, 126, 234, ${0.06 * (1 - dist / LINE_DISTANCE)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  let animId;
  let isAnimating = false;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    drawLines();
    animId = requestAnimationFrame(animate);
  }
  function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    animate();
  }
  function stopAnimation() {
    cancelAnimationFrame(animId);
    isAnimating = false;
  }
  startAnimation();

  // Pause when in project view
  const obs = new MutationObserver(() => {
    if (!projectView.classList.contains('hidden')) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });
  obs.observe(projectView, { attributes: true, attributeFilter: ['class'] });
})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COUNTER ANIMATION (hero stats) â€” rAF-based
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
(function animateCounters() {
  const nums = document.querySelectorAll('.hero-stat-num[data-count]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.count.includes('+') ? '+' : '';
          const duration = 800; // ms
          const start = performance.now();
          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.1 }
  );
  nums.forEach((n) => io.observe(n));
})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LAUNCH PROJECT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function launchProject(key) {
  const proj = PROJECTS[key];
  if (!proj) return;

  // Role check
  const allowedRoles = XCP_ROLE_MAP[key];
  if (allowedRoles && xcPortalUser && !allowedRoles.includes(xcPortalUser.role)) {
    const el = document.getElementById('xcp-access-denied');
    if (el) {
      el.textContent = 'ðŸ”’ Agent access required. Ask your admin to upgrade your account.';
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 3500);
    }
    return;
  }

  if (proj.mode === 'tab') {
    window.open(proj.url, '_blank', 'noopener');
    return;
  }

  activeProject = key;
  currentIframeUrl = proj.url;

  homeView.style.display = 'none';
  projectView.classList.remove('hidden');
  topbarTitle.textContent = proj.name;

  // Show loader
  iframeLoader.classList.remove('hidden');
  iframe.src = proj.url;

  // Clear any previous timeout
  if (window._iframeTimeout) clearTimeout(window._iframeTimeout);

  // Hide loader when iframe loads
  iframe.onload = () => {
    iframeLoader.classList.add('hidden');
    if (window._iframeTimeout) {
      clearTimeout(window._iframeTimeout);
      window._iframeTimeout = null;
    }
  };

  // Error handler
  iframe.onerror = () => {
    showIframeError(proj.name);
    if (window._iframeTimeout) {
      clearTimeout(window._iframeTimeout);
      window._iframeTimeout = null;
    }
  };

  // Timeout: if iframe hasn't loaded in 30s, show error
  window._iframeTimeout = setTimeout(() => {
    if (!iframeLoader.classList.contains('hidden')) {
      showIframeError(proj.name);
    }
  }, 30000);

  history.pushState({ project: key }, proj.name, '#' + key);
}

/* â”€â”€â”€ Return to home â”€â”€â”€ */
function goHome() {
  activeProject = null;
  currentIframeUrl = null;
  iframe.src = 'about:blank';
  iframe.onload = null;
  iframe.onerror = null;
  if (window._iframeTimeout) {
    clearTimeout(window._iframeTimeout);
    window._iframeTimeout = null;
  }

  // Remove any error overlay
  const errOverlay = document.getElementById('iframe-error');
  if (errOverlay) errOverlay.remove();

  projectView.classList.add('hidden');
  iframeLoader.classList.add('hidden');
  homeView.style.display = '';

  if (location.hash) {
    history.pushState(null, 'Xcelias', location.pathname);
  }
}

/* â”€â”€â”€ Show iframe load error â”€â”€â”€ */
function showIframeError(projectName) {
  iframeLoader.classList.add('hidden');

  const existing = document.getElementById('iframe-error');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'iframe-error';
  overlay.style.cssText =
    'position:absolute;inset:48px 0 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--bg,#0f0f1a);z-index:6;text-align:center;padding:24px';
  overlay.innerHTML = `
    <div style="font-size:3rem;opacity:0.5">âš ï¸</div>
    <h3 style="font-size:1.1rem;font-weight:700;color:#e8e8f0">Failed to Load</h3>
    <p style="font-size:0.82rem;color:#9898b8;max-width:360px;line-height:1.6">${escHtml(projectName || 'This module')} didn't respond. Make sure the server is running and try again.</p>
    <div style="display:flex;gap:12px;margin-top:8px">
      <button id="iframe-err-retry" style="padding:10px 24px;border-radius:50px;border:1px solid rgba(102,126,234,0.3);background:rgba(102,126,234,0.1);color:#a5b4fc;font-family:inherit;font-size:0.78rem;font-weight:600;cursor:pointer">Retry</button>
      <button id="iframe-err-home" style="padding:10px 24px;border-radius:50px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.05);color:#9898b8;font-family:inherit;font-size:0.78rem;font-weight:600;cursor:pointer">Back to Home</button>
    </div>
  `;
  projectView.appendChild(overlay);
  overlay.querySelector('#iframe-err-retry').addEventListener('click', function () {
    location.reload();
  });
  overlay.querySelector('#iframe-err-home').addEventListener('click', function () {
    goHome();
  });
}

/* â”€â”€â”€ Open in new tab â”€â”€â”€ */
function openInNewTab() {
  if (currentIframeUrl) {
    window.open(currentIframeUrl, '_blank', 'noopener');
  }
}

/* â”€â”€â”€ Keyboard shortcuts â”€â”€â”€ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeProject) goHome();
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   XC PORTAL AUTH (using shared xcelias-auth.js module)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function applyPortalRoles(user) {
  xcPortalUser = user;
  // Populate user chip
  const chip = document.getElementById('xcp-user-chip');
  if (chip) {
    const roleLabel =
      {
        admin: '\u{1F451} Admin',
        agent: '\u{1F3E0} Agent',
        trainee: '\u{1F393} Trainee',
        student: '\u{1F4D6} Student',
      }[user.role] || user.role;
    chip.innerHTML = `<span class="xcp-chip-name">${escHtml(user.displayName || user.username)}</span><span class="xcp-chip-role">${escHtml(roleLabel)}</span><button class="xcp-chip-signout" id="xcp-signout">Sign Out</button>`;
    chip.style.display = 'flex';
    document.getElementById('xcp-signout').addEventListener('click', () => {
      XceliasAuth.signOut();
    });
  }
  // Student role: redirect directly to Study Guide (no portal access)
  if (user.role === 'student') {
    window.location.replace('/studyguide/');
    return;
  }

  // Apply locked state to restricted cards
  document.querySelectorAll('.project-card').forEach((card) => {
    const key = card.dataset.project;
    const required = XCP_ROLE_MAP[key];
    if (required && !required.includes(user.role)) {
      card.classList.add('xcp-card-locked');
      card.style.position = 'relative';
      const badge = document.createElement('div');
      badge.className = 'xcp-lock-badge';
      badge.textContent = 'ðŸ”’ Agent Only';
      card.appendChild(badge);
    }
  });
}

XceliasAuth.guard({
  moduleName: 'Portal',
  requiredRoles: null, // any authenticated user can access home
  onReady: applyPortalRoles,
});

/* â”€â”€â”€ Card click / keyboard bindings â”€â”€â”€ */
document.querySelectorAll('.project-card').forEach((card) => {
  const key = card.dataset.project;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.card-launch')) return;
    launchProject(key);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      launchProject(key);
    }
  });

  const btn = card.querySelector('.card-launch');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      launchProject(key);
    });
  }
});

/* â”€â”€â”€ Browser back/forward â”€â”€â”€ */
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.project) {
    launchProject(e.state.project);
  } else {
    goHome();
  }
});

/* â”€â”€â”€ Deep linking â”€â”€â”€ */
(function handleInitialHash() {
  const hash = location.hash.replace('#', '');
  if (hash && PROJECTS[hash]) {
    launchProject(hash);
  }
})();
