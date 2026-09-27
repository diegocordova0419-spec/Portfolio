// ── Theme toggle ──────────────────────────────────────────
const html     = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const saved    = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', saved);

themeBtn.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});


// ── Scroll-triggered reveal ───────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = Number(entry.target.dataset.delay) || 0;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.project-card').forEach((el, i) => {
  el.dataset.delay = i * 80;
  observer.observe(el);
});

document.querySelectorAll('.skill-item').forEach((el, i) => {
  el.dataset.delay = i * 40;
  observer.observe(el);
});


// ── Project data ──────────────────────────────────────────
const projects = {
  weather: {
    icon:     '🌤️',
    title:    'Weather Dashboard',
    subtitle: 'Live weather data with a clean, responsive UI',
    desc:     'A real-time weather application that fetches current conditions and forecasts using the OpenWeather API. The goal was to practice consuming REST APIs, handling async JavaScript, and designing a layout that works on any screen size.',
    features: [
      'Current conditions: temperature, humidity, wind speed, and UV index',
      '5-day hourly forecast with weather condition icons',
      'City search with auto-suggestions and geolocation fallback',
      'Dynamic background that shifts based on time of day',
      'Fully responsive — optimized for mobile and desktop'
    ],
    tags: ['HTML', 'CSS', 'JavaScript', 'OpenWeather API', 'Fetch API', 'Flexbox'],
    live: 'weather/index.html',
    code: 'https://github.com/diegocordova0419-spec'
  },

  snake: {
    icon:     '🎮',
    title:    'Canvas Snake Game',
    subtitle: 'Classic snake, built from scratch with the Canvas API',
    desc:     'A fully playable browser snake game built using vanilla JavaScript and the HTML5 Canvas API — no libraries, no frameworks. This project pushed me to understand game loops, collision detection, and smooth 60fps rendering.',
    features: [
      'Smooth 60fps game loop using requestAnimationFrame',
      'Collision detection for walls, self, and food',
      'Progressive difficulty — snake speeds up as your score grows',
      'High score tracking stored in localStorage',
      'Touch swipe controls for mobile play'
    ],
    tags: ['JavaScript', 'Canvas API', 'HTML', 'CSS', 'Game Loop', 'localStorage'],
    live: 'snake/index.html',
    code: 'https://github.com/diegocordova0419-spec'
  },

  movies: {
    icon:     '🍿',
    title:    'Movie Tracker',
    subtitle: 'Search, discover, and save movies — built with React',
    desc:     'My first real React project: a movie discovery and watchlist app powered by the TMDB API. Built while learning React hooks, focusing on clean component structure and state management without any external state library.',
    features: [
      'Search movies by title with debounced live results',
      'Movie detail view with cast, ratings, and overview',
      'Add/remove from a personal watchlist with one click',
      'Watchlist persists across sessions via localStorage',
      'Responsive grid layout with skeleton loading states'
    ],
    tags: ['React', 'JavaScript', 'TMDB API', 'CSS Modules', 'React Hooks', 'localStorage'],
    live: 'movies/index.html',
    code: 'https://github.com/diegocordova0419-spec'
  },

  taskboard: {
    icon:     '✅',
    title:    'Daymark — Task Planner',
    subtitle: 'A simple task board for planning the day',
    desc:     'A responsive task planner that keeps a small to-do list organized without an account. Add tasks, mark them complete, filter by status, and come back to the same list later.',
    features: [
      'Add tasks with a title and optional category',
      'Filter the list by all, active, or completed tasks',
      'Track task completion with a live progress summary',
      'Persist tasks in the browser between visits',
      'Responsive layout with empty and completed states'
    ],
    tags: ['HTML', 'CSS', 'JavaScript', 'localStorage', 'Responsive Design'],
    live: 'taskboard/index.html',
    code: 'https://github.com/diegocordova0419-spec'
  },

  expenses: {
    icon:     '💸',
    title:    'Pocket Ledger — Expense Tracker',
    subtitle: 'A personal spending tracker with clear summaries',
    desc:     'A small personal finance dashboard for recording everyday spending and reviewing where the money goes. Entries are saved locally in the browser, with totals grouped by category.',
    features: [
      'Record an amount, category, date, and short description',
      'See monthly spending and remaining budget at a glance',
      'Compare spending across categories with a visual breakdown',
      'Remove entries and update summaries immediately',
      'Keep the ledger between visits using local storage'
    ],
    tags: ['HTML', 'CSS', 'JavaScript', 'Data Visualization', 'localStorage'],
    live: 'expenses/index.html',
    code: 'https://github.com/diegocordova0419-spec'
  },

  focus: {
    icon:     '⏱️',
    title:    'Flowtime — Focus Timer',
    subtitle: 'A distraction-free Pomodoro timer',
    desc:     'A minimal focus timer for working in short, intentional sessions. Choose a work or break interval, start the countdown, and pause or reset it whenever plans change.',
    features: [
      'Switch between focus, short break, and long break sessions',
      'Start, pause, and reset the countdown',
      'Adjust session lengths to fit your routine',
      'Announce when a session finishes',
      'Keep controls keyboard accessible and layouts responsive'
    ],
    tags: ['HTML', 'CSS', 'JavaScript', 'Timers', 'Accessibility'],
    live: 'focus/index.html',
    code: 'https://github.com/diegocordova0419-spec'
  }
};


// ── Modal logic ───────────────────────────────────────────
const backdrop      = document.getElementById('modalBackdrop');
const modalIcon     = document.getElementById('modalIcon');
const modalTitle    = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalDesc     = document.getElementById('modalDesc');
const modalFeatures = document.getElementById('modalFeatures');
const modalTags     = document.getElementById('modalTags');
const modalActions  = document.getElementById('modalActions');
const modalClose    = document.getElementById('modalClose');

function openModal(key) {
  const p = projects[key];
  if (!p) return;

  modalIcon.textContent     = p.icon;
  modalTitle.textContent    = p.title;
  modalSubtitle.textContent = p.subtitle;
  modalDesc.textContent     = p.desc;

  modalFeatures.innerHTML = p.features
    .map(f => `<li>${f}</li>`)
    .join('');

  modalTags.innerHTML = p.tags
    .map(t => `<span class="tag">${t}</span>`)
    .join('');

  modalActions.innerHTML = [
    p.live && `<a href="${p.live}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">↗ View live</a>`,
    p.code && `<a href="${p.code}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">⌥ GitHub profile</a>`
  ].filter(Boolean).join('');

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-project-details]').forEach(button => {
  button.addEventListener('click', () => openModal(button.dataset.projectDetails));
});

// Close methods
modalClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', (e) => {
  if (e.target === backdrop) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});