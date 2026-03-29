/* ═══════════════════════════════════════════════════
   MODEL: SessionModel
   Tracks study sessions + streak data
   ═══════════════════════════════════════════════════ */

class SessionModel {
  constructor() {
    this._listeners = [];
    this.sessions = JSON.parse(localStorage.getItem('ssp_sessions') || '[]');
  }

  subscribe(fn) { this._listeners.push(fn); }
  _notify() { this._listeners.forEach(fn => fn(this.sessions)); }

  _save() {
    localStorage.setItem('ssp_sessions', JSON.stringify(this.sessions));
    this._notify();
  }

  record(task) {
    this.sessions.push({
      taskId: task.id,
      taskName: task.name,
      subject: task.subject,
      duration: task.duration,
      difficulty: task.difficulty,
      completedAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    });
    this._save();
    this._updateStreak();
  }

  getAll() { return this.sessions; }

  getByDate(dateStr) {
    return this.sessions.filter(s => s.date === dateStr);
  }

  getThisWeek() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.sessions.filter(s => new Date(s.completedAt) >= weekAgo);
  }

  getTotalHours() {
    return this.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  }

  getStreak() {
    return parseInt(localStorage.getItem('ssp_streak') || '0');
  }

  getBestStreak() {
    const dates = [...new Set(this.sessions.map(s => s.date))].sort();
    if (dates.length === 0) return 0;
    let best = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
      if (diff === 1) { current++; best = Math.max(best, current); }
      else current = 1;
    }
    return best;
  }

  _updateStreak() {
    const dates = [...new Set(this.sessions.map(s => s.date))].sort();
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    if (dates.includes(today)) {
      streak = 1;
      let check = new Date();
      check.setDate(check.getDate() - 1);
      while (dates.includes(check.toISOString().split('T')[0])) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }
    localStorage.setItem('ssp_streak', streak.toString());
  }

  // ── Sliding Window: Hours per day for last N days ──
  getDailyHours(days = 14) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hours = this.sessions
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      result.push(hours);
    }
    return result;
  }
}

window.SessionModel = SessionModel;
