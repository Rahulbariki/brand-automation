from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import shutil
import os

from .schemas import (
    BrandNameRequest, TaglineRequest, StrategyRequest,
    MarketingContentRequest, SentimentRequest, ColorPaletteRequest,
    ChatRequest, LogoRequest
)
from .ai_services import (
    generate_brand_names, generate_marketing_content, analyze_sentiment,
    get_color_palette, chat_with_ai, generate_logo_prompt, generate_logo_image,
    transcribe_audio
)
from .auth import router as auth_router
from .admin import router as admin_router
from .payments import router as payments_router
from .dependencies import get_current_user
from .database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BizForge API", version="1.0.0")

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])

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

app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/")
async def read_root():
    return FileResponse(os.path.join(frontend_path, "index.html"))

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

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# --- Activity 2.5: Brand Name Generator ---
@app.post("/api/generate-brand")
async def api_generate_brand(request: BrandNameRequest, current_user: dict = Depends(get_current_user)):
    names = generate_brand_names(request)
    return {"names": names}

# --- Activity 2.6: Marketing Content ---
@app.post("/api/generate-content")
async def api_generate_content(request: MarketingContentRequest, current_user: dict = Depends(get_current_user)):
    content = generate_marketing_content(request)
    return {"content": content}

# --- Activity 2.7: Sentiment Analysis ---
@app.post("/api/analyze-sentiment")
async def api_analyze_sentiment(request: SentimentRequest, current_user: dict = Depends(get_current_user)):
    result = analyze_sentiment(request)
    return result

# --- Activity 2.8: Color Palette ---
@app.post("/api/get-colors")
async def api_get_colors(request: ColorPaletteRequest, current_user: dict = Depends(get_current_user)):
    colors = get_color_palette(request)
    return {"colors": colors}

# --- Activity 2.9: Chatbot ---
@app.post("/api/chat")
async def api_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    response = chat_with_ai(request)
    return {"response": response}

# --- Activity 2.10: Logo Generation ---
@app.post("/api/generate-logo")
async def api_generate_logo(request: LogoRequest, current_user: dict = Depends(get_current_user)):
    # 1. Generate Prompt
    prompt = generate_logo_prompt(request)
    
    # 2. Generate Image
    safe_name = "".join(x for x in request.brand_name if x.isalnum())
    filename = f"{safe_name}_logo.png"
    
    image_file = generate_logo_image(prompt, filename)
    
    image_url = ""
    if image_file:
        image_url = f"/assets/generated_logos/{image_file}"
    else:
        # We need a placeholder. 
        # Ideally we should serve one if it exists or return empty.
        image_url = "" 
        
    return {
        "prompt": prompt,
        "image_url": image_url
    }

# --- Activity 2.11: Voice Transcription ---
@app.post("/api/transcribe-voice")
async def api_transcribe_voice(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    temp_filename = f"temp_{file.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        text = transcribe_audio(temp_filename)
        
        return {"text": text}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
