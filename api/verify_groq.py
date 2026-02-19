
import sys
import os
import json

# Ensure the backend directory is in the python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', '.env'))

from backend.ai_services import (
    generate_brand_names, generate_marketing_content, analyze_sentiment,
    get_color_palette, chat_with_ai, generate_logo_prompt, generate_logo_image
)
from backend.models import (
    BrandNameRequest, MarketingContentRequest, SentimentRequest,
    ColorPaletteRequest, ChatRequest, LogoRequest
)

def run_tests():
    print("--- Testing BizForge AI Services ---\n")

    # 1. Brand Names
    print("[1] Testing Brand Name Generator...")
    try:
        req = BrandNameRequest(industry="Tech", keywords=["AI", "Fast", "Future"], tone="innovative")
        names = generate_brand_names(req)
        print(f"Result: {names}\n")
    except Exception as e:
        print(f"FAILED: {e}\n")

    # 2. Marketing Content
    print("[2] Testing Marketing Content Generator...")
    try:
        req = MarketingContentRequest(brand_name="NexGen AI", description="AI automation tool", tone="professional", content_type="social media caption")
        content = generate_marketing_content(req)
        print(f"Result: {content[:100]}...\n")
    except Exception as e:
        print(f"FAILED: {e}\n")

    # 3. Sentiment Analysis
    print("[3] Testing Sentiment Analysis...")
    try:
        req = SentimentRequest(text="I love using this product, it saves me so much time!", brand_tone="excited")
        sentiment = analyze_sentiment(req)
        print(f"Result: {sentiment}\n")
    except Exception as e:
        print(f"FAILED: {e}\n")

    # 4. Color Palette
    print("[4] Testing Color Palette...")
    try:
        req = ColorPaletteRequest(industry="Finance", tone="trustworthy")
        palette = get_color_palette(req)
        print(f"Result: {palette}\n")
    except Exception as e:
        print(f"FAILED: {e}\n")

    # 5. Chatbot (IBM Granite)
    print("[5] Testing Chatbot (IBM Granite)...")
    try:
        req = ChatRequest(message="What is a good strategy for a coffee shop?")
        response = chat_with_ai(req)
        print(f"Result: {response[:100]}...\n")
    except Exception as e:
        print(f"FAILED: {e}\n")

    # 6. Logo Prompt & Image
    print("[6] Testing Logo Generation...")
    try:
        req = LogoRequest(brand_name="Bean & Brew", industry="Coffee", keywords=["warm", "rustic"], style="vintage")
        prompt = generate_logo_prompt(req)
        print(f"Generated Prompt: {prompt[:100]}...")
        
        print("Generating Image (this may take a moment)...")
        # Use a simple prompt for testing to avoid complexity issues if any
        image_filename = generate_logo_image("minimalist coffee bean logo, vector art", "test_logo.png")
        if image_filename:
             print(f"SUCCESS: Image saved to {image_filename}\n")
        else:
             print("FAILED: Image generation returned empty filename.\n")
            
    except Exception as e:
        print(f"FAILED: {e}\n")

if __name__ == "__main__":
    run_tests()
