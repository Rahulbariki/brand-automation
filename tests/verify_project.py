import sys
import os
import time
import subprocess
import requests
import signal

# Add backend to path just in case, though we run as module
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

def verify_project():
    print(f"Project Root: {project_root}")
    
    # 1. Start Backend
    print("Starting Backend...")
    # We use the same python interpreter
    cmd = [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--port", "8000", "--host", "127.0.0.1"]
    
    # Env vars
    env = os.environ.copy()
    # Ensure PYTHONPATH includes project root
    env["PYTHONPATH"] = project_root
    
    process = subprocess.Popen(
        cmd, 
        cwd=project_root, 
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True # Python 3.7+
    )
    
    base_url = "http://127.0.0.1:8000"
    
    try:
        # 2. Wait for Health Check
        print("Waiting for backend to be ready...")
        healthy = False
        for i in range(20): # 10 seconds timeout
            try:
                resp = requests.get(f"{base_url}/health", timeout=1)
                if resp.status_code == 200:
                    print("Backend is HEALTHY")
                    healthy = True
                    break
            except requests.exceptions.ConnectionError:
                pass
            time.sleep(0.5)
            
        if not healthy:
            print("Backend failed to start within timeout.")
            # Print stderr
            outs, errs = process.communicate(timeout=1)
            print(f"STDOUT:\n{outs}")
            print(f"STDERR:\n{errs}")
            return
            
        # 3. Verify Static Files
        print("Verifying Static Files...")
        try:
            resp = requests.get(f"{base_url}/", timeout=1)
            if resp.status_code == 200:
                 print("Frontend (index.html) served correctly.")
            else:
                 print(f"Frontend served with status {resp.status_code}")
                 
            resp = requests.get(f"{base_url}/assets/js/script.js", timeout=1)
            if resp.status_code == 200:
                 print("Assets (script.js) served correctly.")
            else:
                 print(f"Assets served with status {resp.status_code}")
                 
        except Exception as e:
            print(f"Error verifying static files: {e}")

        # 4. Verify API
        print("Verifying Brand Generation API (Mock check)...")
        # We don't want to actually call Groq/AI if we can avoid it, or we expect it to fail if keys are missing.
        # But we can check if 404 or 422 (validation error) which means endpoint exists.
        try:
            resp = requests.post(f"{base_url}/api/generate-brand", json={}, timeout=2)
            if resp.status_code == 422: # Missing fields
                print("API Endpoint /api/generate-brand exists (Got 422 as expected for empty body).")
            elif resp.status_code == 200:
                print("API Endpoint /api/generate-brand working.")
            else:
                print(f"API Endpoint returned {resp.status_code}. Might be normal if keys missing.")
        except Exception as e:
            print(f"Error verifying API: {e}")

    finally:
        print("Stopping Backend...")
        process.terminate()
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            process.kill()
        print("Done.")

if __name__ == "__main__":
    verify_project()
