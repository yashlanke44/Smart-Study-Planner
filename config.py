import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ssp-dev-secret-2026-change-in-prod-very-long-string-to-avoid-warning')
    _default_db = 'sqlite:////tmp/study_planner.db' if os.environ.get('VERCEL') else 'sqlite:///study_planner.db'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', _default_db)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'ssp-jwt-secret-2026-very-long-string-to-avoid-warning-32-bytes')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SECURE = False  # Set True in production (HTTPS)
    JWT_COOKIE_SAMESITE = 'Lax'
    JWT_COOKIE_CSRF_PROTECT = False
    DEBUG = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    PORT = int(os.environ.get('PORT', 3000))
