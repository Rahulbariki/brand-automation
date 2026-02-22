import os
import sys
import json
import traceback
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

app = FastAPI(
    title="BrandNova API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- GLOBAL ERROR HANDLER --------

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal Server Error",
            "detail": str(exc),
            "traceback": traceback.format_exc()
        },
    )

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

# -------- DATABASE LOAD AFTER ROUTERS --------

@app.on_event("startup")
def startup_event():
    try:
        from database import engine, Base
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("DB Startup Error:")
        traceback.print_exc()

# -------- HEALTH CHECK --------

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "env": ENV}

# -------- STATIC ASSETS --------

assets_dir = os.path.join(api_dir, "..", "frontend", "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
