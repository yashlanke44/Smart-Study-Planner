/* ═══════════════════════════════════════════════════
   VIEWMODEL: TaskViewModel
   Connects TaskModel + SessionModel ↔ TaskView
   Business logic for task management
   ═══════════════════════════════════════════════════ */

class TaskViewModel {
  constructor(taskModel, sessionModel, taskView, toastFn, confettiFn) {
    this.model = taskModel;
    this.sessions = sessionModel;
    this.view = taskView;
    this.toast = toastFn;
    this.confetti = confettiFn;
    this.currentFilter = 'all';
    this.currentSort = 'deadline';
    this._bind();
  }

  _bind() {
    this.view.onAddClick(() => this.view.openModal());
    this.view.onModalClose(() => this.view.closeModal());
    this.view.onFormSubmit(data => this.handleSubmit(data));
    this.view.onFilter(filter => { this.currentFilter = filter; this.render(); });
    this.view.onSort(sort => { this.currentSort = sort; this.render(); });

    // Re-render when model changes
    this.model.subscribe(() => this.render());
  }

  handleSubmit(data) {
    const { editId, ...taskData } = data;
    if (editId) {
      this.model.update(editId, taskData);
      this.toast('Task updated!', 'success');
    } else {
      this.model.add(taskData);
      this.toast(`Task "${taskData.name}" added!`, 'success');
    }
    this.view.closeModal();
  }

  toggleComplete(id) {
    const task = this.model.get(id);
    if (!task) return;

    if (task.status === 'completed') {
      this.model.update(id, { status: 'pending', completedAt: null });
    } else {
      this.model.update(id, { status: 'completed', completedAt: new Date().toISOString() });
      this.sessions.record(task);
      this.confetti();
      this.toast(`🎉 "${task.name}" completed!`, 'success');
    }
  }

  startTask(id) {
    this.model.update(id, { status: 'in-progress', startedAt: new Date().toISOString() });
    const task = this.model.get(id);
    this.toast(`Started "${task?.name}"`, 'info');
  }

  editTask(id) {
    const task = this.model.get(id);
    if (task) this.view.openModal(task);
  }

  deleteTask(id) {
    this.model.delete(id);
    this.toast('Task deleted', 'info');
  }

  getFilteredSorted() {
    let tasks = this.model.getSorted(this.currentSort);
    const now = new Date();
    switch (this.currentFilter) {
      case 'pending':     return tasks.filter(t => t.status === 'pending');
      case 'in-progress': return tasks.filter(t => t.status === 'in-progress');
      case 'completed':   return tasks.filter(t => t.status === 'completed');
      case 'overdue':     return tasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < now);
      default:            return tasks;
    }
  }

  render() {
    const tasks = this.getFilteredSorted();
    this.view.renderList(tasks, {
      onToggle: id => this.toggleComplete(id),
      onEdit: id => this.editTask(id),
      onDelete: id => this.deleteTask(id),
      onStart: id => this.startTask(id)
    });
  }
}

window.TaskViewModel = TaskViewModel;
