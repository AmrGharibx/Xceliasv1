/* ═══════════════════════════════════════════════════════════
   XCELIAS PORTAL — NAVIGATION + PARTICLE SYSTEM + EFFECTS
   ═══════════════════════════════════════════════════════════ */

function escHtml(s){const d=document.createElement('div');d.textContent=String(s??'');return d.innerHTML;}

const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const PROJECTS = {
  activities: {
    name:  'Training Academy',
    url:   '/activities/index.html',
    mode:  'iframe'
  },
  content: {
    name:  'Training Manual',
    url:   '/content/index.html',
    mode:  'iframe'
  },
  avaria: {
    name:  'Academy Operations',
    url:   IS_LOCAL ? 'http://localhost:3005' : 'https://lms.xcelias.com',
    mode:  'iframe'
  },
  reports: {
    name:  'Report Generator',
    url:   '/reports/index.html',
    mode:  'iframe'
  },
  website: {
    name:  'Property Explorer',
    url:   IS_LOCAL ? 'http://localhost:3000' : '/website/index.html',
    mode:  'iframe'
  }
};

/* ─── State ─── */
let activeProject = null;
let currentIframeUrl = null;

/* ─── Auth State ─── */
let xcPortalUser = null;
// Keys not listed = accessible to any logged-in user
const XCP_ROLE_MAP = {
  website: ['admin', 'agent']
};

/* ─── DOM refs ─── */
const homeView     = document.getElementById('home-view');
const projectView  = document.getElementById('project-view');
const iframe       = document.getElementById('project-iframe');
const topbarTitle  = document.getElementById('topbar-title');
const topbarNewTab = document.getElementById('topbar-newtab');
const iframeLoader = document.getElementById('iframe-loading');

/* ═══════════════════════════════════════════════════
   PARTICLE SYSTEM (ambient floating particles)
   ═══════════════════════════════════════════════════ */
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
    constructor() { this.reset(); }
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
  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    animId = requestAnimationFrame(animate);
  }
  animate();

  // Pause when in project view
  const obs = new MutationObserver(() => {
    if (!projectView.classList.contains('hidden')) {
      cancelAnimationFrame(animId);
    } else {
      animate();
    }
  });
  obs.observe(projectView, { attributes: true, attributeFilter: ['class'] });
})();

/* ═══════════════════════════════════════════════════
   COUNTER ANIMATION (hero stats) — rAF-based
   ═══════════════════════════════════════════════════ */
(function animateCounters() {
  const nums = document.querySelectorAll('.hero-stat-num[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
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
  }, { threshold: 0.3 });
  nums.forEach(n => io.observe(n));
})();

/* ═══════════════════════════════════════════════════
   LAUNCH PROJECT
   ═══════════════════════════════════════════════════ */
function launchProject(key) {
  const proj = PROJECTS[key];
  if (!proj) return;

  // Role check
  const allowedRoles = XCP_ROLE_MAP[key];
  if (allowedRoles && xcPortalUser && !allowedRoles.includes(xcPortalUser.role)) {
    const el = document.getElementById('xcp-access-denied');
    if (el) {
      el.textContent = '🔒 Agent access required. Ask your admin to upgrade your account.';
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 3500);
    }
    return;
  }

  if (proj.mode === 'tab') {
    if (!proj.url) {
      showAvariaBanner();
      return;
    }
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
    if (window._iframeTimeout) { clearTimeout(window._iframeTimeout); window._iframeTimeout = null; }
  };

  // Error handler
  iframe.onerror = () => {
    showIframeError(proj.name);
    if (window._iframeTimeout) { clearTimeout(window._iframeTimeout); window._iframeTimeout = null; }
  };

  // Timeout: if iframe hasn't loaded in 30s, show error
  window._iframeTimeout = setTimeout(() => {
    if (!iframeLoader.classList.contains('hidden')) {
      showIframeError(proj.name);
    }
  }, 30000);

  history.pushState({ project: key }, proj.name, '#' + key);
}

/* ─── Return to home ─── */
function goHome() {
  activeProject = null;
  currentIframeUrl = null;
  iframe.src = 'about:blank';
  iframe.onload = null;
  iframe.onerror = null;
  if (window._iframeTimeout) { clearTimeout(window._iframeTimeout); window._iframeTimeout = null; }

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

/* ─── Show iframe load error ─── */
function showIframeError(projectName) {
  iframeLoader.classList.add('hidden');

  const existing = document.getElementById('iframe-error');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'iframe-error';
  overlay.style.cssText = 'position:absolute;inset:48px 0 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--bg,#0f0f1a);z-index:6;text-align:center;padding:24px';
  overlay.innerHTML = `
    <div style="font-size:3rem;opacity:0.5">⚠️</div>
    <h3 style="font-size:1.1rem;font-weight:700;color:#e8e8f0">Failed to Load</h3>
    <p style="font-size:0.82rem;color:#9898b8;max-width:360px;line-height:1.6">${escHtml(projectName || 'This module')} didn't respond. Make sure the server is running and try again.</p>
    <div style="display:flex;gap:12px;margin-top:8px">
      <button onclick="location.reload()" style="padding:10px 24px;border-radius:50px;border:1px solid rgba(102,126,234,0.3);background:rgba(102,126,234,0.1);color:#a5b4fc;font-family:inherit;font-size:0.78rem;font-weight:600;cursor:pointer">Retry</button>
      <button onclick="goHome()" style="padding:10px 24px;border-radius:50px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.05);color:#9898b8;font-family:inherit;font-size:0.78rem;font-weight:600;cursor:pointer">Back to Home</button>
    </div>
  `;
  projectView.appendChild(overlay);
}

/* ─── Open in new tab ─── */
function openInNewTab() {
  if (currentIframeUrl) {
    window.open(currentIframeUrl, '_blank', 'noopener');
  }
}

/* ─── Keyboard shortcuts ─── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeProject) goHome();
});

/* ═══════════════════════════════════════════════════════════════
   XC PORTAL AUTH GUARD
   ═══════════════════════════════════════════════════════════════ */
(function xcPortalAuthGuard() {
  'use strict';
  const _r = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const _w = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const _hash = async (s) => {
    try {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
    } catch {
      throw new Error('Secure hashing unavailable — HTTPS required');
    }
  };

  function applyRoles(user) {
    xcPortalUser = user;
    // Populate user chip
    const chip = document.getElementById('xcp-user-chip');
    if (chip) {
      const roleLabel = { admin: '👑 Admin', agent: '🏠 Agent', trainee: '🎓 Trainee' }[user.role] || user.role;
      chip.innerHTML = `<span class="xcp-chip-name">${escHtml(user.displayName || user.username)}</span><span class="xcp-chip-role">${escHtml(roleLabel)}</span><button class="xcp-chip-signout" id="xcp-signout">Sign Out</button>`;
      chip.style.display = 'flex';
      document.getElementById('xcp-signout').addEventListener('click', () => {
        try { localStorage.removeItem('xcCurrentUser'); } catch {}
        if (window.xcFirebaseReady && window.xcAuth) window.xcAuth.signOut().catch(() => {});
        location.reload();
      });
    }
    // Apply locked state to restricted cards
    document.querySelectorAll('.project-card').forEach(card => {
      const key = card.dataset.project;
      const required = XCP_ROLE_MAP[key];
      if (required && !required.includes(user.role)) {
        card.classList.add('xcp-card-locked');
        card.style.position = 'relative';
        const badge = document.createElement('div');
        badge.className = 'xcp-lock-badge';
        badge.textContent = '🔒 Agent Only';
        card.appendChild(badge);
      }
    });
  }

  const trySignIn = async (username, password) => {
    const u = username.toLowerCase().trim();
    if (window.xcFirebaseReady) {
      try {
        const cred = await window.xcAuth.signInWithEmailAndPassword(`${u}@xcelias.internal`, password);
        const snap = await window.xcDB.ref(`users/${cred.user.uid}`).once('value');
        const profile = snap.val();
        if (!profile) throw new Error('Account profile not found');
        const user = { uid: cred.user.uid, ...profile };
        _w('xcCurrentUser', user);
        return user;
      } catch (e) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') throw new Error('Invalid username or password');
        throw e;
      }
    }
    // Offline
    const adminSetup = _r('xcAdminSetup', null);
    if (u === 'admin') {
      if (!adminSetup) throw new Error('No admin found. Log in via Training Academy first.');
      const h = await _hash(password);
      if (h !== adminSetup.passwordHash) throw new Error('Invalid username or password');
      const user = { uid: 'admin_local', username: 'admin', displayName: 'Admin', role: 'admin', batchId: 'admin' };
      _w('xcCurrentUser', user);
      return user;
    }
    const accounts = _r('xcAccounts', []);
    if (!accounts.length) throw new Error('No accounts found. Log in via Training Academy first.');
    const account = accounts.find(a => (a.username || '').toLowerCase() === u);
    if (!account) throw new Error('Invalid username or password');
    const h = await _hash(password);
    if (h !== account.passwordHash) throw new Error('Invalid username or password');
    _w('xcCurrentUser', account);
    return account;
  };

  const overlay  = document.getElementById('xcp-auth-guard');
  const cur = _r('xcCurrentUser', null);

  // Already logged in — verify via Firebase before trusting localStorage
  if (cur && cur.role) {
    if (window.xcFirebaseReady && window.xcAuth) {
      // Online: verify a real Firebase session backs this localStorage claim
      const _unsub = window.xcAuth.onAuthStateChanged((fbUser) => {
        _unsub();
        if (fbUser) {
          // Real Firebase session — proceed
          if (overlay) overlay.remove();
          applyRoles(cur);
        } else {
          // No Firebase session — check for legitimate offline accounts
          const adminSetup = _r('xcAdminSetup', null);
          const accounts = _r('xcAccounts', []);
          const isOfflineAdmin = cur.uid === 'admin_local' && adminSetup;
          const isOfflineAccount = accounts.some(a => a.uid === cur.uid);
          if (isOfflineAdmin || isOfflineAccount) {
            if (overlay) overlay.remove();
            applyRoles(cur);
          } else {
            // Forged localStorage — wipe and force re-login
            try { localStorage.removeItem('xcCurrentUser'); } catch {}
            location.reload();
          }
        }
      });
    } else {
      // Offline: trust localStorage (legitimate offline flow)
      if (overlay) overlay.remove();
      applyRoles(cur);
    }
    return;
  }

  // Show overlay and attach form handlers
  const form     = document.getElementById('xcp-form');
  const errEl    = document.getElementById('xcp-error');
  const submitEl = document.getElementById('xcp-submit');
  const unameEl  = document.getElementById('xcp-username');
  const pwEl     = document.getElementById('xcp-password');
  const toggle   = document.getElementById('xcp-pw-toggle');

  if (toggle) toggle.addEventListener('click', () => {
    pwEl.type = pwEl.type === 'password' ? 'text' : 'password';
    toggle.textContent = pwEl.type === 'password' ? '👁' : '🙈';
  });

  const showErr  = (m) => {
    if (errEl) {
      errEl.textContent = m;
      errEl.style.display = m ? 'block' : 'none';
    }
  };
  const setLoad  = (on) => { if (submitEl) { submitEl.disabled = on; submitEl.textContent = on ? '· · ·' : '⚡ Enter Portal'; } };

  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uname = (unameEl?.value || '').trim();
    const pw    = pwEl?.value || '';
    if (!uname || !pw) { showErr('Enter username and password'); return; }
    setLoad(true); showErr('');
    try {
      const user = await trySignIn(uname, pw);
      if (overlay) overlay.remove();
      applyRoles(user);
    } catch (err) { showErr(err.message || 'Login failed'); }
    setLoad(false);
  });
})();

/* ─── Card click / keyboard bindings ─── */
document.querySelectorAll('.project-card').forEach(card => {
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

/* ─── Browser back/forward ─── */
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.project) {
    launchProject(e.state.project);
  } else {
    goHome();
  }
});

/* ═══════════════════════════════════════════════════
   AVARIA BANNER (graceful server-required notice)
   ═══════════════════════════════════════════════════ */
function showAvariaBanner() {
  // Remove existing banner if any
  const existing = document.getElementById('avaria-banner');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'avaria-banner';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);animation:fadeIn .3s ease';
  overlay.innerHTML = `
    <div style="background:linear-gradient(180deg,rgba(30,30,50,0.97),rgba(15,15,26,0.98));border:1px solid rgba(102,126,234,0.25);border-radius:20px;padding:40px;max-width:480px;width:90%;box-shadow:0 24px 80px rgba(0,0,0,0.6),0 0 60px rgba(102,126,234,0.08);text-align:center">
      <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 20px">🏛️</div>
      <h3 style="font-size:20px;font-weight:700;color:#e8e8f0;margin-bottom:8px">Server Required</h3>
      <p style="color:#9898b8;font-size:14px;line-height:1.6;margin-bottom:24px">Academy Operations runs on a local Next.js server with database and authentication. It requires a separate setup.</p>
      <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(102,126,234,0.15);border-radius:12px;padding:16px;margin-bottom:24px;text-align:left">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#667eea;margin-bottom:10px;font-weight:600">Run locally</div>
        <code style="font-family:monospace;font-size:13px;color:#f093fb;line-height:1.8;display:block">cd "System Before Prompting V2/avaria"</code>
        <code style="font-family:monospace;font-size:13px;color:#f093fb;display:block">npm run dev</code>
      </div>
      <button onclick="document.getElementById('avaria-banner').remove()" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:12px 36px;border-radius:50px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s ease;box-shadow:0 8px 24px rgba(102,126,234,0.3)">Got it</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

/* ─── Deep linking ─── */
(function handleInitialHash() {
  const hash = location.hash.replace('#', '');
  if (hash && PROJECTS[hash]) {
    launchProject(hash);
  }
})();
