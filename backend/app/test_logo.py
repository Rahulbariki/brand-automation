import os
import requests
from dotenv import load_dotenv

# Load env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

HF_HEADERS = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}

def test_generate_logo(prompt: str, filename: str = "test_logo.png"):
    SDXL_MODEL = "runwayml/stable-diffusion-v1-5"
    API_URL = f"https://api-inference.huggingface.co/models/{SDXL_MODEL}"
    
    payload = {"inputs": prompt}
    print(f"Sending request to {API_URL}...")
    try:
        response = requests.post(API_URL, headers=HF_HEADERS, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        response.raise_for_status()
        
        # Determine root directory (Brand Automation)
        # File is at backend/app/test_logo.py -> backend -> Brand Automation
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        output_dir = os.path.join(root_dir, "frontend", "assets", "generated_logos")
        os.makedirs(output_dir, exist_ok=True)
        
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "wb") as f:
            f.write(response.content)
            
        print(f"File saved successfully to: {filepath}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return False

if __name__ == "__main__":
    test_generate_logo("A futuristic minimalist logo for a tech brand called 'rahul'")
