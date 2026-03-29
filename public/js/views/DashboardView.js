/* ═══════════════════════════════════════════════════
   VIEW: DashboardView
   Pure rendering for dashboard page
   ═══════════════════════════════════════════════════ */

class DashboardView {
  constructor() {
    this.nameEl = document.getElementById('dashboard-name');
    this.dateEl = document.getElementById('dashboard-date');
    this.chartCanvas = document.getElementById('dashboard-chart');
  }

  setUserName(name) {
    if (this.nameEl) this.nameEl.textContent = name;
  }

  setDate(dateStr) {
    if (this.dateEl) this.dateEl.textContent = dateStr;
  }

  animateCount(el, target, duration = 1200) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const inc = (target - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += inc;
      if ((inc >= 0 && current >= target) || (inc < 0 && current <= target) || inc === 0) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, 16);
  }

  renderStats(total, completed, overdue, streak) {
    this.animateCount(document.getElementById('stat-total-tasks'), total);
    this.animateCount(document.getElementById('stat-completed'), completed);
    this.animateCount(document.getElementById('stat-overdue'), overdue);
    this.animateCount(document.getElementById('stat-streak'), streak);
  }

  renderUpcoming(tasks) {
    const container = document.getElementById('upcoming-tasks-list');
    if (!container) return;
    if (tasks.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">📝</span><p>No upcoming tasks.</p></div>';
      return;
    }
    const priorityNames = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
    container.innerHTML = tasks.slice(0, 5).map((t, i) => {
      const days = Math.ceil((new Date(t.deadline) - new Date()) / 86400000);
      const overdue = days < 0;
      return `<div class="task-mini animate-pop-in" style="--delay:${i * 0.05}s; display:flex; align-items:center; gap:12px; padding:10px; border-radius:8px; margin-bottom:8px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color);">
        <span class="task-priority priority-${t.priority}" style="font-size:0.7rem;padding:2px 8px;border-radius:100px;">${priorityNames[t.priority]}</span>
        <span style="flex:1;font-size:0.9rem;font-weight:500;">${t.name}</span>
        <span style="font-size:0.75rem;color:${overdue ? 'var(--accent-danger)' : 'var(--text-secondary)'};">${overdue ? Math.abs(days) + 'd overdue' : days + 'd left'}</span>
      </div>`;
    }).join('');
  }

  renderSchedulePreview(schedule) {
    const container = document.getElementById('today-schedule');
    if (!container) return;
    if (!schedule || schedule.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">🤖</span><p>No schedule yet. Let AI create one!</p></div>';
      return;
    }
    const fmt = d => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    container.innerHTML = schedule.filter(s => s.type === 'task').slice(0, 4).map((item, i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.02);border:1px solid var(--border-color);" class="animate-pop-in" style="--delay:${i*0.05}s">
        <span style="font-size:0.75rem;color:var(--accent-primary);font-family:var(--font-mono);min-width:100px;">${fmt(item.startTime)}</span>
        <span style="flex:1;font-size:0.9rem;font-weight:500;">${item.task.name}</span>
        <span style="font-size:0.75rem;color:var(--text-secondary);">${item.duration}h</span>
      </div>`).join('');
  }

  renderWeeklyChart(data) {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.getContext('2d');
    const w = this.chartCanvas.parentElement.getBoundingClientRect().width || 400;
    this.chartCanvas.width = w;
    this.chartCanvas.height = 200;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal = Math.max(...data, 1);
    const pad = { top: 20, right: 20, bottom: 30, left: 40 };
    const cW = w - pad.left - pad.right, cH = 200 - pad.top - pad.bottom;
    const barW = cW / 7 * 0.6, gap = cW / 7;
    ctx.clearRect(0, 0, w, 200);
    data.forEach((val, i) => {
      const bH = (val / maxVal) * cH;
      const x = pad.left + i * gap + (gap - barW) / 2, y = pad.top + cH - bH;
      const grad = ctx.createLinearGradient(x, y, x, y + bH);
      grad.addColorStop(0, 'rgba(108,99,255,0.8)');
      grad.addColorStop(1, 'rgba(0,201,167,0.4)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(x, y, barW, bH, 4); ctx.fill();
      ctx.fillStyle = '#e8e8f0'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(1) + 'h', x + barW / 2, y - 6);
      ctx.fillStyle = '#8888a8'; ctx.fillText(days[i], x + barW / 2, 192);
    });
  }

  renderQuickTips(tips) {
    const container = document.getElementById('quick-suggestions');
    if (!container) return;
    if (tips.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">🧠</span><p>Complete tasks for tips!</p></div>';
      return;
    }
    container.innerHTML = tips.slice(0, 3).map((t, i) => `
      <div style="display:flex;gap:12px;padding:10px;border-radius:8px;margin-bottom:8px;border-left:3px solid var(--accent-primary);background:rgba(255,255,255,0.02);" class="animate-pop-in" style="--delay:${i*0.1}s">
        <span style="font-size:1.2rem;">${t.icon}</span>
        <div><div style="font-size:0.85rem;font-weight:600;margin-bottom:2px;">${t.title}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);">${t.description.slice(0, 80)}...</div></div>
      </div>`).join('');
  }
}

window.DashboardView = DashboardView;
