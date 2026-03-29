/* ═══════════════════════════════════════════════════
   MODEL: TaskModel
   Pure data + storage logic for tasks
   DSA: Hash Map (Map) for O(1) lookups
   ═══════════════════════════════════════════════════ */

class TaskModel {
  constructor() {
    /** @type {Map<string, object>} Hash Map for O(1) task lookup */
    this._taskMap = new Map();
    this._listeners = [];
    this._load();
  }

  // ── Observable Pattern: notify listeners on change ─
  subscribe(fn) { this._listeners.push(fn); }
  _notify() { this._listeners.forEach(fn => fn(this.getAll())); }

  // ── Persistence ────────────────────────────────
  _load() {
    const data = JSON.parse(localStorage.getItem('ssp_tasks') || '[]');
    data.forEach(t => this._taskMap.set(t.id, t));
  }

  _save() {
    localStorage.setItem('ssp_tasks', JSON.stringify([...this._taskMap.values()]));
    this._notify();
  }

  // ── CRUD — all O(1) via Hash Map ──────────────
  add(task) {
    const newTask = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      ...task,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      studyTime: 0
    };
    this._taskMap.set(newTask.id, newTask);
    this._save();
    return newTask;
  }

  update(id, data) {
    const task = this._taskMap.get(id);
    if (!task) return null;
    Object.assign(task, data);
    this._save();
    return task;
  }

  delete(id) {
    this._taskMap.delete(id);
    this._save();
  }

  get(id) {
    return this._taskMap.get(id) || null;
  }

  getAll() {
    return [...this._taskMap.values()];
  }

  // ── Filtered Queries ───────────────────────────
  getPending() {
    return this.getAll().filter(t => t.status !== 'completed');
  }

  getCompleted() {
    return this.getAll().filter(t => t.status === 'completed');
  }

  getOverdue() {
    const now = new Date();
    return this.getAll().filter(t =>
      t.status !== 'completed' && new Date(t.deadline) < now
    );
  }

  getBySubject(subject) {
    return this.getAll().filter(t => t.subject === subject);
  }

  // ── Sorting (Merge Sort — O(n log n) stable) ──
  getSorted(field = 'deadline') {
    const tasks = this.getAll();
    return tasks.sort((a, b) => {
      switch (field) {
        case 'deadline': return new Date(a.deadline) - new Date(b.deadline);
        case 'priority': return a.priority - b.priority;
        case 'name':     return a.name.localeCompare(b.name);
        case 'created':  return new Date(b.createdAt) - new Date(a.createdAt);
        default: return 0;
      }
    });
  }
}

// Export singleton
window.TaskModel = TaskModel;
