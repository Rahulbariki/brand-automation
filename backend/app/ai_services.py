import requests
import os
import json
import speech_recognition as sr
from groq import Groq

# --- Activity 2.11: Voice Input Transcription ---
def transcribe_audio(audio_file_path: str) -> str:
    """Transcribes audio file to text using Google Speech Recognition."""
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_file_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return text
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError as e:
        return f"Could not request results; {e}"
    except Exception as e:
        return f"Error processing audio: {e}"
from dotenv import load_dotenv
from .schemas import (
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
IBM_MODEL = os.getenv("IBM_MODEL", "ibm-granite/granite-4.0-h-350m")
HF_API_URL = f"https://api-inference.huggingface.co/models/{IBM_MODEL}"
HF_HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

# --- Activity 2.5: Brand Name Generator ---
def generate_brand_names(request: BrandNameRequest) -> list[str]:
    """Generates creative brand names using Groq."""
    prompt = f"""
    You are a professional naming consultant. Generate 10 unique, {request.tone}, and brand-ready names for a {request.industry} business.
    Keywords: {', '.join(request.keywords)}
    Description: {request.description or 'N/A'}
    
    Return ONLY a JSON array of strings, e.g., ["Name1", "Name2"]. 
    Do not add any markdown formatting, numbering, or explanation.
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0.8,
        )
        content = chat_completion.choices[0].message.content.strip()
        # Cleanup
        if "```" in content:
            content = content.replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating names: {e}")
        return ["Error generating names", "Please try again"]

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
        if "```" in content:
            content = content.replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception:
        return {"sentiment": "Unknown", "confidence": 0.0, "tone_alignment": "Error"}

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
        if "```" in content:
            content = content.replace("```json", "").replace("```", "")
        return json.loads(content)
    except Exception:
        return ["#000000", "#FFFFFF", "#808080", "#C0C0C0", "#333333"]

# --- Activity 2.9: AI Chatbot (IBM Granite) ---
def chat_with_ai(request: ChatRequest) -> str:
    """Consults the IBM Granite model for branding advice."""
    prompt = f"""
    [System: You are BizForge, an expert branding assistant. Provide helpful, strategic, and concise advice.]
    [User: {request.message}]
    """
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 500, "return_full_text": False}
    }
    
    try:
        response = requests.post(HF_API_URL, headers=HF_HEADERS, json=payload, timeout=10)
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
def generate_logo_prompt(request: LogoRequest) -> str:
    """Generates a detailed prompt for SDXL."""
    prompt = f"""
    Create a highly detailed stable diffusion prompt for a logo.
    Brand Name: {request.brand_name}
    Industry: {request.industry}
    Style: {request.style}
    Keywords: {', '.join(request.keywords)}
    
    The prompt should describe visual elements, colors, mood, and lighting. 
    Return ONLY the prompt text.
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating logo prompt: {e}")
        return "A professional logo for " + request.brand_name

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
def generate_logo_image(prompt: str, filename: str = "logo.png") -> str:
    """Generates a logo image using SDXL via Hugging Face and saves it."""
    # Fallback to SD v1.5 if others are unavailable
    SDXL_MODEL = "runwayml/stable-diffusion-v1-5"
    API_URL = f"https://api-inference.huggingface.co/models/{SDXL_MODEL}"
    
    payload = {"inputs": prompt}
    try:
        response = requests.post(API_URL, headers=HF_HEADERS, json=payload, timeout=30)
        response.raise_for_status()
        image_bytes = response.content
        
        # Ensure directory exists
        output_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "assets", "generated_logos")
        os.makedirs(output_dir, exist_ok=True)
        
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)
            
        return filename
    except Exception as e:
        print(f"SDXL Generation Failed: {e}")
        return ""

# For verification script
def test_groq():
    return generate_tagline(TaglineRequest(brand_name="TestBrand", industry="Tech"))


