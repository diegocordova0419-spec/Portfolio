const modes = {
  focus: { label: 'FOCUS SESSION', button: 'Start focus', duration: 25 },
  short: { label: 'SHORT BREAK', button: 'Start break', duration: 5 },
  long: { label: 'LONG BREAK', button: 'Start break', duration: 15 }
};
const circumference = 2 * Math.PI * 96;
const ring = document.getElementById('ringProgress');
const timerDisplay = document.getElementById('timer');
const durationLabel = document.getElementById('durationLabel');
const sessionStatus = document.getElementById('sessionStatus');
const toggleButton = document.getElementById('toggleTimer');
const durationByMode = Object.fromEntries(Object.entries(modes).map(([key, mode]) => [key, mode.duration]));
let activeMode = 'focus';
let remainingSeconds = durationByMode[activeMode] * 60;
let endAt = 0;
let intervalId = null;
let completed = false;

function render() {
  const totalSeconds = durationByMode[activeMode] * 60;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  timerDisplay.setAttribute('aria-label', `${minutes} minutes ${seconds} seconds remaining`);
  durationLabel.textContent = durationByMode[activeMode];
  document.getElementById('modeLabel').textContent = modes[activeMode].label;
  toggleButton.textContent = intervalId ? 'Pause session' : modes[activeMode].button;
  ring.style.strokeDasharray = String(circumference);
  ring.style.strokeDashoffset = String(circumference * (1 - remainingSeconds / totalSeconds));
  document.querySelectorAll('.mode-button').forEach((button) => {
    const selected = button.dataset.mode === activeMode;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function stopTimer() {
  window.clearInterval(intervalId);
  intervalId = null;
}

function tick() {
  remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  if (remainingSeconds === 0) {
    stopTimer();
    completed = true;
    sessionStatus.textContent = 'Session complete. Nice work!';
  }
  render();
}

function selectMode(mode) {
  stopTimer();
  activeMode = mode;
  completed = false;
  remainingSeconds = durationByMode[activeMode] * 60;
  sessionStatus.textContent = 'Ready when you are';
  render();
}

toggleButton.addEventListener('click', () => {
  if (intervalId) {
    remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    stopTimer();
    completed = false;
    sessionStatus.textContent = 'Paused. Pick up when you’re ready.';
    render();
    return;
  }
  if (completed || remainingSeconds === 0) {
    remainingSeconds = durationByMode[activeMode] * 60;
    sessionStatus.textContent = 'Ready when you are';
  }
  completed = false;
  endAt = Date.now() + remainingSeconds * 1000;
  sessionStatus.textContent = 'You’ve got this.';
  intervalId = window.setInterval(tick, 250);
  render();
});

document.getElementById('resetTimer').addEventListener('click', () => {
  stopTimer();
  completed = false;
  remainingSeconds = durationByMode[activeMode] * 60;
  sessionStatus.textContent = 'Ready when you are';
  render();
});

document.querySelectorAll('.mode-button').forEach((button) => {
  button.addEventListener('click', () => selectMode(button.dataset.mode));
});

document.getElementById('decreaseDuration').addEventListener('click', () => {
  if (intervalId || durationByMode[activeMode] <= 1) return;
  durationByMode[activeMode] -= 1;
  remainingSeconds = durationByMode[activeMode] * 60;
  completed = false;
  sessionStatus.textContent = 'Ready when you are';
  render();
});

document.getElementById('increaseDuration').addEventListener('click', () => {
  if (intervalId || durationByMode[activeMode] >= 120) return;
  durationByMode[activeMode] += 1;
  remainingSeconds = durationByMode[activeMode] * 60;
  completed = false;
  sessionStatus.textContent = 'Ready when you are';
  render();
});

window.addEventListener('pagehide', stopTimer);
render();
