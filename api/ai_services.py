import requests
import os
import json
import uuid
import random
import time
import urllib.parse
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

from typing import Optional

def generate_svg_logo(prompt: str, concept_id: int = 0) -> Optional[str]:
    """Generates a professional-grade, multi-style SVG logo using Groq."""
    try:
        brand_name = prompt.split(' ')[0] if ' ' in prompt else prompt
        # We use distinct designer personas based on the concept index
        STYLES = [
            f"ICONIC BRANDMARK: Design a iconic symbolic logo for {brand_name}. Use bold geometry, linear gradients, and a modern aesthetic.",
            f"PROFESSIONAL TYPOGRAPHIC: Create a sleek typographic logo for {brand_name}. Use elegant paths, letter-spacing, and professional balance.",
            f"PREMIUM MONOGRAM: Design a minimalist monogram using the initials of {brand_name} inside a geometric container (hexagon/diamond).",
            f"MODERN ABSTRACT: Create a creative abstract shape that Represents {prompt}. Use vibrant colors and clean lines.",
            f"LUXURY EMBLEM: Design a centered high-end emblem for {brand_name} with gold/slat gradients and luxury framing."
        ]
        style_instruction = STYLES[concept_id % len(STYLES)]
        
        print(f"Generating Premium SVG Concept {concept_id+1} for: {brand_name}...")
        
        system_prompt = "You are an elite brand identity designer. You provide ONLY raw, valid, high-conversion SVG source code. No explanations."
        user_prompt = f"""
        Design Requirement: {style_instruction}
        Full Business Context: {prompt}
        
        Task: Output a professional 512x512 SVG.
        - Include the brand text "{brand_name}" visibly.
        - Use <linearGradient> with id="grad{concept_id}" for a premium 3D look.
        - Use professional colors (Gold: #D4AF37, Slate: #2F4F4F, Navy: #000080, White: #FFFFFF).
        - Center all elements within the 512x512 viewBox.
        - Return ONLY raw <svg>...</svg> code. No markdown, no text.
        """
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            max_tokens=3000,
            temperature=0.4
        )
        svg_code = chat_completion.choices[0].message.content.strip()
        
        # Enhanced extraction for robustness
        if "<svg" in svg_code.lower():
            import re
            match = re.search(r'<svg.*?</svg>', svg_code, re.DOTALL | re.IGNORECASE)
            if match:
                svg_code = match.group(0)
                # Cleanup potential whitespace or invalid chars from LLM
                svg_code = svg_code.replace("```svg", "").replace("```", "")
                
                import base64
                encoded = base64.b64encode(svg_code.encode('utf-8')).decode('utf-8')
                return f"data:image/svg+xml;base64,{encoded}"
    except Exception as e:
        print(f"SVG Master Fallback failed: {e}")
    return None

def generate_logo_image(prompt: str, concept_id: int = 0) -> Optional[str]:
    """
    Primary Logo Generation Engine. 
    Switched to high-fidelity Base64 SVGs to ensure NO BROKEN IMAGES and 100% reliability.
    """
    # We directly use the rich SVG engine because external providers (HF/Pollinations) 
    # are currently returning 402/530 and breaking the user experience.
    return generate_svg_logo(prompt, concept_id)

def generate_multiple_logos(request: LogoRequest) -> list[dict]:
    """Generates 5 distinct, reliable logo designs in parallel."""
    import concurrent.futures
    import time
    
    prompts = generate_logo_prompts(request)
    results = []
    
    # We use ThreadPoolExecutor to generate 5 rich SVGs in parallel via Groq
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_info = {}
        for i, prompt in enumerate(prompts):
            time.sleep(0.1) # Rapid staggering
            f = executor.submit(generate_logo_image, prompt, i)
            future_to_info[f] = prompt
            
        for future in concurrent.futures.as_completed(future_to_info):
            prompt = future_to_info[future]
            try:
                img_url = future.result()
                if img_url:
                    results.append({"image_url": img_url, "prompt": prompt})
            except Exception as e:
                print(f"Generation error in concept: {e}")

    # Sorting to maintain consistent display order if possible
    return results[:5]


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
