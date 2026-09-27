const expenseStorageKey = 'pocket-ledger-expenses';
const budgetStorageKey = 'pocket-ledger-budget';
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 });
const monthPicker = document.getElementById('monthPicker');
const dateInput = document.getElementById('dateInput');
const notice = document.getElementById('notice');
const currentDate = new Date();
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const today = localDate(currentDate);
monthPicker.value = monthKey(currentDate);
dateInput.value = today;
let budget = 15000;
let expenses = [];

try {
  const storedBudget = localStorage.getItem(budgetStorageKey);
  if (storedBudget !== null) {
    const savedBudget = Number(storedBudget);
    if (!Number.isFinite(savedBudget) || savedBudget < 0) throw new Error('Saved budget is invalid.');
    budget = savedBudget;
  }
  const savedExpenses = localStorage.getItem(expenseStorageKey);
  if (savedExpenses === null) {
    expenses = [
      { id: crypto.randomUUID(), description: 'Coffee & breakfast', amount: 185, category: 'Food', date: today },
      { id: crypto.randomUUID(), description: 'Train fare', amount: 72, category: 'Transport', date: today },
      { id: crypto.randomUUID(), description: 'Weekly groceries', amount: 1240, category: 'Food', date: today }
    ];
  } else {
    expenses = JSON.parse(savedExpenses);
    if (!Array.isArray(expenses) || expenses.some((item) => typeof item.id !== 'string' || typeof item.description !== 'string' || !Number.isFinite(item.amount) || typeof item.category !== 'string' || typeof item.date !== 'string')) {
      throw new Error('Saved expense data is invalid.');
    }
  }
} catch (error) {
  notice.textContent = 'Saved entries could not be loaded. New entries may not be saved.';
  console.error('Could not load the ledger:', error);
}

function save() {
  try {
    localStorage.setItem(expenseStorageKey, JSON.stringify(expenses));
    localStorage.setItem(budgetStorageKey, String(budget));
    notice.textContent = '';
  } catch (error) {
    notice.textContent = 'Could not save in this browser. Check your storage settings.';
    console.error('Could not save the ledger:', error);
  }
}

function render() {
  const selectedMonth = monthPicker.value;
  const monthExpenses = expenses.filter((item) => item.date.slice(0, 7) === selectedMonth).sort((a, b) => b.date.localeCompare(a.date));
  const total = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = budget - total;
  const usedPercent = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  document.getElementById('totalSpent').textContent = currency.format(total);
  document.getElementById('budgetValue').textContent = currency.format(budget);
  document.getElementById('remainingBudget').textContent = currency.format(remaining);
  document.getElementById('remainingBudget').classList.toggle('over-budget', remaining < 0);
  document.getElementById('monthCaption').textContent = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(`${selectedMonth}-01T12:00:00`));
  document.getElementById('budgetInput').value = budget;
  const budgetBar = document.getElementById('budgetBar');
  budgetBar.style.width = `${usedPercent}%`;
  budgetBar.classList.toggle('over-budget', total > budget);
  document.querySelector('.budget-track').setAttribute('aria-valuenow', usedPercent);
  document.getElementById('entryCount').textContent = `${monthExpenses.length} ${monthExpenses.length === 1 ? 'entry' : 'entries'}`;
  const categories = new Map();
  monthExpenses.forEach((item) => categories.set(item.category, (categories.get(item.category) || 0) + item.amount));
  const categoryBreakdown = document.getElementById('categoryBreakdown');
  if (categories.size === 0) {
    categoryBreakdown.innerHTML = '<p class="empty-category">Your category summary will appear here.</p>';
  } else {
    const largest = Math.max(...categories.values());
    categoryBreakdown.replaceChildren(...[...categories.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount]) => {
      const row = document.createElement('div');
      row.className = 'category-row';
      const label = document.createElement('span');
      label.className = 'category-name';
      label.textContent = name;
      const track = document.createElement('span');
      track.className = 'category-track';
      const bar = document.createElement('span');
      bar.style.width = `${Math.round((amount / largest) * 100)}%`;
      track.append(bar);
      const value = document.createElement('span');
      value.className = 'category-amount';
      value.textContent = currency.format(amount);
      row.append(label, track, value);
      return row;
    }));
  }
  const rows = document.getElementById('expenseRows');
  rows.replaceChildren(...monthExpenses.map((expense) => {
    const row = document.createElement('tr');
    const description = document.createElement('td');
    description.textContent = expense.description;
    const category = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = 'category-pill';
    pill.textContent = expense.category;
    category.append(pill);
    const date = document.createElement('td');
    date.textContent = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${expense.date}T12:00:00`));
    const amount = document.createElement('td');
    amount.className = 'amount-column';
    amount.textContent = currency.format(expense.amount);
    const action = document.createElement('td');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${expense.description}`);
    remove.addEventListener('click', () => {
      expenses = expenses.filter((item) => item.id !== expense.id);
      save();
      render();
    });
    action.append(remove);
    row.append(description, category, date, amount, action);
    return row;
  }));
  document.getElementById('emptyState').hidden = monthExpenses.length > 0;
}

document.getElementById('expenseForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const description = document.getElementById('descriptionInput').value.trim();
  const amount = Number(document.getElementById('amountInput').value);
  if (!description || !Number.isFinite(amount) || amount <= 0 || !dateInput.value) {
    notice.textContent = 'Enter a description, a positive amount, and a date.';
    return;
  }
  expenses.unshift({ id: crypto.randomUUID(), description, amount, category: document.getElementById('categoryInput').value, date: dateInput.value });
  monthPicker.value = monthKey(new Date(`${dateInput.value}T12:00:00`));
  document.getElementById('descriptionInput').value = '';
  document.getElementById('amountInput').value = '';
  save();
  render();
});

document.getElementById('budgetForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const updatedBudget = Number(document.getElementById('budgetInput').value);
  if (!Number.isFinite(updatedBudget) || updatedBudget < 0) {
    notice.textContent = 'Enter a valid budget of zero or more.';
    return;
  }
  budget = updatedBudget;
  save();
  render();
});

monthPicker.addEventListener('change', render);
render();
