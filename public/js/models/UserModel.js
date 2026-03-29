/* ═══════════════════════════════════════════════════
   MODEL: UserModel
   Handles user auth state + JWT token management
   ═══════════════════════════════════════════════════ */

class UserModel {
  constructor() {
    this.token = null;
    this.user = null;
    this._listeners = [];
    this._load();
  }

  subscribe(fn) { this._listeners.push(fn); }
  _notify() { this._listeners.forEach(fn => fn(this.user, this.token)); }

  _load() {
    try {
      this.token = JSON.parse(localStorage.getItem('ssp_token'));
      this.user = JSON.parse(localStorage.getItem('ssp_user'));
    } catch { /* ignore */ }
  }

  _save() {
    localStorage.setItem('ssp_token', JSON.stringify(this.token));
    localStorage.setItem('ssp_user', JSON.stringify(this.user));
    this._notify();
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    this._save();
  }

  clear() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('ssp_token');
    localStorage.removeItem('ssp_user');
    this._notify();
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getName() {
    return this.user?.name || 'Student';
  }

  getEmail() {
    return this.user?.email || '';
  }

  async login(email, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    this.setAuth(data.token, data.user);
    return data.user;
  }

  async signup(name, email, password) {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    this.setAuth(data.token, data.user);
    return data.user;
  }
}

window.UserModel = UserModel;
