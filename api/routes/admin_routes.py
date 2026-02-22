from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import User, GeneratedContent, UsageLog
from dependencies import admin_required, require_enterprise

router = APIRouter()

# Schema for partial updates
from pydantic import BaseModel
from typing import Optional

class UserUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None

class PlanUpdate(BaseModel):
    subscription_plan: str

@router.put("/users/{user_id}/set-plan")
def set_user_plan(user_id: int, payload: PlanUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_plan = payload.subscription_plan
    if new_plan not in ["free", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
        
    if user.subscription_plan == "enterprise" and new_plan != "enterprise":
        if user.plan_source == "stripe":
            raise HTTPException(status_code=400, detail="Cannot revoke Stripe Enterprise users")
            
    user.subscription_plan = new_plan
    
    if new_plan == "enterprise":
        user.subscription_status = "active"
        user.plan_source = "admin"
    elif new_plan == "free":
        user.subscription_status = "inactive"
        if user.plan_source == "admin":
            user.plan_source = "default"
    else:
        user.subscription_status = "active"
        
    db.commit()
    return {"message": "Plan updated", "subscription_plan": user.subscription_plan, "plan_source": user.plan_source}

@router.get("/users")
def get_all_users(limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    users = db.query(User).order_by(User.id).limit(limit).all()
    # Return standardized list
    return [
        {
            "id": u.id, 
            "email": u.email, 
            "fullname": u.fullname, 
            "is_admin": u.is_admin,
            "role": u.role,
            "is_active": u.is_active,
            "subscription_plan": u.subscription_plan
        } 
        for u in users
    ]

@router.put("/users/{user_id}/toggle-admin")
def toggle_admin(user_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle
    user.is_admin = not user.is_admin
    # Sync role string
    user.role = "admin" if user.is_admin else "user"
    
    db.commit()
    return {"message": "Admin status updated", "is_admin": user.is_admin}

@router.put("/users/{user_id}/toggle-active")
def toggle_active(user_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle
    user.is_active = not user.is_active
    db.commit()
    return {"message": "Active status updated", "is_active": user.is_active}

@router.get("/usage")
def get_usage_logs(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(require_enterprise)):
    logs = db.query(UsageLog).order_by(UsageLog.created_at.desc()).limit(limit).all()
    return logs

@router.get("/generated")
def get_generated_content(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(require_enterprise)):
    content = db.query(GeneratedContent).order_by(GeneratedContent.created_at.desc()).limit(limit).all()
    return content

@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(require_enterprise)):
    try:
        # Aggregations
        total_users = db.query(func.count(User.id)).scalar()
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
        total_tokens = db.query(func.sum(UsageLog.tokens_used)).scalar() or 0
        total_content = db.query(func.count(GeneratedContent.id)).scalar()
        
        # Monthly User Growth (PostgreSQL specific date_trunc)
        # Note: SQLite fallback might fail here, but we are on Postgres now.
        try:
            monthly_users = (
                db.query(func.date_trunc('month', User.created_at), func.count(User.id))
                .group_by(func.date_trunc('month', User.created_at))
                .order_by(func.date_trunc('month', User.created_at))
                .all()
            )
            user_labels = [row[0].strftime('%b %Y') for row in monthly_users] if monthly_users else []
            user_data = [row[1] for row in monthly_users] if monthly_users else []
        except Exception:
             # Fallback if date_trunc fails or empty
            user_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
            user_data = [5, 10, 15, 25, 40, total_users] 

        # Mock Usage Data (Can be replaced with real daily aggregation later)
        usage_labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Today"]
        usage_data = [120, 190, 300, 500, 200, 300, total_tokens]

        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_tokens": total_tokens,
            "total_content": total_content,
            "usage_labels": usage_labels,
            "usage_data": usage_data,
            "user_labels": user_labels,
            "user_data": user_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # Note: 'db' session is handled by FastAPI's Depends(get_db) which auto-closes it.
    # We don't need manual db.close() here because we are using dependency injection.
@router.get("/live-usage")
def get_live_usage(db: Session = Depends(get_db), current_user: User = Depends(require_enterprise)):
    # This endpoint returns data tailored for a "Live Usage Graph"
    # For now, we reuse the dashboard logic or return specific usage metrics
    try:
        # Get last 7 days usage (simulated for now, can query UsageLog by date)
        logs = db.query(UsageLog).filter(UsageLog.created_at >= func.now() - func.interval('7 days')).all()
        # Group by day logic etc. (Simplified here)
        
        # Consistent return format for the chart
        stats = dashboard_stats(db, current_user)
        return {
            "labels": stats["usage_labels"],
            "data": stats["usage_data"],
            "total_tokens": stats["total_tokens"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(admin_required)):
    # Basic Stats
    try:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_content = db.query(func.count(GeneratedContent.id)).scalar() or 0
        total_branding_requests = db.query(func.sum(UsageLog.request_count)).scalar() or 0
        
        free_users = db.query(func.count(User.id)).filter(User.subscription_plan == "free").scalar() or 0
        pro_users = db.query(func.count(User.id)).filter(User.subscription_plan == "pro").scalar() or 0
        enterprise_users = db.query(func.count(User.id)).filter(User.subscription_plan == "enterprise").scalar() or 0
    except Exception as e:
        db.rollback()
        print(f"Error fetching basic admin stats: {e}")
        total_users = total_content = total_branding_requests = free_users = pro_users = enterprise_users = 0

    # Active Users (last 30 days)
    try:
        active_users = db.query(func.count(func.distinct(UsageLog.user_id))).filter(
            UsageLog.created_at >= func.now() - func.text('interval \'30 days\'')
        ).scalar() or 0
    except:
        db.rollback()
        # Fallback for SQLite or missed interval
        active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
        
    # Monthly Growth Data (Postgres specific)
    content_data = []
    request_data = []
    try:
        monthly_content = db.query(
            func.date_trunc('month', GeneratedContent.created_at), 
            func.count(GeneratedContent.id)
        ).group_by(func.date_trunc('month', GeneratedContent.created_at)).all()
        
        monthly_requests = db.query(
            func.date_trunc('month', UsageLog.created_at), 
            func.sum(UsageLog.request_count)
        ).group_by(func.date_trunc('month', UsageLog.created_at)).all()
        
        content_data = [{"month": str(row[0])[:7], "count": row[1]} for row in monthly_content]
        request_data = [{"month": str(row[0])[:7], "count": row[1]} for row in monthly_requests]
    except Exception as e:
        db.rollback()
        print(f"Monthly growth queries failed (likely due to DB engine): {e}")

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_generated_content": total_content,
        "total_branding_requests": total_branding_requests,
        "plan_distribution": {
            "free": free_users,
            "pro": pro_users,
            "enterprise": enterprise_users
        },
        "monthly_growth": {
            "content": content_data,
            "requests": request_data
        }
    }

class ImpersonateRequest(BaseModel):
    user_id: int

@router.post("/impersonate")
def impersonate(request: ImpersonateRequest, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from utils.jwt_handler import create_token
    token_data = {"sub": user.email, "user_id": user.id, "admin": user.is_admin, "is_impersonated": True}
    token = create_token(token_data)
    
    return {"impersonation_token": token, "user": {"email": user.email, "id": user.id}}
