/* ═══════════════════════════════════════════════════
   VIEW: AuthView
   Pure rendering + DOM references for auth page
   ═══════════════════════════════════════════════════ */

class AuthView {
  constructor() {
    this.formEl = document.getElementById('auth-form');
    this.titleEl = document.getElementById('auth-title');
    this.subtitleEl = document.getElementById('auth-subtitle');
    this.submitBtn = document.getElementById('auth-submit');
    this.switchText = document.getElementById('auth-switch-text');
    this.toggleBtn = document.getElementById('auth-toggle');
    this.nameGroup = document.getElementById('signup-name-group');
    this.errorEl = document.getElementById('auth-error');
    this.nameInput = document.getElementById('auth-name');
    this.emailInput = document.getElementById('auth-email');
    this.passwordInput = document.getElementById('auth-password');
  }

  // ── Bind events (called by ViewModel) ──────────
  onSubmit(handler) {
    this.formEl?.addEventListener('submit', (e) => {
      e.preventDefault();
      handler({
        name: this.nameInput.value.trim(),
        email: this.emailInput.value.trim(),
        password: this.passwordInput.value
      });
    });
  }

  onToggle(handler) {
    this.toggleBtn?.addEventListener('click', handler);
  }

  // ── Render methods ─────────────────────────────
  showLoginMode() {
    this.titleEl.textContent = 'Welcome Back';
    this.subtitleEl.textContent = 'Sign in to your study planner';
    this.submitBtn.textContent = 'Sign In';
    this.switchText.textContent = "Don't have an account?";
    this.toggleBtn.textContent = 'Sign Up';
    this.nameGroup.classList.add('hidden');
    this.hideError();
  }

  showSignupMode() {
    this.titleEl.textContent = 'Create Account';
    this.subtitleEl.textContent = 'Start your smart study journey';
    this.submitBtn.textContent = 'Create Account';
    this.switchText.textContent = 'Already have an account?';
    this.toggleBtn.textContent = 'Sign In';
    this.nameGroup.classList.remove('hidden');
    this.hideError();
  }

  showError(msg) {
    this.errorEl.textContent = msg;
    this.errorEl.classList.remove('hidden');
  }

  hideError() {
    this.errorEl.classList.add('hidden');
  }
}

window.AuthView = AuthView;
