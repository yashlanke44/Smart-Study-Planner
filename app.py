"""
app.py — Smart Study Planner (Python / Flask)
=============================================
MVVM Architecture:
  Model      → models/ (SQLAlchemy + DSA algorithms)
  View       → templates/ (Jinja2)
  ViewModel  → Route handler functions in this file

Stack:
  Flask  + Flask-SQLAlchemy + Flask-JWT-Extended + bcrypt
"""

from flask import (Flask, render_template, request, jsonify,
                   redirect, url_for, make_response)
from flask_jwt_extended import (JWTManager, create_access_token,
                                jwt_required, get_jwt_identity,
                                set_access_cookies, unset_jwt_cookies,
                                verify_jwt_in_request)
from flask_jwt_extended.exceptions import NoAuthorizationError
from datetime import datetime, date
import os

from config import Config
from models.database import db
from models.user import User, StudySession
from models.task import Task
from models import scheduler as sched


# ─── App Factory ──────────────────────────────────────────────────
def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt = JWTManager(app)

    with app.app_context():
        db.create_all()

    # ══════════════════════════════════════════════════════════════
    # PAGE ROUTES  (Views — Jinja2 templates)
    # ══════════════════════════════════════════════════════════════

    @app.route('/')
    def index():
        """Landing page — device selector + hero."""
        return render_template('index.html')

    @app.route('/dashboard')
    def dashboard():
        """Main app shell — rendered for authenticated users."""
        return render_template('dashboard.html')

    # ══════════════════════════════════════════════════════════════
    # AUTH API  (ViewModel: AuthViewModel)
    # ══════════════════════════════════════════════════════════════

    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.get_json()
        name     = (data.get('name') or '').strip()
        email    = (data.get('email') or '').strip().lower()
        password = data.get('password', '')

        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required.'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters.'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered.'}), 409

        user = User(name=name, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))
        resp  = make_response(jsonify({'user': user.to_dict(), 'message': 'Account created!'}), 201)
        set_access_cookies(resp, token)
        return resp

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data  = request.get_json()
        email = (data.get('email') or '').strip().lower()
        pwd   = data.get('password', '')

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(pwd):
            return jsonify({'error': 'Invalid email or password.'}), 401

        token = create_access_token(identity=str(user.id))
        resp  = make_response(jsonify({'user': user.to_dict(), 'message': 'Welcome back!'}), 200)
        set_access_cookies(resp, token)
        return resp

    @app.route('/api/auth/logout', methods=['POST'])
    def logout():
        resp = make_response(jsonify({'message': 'Logged out.'}))
        unset_jwt_cookies(resp)
        return resp

    @app.route('/api/auth/me', methods=['GET'])
    @jwt_required()
    def me():
        uid  = int(get_jwt_identity())
        user = User.query.get_or_404(uid)
        return jsonify({'user': user.to_dict()})

    # ══════════════════════════════════════════════════════════════
    # TASKS API  (ViewModel: TaskViewModel)
    # ══════════════════════════════════════════════════════════════

    @app.route('/api/tasks', methods=['GET'])
    @jwt_required()
    def get_tasks():
        uid    = int(get_jwt_identity())
        status = request.args.get('status')
        subj   = request.args.get('subject')
        sort   = request.args.get('sort', 'created')

        q = Task.query.filter_by(user_id=uid)
        if status:
            q = q.filter_by(status=status)
        if subj:
            q = q.filter_by(subject=subj)

        tasks = q.all()

        # Python-side sort using DSA
        task_dicts = [t.to_dict() for t in tasks]
        if sort == 'urgency':
            task_dicts = sched.heap_schedule(task_dicts)
        elif sort == 'deadline':
            task_dicts = sched.earliest_deadline_first(task_dicts)
        else:
            task_dicts.sort(key=lambda t: t['created_at'], reverse=True)

        return jsonify({'tasks': task_dicts, 'count': len(task_dicts)})

    @app.route('/api/tasks', methods=['POST'])
    @jwt_required()
    def create_task():
        uid  = int(get_jwt_identity())
        data = request.get_json()

        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({'error': 'Title is required.'}), 400

        deadline = None
        if data.get('deadline'):
            try:
                deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid deadline format.'}), 400

        task = Task(
            user_id      = uid,
            title        = title,
            description  = data.get('description', ''),
            subject      = data.get('subject', 'Other'),
            priority     = data.get('priority', 'medium'),
            status       = data.get('status', 'pending'),
            deadline     = deadline,
            duration_hrs = float(data.get('duration_hrs', 1.0)),
            tags         = data.get('tags', ''),
        )
        db.session.add(task)
        db.session.commit()
        return jsonify({'task': task.to_dict()}), 201

    @app.route('/api/tasks/<int:task_id>', methods=['PUT'])
    @jwt_required()
    def update_task(task_id):
        uid  = int(get_jwt_identity())
        task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
        data = request.get_json()

        for field in ('title', 'description', 'subject', 'priority', 'status', 'tags'):
            if field in data:
                setattr(task, field, data[field])
        if 'duration_hrs' in data:
            task.duration_hrs = float(data['duration_hrs'])
        if 'deadline' in data and data['deadline']:
            task.deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
        if data.get('status') == 'completed' and not task.completed_at:
            task.completed_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'task': task.to_dict()})

    @app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
    @jwt_required()
    def delete_task(task_id):
        uid  = int(get_jwt_identity())
        task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted.'})

    # ══════════════════════════════════════════════════════════════
    # SCHEDULER API  (ViewModel: SchedulerViewModel)
    # ══════════════════════════════════════════════════════════════

    @app.route('/api/schedule', methods=['POST'])
    @jwt_required()
    def generate_ai_schedule():
        uid   = int(get_jwt_identity())
        data  = request.get_json() or {}
        tasks = Task.query.filter_by(user_id=uid).filter(Task.status != 'completed').all()

        task_dicts   = [t.to_dict() for t in tasks]
        budget       = float(data.get('time_budget_hrs', 8.0))
        dependencies = data.get('dependencies', {})
        # Convert string keys from JSON to int
        deps_int = {int(k): v for k, v in dependencies.items()}

        result = sched.generate_schedule(task_dicts, budget, deps_int)
        return jsonify(result)

    @app.route('/api/schedule/heap', methods=['GET'])
    @jwt_required()
    def heap_sorted():
        uid   = int(get_jwt_identity())
        tasks = Task.query.filter_by(user_id=uid).filter(Task.status != 'completed').all()
        return jsonify({'tasks': sched.heap_schedule([t.to_dict() for t in tasks])})

    @app.route('/api/schedule/edf', methods=['GET'])
    @jwt_required()
    def edf_sorted():
        uid   = int(get_jwt_identity())
        tasks = Task.query.filter_by(user_id=uid).filter(Task.status != 'completed').all()
        return jsonify({'tasks': sched.earliest_deadline_first([t.to_dict() for t in tasks])})

    # ══════════════════════════════════════════════════════════════
    # ANALYTICS API  (ViewModel: AnalyticsViewModel)
    # ══════════════════════════════════════════════════════════════

    @app.route('/api/analytics', methods=['GET'])
    @jwt_required()
    def analytics():
        uid      = int(get_jwt_identity())
        sessions = StudySession.query.filter_by(user_id=uid).order_by(StudySession.date).all()
        tasks    = Task.query.filter_by(user_id=uid).all()

        session_dicts = [s.to_dict() for s in sessions]
        insights      = sched.productivity_insights(session_dicts)

        # Task stats
        total     = len(tasks)
        completed = sum(1 for t in tasks if t.status == 'completed')
        overdue   = sum(1 for t in tasks if t.is_overdue)
        by_subj   = {}
        for t in tasks:
            by_subj[t.subject] = by_subj.get(t.subject, 0) + 1

        return jsonify({
            'insights':      insights,
            'task_stats':    {
                'total':     total,
                'completed': completed,
                'pending':   total - completed,
                'overdue':   overdue,
            },
            'by_subject':    by_subj,
            'sessions':      session_dicts,
        })

    @app.route('/api/analytics/session', methods=['POST'])
    @jwt_required()
    def log_session():
        uid  = int(get_jwt_identity())
        data = request.get_json()
        session = StudySession(
            user_id      = uid,
            duration_min = float(data.get('duration_min', 30)),
            subject      = data.get('subject', 'General'),
            date         = date.today(),
        )
        db.session.add(session)
        db.session.commit()
        return jsonify({'session': session.to_dict()}), 201

    # ══════════════════════════════════════════════════════════════
    # DASHBOARD API  (ViewModel: DashboardViewModel)
    # ══════════════════════════════════════════════════════════════

    @app.route('/api/dashboard', methods=['GET'])
    @jwt_required()
    def dashboard_data():
        uid   = int(get_jwt_identity())
        user  = User.query.get_or_404(uid)
        tasks = Task.query.filter_by(user_id=uid).all()

        total     = len(tasks)
        completed = sum(1 for t in tasks if t.status == 'completed')
        pending   = [t.to_dict() for t in tasks if t.status != 'completed']
        urgent    = sched.heap_schedule(pending)[:3]          # top-3 urgent

        return jsonify({
            'user':       user.to_dict(),
            'stats': {
                'total':       total,
                'completed':   completed,
                'pending':     total - completed,
                'completion':  round(completed / total * 100, 1) if total else 0,
                'streak':      user.streak,
            },
            'urgent_tasks': urgent,
        })

    # ══════════════════════════════════════════════════════════════
    # ERROR HANDLERS
    # ══════════════════════════════════════════════════════════════

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found.'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error.'}), 500

    return app


# ─── Entry Point ──────────────────────────────────────────────────
if __name__ == '__main__':
    app = create_app()
    port = app.config.get('PORT', 3000)
    print(f'\n  🧠  Smart Study Planner (Python/Flask)')
    print(f'  🌐  Running at http://localhost:{port}')
    print(f'  📦  Database: SQLite (study_planner.db)\n')
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
