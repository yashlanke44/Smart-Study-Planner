/* ═══════════════════════════════════════════════════
   VIEW: AboutView
   Pure rendering for the DSA showcase / about page
   ═══════════════════════════════════════════════════ */

class AboutView {
  constructor() {
    this.gridEl = document.getElementById('dsa-grid');
    this.codeEl = document.getElementById('typing-code');
    this._typingInterval = null;
  }

  renderDSACards(concepts) {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = concepts.map((c, i) => `
      <div class="dsa-card animate-pop-in" style="--delay:${i * 0.08}s">
        <div class="dsa-card-header">
          <span class="dsa-card-icon">${c.icon}</span>
          <div>
            <div class="dsa-card-title">${c.title}</div>
            <span class="dsa-card-complexity">${c.complexity}</span>
          </div>
        </div>
        <p class="dsa-card-desc">${c.description}</p>
        <div class="dsa-card-usage">
          <span>📍 Used in: ${c.where}</span>
          <pre>${c.usage}</pre>
        </div>
      </div>`).join('');
  }

  startTypingAnimation(snippets) {
    if (!this.codeEl) return;
    let snippetIdx = 0;

    const typeSnippet = () => {
      const snippet = snippets[snippetIdx];
      let charIdx = 0;
      this.codeEl.textContent = '';

      this._typingInterval = setInterval(() => {
        if (charIdx < snippet.length) {
          this.codeEl.textContent += snippet[charIdx];
          charIdx++;
        } else {
          clearInterval(this._typingInterval);
          setTimeout(() => {
            snippetIdx = (snippetIdx + 1) % snippets.length;
            typeSnippet();
          }, 3000);
        }
      }, 30);
    };

    typeSnippet();
  }

  stopTypingAnimation() {
    if (this._typingInterval) {
      clearInterval(this._typingInterval);
      this._typingInterval = null;
    }
  }
}

window.AboutView = AboutView;
