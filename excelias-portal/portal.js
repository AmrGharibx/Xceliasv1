/* ═══════════════════════════════════════════════════
   EXCELIAS PORTAL — NAVIGATION LOGIC
   ═══════════════════════════════════════════════════ */

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
    url:   'http://localhost:3005',
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
const homeView    = document.getElementById('home-view');
const projectView = document.getElementById('project-view');
const iframe      = document.getElementById('project-iframe');
const topbarTitle = document.getElementById('topbar-title');
const topbarNewTab= document.getElementById('topbar-newtab');

/* ─── Launch a project ─── */
function launchProject(key) {
  const proj = PROJECTS[key];
  if (!proj) return;

  /* Avaria opens in a new tab (X-Frame-Options: DENY + absolute paths) */
  if (proj.mode === 'tab') {
    window.open(proj.url, '_blank', 'noopener');
    return;
  }

  activeProject = key;
  currentIframeUrl = proj.url;

  /* Show project view */
  homeView.style.display = 'none';
  projectView.classList.remove('hidden');
  topbarTitle.textContent = proj.name;

  /* Load iframe */
  iframe.src = proj.url;

  /* Push history state so browser back = go home */
  history.pushState({ project: key }, proj.name, '#' + key);
}

/* ─── Return to home ─── */
function goHome() {
  activeProject = null;
  currentIframeUrl = null;

  /* Unload iframe to free resources */
  iframe.src = 'about:blank';

  /* Show home */
  projectView.classList.add('hidden');
  homeView.style.display = '';

  /* Clean URL */
  if (location.hash) {
    history.pushState(null, 'Excelias', location.pathname);
  }
}

/* ─── Open current project in a new tab ─── */
function openInNewTab() {
  if (currentIframeUrl) {
    window.open(currentIframeUrl, '_blank', 'noopener');
  }
}

/* ─── Keyboard shortcuts ─── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeProject) {
    goHome();
  }
});

/* ─── Card click / keyboard bindings ─── */
document.querySelectorAll('.project-card').forEach(card => {
  const key = card.dataset.project;

  card.addEventListener('click', (e) => {
    /* Don't double-fire if the launch button was clicked */
    if (e.target.closest('.card-launch')) return;
    launchProject(key);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      launchProject(key);
    }
  });

  /* Launch button inside card */
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

/* ─── Deep linking: handle initial #hash ─── */
(function handleInitialHash() {
  const hash = location.hash.replace('#', '');
  if (hash && PROJECTS[hash]) {
    launchProject(hash);
  }
})();
