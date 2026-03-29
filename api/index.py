import sys
import os

# Add the parent directory to the sys.path so 'app' and 'models' can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

# Vercel Serverless Function looks for the 'app' object
app = create_app()
