from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from utils.jwt_handler import verify_token
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("email") or payload.get("sub") # Handle both cases
    if email is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def require_pro(user: User = Depends(get_current_user)):
    if user.subscription_plan not in ["pro", "enterprise", "admin"]: # Allow admins too
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Pro subscription required"
        )
    return user
