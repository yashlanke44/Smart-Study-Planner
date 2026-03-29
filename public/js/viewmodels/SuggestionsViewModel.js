/* ═══════════════════════════════════════════════════
   VIEWMODEL: SuggestionsViewModel
   Connects Model APIs ↔ SuggestionsView
   Applies heuristic analysis on data to derive insights
   ═══════════════════════════════════════════════════ */

class SuggestionsViewModel {
  constructor(taskModel, sessionModel, view, toastFn) {
    this.tasks = taskModel;
    this.sessions = sessionModel;
    this.view = view;
    this.toast = toastFn;
    this.view.onRefresh(() => this.refresh());
  }

  generateAll() {
    const suggestions = [];
    const completed = this.tasks.getCompleted();
    const pending = this.tasks.getPending();
    const overdue = this.tasks.getOverdue();

    if (overdue.length > 0) {
      suggestions.push({
        icon: '⚠️', title: 'Overdue Tasks Detected',
        description: `You have ${overdue.length} overdue task(s). Prioritize using the Priority Queue scheduler.`,
        priority: 'high', tags: ['Priority Queue', 'Urgent']
      });
    }

    const hoursWeek = this.sessions.getThisWeek().reduce((sum, s) => sum + (s.duration || 0), 0);
    if (hoursWeek > 30) {
      suggestions.push({ icon: '🔥', title: 'High Workload', description: `Studied ${hoursWeek.toFixed(1)}h this week. Try the Knapsack DP scheduler to limit daily budget.`, priority: 'medium', tags: ['DP', 'Health'] });
    } else if (hoursWeek < 5 && pending.length > 0) {
      suggestions.push({ icon: '📚', title: 'Increase Time', description: `Only ${hoursWeek.toFixed(1)}h. Use Greedy (EDF) scheduler to hit deadlines fast.`, priority: 'medium', tags: ['Greedy', 'Consistency'] });
    }

    if (this.sessions.getStreak() >= 3) {
      suggestions.push({ icon: '📈', title: 'Streak Active', description: `${this.sessions.getStreak()}-Day Streak! Sliding Window analysis shows your output peaking.`, priority: 'low', tags: ['Sliding Window', 'Flow'] });
    }

    if (suggestions.length === 0) {
      suggestions.push({ icon: '🚀', title: 'Start Exploring', description: 'Complete tasks to let AI analyze performance using Graph Traversal and Statistical Models.', priority: 'low', tags: ['AI', 'Setup'] });
    }

    return suggestions;
  }

  refresh() {
    this.view.render(this.generateAll());
    this.toast('AI Suggestions Recalculated', 'success');
  }
}

window.SuggestionsViewModel = SuggestionsViewModel;
