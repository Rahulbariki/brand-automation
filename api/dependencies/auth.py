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
    if user.is_admin:
        return user
    if user.subscription_plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Pro subscription required"
        )
    return user

async def require_enterprise(user: User = Depends(get_current_user)):
    if user.is_admin:
        return user
    if user.subscription_plan == "enterprise" and user.plan_source in ["stripe", "admin"]:
        return user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, 
        detail="Enterprise subscription required. Only available via Stripe or Admin grant."
    )

async def check_usage_limit(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import UsageLog, Team, TeamMember
    from datetime import datetime
    
    # Determine effective plan and owner
    effective_plan = user.subscription_plan
    owner_user = user
    
    membership = db.query(TeamMember).filter(TeamMember.user_id == user.id).first()
    if membership:
        team = db.query(Team).filter(Team.id == membership.team_id).first()
        if team and team.owner.subscription_plan == "enterprise":
            effective_plan = "enterprise"
            owner_user = team.owner
            
    if user.is_admin or effective_plan == "enterprise":
        # Log usage under owner simply without limit
        db.add(UsageLog(user_id=owner_user.id, api_used=str(request.url.path), tokens_used=0, request_count=1))
        db.commit()
        return user
        
    # Get current month start
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    # Count usage this month
    from sqlalchemy import func
    from config import FREE_TIER_LIMIT, PRO_TIER_LIMIT
    
    usage_sum = db.query(func.sum(UsageLog.request_count)).filter(
        UsageLog.user_id == owner_user.id,
        UsageLog.created_at >= month_start
    ).scalar() or 0
    
    limit = FREE_TIER_LIMIT if effective_plan == "free" else PRO_TIER_LIMIT
    
    if usage_sum >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Usage limit reached ({usage_sum}/{limit}). Upgrade to continue."
        )
    
    # Log usage
    db.add(UsageLog(
        user_id=owner_user.id,
        api_used=str(request.url.path),
        tokens_used=0,
        request_count=1
    ))
    db.commit()
    return user
