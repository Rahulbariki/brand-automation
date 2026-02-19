from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, UsageLog
from schemas import UserOut, UserAdminUpdate
from dependencies import get_current_admin_user

router = APIRouter()

# --- User Management ---

@router.get("/users", response_model=List[UserOut])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).offset(skip).limit(limit).all()
    # Pydantic will handle User -> UserOut conversion including computed fields if any
    return users

@router.get("/users/{user_id}", response_model=UserOut)
async def read_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int, 
    update_data: UserAdminUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin_user)
):
    # Prevent self-demotion
    if user_id == current_user.id and update_data.role != "admin":
        # Check if they are the last admin? (Implementation detail for later)
        pass

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update_data.role:
        user.role = update_data.role
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    
    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user": {"id": user.id, "role": user.role, "is_active": user.is_active}}

# --- Analytics / Usage ---

@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin_user)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_usage_logs = db.query(UsageLog).count()
    
    # Simple aggregation (could be optimized with raw SQL or func.sum)
    # total_tokens = db.query(func.sum(UsageLog.tokens_used)).scalar() or 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_generations": total_usage_logs
    }

@router.get("/usage/recent")
async def get_recent_usage(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    logs = db.query(UsageLog).order_by(UsageLog.created_at.desc()).limit(limit).all()
    return logs 
