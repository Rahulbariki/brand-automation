from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import User
from utils.hashing import hash_password, verify_password
from utils.jwt_handler import create_token
from dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Schemas (Simplified inline for now, can be moved to schemas.py)
class UserSignup(BaseModel):
    email: str
    password: str
    fullname: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/google-login")
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    from .google_auth import verify_google_token
    
    # Verify token with Supabase
    google_user = verify_google_token(request.token)
    email = google_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid Google User Data")

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create new user automatically
        new_user = User(
            email=email,
            fullname=google_user.get("user_metadata", {}).get("full_name"),
            provider="google",
            hashed_password=None,
            is_active=True  # Ensure user is active by default
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user

    # Generate JWT
    token = create_token({"sub": user.email, "email": user.email, "admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/signup")
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed = hash_password(user_data.password)
    new_user = User(
        email=user_data.email, 
        hashed_password=hashed,
        fullname=user_data.fullname
    )
    try:
        db.add(new_user)
        db.commit()
    except Exception as e:
        db.rollback()
        # Check for integrity error (duplicate email)
        if "unique constraint" in str(e).lower() or "integrityerror" in str(e).lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": "User created successfully"}

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_token({"sub": user.email, "email": user.email, "admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "fullname": current_user.fullname,
        "is_admin": current_user.is_admin,
        "subscription_plan": current_user.subscription_plan
    }
