const TMDB_KEY = '618de79c2da7c201d5fe3cfb2e01521b';
const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const grid = document.getElementById('movieGrid');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const emptyTitle = document.getElementById('emptyTitle');
const emptyText = document.getElementById('emptyText');
const searchInput = document.getElementById('movieSearch');
const resultsTab = document.getElementById('resultsTab');
const watchlistTab = document.getElementById('watchlistTab');
const watchlistCount = document.getElementById('watchlistCount');
const detailBackdrop = document.getElementById('detailBackdrop');
const detailContent = document.getElementById('detailContent');
let results = [];
let showingWatchlist = false;
let watchlist = readWatchlist();

function readWatchlist() {
  try {
    const saved = JSON.parse(localStorage.getItem('movieWatchlist') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveWatchlist() {
  try {
    localStorage.setItem('movieWatchlist', JSON.stringify(watchlist));
  } catch {
    errorMessage.textContent = 'Your browser could not save the watchlist. Check storage settings and try again.';
  }
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function hasMovie(movie) {
  return watchlist.some(item => item.id === movie.id);
}

function updateWatchlistCount() {
  watchlistCount.textContent = String(watchlist.length);
}

function switchTab(watchlistSelected) {
  showingWatchlist = watchlistSelected;
  resultsTab.classList.toggle('active', !watchlistSelected);
  watchlistTab.classList.toggle('active', watchlistSelected);
  resultsTab.setAttribute('aria-selected', String(!watchlistSelected));
  watchlistTab.setAttribute('aria-selected', String(watchlistSelected));
  renderMovies(watchlistSelected ? watchlist : results);
}

function toggleWatchlist(movie) {
  if (hasMovie(movie)) {
    watchlist = watchlist.filter(item => item.id !== movie.id);
  } else {
    watchlist = [...watchlist, {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      overview: movie.overview
    }];
  }
  saveWatchlist();
  updateWatchlistCount();
  renderMovies(showingWatchlist ? watchlist : results);
}

function renderMovies(movies) {
  grid.replaceChildren();
  if (!movies.length) {
    emptyState.hidden = false;
    if (showingWatchlist) {
      emptyTitle.textContent = 'Your watchlist is empty';
      emptyText.textContent = 'Save movies with the heart button and they will appear here.';
    } else if (results.length === 0 && searchInput.value.trim()) {
      emptyTitle.textContent = 'No movies found';
      emptyText.textContent = 'Try another title or check the spelling.';
    } else {
      emptyTitle.textContent = 'Find something to watch';
      emptyText.textContent = 'Search for a movie by title to see results here.';
    }
    return;
  }
  emptyState.hidden = true;
  const fragment = document.createDocumentFragment();
  movies.forEach(movie => fragment.append(createMovieCard(movie)));
  grid.append(fragment);
}

function createMovieCard(movie) {
  const card = makeElement('article', 'movie-card');
  card.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    openDetails(movie);
  });
  const posterButton = makeElement('button', 'poster-button');
  posterButton.type = 'button';
  posterButton.setAttribute('aria-label', `View details for ${movie.title}`);
  if (movie.poster_path) {
    const poster = makeElement('img', 'poster');
    poster.src = `${IMAGE_BASE}${movie.poster_path}`;
    poster.alt = `${movie.title} poster`;
    poster.loading = 'lazy';
    posterButton.append(poster);
  } else {
    posterButton.append(makeElement('span', 'poster-fallback', 'No poster available'));
  }
  posterButton.addEventListener('click', () => openDetails(movie));

  const info = makeElement('div', 'card-info');
  info.append(makeElement('h3', 'movie-title', movie.title));
  const meta = makeElement('div', 'movie-meta');
  const year = movie.release_date ? movie.release_date.slice(0, 4) : 'Year unknown';
  meta.append(makeElement('span', '', year));
  meta.append(makeElement('span', 'rating', `★ ${Number(movie.vote_average || 0).toFixed(1)}`));
  info.append(meta);
  info.append(makeElement('p', 'overview', movie.overview || 'No overview available.'));
  const saveButton = makeElement('button', `watch-button${hasMovie(movie) ? ' saved' : ''}`,
    hasMovie(movie) ? '♥ Saved to watchlist' : '♡ Add to watchlist');
  saveButton.type = 'button';
  saveButton.setAttribute('aria-pressed', String(hasMovie(movie)));
  saveButton.addEventListener('click', () => toggleWatchlist(movie));
  info.append(saveButton);
  card.append(posterButton, info);
  return card;
}

function showSkeletons() {
  emptyState.hidden = true;
  grid.replaceChildren();
  for (let index = 0; index < 10; index += 1) grid.append(makeElement('div', 'skeleton'));
}

async function apiRequest(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(TMDB_KEY)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.status_message || `TMDB request failed (${response.status})`);
  return data;
}

async function searchMovies(query) {
  if (!query.trim()) {
    errorMessage.textContent = 'Enter a movie title to search.';
    searchInput.focus();
    return;
  }
  if (!TMDB_KEY || TMDB_KEY === 'MY_KEY_HERE') {
    errorMessage.textContent = 'Add your TMDB API key to movies/script.js before searching.';
    console.warn('TMDB API key is not configured.');
    return;
  }
  showingWatchlist = false;
  resultsTab.classList.add('active');
  watchlistTab.classList.remove('active');
  resultsTab.setAttribute('aria-selected', 'true');
  watchlistTab.setAttribute('aria-selected', 'false');
  errorMessage.textContent = '';
  showSkeletons();
  try {
    const data = await apiRequest(`/search/movie?query=${encodeURIComponent(query.trim())}&include_adult=false`);
    results = data.results || [];
    renderMovies(results);
  } catch (error) {
    results = [];
    renderMovies(results);
    errorMessage.textContent = error instanceof Error && error.message ? error.message : 'Unable to search movies. Please try again.';
  }
}

async function openDetails(movie) {
  detailBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  detailContent.textContent = 'Loading movie details...';
  try {
    if (!TMDB_KEY || TMDB_KEY === 'MY_KEY_HERE') {
      throw new Error('Add your TMDB API key to movies/script.js to load movie details.');
    }
    const [details, credits] = await Promise.all([
      apiRequest(`/movie/${encodeURIComponent(movie.id)}`),
      apiRequest(`/movie/${encodeURIComponent(movie.id)}/credits`)
    ]);
    const layout = makeElement('div', 'detail-layout');
    if (details.poster_path) {
      const poster = makeElement('img', 'detail-poster');
      poster.src = `${IMAGE_BASE}${details.poster_path}`;
      poster.alt = `${details.title} poster`;
      layout.append(poster);
    }
    const copy = makeElement('div', 'detail-copy');
    copy.append(makeElement('h2', '', details.title));
    const year = details.release_date ? details.release_date.slice(0, 4) : 'Release year unknown';
    copy.append(makeElement('div', 'detail-subtitle', `${year} · ★ ${Number(details.vote_average || 0).toFixed(1)} / 10`));
    copy.append(makeElement('h3', '', 'Overview'));
    copy.append(makeElement('p', '', details.overview || 'No overview available.'));
    copy.append(makeElement('h3', '', 'Genres'));
    const genres = makeElement('div', 'genres');
    (details.genres || []).forEach(genre => genres.append(makeElement('span', 'genre', genre.name)));
    copy.append(genres);
    copy.append(makeElement('h3', '', 'Top cast'));
    const cast = makeElement('ol', 'cast-list');
    (credits.cast || []).slice(0, 5).forEach(person => cast.append(makeElement('li', '', person.name)));
    if (!credits.cast || !credits.cast.length) cast.append(makeElement('li', '', 'Cast information unavailable.'));
    copy.append(cast);
    const saveButton = makeElement('button', `watch-button${hasMovie(movie) ? ' saved' : ''}`,
      hasMovie(movie) ? '♥ Saved to watchlist' : '♡ Add to watchlist');
    saveButton.type = 'button';
    saveButton.addEventListener('click', () => {
      toggleWatchlist(movie);
      saveButton.classList.toggle('saved', hasMovie(movie));
      saveButton.textContent = hasMovie(movie) ? '♥ Saved to watchlist' : '♡ Add to watchlist';
    });
    copy.append(saveButton);
    layout.append(copy);
    detailContent.replaceChildren(layout);
  } catch (error) {
    detailContent.textContent = error instanceof Error && error.message ? error.message : 'Unable to load movie details.';
  }
}

function closeDetails() {
  detailBackdrop.hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  searchMovies(searchInput.value);
});
resultsTab.addEventListener('click', () => switchTab(false));
watchlistTab.addEventListener('click', () => switchTab(true));
document.getElementById('closeDetails').addEventListener('click', closeDetails);
detailBackdrop.addEventListener('click', event => {
  if (event.target === detailBackdrop) closeDetails();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !detailBackdrop.hidden) closeDetails();
});

updateWatchlistCount();
renderMovies(results);
