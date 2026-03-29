/* ═══════════════════════════════════════════════════
   VIEW: AnalyticsView
   Pure rendering for analytics charts + stats
   ═══════════════════════════════════════════════════ */

class AnalyticsView {
  renderStats(data) {
    document.getElementById('analytics-completion-rate').textContent = data.completionRate + '%';
    document.getElementById('analytics-avg-time').textContent = data.avgTime + 'h';
    document.getElementById('analytics-productivity-score').textContent = data.score;
    document.getElementById('analytics-best-streak').textContent = data.bestStreak;

    const cTrend = document.getElementById('analytics-completion-trend');
    cTrend.textContent = data.completionRate > 50 ? '↑ Good' : '↓ Needs work';
    cTrend.style.color = data.completionRate > 50 ? 'var(--accent-secondary)' : 'var(--accent-danger)';

    const tTrend = document.getElementById('analytics-time-trend');
    tTrend.textContent = parseFloat(data.avgTime) > 2 ? '↑ Active' : '↓ Increase';
    tTrend.style.color = parseFloat(data.avgTime) > 2 ? 'var(--accent-secondary)' : 'var(--accent-warning)';

    const sTrend = document.getElementById('analytics-score-trend');
    sTrend.textContent = data.score > 60 ? '↑ Excellent' : '↓ Improve';
    sTrend.style.color = data.score > 60 ? 'var(--accent-secondary)' : 'var(--accent-warning)';
  }

  renderWeeklyChart(data) {
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.parentElement.getBoundingClientRect().width || 500;
    canvas.width = w; canvas.height = 250;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal = Math.max(...data, 1);
    const pad = { t: 20, r: 20, b: 30, l: 40 };
    const cW = w - pad.l - pad.r, cH = 250 - pad.t - pad.b;
    const barW = cW / 7 * 0.6, gap = cW / 7;
    ctx.clearRect(0, 0, w, 250);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    }

    data.forEach((val, i) => {
      const bH = (val / maxVal) * cH;
      const x = pad.l + i * gap + (gap - barW) / 2, y = pad.t + cH - bH;
      const grad = ctx.createLinearGradient(x, y, x, y + bH);
      grad.addColorStop(0, 'rgba(108,99,255,0.6)');
      grad.addColorStop(1, 'rgba(0,201,167,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(x, y, barW, bH, 4); ctx.fill();
      ctx.fillStyle = '#e8e8f0'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(1) + 'h', x + barW / 2, y - 6);
      ctx.fillStyle = '#8888a8'; ctx.fillText(days[i], x + barW / 2, 242);
    });
  }

  renderDistribution(categories) {
    const canvas = document.getElementById('distribution-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 300; canvas.height = 250;
    const entries = Object.entries(categories);
    if (entries.length === 0) return;
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const colors = ['#6C63FF', '#00C9A7', '#FFD93D', '#FF6B6B', '#4DA8DA', '#E879F9'];
    const cx = 150, cy = 115, r = 80, ir = 50;
    let angle = -Math.PI / 2;

    entries.forEach(([label, value], i) => {
      const slice = (value / total) * 2 * Math.PI;
      const end = angle + slice;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, end);
      ctx.arc(cx, cy, ir, end, angle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      const mid = angle + slice / 2;
      const lx = cx + (r + 20) * Math.cos(mid);
      const ly = cy + (r + 20) * Math.sin(mid);
      ctx.fillStyle = '#e8e8f0'; ctx.font = '11px Inter';
      ctx.textAlign = lx > cx ? 'left' : 'right';
      ctx.fillText(`${label} (${value})`, lx, ly);
      angle = end;
    });

    ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 20px Inter'; ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 4);
    ctx.font = '11px Inter'; ctx.fillStyle = '#8888a8';
    ctx.fillText('Tasks', cx, cy + 20);
  }

  renderFocusChart(rawData, movingAvg, windowSize) {
    const canvas = document.getElementById('focus-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.parentElement.getBoundingClientRect().width || 500;
    canvas.width = w; canvas.height = 250;
    const maxVal = Math.max(...rawData, ...movingAvg, 1);
    const pad = { t: 30, r: 20, b: 30, l: 40 };
    const cW = w - pad.l - pad.r, cH = 250 - pad.t - pad.b;
    const getX = i => pad.l + (i / (rawData.length - 1)) * cW;
    const getY = v => pad.t + cH - (v / maxVal) * cH;

    ctx.clearRect(0, 0, w, 250);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillStyle = '#555577'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText(((maxVal / 4) * (4 - i)).toFixed(1) + 'h', pad.l - 5, y + 4);
    }

    // Area
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(0));
    rawData.forEach((v, i) => ctx.lineTo(getX(i), getY(v)));
    ctx.lineTo(getX(rawData.length - 1), pad.t + cH);
    ctx.lineTo(getX(0), pad.t + cH);
    ctx.closePath();
    const aGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
    aGrad.addColorStop(0, 'rgba(108,99,255,0.2)');
    aGrad.addColorStop(1, 'rgba(108,99,255,0)');
    ctx.fillStyle = aGrad; ctx.fill();

    // Raw line
    ctx.beginPath();
    rawData.forEach((v, i) => { i === 0 ? ctx.moveTo(getX(i), getY(v)) : ctx.lineTo(getX(i), getY(v)); });
    ctx.strokeStyle = 'rgba(108,99,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();

    // Moving avg line
    ctx.beginPath();
    movingAvg.forEach((v, i) => {
      const x = getX(i + Math.floor(windowSize / 2));
      i === 0 ? ctx.moveTo(x, getY(v)) : ctx.lineTo(x, getY(v));
    });
    ctx.strokeStyle = '#00C9A7'; ctx.lineWidth = 3; ctx.stroke();

    // Points
    rawData.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(getX(i), getY(v), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#6C63FF'; ctx.fill();
    });

    // Legend
    ctx.fillStyle = 'rgba(108,99,255,0.5)'; ctx.fillRect(w - 180, 8, 12, 3);
    ctx.fillStyle = '#8888a8'; ctx.font = '10px Inter'; ctx.textAlign = 'left';
    ctx.fillText('Daily', w - 164, 13);
    ctx.fillStyle = '#00C9A7'; ctx.fillRect(w - 110, 8, 12, 3);
    ctx.fillStyle = '#8888a8'; ctx.fillText(`SMA (${windowSize}-day)`, w - 94, 13);
  }

  renderHeatmap(cells) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = cells.map(c =>
      `<div class="heatmap-cell" data-level="${c.level}" data-tooltip="${c.date}: ${c.level} sessions"></div>`
    ).join('');
  }
}

window.AnalyticsView = AnalyticsView;
