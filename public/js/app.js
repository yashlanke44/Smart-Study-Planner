/* ═══════════════════════════════════════════════════
   ROOT: app.js
   Application entry point. Initializes all MVVM parts.
   Serves as DI container (Dependency Injection).
   ═══════════════════════════════════════════════════ */

const App = {
  currentPage: 'landing',

  init() {
    // ── 1. Init Dependencies (Utils) ───────────────
    const toast = Utils.showToast.bind(Utils);
    const confetti = Utils.showConfetti.bind(Utils);

    // ── 2. Instantiate Models (M) ──────────────────
    const userModel = new UserModel();
    const taskModel = new TaskModel();
    const sessionModel = new SessionModel();
    const schedulerModel = new SchedulerModel();

    // ── 3. Instantiate Views (V) ───────────────────
    const authView = new AuthView();
    const taskView = new TaskView();
    const dashboardView = new DashboardView();
    const schedulerView = new SchedulerView();
    const analyticsView = new AnalyticsView();
    const suggestionsView = new SuggestionsView();
    const aboutView = new AboutView();

    // ── 4. Instantiate ViewModels (VM) ─────────────
    this.authVM = new AuthViewModel(userModel, authView, () => this.onLogin());
    this.taskVM = new TaskViewModel(taskModel, sessionModel, taskView, toast, confetti);
    this.schedulerVM = new SchedulerViewModel(taskModel, schedulerModel, schedulerView, toast);
    this.suggestionsVM = new SuggestionsViewModel(taskModel, sessionModel, suggestionsView, toast);
    this.dashboardVM = new DashboardViewModel(userModel, taskModel, sessionModel, schedulerModel, this.suggestionsVM, dashboardView);
    this.analyticsVM = new AnalyticsViewModel(taskModel, sessionModel, analyticsView);

    this.userModel = userModel; // save for guard

    // ── 5. Static View Init ────────────────────────
    aboutView.renderDSACards(window.AboutModelData.dsaConcepts);
    this.aboutView = aboutView;

    // ── 6. Setup Global UI ─────────────────────────
    this.setupNavigation();
    this.initParticles();
    this.animateLandingStats();

    document.getElementById('btn-learn-more')?.addEventListener('click', () => {
      document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => this.onLogout());
    document.getElementById('btn-get-started')?.addEventListener('click', () => this.navigate('auth'));

    if (userModel.isAuthenticated()) this.onLogin();
  },

  // ── Navigation (Router) ────────────────────────
  setupNavigation() {
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        this.navigate(el.dataset.navigate);
      });
    });
  },

  navigate(page) {
    const protectedPages = ['dashboard', 'tasks', 'scheduler', 'analytics', 'suggestions', 'about'];
    if (protectedPages.includes(page) && !this.userModel.isAuthenticated()) {
      page = 'auth';
    }

    if (this.currentPage === 'about') this.aboutView.stopTypingAnimation();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      pageEl.classList.add('active', 'page-enter');
      setTimeout(() => pageEl.classList.remove('page-enter'), 500);
    }

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.getElementById(`nav-${page}`);
    if (activeLink) activeLink.classList.add('active');

    this.currentPage = page;

    // Trigger ViewModel refresh cycles
    switch (page) {
      case 'dashboard': this.dashboardVM.refresh(); break;
      case 'tasks': this.taskVM.render(); break;
      case 'analytics': setTimeout(() => this.analyticsVM.refresh(), 100); break;
      case 'suggestions': this.suggestionsVM.refresh(); break;
      case 'about': this.aboutView.startTypingAnimation(window.AboutModelData.codeSnippets); break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  onLogin() {
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('nav-username').textContent = this.userModel.getName();
    this.navigate('dashboard');
  },

  onLogout() {
    this.userModel.clear();
    document.getElementById('main-nav').classList.add('hidden');
    Utils.showToast('Logged out', 'info');
    this.navigate('landing');
  },

  // ── Sparkles & UI ──────────────────────────────
  animateLandingStats() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('[data-count]').forEach(c => Utils.animateCount(c, parseInt(c.dataset.count), 2000));
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    const stats = document.querySelector('.hero-stats');
    if (stats) observer.observe(stats);
  },

  initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [], w, h;

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 200));

    class Particle {
      constructor() { this.x = Math.random() * w; this.y = Math.random() * h; this.size = Math.random() * 2 + 0.5; this.sx = (Math.random() - 0.5) * 0.5; this.sy = (Math.random() - 0.5) * 0.5; this.op = Math.random() * 0.5 + 0.1; }
      update() { this.x += this.sx; this.y += this.sy; if (this.x < 0 || this.x > w) this.sx *= -1; if (this.y < 0 || this.y > h) this.sy *= -1; }
      draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(108,99,255,${this.op})`; ctx.fill(); }
    }
    for (let i = 0; i < Math.min(80, Math.floor(w * h / 15000)); i++) particles.push(new Particle());

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(108,99,255,${0.1 * (1 - dist / 150)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
