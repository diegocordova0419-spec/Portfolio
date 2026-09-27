console.log('Weather dashboard script loaded');

const API_KEY = '510bec71b8c9a7a2af441f7312e5ce6e';
const API_BASE = 'https://api.openweathermap.org/data/2.5';
const elements = {
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  locationBtn: document.getElementById('locationBtn'),
  errorMsg: document.getElementById('errorMsg'),
  weatherCard: document.getElementById('weatherCard'),
  cityName: document.getElementById('cityName'),
  weatherDate: document.getElementById('weatherDate'),
  weatherDesc: document.getElementById('weatherDesc'),
  weatherIcon: document.getElementById('weatherIcon'),
  temperature: document.getElementById('temperature'),
  feelsLike: document.getElementById('feelsLike'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  visibility: document.getElementById('visibility'),
  forecastGrid: document.getElementById('forecastGrid'),
  forecastSection: document.getElementById('forecastSection'),
  emptyState: document.getElementById('emptyState'),
  loading: document.getElementById('loading')
};

function showError(message) {
  elements.errorMsg.textContent = message;
  elements.errorMsg.setAttribute('role', 'alert');
}

function setLoading(isLoading) {
  elements.loading.style.display = isLoading ? 'block' : 'none';
  elements.searchBtn.disabled = isLoading;
  elements.locationBtn.disabled = isLoading;
  if (isLoading) {
    elements.weatherCard.style.display = 'none';
    elements.forecastSection.style.display = 'none';
    elements.emptyState.style.display = 'none';
  }
}

async function requestWeather(path) {
  const response = await fetch(`${API_BASE}/${path}&appid=${encodeURIComponent(API_KEY)}&units=metric`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Weather request failed (${response.status})`);
  }
  return data;
}

function renderCurrentWeather(data) {
  const weather = data.weather[0];
  elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
  elements.weatherDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  }).format(new Date());
  elements.weatherDesc.textContent = weather.description;
  elements.weatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
  elements.weatherIcon.alt = weather.description;
  elements.temperature.textContent = `${Math.round(data.main.temp)}°C`;
  elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  elements.humidity.textContent = `${data.main.humidity}%`;
  elements.wind.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
  elements.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
}

function renderForecast(data) {
  const daily = new Map();
  data.list.forEach((item) => {
    const day = item.dt_txt.slice(0, 10);
    if (!daily.has(day)) daily.set(day, []);
    daily.get(day).push(item);
  });

  const days = [...daily.entries()].slice(0, 5);
  elements.forecastGrid.replaceChildren(...days.map(([day, readings]) => {
    const midday = readings.find(item => item.dt_txt.includes('12:00:00')) || readings[0];
    const temps = readings.map(item => item.main.temp);
    const card = document.createElement('div');
    card.className = 'forecast-card';
    const label = document.createElement('p');
    label.className = 'forecast-day';
    label.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${day}T12:00:00`));
    const icon = document.createElement('img');
    icon.className = 'forecast-icon';
    icon.src = `https://openweathermap.org/img/wn/${midday.weather[0].icon}.png`;
    icon.alt = midday.weather[0].description;
    const high = document.createElement('p');
    high.className = 'forecast-high';
    high.textContent = `${Math.round(Math.max(...temps))}°`;
    const low = document.createElement('p');
    low.className = 'forecast-low';
    low.textContent = `${Math.round(Math.min(...temps))}°`;
    const description = document.createElement('p');
    description.className = 'forecast-desc';
    description.textContent = midday.weather[0].description;
    card.append(label, icon, high, low, description);
    return card;
  }));
}

async function fetchByCity() {
  const city = elements.searchInput.value.trim();
  if (!city) {
    showError('Enter a city name to search.');
    elements.searchInput.focus();
    return;
  }
  if (!API_KEY || API_KEY === 'MY_KEY_HERE') {
    showError('Add your OpenWeather API key to weather/script.js before searching.');
    console.warn('OpenWeather API key is not configured.');
    return;
  }

  elements.errorMsg.textContent = '';
  setLoading(true);
  try {
    const query = `q=${encodeURIComponent(city)}`;
    const [current, forecast] = await Promise.all([
      requestWeather(`weather?${query}`),
      requestWeather(`forecast?${query}`)
    ]);
    renderCurrentWeather(current);
    renderForecast(forecast);
    elements.weatherCard.style.display = 'block';
    elements.forecastSection.style.display = 'block';
    elements.emptyState.style.display = 'none';
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : 'Unable to load weather. Please try again.');
    elements.emptyState.style.display = 'block';
  } finally {
    setLoading(false);
  }
}

async function fetchByLocation() {
  if (!API_KEY || API_KEY === 'MY_KEY_HERE') {
    showError('Add your OpenWeather API key to weather/script.js before searching.');
    console.warn('OpenWeather API key is not configured.');
    return;
  }
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by this browser.');
    return;
  }
  elements.errorMsg.textContent = '';
  setLoading(true);
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
    const query = `lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
    const [current, forecast] = await Promise.all([
      requestWeather(`weather?${query}`),
      requestWeather(`forecast?${query}`)
    ]);
    renderCurrentWeather(current);
    renderForecast(forecast);
    elements.weatherCard.style.display = 'block';
    elements.forecastSection.style.display = 'block';
    elements.emptyState.style.display = 'none';
  } catch (error) {
    showError(error instanceof Error && error.message ? error.message : 'Unable to get your location. Please try again.');
    elements.emptyState.style.display = 'block';
  } finally {
    setLoading(false);
  }
}

elements.searchBtn.addEventListener('click', fetchByCity);
elements.searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') fetchByCity();
});
elements.locationBtn.addEventListener('click', fetchByLocation);
