from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .config import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user_token(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        # Fallback to Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    return token

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    # Public access: Return a static mock user or None
    return User(
        id=1,
        email="guest@example.com",
        fullname="Guest User",
        role="user",
        subscription_plan="free"
    )

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    return current_user
