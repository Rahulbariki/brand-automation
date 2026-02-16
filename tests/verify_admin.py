import requests
import sys

BASE_URL = "http://localhost:8000"

def test_admin_access():
    print("Testing Admin Access Control...")
    
    # 1. Test as Guest (Should Fail)
    print("\n1. Testing Public Access to Admin API (Guest Mode)...")
    try:
        # endpoint: /api/admin/stats
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 403:
            print("SUCCESS: Guest access denied (403 Forbidden).")
        else:
            print(f"FAILURE: Guest access not denied properly. Got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"FAILURE: Request failed: {e}")
        return False

    return True

if __name__ == "__main__":
    success = test_admin_access()
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
