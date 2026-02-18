from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, GeneratedContent
from app.dependencies import get_current_user

router = APIRouter()

def admin_only(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

@router.get("/users")
def get_all_users(limit: int = 50, db: Session = Depends(get_db), admin: User = Depends(admin_only)):
    users = db.query(User).limit(limit).all()
    # Sanitize response
    return [
        {
            "id": u.id, 
            "email": u.email, 
            "fullname": u.fullname, 
            "role": "admin" if u.is_admin else "user", # Mapping boolean to string for frontend compat
            "is_active": u.is_active
        } 
        for u in users
    ]

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin: User = Depends(admin_only)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    pro_users = db.query(User).filter(User.subscription_plan == "pro").count()
    total_generations = db.query(GeneratedContent).count()
    
    # Simple Metrics
    mrr = pro_users * 19.99 # Assuming $19.99 Pro Plan
    conversion_rate = (pro_users / total_users * 100) if total_users > 0 else 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "pro_users": pro_users,
        "total_generations": total_generations,
        "mrr": round(mrr, 2),
        "conversion_rate": round(conversion_rate, 2)
    }

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, payload: dict, db: Session = Depends(get_db), admin: User = Depends(admin_only)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if "role" in payload:
        user.is_admin = (payload["role"] == "admin" or payload["role"] == "superadmin")
        user.role = payload["role"] # Update string role too if model has it
        
    if "is_active" in payload:
        user.is_active = payload["is_active"]
        
    db.commit()
    return {"message": "User updated"}
