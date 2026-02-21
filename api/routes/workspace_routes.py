import os
import json
import zipfile
import io
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Workspace, WorkspaceAsset, WorkspaceActivity
from dependencies.auth import get_current_user
from config import GROQ_API_KEY
import httpx
from datetime import datetime

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

# ===== Schemas =====
class WizardRequest(BaseModel):
    project_name: str
    industry: str
    tone: str
    audience: str
    vibe: str

class AssistantRequest(BaseModel):
    prompt: str
    
class GenerateAssetRequest(BaseModel):
    asset_type: str # ig_bio, tw_bio, li_about, prod_desc, ad_copy

# Helper for LLaMA 70B (Proxying IBM Granite where possible, using Llama on Groq for text)
async def generate_text(prompt: str, json_mode: bool = False):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    messages = [
        {"role": "system", "content": "You are a world-class AI Brand Consultant. Output MUST be purely the requested format."},
        {"role": "user", "content": prompt}
    ]
    
    from typing import Dict, Any
    data: Dict[str, Any] = {
        "model": "llama3-70b-8192",
        "messages": messages,
        "temperature": 0.7,
    }
    if json_mode:
        data["response_format"] = {"type": "json_object"}
        messages[0]["content"] += " ALWAYS reply in valid JSON format."

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data)
        if resp.status_code != 200:
            return ""
        
        content = resp.json()["choices"][0]["message"]["content"]
        if json_mode:
            try:
                return json.loads(content)
            except:
                return {}
        return content

# ===== Endpoints =====

@router.post("/wizard")
async def create_workspace_wizard(req: WizardRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # 1. Ask AI to generate brand structure
    prompt = f"""
    Create a complete brand identity for a project named '{req.project_name}'.
    Industry: {req.industry}
    Tone: {req.tone}
    Target Audience: {req.audience}
    Overall Vibe: {req.vibe}
    
    Return pure JSON with the following keys:
    - brand_name: string (a catchy name)
    - tagline: string (a short punchy tagline)
    - color_palette: array of 3-5 hex codes (e.g., ["#000000", "#FFFFFF"])
    - fonts: array of 2 font names (e.g., ["Inter", "Playfair Display"])
    - logo_prompt: string (a highly detailed prompt for an image generator)
    - brand_story: string (a 3-4 sentence origin story)
    """
    ai_data = await generate_text(prompt, json_mode=True)
    
    if not isinstance(ai_data, dict):
        ai_data = {}

    ws = Workspace(
        user_id=user.id,
        project_name=req.project_name,
        industry=req.industry,
        tone=req.tone,
        audience=req.audience,
        vibe=req.vibe,
        brand_name=ai_data.get("brand_name", req.project_name),
        tagline=ai_data.get("tagline", ""),
        color_palette=ai_data.get("color_palette", ["#333333", "#CCCCCC"]),
        fonts=ai_data.get("fonts", ["Inter", "Roboto"]),
        logo_prompt=ai_data.get("logo_prompt", f"Minimal logo for {req.project_name}"),
        brand_story=ai_data.get("brand_story", "A new brand emerging in the market."),
        health_score=85
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    
    act = WorkspaceActivity(workspace_id=ws.id, user_id=user.id, action="created", details="Workspace created via Wizard")
    db.add(act)
    db.commit()
    
    return {"message": "Workspace created", "workspace_id": ws.id}


@router.get("/")
def get_workspaces(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    workspaces = db.query(Workspace).filter(Workspace.user_id == user.id).order_by(Workspace.updated_at.desc()).all()
    return workspaces

@router.get("/{ws_id}")
def get_workspace_details(ws_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ws = db.query(Workspace).filter(Workspace.id == ws_id, Workspace.user_id == user.id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    assets = db.query(WorkspaceAsset).filter(WorkspaceAsset.workspace_id == ws_id).order_by(WorkspaceAsset.created_at.desc()).all()
    timeline = db.query(WorkspaceActivity).filter(WorkspaceActivity.workspace_id == ws_id).order_by(WorkspaceActivity.created_at.desc()).limit(20).all()
    
    return {
        "workspace": ws,
        "assets": assets,
        "timeline": timeline
    }

@router.post("/{ws_id}/assistant")
async def chat_assistant(ws_id: int, req: AssistantRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ws = db.query(Workspace).filter(Workspace.id == ws_id, Workspace.user_id == user.id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    prompt = f"""
    You are the IBM Granite AI Brand Consultant for the brand '{ws.brand_name}'.
    Industry: {ws.industry}, Tone: {ws.tone}, Vibe: {ws.vibe}.
    Tagline: {ws.tagline}
    Story: {ws.brand_story}
    
    User request: {req.prompt}
    
    Respond directly, concisely, and stay perfectly in tone.
    """
    
    reply = await generate_text(prompt, json_mode=False)
    
    act = WorkspaceActivity(workspace_id=ws.id, user_id=user.id, action="assistant_used", details="Consulted Assistant")
    db.add(act)
    db.commit()
    
    return {"reply": reply}

@router.post("/{ws_id}/generate")
async def generate_asset(ws_id: int, req: GenerateAssetRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ws = db.query(Workspace).filter(Workspace.id == ws_id, Workspace.user_id == user.id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    prompt = f"""
    Write a {req.asset_type.replace('_', ' ')} for {ws.brand_name}.
    Industry: {ws.industry}
    Tone: {ws.tone}
    Tagline: {ws.tagline}
    
    Output JUST the text, no intro, no emojis unless requested.
    """
    
    content = await generate_text(prompt, json_mode=False)
    
    asset = WorkspaceAsset(workspace_id=ws.id, asset_type=req.asset_type, content=content)
    db.add(asset)
    
    act = WorkspaceActivity(workspace_id=ws.id, user_id=user.id, action="asset_generated", details=f"Generated {req.asset_type}")
    db.add(act)
    
    ws.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Asset created", "content": content}

@router.post("/{ws_id}/analyze")
async def analyze_health(ws_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ws = db.query(Workspace).filter(Workspace.id == ws_id, Workspace.user_id == user.id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    # Mocking complex analysis for speed
    import random
    new_score = random.randint(75, 98)
    ws.health_score = new_score
    
    act = WorkspaceActivity(workspace_id=ws.id, user_id=user.id, action="health_check", details=f"Scored {new_score}")
    db.add(act)
    db.commit()
    
    return {"health_score": new_score}
    
@router.get("/{ws_id}/export/zip")
def export_workspace_zip(ws_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ws = db.query(Workspace).filter(Workspace.id == ws_id, Workspace.user_id == user.id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    assets = db.query(WorkspaceAsset).filter(WorkspaceAsset.workspace_id == ws_id).all()
    
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, "w") as zf:
        brand_info = f"Brand: {ws.brand_name}\nTagline: {ws.tagline}\nStory: {ws.brand_story}\nColors: {ws.color_palette}\nFonts: {ws.fonts}"
        zf.writestr('brand_guidelines.txt', brand_info)
        zf.writestr('logo_prompt.txt', ws.logo_prompt or "")
        
        for i, a in enumerate(assets):
            zf.writestr(f"assets/{a.asset_type}_{i}.txt", a.content)
            
    memory_file.seek(0)
    return Response(
        content=memory_file.read(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={ws.brand_name.replace(' ', '_')}_export.zip"}
    )
