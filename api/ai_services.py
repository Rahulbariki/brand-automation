import requests
import os
import json
# import speech_recognition as sr # Removed to save space on Vercel
from groq import Groq

# --- Activity 2.11: Voice Input Transcription ---
def transcribe_audio(audio_file_path: str) -> str:
    """Transcribes audio file to text using Google Speech Recognition."""
    # Disabled for Vercel Serverless optimization (omitting large libraries)
    return "Voice transcription is currently disabled in this lightweight deployment."
from dotenv import load_dotenv
from schemas import (
    BrandNameRequest, TaglineRequest, StrategyRequest,
    MarketingContentRequest, SentimentRequest, ColorPaletteRequest,
    ChatRequest, LogoRequest
)

# Load environment variables
# Load environment variables
load_dotenv()

# --- Clients ---
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    # Fallback or warning - though for now we assume it exists if .env is loaded
    print("Warning: GROQ_API_KEY not found in environment.")

groq_client = Groq(api_key=api_key)

# IBM Granite (Hugging Face)
HF_API_KEY = os.getenv("HF_API_KEY")
# Using a more reliable endpoint for Granite
IBM_MODEL = os.getenv("IBM_MODEL", "ibm-granite/granite-3.0-8b-instruct") 
HF_API_URL = f"https://api-inference.huggingface.co/models/{IBM_MODEL}"
HF_HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

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

# --- Legacy Helper ---
def generate_tagline(request: TaglineRequest) -> str:
    # Re-using the content generator logic or simple prompt
    prompt = f"Create a catchy tagline for {request.brand_name} ({request.industry}). Return only the tagline."
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    )
    return chat_completion.choices[0].message.content.strip().replace('"', '')

# --- Activity 2.10 (Part 2): Logo Image Generation ---
# --- Activity 2.10 (Part 2): Logo Image Generation ---
def generate_logo_image(prompt: str) -> str:
    import urllib.parse
    import random
    import time
    from pathlib import Path
    import requests
    import os

    enhanced_mockup_prompt = f"""
Professional luxury brand logo mockup for {prompt}

3D embossed metallic logo
gold foil or matte black finish
realistic paper texture
soft studio lighting
cinematic shadow
premium typography
logo engraved on business card
logo printed on textured paper
brand identity mockup
ultra realistic render
center composition
8k quality
dribbble behance style
"""
    
    negative_prompt = """
cartoon
icon
favicon
flat vector
circle logo
abstract blob
emoji
clipart
watermark
low quality
"""

    # 1. Hugging Face (Primary attempt if token is available)
    hf_token = os.getenv("HF_API_KEY")
    if hf_token:
        try:
            print(f"Generating image with Hugging Face (SDXL Refiner) for {prompt}...")
            # Using the refiner model as requested for superior photo quality
            API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-refiner-1.0"
            headers = {"Authorization": f"Bearer {hf_token}"}
            
            payload = {
                "inputs": enhanced_mockup_prompt,
                "parameters": {"negative_prompt": negative_prompt}
            }
            response = requests.post(API_URL, headers=headers, json=payload, timeout=20)
            
            if response.status_code == 200:
                import base64
                print("HF Generated Successfully. Encoding to base64 for safe Vercel transmission...")
                encoded = base64.b64encode(response.content).decode('utf-8')
                return f"data:image/png;base64,{encoded}"
            else:
                print(f"HF Generation failed with status {response.status_code}. Fallthrough to backup...")
        except Exception as e:
            print(f"HF Generation exception: {e}. Fallthrough to backup...")

    # 2. Pollinations.ai (Backup - Currently Highly Reliable for Frontend Loading)
    try:
        print("Generating with Pollinations + Saving Locally...")

        seed = random.randint(1, 100000)
        encoded_prompt = urllib.parse.quote(enhanced_mockup_prompt.strip().replace('\n', ' '))

        poll_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={seed}&nologo=true"

        response = requests.get(poll_url, timeout=60)

        if response.status_code != 200:
            raise Exception("Pollinations download failed")

        # 🔥 SAVE LOCALLY
        output_dir = Path(__file__).resolve().parent.parent / "frontend" / "assets" / "generated"
        output_dir.mkdir(parents=True, exist_ok=True)

        filename = f"logo_{int(time.time())}.png"
        filepath = output_dir / filename

        with open(filepath, "wb") as f:
            f.write(response.content)

        print("Saved:", filepath)

        # RETURN LOCAL SERVED PATH
        return f"/assets/generated/{filename}"
    except Exception as e:
        print(f"Image generation failed: {e}")
        return None

def generate_multiple_logos(request: LogoRequest) -> list[dict]:
    """Generates 5 distinct logo designs in parallel."""
    import concurrent.futures
    import time
    
    prompts = generate_logo_prompts(request)
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Submit all generation tasks
        # Apply a tiny delay to stagger API requests to free endpoints
        futures = []
        for i, prompt in enumerate(prompts):
            time.sleep(i * 0.5)
            futures.append(executor.submit(generate_logo_image, prompt))
            
        future_to_prompt = {futures[i]: prompts[i] for i in range(len(prompts))}
        
        for future in concurrent.futures.as_completed(future_to_prompt):
            prompt = future_to_prompt[future]
            try:
                img_url = future.result()
                results.append({"prompt": prompt, "image_url": img_url})
            except Exception as e:
                print(f"Error in parallel logo generation: {e}")
                
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


