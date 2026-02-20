from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from utils.supabase_jwt import verifier
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify using Supabase JWKS
    payload = await verifier.verify_token(token)
    if payload is None:
        raise credentials_exception
        
    # Supabase user ID is in 'sub' claim
    supabase_id: str = payload.get("sub")
    email: str = payload.get("email")

    if not supabase_id:
        raise credentials_exception
        
    # Query by Supabase ID first (most robust)
    user = db.query(User).filter(User.supabase_id == supabase_id).first()
    
    if not user and email:
        # Fallback to email (useful during transition or if user was created manually)
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Sync the Supabase ID for future requests
            user.supabase_id = supabase_id
            db.commit()
            db.refresh(user)

    if user is None:
        # Auto-create user from Supabase identity
        # This handles Google OAuth users correctly when they first hit the dashboard
        user = User(
            email=email,
            supabase_id=supabase_id,
            fullname=payload.get("user_metadata", {}).get("full_name"),
            provider="supabase",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Ensure admin/subscription overrides are applied (e.g. for rahulbariki24@gmail.com)
    from utils.auth_utils import apply_admin_overrides
    apply_admin_overrides(user, db)
    
    # Attach to request context (state) as per requirements
    request.state.user = user
    request.state.role = user.role
    request.state.is_admin = user.is_admin
    
    return user

async def require_pro(user: User = Depends(get_current_user)):
    if user.subscription_plan not in ["pro", "enterprise", "admin"]: # Allow admins too
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Pro subscription required"
        )
    return user
