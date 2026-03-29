/* ═══════════════════════════════════════════════════
   VIEW: SuggestionsView
   Pure rendering for AI suggestions page
   ═══════════════════════════════════════════════════ */

class SuggestionsView {
  constructor() {
    this.listEl = document.getElementById('suggestions-list');
  }

  onRefresh(handler) {
    document.getElementById('btn-refresh-suggestions')?.addEventListener('click', handler);
  }

  render(suggestions) {
    if (!this.listEl) return;
    if (suggestions.length === 0) {
      this.listEl.innerHTML = '<div class="empty-state"><span class="empty-icon">💡</span><p>Complete more tasks to receive AI suggestions!</p></div>';
      return;
    }
    this.listEl.innerHTML = suggestions.map((s, i) => `
      <div class="suggestion-card suggestion-priority-${s.priority} animate-pop-in" style="--delay:${i * 0.1}s">
        <div class="suggestion-icon">${s.icon}</div>
        <div class="suggestion-content">
          <h3>${s.title}</h3>
          <p>${s.description}</p>
          <div>${s.tags.map(t => `<span class="suggestion-tag">${t}</span>`).join('')}</div>
        </div>
      </div>`).join('');
  }
}

window.SuggestionsView = SuggestionsView;
