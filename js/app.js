const STORAGE_KEY = 'task-note-v1';

let tasks = load();
let currentFilter = 'all';
let editingId = null;

// DOM
const $taskList    = document.getElementById('taskList');
const $emptyState  = document.getElementById('emptyState');
const $taskCount   = document.getElementById('taskCount');
const $overlay     = document.getElementById('modalOverlay');
const $form        = document.getElementById('taskForm');
const $modalTitle  = document.getElementById('modalTitle');
const $title       = document.getElementById('taskTitle');
const $desc        = document.getElementById('taskDesc');
const $deadline    = document.getElementById('taskDeadline');
const $toast       = document.getElementById('toast');

// Events
document.getElementById('openFormBtn').addEventListener('click', () => openModal());
document.getElementById('closeFormBtn').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
$overlay.addEventListener('click', e => { if (e.target === $overlay) closeModal(); });

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    render();
  });
});

$form.addEventListener('submit', e => {
  e.preventDefault();
  const title = $title.value.trim();
  if (!title) return;

  if (editingId) {
    const t = tasks.find(t => t.id === editingId);
    if (t) { t.title = title; t.description = $desc.value.trim(); t.deadline = $deadline.value; }
    toast('タスクを更新しました');
  } else {
    tasks.unshift({
      id: String(Date.now()),
      title,
      description: $desc.value.trim(),
      deadline: $deadline.value,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
    toast('タスクを追加しました！');
  }

  save(); closeModal(); render();
});

// keyboard shortcut: Escape to close
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Modal ──────────────────────────────────────
function openModal(task = null) {
  editingId = task ? task.id : null;
  $modalTitle.textContent = task ? 'タスクを編集' : '新しいタスク';
  $title.value    = task ? task.title       : '';
  $desc.value     = task ? task.description : '';
  $deadline.value = task ? task.deadline    : '';
  $overlay.classList.add('open');
  setTimeout(() => $title.focus(), 80);
}

function closeModal() {
  $overlay.classList.remove('open');
  $form.reset();
  editingId = null;
}

// ── Actions ────────────────────────────────────
function toggleComplete(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.completed = !t.completed;
  t.completedAt = t.completed ? new Date().toISOString() : null;
  save(); render();
  if (t.completed) toast('タスクを完了しました！ ✓');
}

function editTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) openModal(t);
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save(); render();
  toast('タスクを削除しました');
}

// ── Render ─────────────────────────────────────
function render() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'active')    return !t.completed;
    if (currentFilter === 'completed') return  t.completed;
    return true;
  });

  $taskCount.textContent = `${filtered.length} 件`;

  if (filtered.length === 0) {
    $taskList.style.display = 'none';
    $emptyState.style.display = 'block';
    return;
  }

  $taskList.style.display = 'flex';
  $emptyState.style.display = 'none';
  $taskList.innerHTML = filtered.map(cardHTML).join('');
}

function cardHTML(t) {
  const status      = t.completed ? null : deadlineStatus(t.deadline);
  const deadlineStr = formatDeadline(t.deadline);
  const createdStr  = formatCreated(t.createdAt);

  return `
    <div class="task-card ${t.completed ? 'completed' : ''} ${status ? `deadline-${status}` : ''}">
      <div class="task-checkbox ${t.completed ? 'checked' : ''}"
           onclick="toggleComplete('${t.id}')" title="${t.completed ? '未完了に戻す' : '完了にする'}"></div>
      <div class="task-content">
        <div class="task-title">${esc(t.title)}</div>
        ${t.description ? `<div class="task-desc">${esc(t.description)}</div>` : ''}
        <div class="task-meta">
          ${deadlineStr ? `<span class="task-deadline ${status || ''}">${deadlineStr}</span>` : ''}
          <span class="task-created">${createdStr} 作成</span>
        </div>
      </div>
      <div class="task-actions">
        ${!t.completed ? `<button class="btn-icon edit" onclick="editTask('${t.id}')">編集</button>` : ''}
        <button class="btn-icon" onclick="deleteTask('${t.id}')">削除</button>
      </div>
    </div>`;
}

// ── Helpers ────────────────────────────────────
function deadlineStatus(dl) {
  if (!dl) return null;
  const now = new Date();
  const d = new Date(dl);
  if (d < now) return 'danger';
  if ((d - now) / 36e5 <= 72) return 'warning';
  return null;
}

function formatDeadline(dl) {
  if (!dl) return null;
  const d = new Date(dl);
  const now = new Date();
  const hasTime = dl.includes('T');
  const MM = d.getMonth() + 1;
  const DD = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dateStr = `${MM}/${DD}`;
  const timeStr = `${hh}:${mm}`;
  const label = hasTime ? `${dateStr} ${timeStr}` : dateStr;

  if (d < now) return `期限切れ（${label}）`;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dDay = new Date(d);  dDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dDay - today) / 864e5);

  if (diffDays === 0) return hasTime ? `今日 ${timeStr} まで` : '今日が期限';
  if (diffDays === 1) return hasTime ? `明日 ${timeStr} まで` : '明日が期限';
  return `${label} まで（あと ${diffDays} 日）`;
}

function formatCreated(iso) {
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let _toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => $toast.classList.remove('show'), 2600);
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

render();
