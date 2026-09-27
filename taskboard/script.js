const storageKey = 'daymark-tasks';
const form = document.getElementById('taskForm');
const input = document.getElementById('taskInput');
const categoryInput = document.getElementById('taskCategory');
const list = document.getElementById('taskList');
const notice = document.getElementById('notice');
const emptyState = document.getElementById('emptyState');
const remainingCount = document.getElementById('remainingCount');
const progressLabel = document.getElementById('progressLabel');
const progressBar = document.getElementById('progressBar');
const progressTrack = document.querySelector('.progress-track');
let filter = 'all';
let tasks = [];

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!Array.isArray(saved) || saved.some((task) => typeof task.id !== 'string' || typeof task.title !== 'string' || typeof task.completed !== 'boolean')) {
    throw new Error('Saved task data is invalid.');
  }
  tasks = saved;
} catch (error) {
  notice.textContent = 'Saved tasks could not be loaded. Your new tasks may not be saved.';
  console.error('Could not load saved tasks:', error);
}

function saveTasks() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    notice.textContent = '';
  } catch (error) {
    notice.textContent = 'Could not save tasks in this browser. Check your storage settings.';
    console.error('Could not save tasks:', error);
  }
}

function render() {
  const remaining = tasks.filter((task) => !task.completed).length;
  const completed = tasks.length - remaining;
  const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  remainingCount.textContent = remaining;
  progressLabel.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  progressTrack.setAttribute('aria-valuenow', percentage);
  const visible = tasks.filter((task) => filter === 'all' || (filter === 'active' ? !task.completed : task.completed));
  list.replaceChildren(...visible.map((task) => {
    const row = document.createElement('li');
    row.className = `task-item${task.completed ? ' completed' : ''}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'task-toggle';
    toggle.setAttribute('aria-label', `${task.completed ? 'Mark as not done' : 'Complete'}: ${task.title}`);
    toggle.setAttribute('aria-pressed', String(task.completed));
    toggle.textContent = task.completed ? '✓' : '';
    toggle.addEventListener('click', () => {
      task.completed = !task.completed;
      saveTasks();
      render();
    });
    const copy = document.createElement('div');
    copy.className = 'task-copy';
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    const category = document.createElement('span');
    category.className = 'task-category';
    category.textContent = task.category;
    copy.append(title, category);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-button';
    remove.setAttribute('aria-label', `Delete ${task.title}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
    });
    row.append(toggle, copy, remove);
    return row;
  }));
  emptyState.hidden = visible.length > 0;
  document.getElementById('clearCompleted').disabled = completed === 0;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) {
    notice.textContent = 'Enter a task before adding it.';
    input.focus();
    return;
  }
  tasks.unshift({ id: crypto.randomUUID(), title, category: categoryInput.value, completed: false });
  filter = 'all';
  document.querySelectorAll('.filter').forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  input.value = '';
  saveTasks();
  render();
  input.focus();
});

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render();
  });
});

document.getElementById('clearCompleted').addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

render();
