import requests
import sys

API_URL = "http://127.0.0.1:8000/api/auth/google-login"

def test_mock_login():
    try:
        payload = {"token": "mock_token"}
        print(f"Sending POST to {API_URL} with payload: {payload}")
        response = requests.post(API_URL, json=payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Mock login worked!")
        else:
            print("FAILURE: Mock login returned error.")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_mock_login()
