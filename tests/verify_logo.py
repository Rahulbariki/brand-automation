import requests
import os
import sys

# Add backend to path to import models if needed, but we'll try to hit the API directly if running
# Usage: python verify_logo.py

BASE_URL = "http://localhost:8000"

def test_logo_generation():
    print("Testing Logo Generation...")
    payload = {
        "brand_name": "TestCorp",
        "industry": "Technology",
        "style": "Minimalist",
        "keywords": ["tech", "future", "clean"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/generate-logo", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {data}")
        
        if "image_url" in data and data["image_url"]:
            print(f"SUCCESS: Image URL received: {data['image_url']}")
            
            # Verify the image is accessible
            img_url = f"{BASE_URL}{data['image_url']}"
            print(f"Verifying access to: {img_url}")
            img_response = requests.get(img_url)
            
            if img_response.status_code == 200:
                print("SUCCESS: Image is accessible!")
                return True
            else:
                print(f"FAILURE: Could not access image. Status: {img_response.status_code}")
                return False
        else:
            print("FAILURE: No image_url in response.")
            return False
            
    except requests.exceptions.ConnectionError:
        print("FAILURE: Could not connect to backend. Is it running?")
        return False
    except Exception as e:
        print(f"FAILURE: Error during request: {e}")
        return False

if __name__ == "__main__":
    success = test_logo_generation()
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
