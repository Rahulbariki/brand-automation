from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.database import engine, Base
from app.routes import auth_routes, admin_routes, branding_routes, stripe_routes

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BizForge API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files
# internal structure: backend/app/main.py -> ../../frontend
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
assets_path = os.path.join(frontend_path, "assets")
css_path = os.path.join(frontend_path, "css")
js_path = os.path.join(frontend_path, "js")

# Ensure assets directory exists
os.makedirs(assets_path, exist_ok=True)
os.makedirs(os.path.join(assets_path, "generated_logos"), exist_ok=True)
os.makedirs(css_path, exist_ok=True)
os.makedirs(js_path, exist_ok=True)

app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
app.mount("/css", StaticFiles(directory=css_path), name="css")
app.mount("/js", StaticFiles(directory=js_path), name="js")

# Mount Routers
app.include_router(auth_routes.router, prefix="/api", tags=["Authentication"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
app.include_router(branding_routes.router, prefix="/api", tags=["Branding AI"])
app.include_router(stripe_routes.router, prefix="/api/stripe", tags=["Stripe"])

# Frontend Pages
@app.get("/")
async def read_root():
    return FileResponse(os.path.join(frontend_path, "index.html"))

@app.get("/login.html")
async def read_login():
    return FileResponse(os.path.join(frontend_path, "login.html"))

@app.get("/signup.html")
async def read_signup():
    return FileResponse(os.path.join(frontend_path, "signup.html"))

@app.get("/branding.html")
async def read_branding():
    return FileResponse(os.path.join(frontend_path, "branding.html"))

@app.get("/dashboard.html")
async def read_dashboard():
    return FileResponse(os.path.join(frontend_path, "dashboard.html"))

@app.get("/auth.html")
async def read_auth():
    return FileResponse(os.path.join(frontend_path, "auth.html"))

@app.get("/admin.html")
async def read_admin():
    return FileResponse(os.path.join(frontend_path, "admin.html"))

@app.get("/brand-names.html")
async def read_brand_names():
    return FileResponse(os.path.join(frontend_path, "brand-names.html"))

@app.get("/logo-creator.html")
async def read_logo_creator():
    return FileResponse(os.path.join(frontend_path, "logo-creator.html"))

@app.get("/marketing.html")
async def read_marketing():
    return FileResponse(os.path.join(frontend_path, "marketing.html"))

@app.get("/design-system.html")
async def read_design_system():
    return FileResponse(os.path.join(frontend_path, "design-system.html"))

@app.get("/sentiment.html")
async def read_sentiment():
    return FileResponse(os.path.join(frontend_path, "sentiment.html"))

@app.get("/ai-consultant.html")
async def read_ai_consultant():
    return FileResponse(os.path.join(frontend_path, "ai-consultant.html"))

@app.get("/startup.html")
async def read_startup():
    return FileResponse(os.path.join(frontend_path, "startup.html"))

@app.get("/health")
def health_check():
    return {"status": "healthy"}
