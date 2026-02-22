from fastapi import APIRouter, Depends, HTTPException, status, Request
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

from utils.auth_utils import apply_admin_overrides

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

    # Apply Overrides
    apply_admin_overrides(user, db)

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
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        # Check for integrity error (duplicate email)
        if "unique constraint" in str(e).lower() or "integrityerror" in str(e).lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=500, detail=str(e))
    
    # Apply any admin overrides
    apply_admin_overrides(new_user, db)
    
    # Generate JWT token so the frontend can redirect to dashboard immediately
    token = create_token({"sub": new_user.email, "email": new_user.email, "admin": new_user.is_admin})
    return {"access_token": token, "token_type": "bearer"}

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

    # Apply Overrides
    apply_admin_overrides(user, db)

    token = create_token({"sub": user.email, "email": user.email, "admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import UsageLog, Team, TeamMember
    from sqlalchemy import func
    from datetime import datetime
    from config import FREE_TIER_LIMIT, PRO_TIER_LIMIT
    
    # Define effective plan (if they belong to an enterprise team)
    effective_plan = current_user.subscription_plan
    owner_user = current_user
    
    membership = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if membership:
        team = db.query(Team).filter(Team.id == membership.team_id).first()
        if team and team.owner.subscription_plan == "enterprise":
            effective_plan = "enterprise"
            owner_user = team.owner

    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    usage_sum = db.query(func.sum(UsageLog.request_count)).filter(
        UsageLog.user_id == owner_user.id,
        UsageLog.created_at >= month_start
    ).scalar() or 0
    
    limit = FREE_TIER_LIMIT if effective_plan == "free" else PRO_TIER_LIMIT
    if effective_plan == "enterprise" or current_user.is_admin:
        limit = "Unlimited"

    return {
        "id": current_user.id,
        "email": current_user.email,
        "fullname": current_user.fullname,
        "is_admin": current_user.is_admin,
        "subscription_plan": current_user.subscription_plan,
        "effective_plan": effective_plan,
        "usage": {
            "used": usage_sum,
            "limit": limit
        }
    }

@router.get("/session-check")
async def session_check(request: Request, db: Session = Depends(get_db)):
    """
    Verifies Supabase JWT and returns explicit Valid/Invalid status.
    Does not rely on cookies.
    """
    from utils.supabase_jwt import verifier
    from fastapi.security import OAuth2PasswordBearer
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"status": "Invalid", "reason": "Missing token"}

    token = auth_header.split(" ")[1]
    payload = await verifier.verify_token(token)
    
    if payload:
        return {"status": "Valid", "user_id": payload.get("sub")}
    else:
        return {"status": "Invalid", "reason": "Expired or invalid token"}

class CouponRequest(BaseModel):
    coupon_code: str

@router.post("/apply-coupon")
def apply_coupon(request: CouponRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if request.coupon_code != "RAHUL2005":
        raise HTTPException(status_code=400, detail="Invalid coupon code")
        
    current_user.subscription_plan = "pro"
    current_user.subscription_status = "active"
    current_user.plan_source = "coupon"
    db.commit()
    
    return {"message": "Coupon applied successfully! You are now a Pro user.", "plan": "pro"}
