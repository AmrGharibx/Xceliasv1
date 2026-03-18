/* ═══════════════════════════════════════════════════════════
   XCELIAS PORTAL — NAVIGATION + PARTICLE SYSTEM + EFFECTS
   ═══════════════════════════════════════════════════════════ */

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
    url:   '/website/index.html',
    mode:  'iframe'
  }
};

/* ─── State ─── */
let activeProject = null;
let currentIframeUrl = null;

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
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const PARTICLE_COUNT = 60;

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
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(102, 126, 234, ${0.06 * (1 - dist / 150)})`;
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
   COUNTER ANIMATION (hero stats)
   ═══════════════════════════════════════════════════ */
(function animateCounters() {
  const nums = document.querySelectorAll('.hero-stat-num[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.count.includes('+') ? '+' : '';
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const interval = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(interval);
          }
          el.textContent = current + suffix;
        }, 30);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(n => io.observe(n));
})();

/* ═══════════════════════════════════════════════════
   LAUNCH PROJECT
   ═══════════════════════════════════════════════════ */
function launchProject(key) {
  const proj = PROJECTS[key];
  if (!proj) return;

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

  // Hide loader when iframe loads
  iframe.onload = () => {
    iframeLoader.classList.add('hidden');
  };

  history.pushState({ project: key }, proj.name, '#' + key);
}

/* ─── Return to home ─── */
function goHome() {
  activeProject = null;
  currentIframeUrl = null;
  iframe.src = 'about:blank';
  iframe.onload = null;

  projectView.classList.add('hidden');
  homeView.style.display = '';

  if (location.hash) {
    history.pushState(null, 'Xcelias', location.pathname);
  }
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
