import os
import sys
import json
import traceback
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

ENV = os.getenv("ENV", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

# -------- DATABASE INIT --------
# On Vercel serverless, lifespan events may not fire reliably.
# We create tables at module load time as a fallback.
_db_initialized = False

def ensure_db():
    global _db_initialized
    if _db_initialized:
        return
    try:
        from database import engine, Base
        Base.metadata.create_all(bind=engine)
        _db_initialized = True
    except Exception as e:
        print("DB Init Error:")
        traceback.print_exc()

# Try to init DB at import time (works for both local and Vercel)
ensure_db()

# -------- LIFESPAN --------
@asynccontextmanager
async def lifespan(app):
    ensure_db()
    yield

app = FastAPI(
    title="BrandNova API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# -------- CORS --------
# On Vercel, frontend and API are on the same domain, but we need CORS
# for Supabase OAuth redirects and dev environments.
# Using allow_origins=["*"] is safe here because auth uses Bearer tokens, not cookies.
allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- GLOBAL ERROR HANDLER --------

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Log full traceback server-side for debugging
    traceback.print_exc()
    
    content = {"message": "Internal Server Error", "detail": str(exc)}
    # Only include traceback in development mode
    if ENV != "production":
        content["traceback"] = traceback.format_exc()
    
    return JSONResponse(status_code=500, content=content)

# -------- ROUTERS LOADED AFTER APP BOOT --------

try:
    import routes.auth_routes as auth_routes
    import routes.admin_routes as admin_routes
    import routes.branding_routes as branding_routes
    import routes.stripe_routes as stripe_routes
    import routes.debug_routes as debug_routes
    import routes.workspace_routes as workspace_routes
    import routes.team_routes as team_routes
    from dependencies import admin_required

    app.include_router(auth_routes.router, prefix="/api", tags=["Auth"])
    app.include_router(admin_routes.router, prefix="/api/admin", dependencies=[Depends(admin_required)])
    app.include_router(branding_routes.router, prefix="/api")
    app.include_router(stripe_routes.router, prefix="/api/stripe")
    app.include_router(debug_routes.router, prefix="/api/debug")
    app.include_router(workspace_routes.router)
    app.include_router(team_routes.router, prefix="/api/team")

except Exception as e:
    print("Router Load Error:", e)
    traceback.print_exc()

# -------- HEALTH CHECK --------

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "env": ENV, "db_initialized": _db_initialized}

# -------- STATIC ASSETS --------

assets_dir = os.path.join(api_dir, "..", "frontend", "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
