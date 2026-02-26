import requests
import os
import json
import uuid
import random
import time
import re
import base64
import urllib.parse
from typing import Optional
from supabase import create_client
from groq import Groq
from dotenv import load_dotenv
from schemas import (
    BrandNameRequest, TaglineRequest, StrategyRequest,
    MarketingContentRequest, SentimentRequest, ColorPaletteRequest,
    ChatRequest, LogoRequest
)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Handle both names for the service key
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Warning: Supabase credentials missing from environment.")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# --- Clients ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not found in environment.")

groq_client = Groq(api_key=GROQ_API_KEY)

# IBM Granite (Hugging Face)
HF_API_KEY = os.getenv("HF_API_KEY")
IBM_MODEL = os.getenv("IBM_MODEL", "ibm-granite/granite-3.0-8b-instruct") 
HF_HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"} if HF_API_KEY else {}

# --- Helper: Robust JSON Extraction ---
def extract_json(text: str):
    """Extracts JSON content from potentially messy AI output."""
    try:
        # Try direct parse
        return json.loads(text.strip())
    except:
        # Try to find the first [ or { and last ] or }
        try:
            start_idx = text.find('[')
            if start_idx == -1: start_idx = text.find('{')
            
            end_idx = text.rfind(']')
            if end_idx == -1: end_idx = text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx+1]
                return json.loads(json_str)
        except:
            pass
    return None

# --- Activity 2.11: Voice Input Transcription ---
def transcribe_audio(audio_file_path: str) -> str:
    """Transcribes audio file to text using Google Speech Recognition."""
    # Disabled for Vercel Serverless optimization (omitting large libraries)
    return "Voice transcription is currently disabled in this lightweight deployment."

# --- Activity 2.5: Brand Name Generator ---
def generate_brand_names(request: BrandNameRequest) -> list[str]:
    """Generates creative brand names using Groq."""
    prompt = f"""
    You are a professional naming consultant. Generate 10 unique, {request.tone}, and brand-ready names for a {request.industry} business.
    Keywords: {', '.join(request.keywords)}
    Description: {request.description or 'N/A'}
    
    Return ONLY a JSON array of strings, e.g., ["Name1", "Name2"]. 
    Do not add any markdown formatting or explanation.
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0.8,
        )
        content = chat_completion.choices[0].message.content.strip()
        result = extract_json(content)
        if isinstance(result, list):
            return result
        return ["Error: AI returned invalid format", "Please try again"]
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating names: {e}")
        return ["Error connecting to AI", f"Detail: {str(e)}"]

# --- Activity 2.6: Marketing Content Generator ---
def generate_marketing_content(request: MarketingContentRequest) -> str:
    """Generates marketing copy using Groq."""
    system_prompt = "You are an expert marketing copywriter."
    user_prompt = f"""
    Write a {request.tone} {request.content_type} for a brand named "{request.brand_name}".
    Description: {request.description}
    Language: {request.language}
    
    Ensure the content is engaging, professional, and optimized for the target audience.
    """
    
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    )
    return chat_completion.choices[0].message.content.strip()

# --- Activity 2.7: Sentiment Analysis ---
def analyze_sentiment(request: SentimentRequest) -> dict:
    """Analyzes sentiment and aligns with brand tone using Groq."""
    prompt = f"""
    Analyze the sentiment of the following customer review based on a "{request.brand_tone}" brand tone.
    Review: "{request.text}"
    
    Return ONLY a JSON object with:
    - sentiment: "Positive", "Neutral", or "Negative"
    - confidence: score between 0.0 and 1.0
    - tone_alignment: Brief comment on how it fits the brand tone.
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0.1, # Low temp for consistent analysis
        )
        content = chat_completion.choices[0].message.content.strip()
        result = extract_json(content)
        if result:
            return result
        return {"sentiment": "Unknown", "confidence": 0.0, "tone_alignment": "Invalid Response"}
    except Exception as e:
        print(f"Sentiment Error: {e}")
        return {"sentiment": "Unknown", "confidence": 0.0, "tone_alignment": f"Error: {str(e)}"}

# --- Activity 2.8: Color Palette --
def get_color_palette(request: ColorPaletteRequest) -> list[str]:
    """Generates a color palette using Groq."""
    prompt = f"""
    Suggest a color palette of 5 hex codes for a {request.tone} brand in the {request.industry} industry.
    Return ONLY a JSON array of hex strings, e.g., ["#FFFFFF", "#000000"].
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        )
        content = chat_completion.choices[0].message.content.strip()
        result = extract_json(content)
        if result and isinstance(result, list):
            return result
        return ["#000000", "#FFFFFF", "#808080", "#C0C0C0", "#333333"]
    except Exception as e:
        print(f"Color Palette Error: {e}")
        return ["#000000", "#FFFFFF", "#808080", "#C0C0C0", "#333333"]

# --- Activity 2.9: AI Chatbot (IBM Granite) ---
def chat_with_ai(request: ChatRequest) -> str:
    """Consults the IBM Granite model for branding advice."""
    prompt = f"""
    [System: You are BrandNova, an expert branding assistant. Provide helpful, strategic, and concise advice.]
    [User: {request.message}]
    """
    
    # Updated to new HF Router endpoint
    ROUTER_URL = f"https://router.huggingface.co/hf-inference/models/{IBM_MODEL}"
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 500, "return_full_text": False}
    }
    
    try:
        response = requests.post(ROUTER_URL, headers=HF_HEADERS, json=payload, timeout=5)
        response.raise_for_status()
        result = response.json()
        
        if isinstance(result, list) and "generated_text" in result[0]:
            return result[0]["generated_text"].strip()
        return str(result)
    except Exception as e:
        print(f"IBM Granite unavailable ({e}), falling back to Groq...")
        # Fallback to Groq
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are BrandNova, an expert branding assistant. Provide helpful, strategic, and concise advice."},
                    {"role": "user", "content": request.message}
                ],
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            )
            return chat_completion.choices[0].message.content.strip()
        except Exception as e2:
            return f"I'm having trouble connecting to my brain right now. Error: {str(e)} | Fallback Error: {str(e2)}"

# --- Activity 2.10: Logo Prompt Generation ---
def generate_logo_prompts(request: LogoRequest) -> list[str]:
    STYLE_MAP = {
        "REAL WORLD CORPORATE":
        "professional corporate brand logo mockup, printed on textured paper, soft studio lighting, minimal depth shadow",

        "3D GLASSMORPHISM":
        "glass transparent 3D logo mockup, floating acrylic logo, cinematic reflections, blurred glass surface",

        "MINIMALIST ICONIC":
        "premium matte logo mockup, debossed on white card, clean luxury brand identity presentation",

        "ARCHITECTURE / TECH":
        "geometric tech brand logo mockup engraved on metallic plate, industrial lighting",

        "LUXURY / ELEGANT":
        "gold foil luxury logo mockup, embossed on black paper, cinematic lighting, premium texture",

        "MODERN VECTOR":
        "modern brand logo mockup printed on minimal stationery with soft shadow"
    }

    base_style = STYLE_MAP.get(request.style, STYLE_MAP["LUXURY / ELEGANT"])

    prompt = f"""
    {base_style}

    Brand Name: {request.brand_name}
    Industry: {request.industry}

    ultra realistic logo mockup
    logo engraved on business card
    soft studio lighting
    cinematic shadow
    paper texture
    embossed metallic finish
    centered composition
    professional branding mockup
    dribbble behance style
    8k quality
    """

    return [prompt for _ in range(5)]


# ══════════════════════════════════════════════════════════════════
# LOGO GENERATION ENGINE — Premium SVG Templates + Groq AI
# ══════════════════════════════════════════════════════════════════

# ── Premium SVG Templates ──────────────────────────────────────
# Each returns a handcrafted, professional SVG with dynamic brand name.

def _svg_iconic(name: str, c1: str, c2: str, ac: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{ac}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="{c1}" stop-opacity="0.4"/>
    </linearGradient>
    <filter id="sh"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/></filter>
  </defs>
  <rect width="512" height="512" rx="40" fill="#0a0a1a"/>
  <circle cx="256" cy="210" r="120" fill="url(#g1)" filter="url(#sh)"/>
  <polygon points="256,110 340,250 172,250" fill="url(#g2)" opacity="0.9"/>
  <circle cx="256" cy="210" r="45" fill="#0a0a1a" opacity="0.7"/>
  <circle cx="256" cy="210" r="28" fill="{ac}" opacity="0.5"/>
  <rect x="160" y="340" width="192" height="4" rx="2" fill="url(#g1)" opacity="0.6"/>
  <text x="256" y="395" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="52" font-weight="800" fill="white" text-anchor="middle" letter-spacing="6">{name.upper()}</text>
  <text x="256" y="440" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="14" fill="{ac}" text-anchor="middle" letter-spacing="10" opacity="0.6">BRAND IDENTITY</text>
</svg>'''

def _svg_typographic(name: str, c1: str, c2: str, ac: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="50%" stop-color="{c2}"/>
      <stop offset="100%" stop-color="{ac}"/>
    </linearGradient>
    <filter id="gl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="512" height="512" rx="40" fill="#0d1117"/>
  <rect x="56" y="56" width="400" height="400" rx="24" fill="none" stroke="{c1}" stroke-width="1" opacity="0.15"/>
  <rect x="72" y="72" width="368" height="368" rx="16" fill="none" stroke="{c2}" stroke-width="0.5" opacity="0.1"/>
  <text x="256" y="240" font-family="Georgia,'Times New Roman',serif" font-size="76" font-weight="700" fill="url(#tg)" text-anchor="middle" filter="url(#gl)">{name}</text>
  <rect x="110" y="265" width="292" height="3" rx="2" fill="url(#tg)"/>
  <text x="256" y="320" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="18" fill="#8b949e" text-anchor="middle" letter-spacing="14">STUDIO</text>
  <circle cx="96" cy="416" r="4" fill="{ac}" opacity="0.4"/>
  <circle cx="256" cy="416" r="4" fill="{c1}" opacity="0.4"/>
  <circle cx="416" cy="416" r="4" fill="{c2}" opacity="0.4"/>
</svg>'''

def _svg_monogram(name: str, c1: str, c2: str, ac: str) -> str:
    ini = name[0].upper() if name else "B"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <linearGradient id="mg2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{ac}"/>
      <stop offset="100%" stop-color="{c1}"/>
    </linearGradient>
    <filter id="ms"><feDropShadow dx="0" dy="6" stdDeviation="12" flood-opacity="0.25"/></filter>
  </defs>
  <rect width="512" height="512" rx="40" fill="#0f0f1e"/>
  <polygon points="256,76 400,146 400,286 256,356 112,286 112,146" fill="none" stroke="url(#mg)" stroke-width="3" filter="url(#ms)"/>
  <polygon points="256,106 374,162 374,270 256,326 138,270 138,162" fill="url(#mg)" opacity="0.12"/>
  <text x="256" y="252" font-family="Georgia,'Times New Roman',serif" font-size="130" font-weight="700" fill="url(#mg2)" text-anchor="middle">{ini}</text>
  <text x="256" y="418" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="38" font-weight="700" fill="white" text-anchor="middle" letter-spacing="8">{name.upper()}</text>
  <rect x="165" y="436" width="182" height="2" rx="1" fill="{ac}" opacity="0.35"/>
  <text x="256" y="468" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="12" fill="#555" text-anchor="middle" letter-spacing="6">EST. 2025</text>
</svg>'''

def _svg_abstract(name: str, c1: str, c2: str, ac: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="a1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <linearGradient id="a2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{ac}"/>
      <stop offset="100%" stop-color="{c1}"/>
    </linearGradient>
    <filter id="as"><feDropShadow dx="0" dy="3" stdDeviation="6" flood-opacity="0.2"/></filter>
  </defs>
  <rect width="512" height="512" rx="40" fill="#080c14"/>
  <circle cx="195" cy="195" r="95" fill="url(#a1)" opacity="0.8" filter="url(#as)"/>
  <circle cx="310" cy="195" r="95" fill="url(#a2)" opacity="0.6"/>
  <circle cx="252" cy="290" r="95" fill="{ac}" opacity="0.35"/>
  <rect x="176" y="176" width="160" height="160" rx="32" fill="none" stroke="white" stroke-width="2" opacity="0.15" transform="rotate(15 256 256)"/>
  <text x="256" y="425" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="46" font-weight="800" fill="white" text-anchor="middle" letter-spacing="5">{name.upper()}</text>
  <text x="256" y="465" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="13" fill="#555" text-anchor="middle" letter-spacing="10">CREATIVE</text>
</svg>'''

def _svg_luxury(name: str, c1: str, c2: str, ac: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37"/>
      <stop offset="50%" stop-color="#F5E6A3"/>
      <stop offset="100%" stop-color="#D4AF37"/>
    </linearGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <filter id="ls"><feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#D4AF37" flood-opacity="0.15"/></filter>
  </defs>
  <rect width="512" height="512" rx="40" fill="#0a0a0a"/>
  <circle cx="256" cy="225" r="145" fill="none" stroke="url(#lg)" stroke-width="2" filter="url(#ls)"/>
  <circle cx="256" cy="225" r="125" fill="none" stroke="url(#lg)" stroke-width="1" opacity="0.4"/>
  <circle cx="256" cy="225" r="105" fill="url(#bg)" opacity="0.15"/>
  <line x1="150" y1="225" x2="362" y2="225" stroke="url(#lg)" stroke-width="1" opacity="0.3"/>
  <text x="256" y="215" font-family="Georgia,'Times New Roman',serif" font-size="44" font-weight="700" fill="url(#lg)" text-anchor="middle">{name.upper()}</text>
  <text x="256" y="255" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="13" fill="#D4AF37" text-anchor="middle" letter-spacing="10" opacity="0.6">PREMIUM</text>
  <rect x="195" y="405" width="122" height="1" rx="1" fill="url(#lg)" opacity="0.4"/>
  <text x="256" y="435" font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="#555" text-anchor="middle" letter-spacing="5">ESTABLISHED 2025</text>
  <circle cx="150" cy="125" r="3" fill="#D4AF37" opacity="0.25"/>
  <circle cx="362" cy="125" r="3" fill="#D4AF37" opacity="0.25"/>
  <circle cx="150" cy="325" r="3" fill="#D4AF37" opacity="0.25"/>
  <circle cx="362" cy="325" r="3" fill="#D4AF37" opacity="0.25"/>
</svg>'''

# Color palettes — vibrant and modern
LOGO_PALETTES = [
    {"c1": "#6C63FF", "c2": "#3F3D9E", "ac": "#FF6584"},   # Tech / Modern
    {"c1": "#00B4D8", "c2": "#0077B6", "ac": "#90E0EF"},   # Ocean / Trust
    {"c1": "#E63946", "c2": "#1D3557", "ac": "#F1FAEE"},   # Bold / Corporate
    {"c1": "#2D6A4F", "c2": "#40916C", "ac": "#B7E4C7"},   # Nature / Eco
    {"c1": "#7209B7", "c2": "#3A0CA3", "ac": "#F72585"},   # Creative / Purple
    {"c1": "#FF6B35", "c2": "#F7931E", "ac": "#FFBA08"},   # Energy / Warm
    {"c1": "#D4AF37", "c2": "#B8860B", "ac": "#F5E6A3"},   # Luxury / Gold
]

TEMPLATE_FNS = [_svg_iconic, _svg_typographic, _svg_monogram, _svg_abstract, _svg_luxury]

def _build_premium_svg(brand_name: str, concept_id: int) -> str:
    """Builds a guaranteed-beautiful SVG using handcrafted templates."""
    fn = TEMPLATE_FNS[concept_id % len(TEMPLATE_FNS)]
    pal = LOGO_PALETTES[(concept_id + hash(brand_name)) % len(LOGO_PALETTES)]
    svg = fn(brand_name, pal["c1"], pal["c2"], pal["ac"])
    encoded = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{encoded}"

def generate_svg_logo(prompt: str, concept_id: int = 0) -> Optional[str]:
    """Generates a professional brand logo using premium handcrafted templates."""
    brand_name = prompt.split(' ')[0] if ' ' in prompt else prompt
    print(f"Building premium logo concept {concept_id+1} for: {brand_name}...")
    return _build_premium_svg(brand_name, concept_id)


def generate_logo_image(prompt: str, concept_id: int = 0) -> Optional[str]:
    """Primary Logo Generation Engine. Always returns a valid Base64 SVG."""
    return generate_svg_logo(prompt, concept_id)


def _get_ai_palettes(brand_name: str, industry: str, style: str) -> list:
    """Uses Groq to generate 5 unique color palettes tailored to the brand."""
    try:
        prompt = f"""Generate 5 unique color palettes for a brand logo.
Brand: {brand_name}
Industry: {industry}
Style: {style}

Each palette must have 3 hex colors: primary, secondary, accent.
Make each palette VERY different from the others.
Palette 1: Corporate/elegant
Palette 2: Modern/minimal
Palette 3: Luxury/premium
Palette 4: Creative/vibrant
Palette 5: Vintage/classic

Return ONLY a JSON array like:
[{{"c1":"#hex","c2":"#hex","ac":"#hex"}},{{"c1":"#hex","c2":"#hex","ac":"#hex"}},...] """

        chat = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=500,
            temperature=0.9
        )
        content = chat.choices[0].message.content.strip()
        result = extract_json(content)
        if isinstance(result, list) and len(result) >= 5:
            # Validate each palette has the required keys
            valid = []
            for p in result[:5]:
                if isinstance(p, dict) and "c1" in p and "c2" in p and "ac" in p:
                    valid.append(p)
            if len(valid) >= 5:
                return valid
    except Exception as e:
        print(f"AI palette generation failed: {e}")
    
    # Fallback: use random selection from built-in palettes
    import copy
    shuffled = copy.deepcopy(LOGO_PALETTES)
    random.shuffle(shuffled)
    return shuffled[:5]

def generate_multiple_logos(request: LogoRequest) -> list[dict]:
    """Generates 5 unique, beautiful logo designs with AI-picked colors."""
    brand_name = request.brand_name
    industry = getattr(request, 'industry', 'business')
    style = getattr(request, 'style', 'MODERN VECTOR')

    # Step 1: Get AI-customized color palettes for this specific brand
    palettes = _get_ai_palettes(brand_name, industry, style)
    
    style_names = ["Iconic Brandmark", "Typographic Wordmark", "Monogram Shield", "Abstract Creative", "Luxury Emblem"]
    results = []

    for i in range(5):
        try:
            fn = TEMPLATE_FNS[i % len(TEMPLATE_FNS)]
            pal = palettes[i] if i < len(palettes) else LOGO_PALETTES[i % len(LOGO_PALETTES)]
            
            svg = fn(brand_name, pal["c1"], pal["c2"], pal["ac"])
            encoded = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
            img_url = f"data:image/svg+xml;base64,{encoded}"
            
            results.append({
                "image_url": img_url,
                "prompt": f"{style_names[i]} logo for {brand_name} ({industry})",
                "concept_name": style_names[i],
                "concept_id": i
            })
        except Exception as e:
            print(f"Generation error in concept {i}: {e}")

    return results


# --- Startup Tools ---
def generate_pitch(request) -> str:
    prompt = f"""
    Create a compelling 1-minute elevator pitch for a startup.
    Product: {request.product_name}
    Problem: {request.problem}
    Solution: {request.solution}
    Target Audience: {request.audience}
    
    Format:
    1. Hook
    2. The Pain (Problem)
    3. The Gain (Solution)
    4. Traction/Ask
    """
    
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    )
    return chat_completion.choices[0].message.content.strip()

def generate_investor_email(request) -> str:
    prompt = f"""
    Write a cold email to an investor.
    Startup: {request.startup_name}
    Investor: {request.investor_name}
    Metrics: {request.key_metrics}
    Ask: {request.ask}
    
    Keep it short, punchy, and professional. Focus on FOMO.
    """
    
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    )
    return chat_completion.choices[0].message.content.strip()
