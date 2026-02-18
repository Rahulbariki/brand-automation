from fastapi import HTTPException
import requests
from app.config import SUPABASE_URL, SUPABASE_KEY

def verify_google_token(token: str):
    """
    Verifies a Supabase-issued Google OAuth token by querying Supabase Auth API.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")

    response = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": SUPABASE_KEY
        }
    )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    return response.json()
