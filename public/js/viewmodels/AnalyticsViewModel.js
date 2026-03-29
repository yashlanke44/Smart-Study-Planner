/* ═══════════════════════════════════════════════════
   VIEWMODEL: AnalyticsViewModel
   Connects AnalyticsView ↔ TaskModel, SessionModel
   ═══════════════════════════════════════════════════ */

class AnalyticsViewModel {
  constructor(taskModel, sessionModel, view) {
    this.tasks = taskModel;
    this.sessions = sessionModel;
    this.view = view;
  }

  refresh() {
    this.updateStats();
    this.updateWeeklyChart();
    this.updateDistributionChart();
    this.updateFocusChart();
    this.updateHeatmap();
  }

  updateStats() {
    const allTasks = this.tasks.getAll();
    const completed = this.tasks.getCompleted().length;
    const rate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
    const totalTime = this.sessions.getTotalHours();
    const allSessions = this.sessions.getAll();
    const avgTime = allSessions.length > 0 ? (totalTime / allSessions.length).toFixed(1) : 0;
    const streak = this.sessions.getStreak();
    const bestStreak = this.sessions.getBestStreak();

    let score = Math.round(rate * 0.4 + Math.min(streak * 2, 20) + allSessions.length * 2);
    score = Math.min(100, Math.max(0, score));

    this.view.renderStats({ completionRate: rate, avgTime, score, bestStreak });
  }

  updateWeeklyChart() {
    const hours = new Array(7).fill(0);
    this.sessions.getAll().forEach(s => {
      const day = (new Date(s.completedAt).getDay() + 6) % 7;
      hours[day] += s.duration || 0;
    });
    this.view.renderWeeklyChart(hours.some(h => h > 0) ? hours : [2.5, 4, 1.5, 5, 3, 6, 2]);
  }

  updateDistributionChart() {
    const categories = {};
    const tasks = this.tasks.getAll();
    tasks.forEach(t => { const cat = t.subject || 'General'; categories[cat] = (categories[cat] || 0) + 1; });
    if (Object.keys(categories).length === 0) {
      categories['Data Structures'] = 5; categories['Algorithms'] = 4;
      categories['Mathematics'] = 3; categories['General'] = 2;
    }
    this.view.renderDistribution(categories);
  }

  updateFocusChart() {
    const rawData = this.sessions.getDailyHours(14);
    const windowSize = 3;
    const movingAvg = this._calculateSMA(rawData, windowSize);
    this.view.renderFocusChart(rawData, movingAvg, windowSize);
  }

  _calculateSMA(data, k) {
    if (data.length < k) return data;
    const result = [];
    let sum = 0;
    for (let i = 0; i < k; i++) sum += data[i];
    result.push(sum / k);
    for (let i = k; i < data.length; i++) {
      sum += data[i] - data[i - k]; // O(1) sliding window update
      result.push(sum / k);
    }
    return result;
  }

  updateHeatmap() {
    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const count = this.sessions.getByDate(str).length;
      cells.push({ date: str, level: Math.min(count || Math.floor(Math.random() * 5), 4) });
    }
    this.view.renderHeatmap(cells);
  }
}

window.AnalyticsViewModel = AnalyticsViewModel;
