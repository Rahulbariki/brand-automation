import sys
import os

# Ensure the 'api' directory is prioritized in the python path
# so that all internal API imports like `import database` work everywhere
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "api"))

# Expose the FastAPI app
from api.index import app

# This allows you to run the server simply with `python main.py`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
