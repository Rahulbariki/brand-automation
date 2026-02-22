from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
from pathlib import Path

# Ensure the 'api' directory is prioritized in the python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "api"))

# Import the main app instance from api/index.py
# This ensures we share all the same routers, database init, and logic
from api.index import app

# The screenshot showed these specific components. 
# While basic CORS is in api/index.py, we can explicitly re-assert it if needed,
# or add any specific main-level routes here.

@app.get("/api/ping")
async def ping():
    return {"message": "pong", "status": "active"}

# Example of handled file upload if needed later (as suggested by screenshot)
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Placeholder for file processing logic
        return JSONResponse(content={"filename": file.filename, "status": "success"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# This allows you to run the server simply with `python main.py`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
