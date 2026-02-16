import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from backend.app.main import app
    print("Backend import successful")
except Exception as e:
    print(f"Backend import failed: {e}")
    sys.exit(1)
