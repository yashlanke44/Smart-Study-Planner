import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ssp-dev-secret-2026-change-in-prod')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///study_planner.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'ssp-jwt-secret-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SECURE = False  # Set True in production (HTTPS)
    JWT_COOKIE_SAMESITE = 'Lax'
    DEBUG = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    PORT = int(os.environ.get('PORT', 3000))
