import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv('../.env')

def test_hf_models():
    models = [
        "black-forest-labs/FLUX.1-schnell",
        "stabilityai/stable-diffusion-3.5-large",
        "Kwai-Kolors/Kolors",
        "playgroundai/playground-v2.5-1024px-aesthetic",
        "stabilityai/sdxl-turbo"
    ]
    
    payload = {
        "inputs": "Professional global brand logo, TechCorp. Masterpiece, isolated on pure white background, minimal, clean edges, award winning logo design, vector art style"
    }
    
    headers = {
        'Authorization': f'Bearer {os.environ.get("HF_API_KEY")}'
    }
    
    for model in models:
        url = f"https://api-inference.huggingface.co/models/{model}"
        print(f"\nTesting {model}...")
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"Status: {res.status_code}")
            print(f"Type: {res.headers.get('content-type', '')}")
            if res.status_code == 200 and res.headers.get('content-type', '').startswith('image/'):
                print(f"Success! {len(res.content)} bytes")
            else:
                print(f"Error logic returned: {res.text[:100]}")
        except Exception as e:
            print(f"Failed with exception: {e}")

if __name__ == '__main__':
    test_hf_models()
