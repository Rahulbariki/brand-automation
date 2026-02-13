import requests
import json

def test_api():
    url = "http://localhost:8000/api/generate-brand"
    headers = {"Content-Type": "application/json"}
    payload = {
        "industry": "Tech",
        "keywords": ["ai", "future"],
        "tone": "Modern",
        "description": "An AI startup"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:", response.json())
        except:
            print("Response Text:", response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()
