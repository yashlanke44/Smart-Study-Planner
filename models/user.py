from models.database import db
import bcrypt
from datetime import datetime


class User(db.Model):
    """
    MODEL — User
    Pure data & business logic. No UI coupling.
    """
    __tablename__ = 'users'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    password   = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    streak     = db.Column(db.Integer, default=0)
    last_study = db.Column(db.DateTime, nullable=True)

    # Relationships
    tasks    = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    sessions = db.relationship('StudySession', backref='user', lazy=True, cascade='all, delete-orphan')

    # ── Hash password (bcrypt) ─────────────────────────────────────────
    def set_password(self, plain_text: str) -> None:
        salt = bcrypt.gensalt()
        self.password = bcrypt.hashpw(plain_text.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, plain_text: str) -> bool:
        return bcrypt.checkpw(plain_text.encode('utf-8'), self.password.encode('utf-8'))

    def to_dict(self) -> dict:
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'streak':     self.streak,
            'created_at': self.created_at.isoformat(),
        }

    def __repr__(self):
        return f'<User {self.email}>'


class StudySession(db.Model):
    """
    MODEL — StudySession
    Daily study log for analytics & streak tracking.
    """
    __tablename__ = 'study_sessions'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date         = db.Column(db.Date, default=datetime.utcnow)
    duration_min = db.Column(db.Float, default=0)   # minutes studied
    subject      = db.Column(db.String(100), nullable=True)

    def to_dict(self) -> dict:
        return {
            'id':           self.id,
            'date':         self.date.isoformat(),
            'duration_min': self.duration_min,
            'subject':      self.subject,
        }
