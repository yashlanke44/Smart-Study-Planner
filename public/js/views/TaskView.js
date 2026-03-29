/* ═══════════════════════════════════════════════════
   VIEW: TaskView
   Pure rendering for task planner page
   ═══════════════════════════════════════════════════ */

class TaskView {
  constructor() {
    this.listEl = document.getElementById('tasks-list');
    this.modalEl = document.getElementById('task-modal');
    this.formEl = document.getElementById('task-form');
    this.modalTitle = document.getElementById('task-modal-title');
    this.submitBtn = document.getElementById('task-submit');
    this.editIdEl = document.getElementById('task-edit-id');
  }

  // ── Event Bindings (ViewModel calls these) ────
  onAddClick(handler) {
    document.getElementById('btn-add-task')?.addEventListener('click', handler);
  }

  onModalClose(handler) {
    document.getElementById('task-modal-close')?.addEventListener('click', handler);
    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) handler();
    });
  }

  onFormSubmit(handler) {
    this.formEl?.addEventListener('submit', (e) => {
      e.preventDefault();
      handler({
        editId: this.editIdEl.value,
        name: document.getElementById('task-name').value.trim(),
        subject: document.getElementById('task-subject').value.trim(),
        deadline: document.getElementById('task-deadline').value,
        priority: parseInt(document.getElementById('task-priority').value),
        duration: parseFloat(document.getElementById('task-duration').value),
        difficulty: document.getElementById('task-difficulty').value,
        prerequisites: document.getElementById('task-prereqs').value.split(',').map(s => s.trim()).filter(Boolean),
        notes: document.getElementById('task-notes').value.trim()
      });
    });
  }

  onFilter(handler) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        handler(btn.dataset.filter);
      });
    });
  }

  onSort(handler) {
    document.getElementById('sort-tasks')?.addEventListener('change', (e) => handler(e.target.value));
  }

  // ── Render Methods ─────────────────────────────
  openModal(task = null) {
    if (task) {
      this.modalTitle.textContent = 'Edit Task';
      this.submitBtn.textContent = 'Update Task';
      this.editIdEl.value = task.id;
      document.getElementById('task-name').value = task.name;
      document.getElementById('task-subject').value = task.subject || '';
      document.getElementById('task-deadline').value = task.deadline?.slice(0, 16) || '';
      document.getElementById('task-priority').value = task.priority || 3;
      document.getElementById('task-duration').value = task.duration || 1;
      document.getElementById('task-difficulty').value = task.difficulty || 'medium';
      document.getElementById('task-prereqs').value = (task.prerequisites || []).join(', ');
      document.getElementById('task-notes').value = task.notes || '';
    } else {
      this.modalTitle.textContent = 'Add New Task';
      this.submitBtn.textContent = 'Add Task';
      this.formEl.reset();
      this.editIdEl.value = '';
    }
    this.modalEl.classList.remove('hidden');
  }

  closeModal() {
    this.modalEl.classList.add('hidden');
  }

  renderList(tasks, { onToggle, onEdit, onDelete, onStart }) {
    if (tasks.length === 0) {
      this.listEl.innerHTML = `
        <div class="empty-state animate-fade-up">
          <span class="empty-icon">📋</span>
          <p>No tasks found. Click "Add Task" to get started!</p>
        </div>`;
      return;
    }

    this.listEl.innerHTML = tasks.map((task, i) => {
      const now = new Date();
      const isOverdue = task.status !== 'completed' && new Date(task.deadline) < now;
      const daysLeft = Math.ceil((new Date(task.deadline) - now) / 86400000);
      const deadlineText = isOverdue
        ? `<span style="color:var(--accent-danger)">Overdue ${Math.abs(daysLeft)}d</span>`
        : `${daysLeft}d left`;

      const priorityNames = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
      const statusLabel = isOverdue && task.status !== 'completed' ? 'overdue' : task.status;

      return `
        <div class="task-card ${task.status === 'completed' ? 'completed' : ''} animate-pop-in"
             style="--delay: ${i * 0.05}s" data-id="${task.id}">
          <div class="task-check" data-action="toggle" data-id="${task.id}">
            ${task.status === 'completed' ? '✓' : ''}
          </div>
          <div class="task-info" data-action="edit" data-id="${task.id}">
            <div class="task-name">${task.name}</div>
            <div class="task-meta">
              <span class="task-priority priority-${task.priority}">${priorityNames[task.priority]}</span>
              <span>📚 ${task.subject || 'General'}</span>
              <span>⏱️ ${task.duration}h</span>
              <span>📅 ${deadlineText}</span>
              <span class="status-badge status-${statusLabel}">${statusLabel}</span>
            </div>
          </div>
          <div class="task-actions">
            ${task.status === 'pending' ? `<button class="task-action-btn" data-action="start" data-id="${task.id}">▶️</button>` : ''}
            <button class="task-action-btn delete" data-action="delete" data-id="${task.id}">🗑️</button>
          </div>
        </div>`;
    }).join('');

    // Delegate events
    this.listEl.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        switch (el.dataset.action) {
          case 'toggle': onToggle(id); break;
          case 'edit': onEdit(id); break;
          case 'delete': onDelete(id); break;
          case 'start': onStart(id); break;
        }
      });
    });
  }
}

window.TaskView = TaskView;
