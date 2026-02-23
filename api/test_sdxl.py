import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv('../.env')

def test_sdxl():
    SDXL_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
    SDXL_URL = f"https://api-inference.huggingface.co/models/{SDXL_MODEL}"
    
    payload = {
        "inputs": "Professional global brand logo, TechCorp. Masterpiece, isolated on pure white background, minimal, clean edges, award winning logo design, vector art style",
        "parameters": {
            "num_inference_steps": 25,
            "guidance_scale": 9.0,
            "width": 1024,
            "height": 1024
        }
    }
    
    headers = {
        'Authorization': f'Bearer {os.environ.get("HF_API_KEY")}'
    }
    
    max_retries = 3
    for i in range(max_retries):
        try:
            print(f"Attempt {i+1}...")
            response = requests.post(SDXL_URL, headers=headers, json=payload, timeout=60)
            print(f"Status: {response.status_code}")
            content_type = response.headers.get('content-type', '')
            print(f"Type: {content_type}")
            
            if response.status_code == 503:
                err = response.json()
                print(f"Loading... Wait {err.get('estimated_time', 10)}s")
                time.sleep(err.get('estimated_time', 10))
                continue
                
            response.raise_for_status()
            
            if content_type.startswith('image/'):
                print(f"Success! Image size: {len(response.content)} bytes")
                return True
            else:
                print(f"Returned non image text: {response.text}")
                return False
        except Exception as e:
            print(f"Exception: {e}")
            time.sleep(3)
            
    print("All attempts failed.")
    return False

if __name__ == '__main__':
    test_sdxl()
