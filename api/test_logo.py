import requests
import urllib.parse

def test_pollinations():
    prompt = 'Professional brand logo, TechCorp. Masterpiece, isolated on pure white background, minimal vector art style'
    encoded_prompt = urllib.parse.quote(prompt)
    base_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&model=flux"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        response = requests.get(base_url, headers=headers, timeout=10)
        print(f"Pollinations Status: {response.status_code}")
        print(f"Pollinations Type: {response.headers.get('content-type', '')}")
        print(f"Pollinations Length: {len(response.content)}")
        if response.headers.get('content-type', '').startswith('image/'):
            print("Pollinations OK")
        else:
            print(f"Pollinations Error Content: {response.text[:100]}")
    except Exception as e:
        print(f"Pollinations Exception: {e}")

if __name__ == '__main__':
    test_pollinations()
