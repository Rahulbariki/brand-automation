from jose import jwt, JWTError
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "super_secret_key_change_me"))
ALGORITHM = "HS256"

# NOTE: This handler is for legacy HS256 tokens. 
# For Supabase JWKS (RS256), use utils.supabase_jwt instead.

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=12)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    """
    Legacy local HS256 verification.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
