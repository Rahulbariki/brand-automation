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
    [System: You are BizForge, an expert branding assistant. Provide helpful, strategic, and concise advice.]
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
                    {"role": "system", "content": "You are BizForge, an expert branding assistant. Provide helpful, strategic, and concise advice."},
                    {"role": "user", "content": request.message}
                ],
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            )
            return chat_completion.choices[0].message.content.strip()
        except Exception as e2:
            return f"I'm having trouble connecting to my brain right now. Error: {str(e)} | Fallback Error: {str(e2)}"

# --- Activity 2.10: Logo Prompt Generation ---
def generate_logo_prompts(request: LogoRequest) -> list[str]:
    """Generates 5 distinct, sophisticated, agency-grade logo prompts."""
    prompt = f"""
    You are a world-class senior brand identity designer. Create 5 MASTERPIECE logo generation prompts for:
    Brand Name: {request.brand_name}
    Industry: {request.industry}
    Requested Global Style: {request.style}
    Core Keywords: {', '.join(request.keywords)}
    
    Guidelines for the engine:
    - Avoid anything that looks like a "child's drawing", "doodle", or "amateur sketch".
    - Enforce "Golden Ratio", "symmetrical", "mathematical precision", and "high-end corporate identity".
    - Use sophisticated lighting: "volumetric lighting", "soft studio shadows", "rim lighting".
    - For {request.brand_name}, the logo should feel "expensive", "authoritative", and "stunning".
    
    Each prompt should represent a unique, world-class direction:
    1. A "Real World" Corporate Identity: High-fidelity, symmetrical, precisely balanced, suitable for global tech or finance giants.
    2. A Sophisticated 3D Glassmorphism: Clear transparency, frosted textures, depth-map shadows, photorealistic unreal engine 5 render.
    3. A Premium Matte/Metallic Physical Mark: Embossed or debossed feel, realistic material texture (brushed aluminum or matte soft-touch), studio rim lighting.
    4. A Modern Architectural Vector: Focus on geometric perfection, negative space mastery, timeless aesthetic.
    5. A Luxury Physical Emblem: Professional crest with high-detail fine lines, suitable for premium hardware or high-end fashion.
    
    The prompts MUST include:
    "Professional high-end [style] logo for [brand name], [Industry]. [Core elements]. Cinematic global illumination, 8k resolution, photorealistic material rendering, 3D depth, sharp focus, symmetrical composition, isolated on centered white background, award-winning studio quality, raytraced shadows."
    
    Return ONLY a JSON list of 5 strings.
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        data = json.loads(chat_completion.choices[0].message.content)
        if isinstance(data, list): return data[:5]
        if isinstance(data, dict):
            for val in data.values():
                if isinstance(val, list): return val[:5]
        return [f"Hyper-realistic professional {request.style} logo for {request.brand_name}, agency quality" for _ in range(5)]
    except Exception as e:
        print(f"Error generating logo prompts: {e}")
        return [f"A hyper-realistic {request.style} professional logo for {request.brand_name}, {request.industry}, 8k, sharp edges, white background" for _ in range(5)]

# --- Legacy Helper ---
def generate_tagline(request: TaglineRequest) -> str:
    # Re-using the content generator logic or simple prompt
    prompt = f"Create a catchy tagline for {request.brand_name} ({request.industry}). Return only the tagline."
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    )
    return chat_completion.choices[0].message.content.strip().replace('"', '')

# --- Activity 2.10 (Part 2): Logo Image Generation (SDXL) ---
def generate_logo_image(prompt: str) -> str:
    """Generates a high-fidelity logo image using SDXL."""
    import base64
    import time
    
    # Using a specialized logo-tuning or keeping SDXL with better params
    SDXL_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
    SDXL_URL = f"https://api-inference.huggingface.co/models/{SDXL_MODEL}"
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "negative_prompt": "child drawing, crayon, doodle, messy, sketch, amateur, low quality, blurry, text, font, letters, numbers, hand drawn, watermark, signature, ugly, distorted, anatomy, paper, frame",
            "num_inference_steps": 45,
            "guidance_scale": 9.0,
            "width": 1024,
            "height": 1024
        }
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(SDXL_URL, headers=HF_HEADERS, json=payload, timeout=60)
            
            if response.status_code == 503:
                time.sleep(20)
                continue
                
            response.raise_for_status()
            image_bytes = response.content
            encoded = base64.b64encode(image_bytes).decode('utf-8')
            return f"data:image/png;base64,{encoded}"
            
        except Exception as e:
            print(f"SDXL Generation Failed (Attempt {attempt+1}): {e}")
            if attempt == max_retries - 1:
                return _fallback_svg_logo(prompt)
            time.sleep(3)
    
    return _fallback_svg_logo(prompt)

def generate_multiple_logos(request: LogoRequest) -> list[dict]:
    """Generates 5 distinct logo designs in parallel."""
    import concurrent.futures
    
    prompts = generate_logo_prompts(request)
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Submit all generation tasks
        future_to_prompt = {executor.submit(generate_logo_image, prompt): prompt for prompt in prompts}
        
        for future in concurrent.futures.as_completed(future_to_prompt):
            prompt = future_to_prompt[future]
            try:
                img_url = future.result()
                results.append({"prompt": prompt, "image_url": img_url})
            except Exception as e:
                print(f"Error in parallel logo generation: {e}")
                
    return results

def _fallback_svg_logo(prompt: str) -> str:
    """Fallback generator that creates a clean SVG if SDXL fails."""
    import base64
    svg_prompt = f"""
You are an elite SaaS brand logo designer.

Generate a modern, clean, professional startup-style logo for:
{prompt}

STRICT RULES:

Return ONLY valid raw SVG code.
Do NOT include markdown.
Do NOT include explanations.
Do NOT include comments.

SVG MUST:

• Use only <svg>, <g>, <path>, <rect>, <circle>, <polygon>, <text>
• Use flat modern SaaS style (Stripe / Linear / Notion inspired)
• Be centered inside a 512x512 viewBox
• Use max 2 primary colors
• Background must be transparent
• No gradients
• No shadows
• No blur
• No filters
• No raster images
• No embedded fonts
• No CSS
• No external references
• No style tags
• No metadata
• No script tags

Logo must be:

• Minimal
• Geometric
• Symmetrical
• Startup-friendly
• Scalable for mobile & favicon
• Suitable for dashboard UI

Typography (if used):

• Use basic system sans-serif
• Use <text> only
• No custom fonts

Stroke rules:

• Stroke width between 4–8
• Rounded joins and caps
• Consistent spacing

Output MUST start with:

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">

And end with:

</svg>
"""
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": svg_prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        )
        svg_content = chat_completion.choices[0].message.content.strip()
        # Clean up SVG
        if "```" in svg_content:
            svg_content = svg_content.split("```")[1].replace("svg", "", 1).strip()
        encoded = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
        return f"data:image/svg+xml;base64,{encoded}"
    except:
        return "https://via.placeholder.com/500?text=Logo+Generation+Error"

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


