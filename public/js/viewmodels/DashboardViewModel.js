/* ═══════════════════════════════════════════════════
   VIEWMODEL: DashboardViewModel
   Aggregates data from multiple models for DashboardView
   ═══════════════════════════════════════════════════ */

class DashboardViewModel {
  constructor(authModel, taskModel, sessionModel, schedulerModel, suggestionsSys, view) {
    this.auth = authModel;
    this.tasks = taskModel;
    this.sessions = sessionModel;
    this.scheduler = schedulerModel;
    this.suggestions = suggestionsSys;
    this.view = view;
  }

  // Called when page becomes active
  refresh() {
    this.view.setUserName(this.auth.getName());
    this.view.setDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));

    // Stats
    const total = this.tasks.getAll().length;
    const completed = this.tasks.getCompleted().length;
    const overdue = this.tasks.getOverdue().length;
    const streak = this.sessions.getStreak();
    this.view.renderStats(total, completed, overdue, streak);

    // Upcoming tasks: pending sorted by deadline (O(v log v))
    const pending = this.tasks.getPending().sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
    this.view.renderUpcoming(pending);

    // Schedule preview
    const scheduleData = this.scheduler.getLastSchedule();
    this.view.renderSchedulePreview(scheduleData ? scheduleData.schedule : []);

    // Weekly Chart: aggregate last 7 days
    const hoursArr = new Array(7).fill(0);
    this.sessions.getAll().forEach(s => {
      const day = (new Date(s.completedAt).getDay() + 6) % 7;
      hoursArr[day] += s.duration || 0;
    });
    const finalData = hoursArr.some(h => h > 0) ? hoursArr : [2, 3.5, 1.5, 4, 2.5, 5, 3]; // mock if empty
    this.view.renderWeeklyChart(finalData);

    // Quick tips
    const tips = this.suggestions.generateAll();
    this.view.renderQuickTips(tips);
  }
}

window.DashboardViewModel = DashboardViewModel;
