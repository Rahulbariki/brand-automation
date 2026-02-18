from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import shutil
import os

from app.database import get_db
from app.models import User, GeneratedContent
from app.dependencies import get_current_user, require_pro
from app.schemas import (
    BrandNameRequest, TaglineRequest, StrategyRequest,
    MarketingContentRequest, SentimentRequest, ColorPaletteRequest,
    ChatRequest, LogoRequest, PitchRequest, InvestorEmailRequest
)
from app.ai_services import (
    generate_brand_names, generate_marketing_content, analyze_sentiment,
    get_color_palette, chat_with_ai, generate_logo_prompt, generate_logo_image,
    transcribe_audio, generate_pitch, generate_investor_email
)

router = APIRouter()

# Helper to log generation
def log_generation(db: Session, user: User, content_type: str, content: str):
    log = GeneratedContent(
        user_id=user.id,
        content_type=content_type,
        content=str(content)
    )
    db.add(log)
    db.commit()

# Dependency: Usage Limit Check
def check_usage_limit(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.subscription_plan in ["pro", "enterprise", "admin"]:
        return user
        
    # Count today's generations
    today = date.today()
    count = db.query(GeneratedContent).filter(
        GeneratedContent.user_id == user.id,
        func.date(GeneratedContent.created_at) == today
    ).count()
    
    if count >= 5:
        raise HTTPException(status_code=403, detail="Free limit reached (5/day). Upgrade to Pro.")
    return user

@router.post("/generate-brand")
async def api_generate_brand(request: BrandNameRequest, db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    names = generate_brand_names(request)
    log_generation(db, user, "brand_names", names)
    return {"names": names}

@router.post("/generate-content")
async def api_generate_content(request: MarketingContentRequest, db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    content = generate_marketing_content(request)
    log_generation(db, user, "marketing_content", content)
    return {"content": content}

@router.post("/analyze-sentiment")
async def api_analyze_sentiment(request: SentimentRequest, db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    result = analyze_sentiment(request)
    log_generation(db, user, "sentiment_analysis", result)
    return result

@router.post("/get-colors")
async def api_get_colors(request: ColorPaletteRequest, db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    colors = get_color_palette(request)
    log_generation(db, user, "color_palette", colors)
    return {"colors": colors}

@router.post("/chat")
async def api_chat(request: ChatRequest, db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    response = chat_with_ai(request)
    log_generation(db, user, "chat", response)
    return {"response": response}

@router.post("/generate-logo")
async def api_generate_logo(request: LogoRequest, db: Session = Depends(get_db), user: User = Depends(require_pro)):
    # Logo is strictly Pro, but we also log it
    prompt = generate_logo_prompt(request)
    safe_name = "".join(x for x in request.brand_name if x.isalnum())
    filename = f"{safe_name}_logo.png"
    image_file = generate_logo_image(prompt, filename)
    image_url = f"/assets/generated_logos/{image_file}" if image_file else ""
    
    log_generation(db, user, "logo", image_url)
    return {"prompt": prompt, "image_url": image_url}

@router.post("/transcribe-voice")
async def api_transcribe_voice(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    temp_filename = f"temp_{file.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        text = transcribe_audio(temp_filename)
        log_generation(db, user, "voice_transcription", text)
        return {"text": text}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@router.post("/generate-pitch")
async def api_generate_pitch(request: PitchRequest, db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    pitch = generate_pitch(request)
    log_generation(db, user, "startup_pitch", pitch)
    return {"pitch": pitch}

@router.post("/generate-investor-email")
async def api_generate_investor_email(request: InvestorEmailRequest, db: Session = Depends(get_db), user: User = Depends(check_usage_limit)):
    email = generate_investor_email(request)
    log_generation(db, user, "investor_email", email)
    return {"email": email}
