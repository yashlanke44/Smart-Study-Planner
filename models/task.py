from models.database import db
from datetime import datetime


class Task(db.Model):
    """
    MODEL — Task
    Core task entity. All business logic is pure Python.
    O(1) lookups via primary-key index (SQLite B-tree).
    """
    __tablename__ = 'tasks'

    PRIORITIES   = ['low', 'medium', 'high', 'critical']
    STATUSES     = ['pending', 'in-progress', 'completed']
    SUBJECTS     = ['DSA', 'OS', 'DBMS', 'Networks', 'Mathematics', 'Web Dev', 'Other']

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title        = db.Column(db.String(200), nullable=False)
    description  = db.Column(db.Text, nullable=True)
    subject      = db.Column(db.String(100), default='Other')
    priority     = db.Column(db.String(20), default='medium')
    status       = db.Column(db.String(20), default='pending')
    deadline     = db.Column(db.DateTime, nullable=True)
    duration_hrs = db.Column(db.Float, default=1.0)   # estimated study hours
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    tags         = db.Column(db.String(500), nullable=True)   # comma-separated

    # ── Computed Properties ────────────────────────────────────────────
    @property
    def urgency_score(self) -> float:
        """
        Urgency = priority_weight / days_remaining
        Used by the Min-Heap Scheduler (SchedulerModel).
        """
        priority_map = {'low': 1, 'medium': 2, 'high': 3, 'critical': 5}
        weight = priority_map.get(self.priority, 2)
        if self.deadline:
            dl_naive = self.deadline.replace(tzinfo=None)
            delta = (dl_naive - datetime.utcnow()).total_seconds() / 86400
            days  = max(delta, 0.1)
            return round(weight / days, 4)
        return weight

    @property
    def is_overdue(self) -> bool:
        return bool(self.deadline and self.deadline.replace(tzinfo=None) < datetime.utcnow() and self.status != 'completed')

    @property
    def tag_list(self) -> list:
        return [t.strip() for t in self.tags.split(',')] if self.tags else []

    def to_dict(self) -> dict:
        return {
            'id':           self.id,
            'title':        self.title,
            'description':  self.description,
            'subject':      self.subject,
            'priority':     self.priority,
            'status':       self.status,
            'deadline':     self.deadline.isoformat() if self.deadline else None,
            'duration_hrs': self.duration_hrs,
            'created_at':   self.created_at.isoformat(),
            'urgency_score':self.urgency_score,
            'is_overdue':   self.is_overdue,
            'tags':         self.tag_list,
        }

    def __repr__(self):
        return f'<Task {self.id}: {self.title}>'
