/* ═══════════════════════════════════════════════════
   VIEWMODEL: AuthViewModel
   Connects UserModel ↔ AuthView
   ═══════════════════════════════════════════════════ */

class AuthViewModel {
  constructor(userModel, authView, onLoginCallback) {
    this.model = userModel;
    this.view = authView;
    this.onLoginCallback = onLoginCallback;
    this.isLoginMode = true;
    this._bind();
  }

  _bind() {
    this.view.onSubmit(data => this.handleSubmit(data));
    this.view.onToggle(() => this.toggleMode());
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.isLoginMode ? this.view.showLoginMode() : this.view.showSignupMode();
  }

  async handleSubmit({ name, email, password }) {
    if (!email || !password) {
      this.view.showError('Please fill in all fields');
      return;
    }
    if (!this.isLoginMode && !name) {
      this.view.showError('Please enter your name');
      return;
    }

    try {
      if (this.isLoginMode) {
        await this.model.login(email, password);
      } else {
        await this.model.signup(name, email, password);
      }
      this.onLoginCallback();
    } catch (err) {
      this.view.showError(err.message || 'Authentication failed');
    }
  }
}

window.AuthViewModel = AuthViewModel;
