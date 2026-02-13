from pydantic import BaseModel
from typing import Optional, List

# --- Auth & User Schemas ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    fullname: str

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    fullname: str
    email: str
    role: str
    subscription_plan: str
    stripe_customer_id: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class UserAdminUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- AI Service Schemas ---

# 2.5: Brand Name Generator
class BrandNameRequest(BaseModel):
    industry: str
    keywords: List[str]
    tone: Optional[str] = "modern"
    description: Optional[str] = None

# 2.6: Marketing Content
class MarketingContentRequest(BaseModel):
    brand_name: str
    description: str
    tone: str
    content_type: str  # product_desc, caption, ad_copy
    language: Optional[str] = "English"

# 2.7: Sentiment Analysis
class SentimentRequest(BaseModel):
    text: str
    brand_tone: Optional[str] = "neutral"

# 2.8: Color Palette
class ColorPaletteRequest(BaseModel):
    industry: str
    tone: str

# 2.9: AI Chatbot
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

# 2.10: Logo Generation
class LogoRequest(BaseModel):
    brand_name: str
    industry: str
    keywords: List[str]
    style: Optional[str] = "minimalist"

# Legacy/Helper
class TaglineRequest(BaseModel):
    brand_name: str
    industry: str

class StrategyRequest(BaseModel):
    brand_name: str
    industry: str
    description: Optional[str] = None
