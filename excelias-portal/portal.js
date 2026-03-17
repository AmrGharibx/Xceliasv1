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
    url:   IS_LOCAL ? 'http://localhost:3005' : null,
    mode:  'tab'
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
      alert('Academy Operations (Avaria) requires a local Next.js server.\n\nRun locally:\n  cd "System Before Prompting V2/avaria" && npm run dev\n\nThen access at http://localhost:3005');
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

/* ─── Deep linking ─── */
(function handleInitialHash() {
  const hash = location.hash.replace('#', '');
  if (hash && PROJECTS[hash]) {
    launchProject(hash);
  }
})();
