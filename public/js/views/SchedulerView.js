/* ═══════════════════════════════════════════════════
   VIEW: SchedulerView
   Pure rendering for AI scheduler page
   ═══════════════════════════════════════════════════ */

class SchedulerView {
  constructor() {
    this.vizEl = document.getElementById('algo-visualization');
    this.stepsEl = document.getElementById('algo-steps');
    this.progressFill = document.getElementById('algo-progress-fill');
    this.progressText = document.getElementById('algo-progress-text');
    this.algoLabel = document.getElementById('algo-name-label');
    this.resultEl = document.getElementById('schedule-result');
    this.timelineEl = document.getElementById('schedule-timeline');
  }

  onGenerate(handler) {
    document.getElementById('btn-generate-schedule')?.addEventListener('click', () => {
      handler({
        hours: parseFloat(document.getElementById('schedule-hours').value),
        breakMin: parseInt(document.getElementById('schedule-break').value),
        startTime: document.getElementById('schedule-start').value,
        algorithm: document.getElementById('schedule-algo').value
      });
    });
  }

  getAlgoName(algo) {
    const names = {
      'priority-queue': 'Priority Queue (Min-Heap)',
      'topological': "Topological Sort (Kahn's BFS)",
      'greedy': 'Greedy (Earliest Deadline First)',
      'dp': 'Dynamic Programming (Knapsack)'
    };
    return names[algo] || algo;
  }

  showVisualization(algoName) {
    this.vizEl.classList.remove('hidden');
    this.stepsEl.innerHTML = '';
    this.progressFill.style.width = '0%';
    this.progressText.textContent = '0%';
    this.algoLabel.textContent = algoName;
  }

  addStep(text, status) {
    return new Promise(resolve => {
      setTimeout(() => {
        const step = document.createElement('div');
        step.className = `algo-step ${status}`;
        step.textContent = text;
        this.stepsEl.appendChild(step);
        this.stepsEl.scrollTop = this.stepsEl.scrollHeight;
        resolve();
      }, 250);
    });
  }

  setProgress(percent) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = percent + '%';
        resolve();
      }, 150);
    });
  }

  renderTimeline(schedule) {
    this.resultEl.classList.remove('hidden');
    const fmt = d => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const priorityNames = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };

    if (schedule.length === 0) {
      this.timelineEl.innerHTML = '<div class="empty-state"><span class="empty-icon">📅</span><p>No schedule generated.</p></div>';
      return;
    }

    this.timelineEl.innerHTML = schedule.map((item, i) => {
      if (item.type === 'break') {
        return `<div class="timeline-item timeline-break animate-pop-in" style="--delay:${i * 0.1}s">
          <div class="timeline-time">${fmt(item.startTime)} — ${fmt(item.endTime)}</div>
          <div class="timeline-task">☕ Break</div>
          <div class="timeline-duration">${Math.round(item.duration * 60)} minutes</div>
        </div>`;
      }
      return `<div class="timeline-item animate-pop-in" style="--delay:${i * 0.1}s">
        <div class="timeline-time">${fmt(item.startTime)} — ${fmt(item.endTime)}</div>
        <div class="timeline-task">${item.task.name}</div>
        <div class="timeline-duration">
          <span class="task-priority priority-${item.task.priority}">${priorityNames[item.task.priority]}</span>
          · ${item.task.subject || 'General'} · ${item.duration}h · ${item.task.difficulty}
        </div>
      </div>`;
    }).join('');
  }
}

window.SchedulerView = SchedulerView;
