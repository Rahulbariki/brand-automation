import sys
import os

# Ensure the root directory is in the python path so 'backend.app' can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Import the FastAPI app from the existing main file
try:
    from backend.app.main import app
except ImportError as e:
    # Fallback for different working directories
    sys.path.append(os.path.dirname(__file__))
    from backend.app.main import app

# This 'app' instance is what Vercel will look for
