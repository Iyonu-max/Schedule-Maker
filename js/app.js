/* ===========================================
   app.js — Personal Dashboard
   =========================================== */

// ── Helpers ──────────────────────────────────
const $ = id => document.getElementById(id);
const store = {
  get: k => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ── Greeting & Clock ─────────────────────────
function updateGreeting() {
  const name = store.get('userName') || '';
  const now = new Date();
  const h = now.getHours();
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const greeting = `Good ${period}${name ? ', ' + name : ''}!`;
  $('greeting-text').textContent = greeting;
  $('datetime-text').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }) + ' · ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
updateGreeting();
setInterval(updateGreeting, 10000);

// ── Custom Name ───────────────────────────────
$('name-edit-btn').addEventListener('click', () => {
  $('name-input').value = store.get('userName') || '';
  $('name-modal').classList.remove('hidden');
  $('name-input').focus();
});
$('name-cancel').addEventListener('click', () => $('name-modal').classList.add('hidden'));
$('name-save').addEventListener('click', saveName);
$('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });
function saveName() {
  const v = $('name-input').value.trim();
  store.set('userName', v);
  $('name-modal').classList.add('hidden');
  updateGreeting();
}

// ── Focus Timer ───────────────────────────────
let timerInterval = null;
let timerSeconds = (store.get('pomodoroMinutes') || 25) * 60;
let timerRunning = false;

function renderTimer() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  $('timer-display').textContent = `${m}:${s}`;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = (store.get('pomodoroMinutes') || 25) * 60;
  renderTimer();
}

renderTimer();
$('pomodoro-minutes').value = store.get('pomodoroMinutes') || 25;

$('timer-start').addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      $('timer-display').textContent = 'Done!';
      return;
    }
    timerSeconds--;
    renderTimer();
  }, 1000);
});

$('timer-stop').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
});

$('timer-reset').addEventListener('click', resetTimer);

$('pomodoro-apply').addEventListener('click', () => {
  const val = parseInt($('pomodoro-minutes').value, 10);
  if (!val || val < 1 || val > 99) return;
  store.set('pomodoroMinutes', val);
  resetTimer();
});

// ── To-Do List ────────────────────────────────
let tasks = store.get('tasks') || [];

function saveTasks() { store.set('tasks', tasks); }

function renderTasks() {
  const sort = $('sort-select').value;
  const sorted = [...tasks];
  if (sort === 'alpha') sorted.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'done') sorted.sort((a, b) => Number(a.done) - Number(b.done));

  const ul = $('todo-list');
  ul.innerHTML = '';
  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.done;
    cb.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = task.text;
    span.addEventListener('dblclick', () => startEdit(task.id, span));

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon-sm';
    editBtn.title = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => startEdit(task.id, span));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon-sm';
    delBtn.title = 'Delete';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(cb, span, editBtn, delBtn);
    ul.appendChild(li);
  });
}

function addTask() {
  const text = $('todo-input').value.trim();
  if (!text) return;
  // Prevent duplicates
  if (tasks.some(t => t.text.toLowerCase() === text.toLowerCase())) {
    $('todo-input').style.outline = '2px solid var(--danger)';
    setTimeout(() => $('todo-input').style.outline = '', 1200);
    return;
  }
  tasks.push({ id: Date.now(), text, done: false });
  $('todo-input').value = '';
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function startEdit(id, span) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const input = document.createElement('input');
  input.className = 'todo-text-edit';
  input.value = task.text;
  span.replaceWith(input);
  input.focus();

  function commit() {
    const newText = input.value.trim();
    if (newText && newText !== task.text) {
      // Prevent duplicate on edit
      if (tasks.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase())) {
        input.style.outline = '2px solid var(--danger)';
        return;
      }
      task.text = newText;
      saveTasks();
    }
    renderTasks();
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') renderTasks(); });
}

$('todo-add').addEventListener('click', addTask);
$('todo-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
$('sort-select').addEventListener('change', renderTasks);
renderTasks();

// ── Quick Links ───────────────────────────────
let links = store.get('quickLinks') || [];

function saveLinks() { store.set('quickLinks', links); }

function renderLinks() {
  const grid = $('links-grid');
  grid.innerHTML = '';
  links.forEach(link => {
    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href = link.url;
    chip.target = '_blank';
    chip.rel = 'noopener noreferrer';
    chip.textContent = link.name;

    const del = document.createElement('button');
    del.className = 'del-link';
    del.textContent = '×';
    del.title = 'Remove';
    del.addEventListener('click', e => {
      e.preventDefault();
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });
    chip.appendChild(del);
    grid.appendChild(chip);
  });
}

$('link-add-btn').addEventListener('click', () => {
  $('link-form').classList.toggle('hidden');
  $('link-name').focus();
});

$('link-cancel').addEventListener('click', () => {
  $('link-form').classList.add('hidden');
  $('link-name').value = '';
  $('link-url').value = '';
});

$('link-save').addEventListener('click', saveLink);
$('link-url').addEventListener('keydown', e => { if (e.key === 'Enter') saveLink(); });

function saveLink() {
  const name = $('link-name').value.trim();
  let url = $('link-url').value.trim();
  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  $('link-form').classList.add('hidden');
  $('link-name').value = '';
  $('link-url').value = '';
}

renderLinks();

// ── Theme Toggle ──────────────────────────────
const html = document.documentElement;
const themeBtn = $('theme-toggle');

function applyTheme(t) {
  html.dataset.theme = t;
  themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
  store.set('theme', t);
}

applyTheme(store.get('theme') || 'light');
themeBtn.addEventListener('click', () => {
  applyTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
});
