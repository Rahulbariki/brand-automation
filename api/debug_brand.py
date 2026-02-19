import sys
import os

# Ensure backend path is added
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.ai_services import generate_brand_names, groq_client
from backend.models import BrandNameRequest

def debug_brand():
    print("Testing Brand Name Generator...")
    req = BrandNameRequest(industry="Coffee", keywords=["smart", "ai"], tone="Luxury", description="A high-end smart coffee shop")
    
    # Manually calling the logic to inspect raw response if function fails too early
    # But first let's try the function which now has traceback logging
    try:
        names = generate_brand_names(req)
        print("Result:", names)
    except Exception as e:
        print("Detailed Error:", e)

if __name__ == "__main__":
    debug_brand()
