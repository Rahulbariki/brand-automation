from sqlalchemy.orm import Session
from models import User

def apply_admin_overrides(user: User, db: Session):
    """
    Force-applies admin status and enterprise plan for the master admin account.
    """
    if user.email == "rahulbariki24@gmail.com":
        needs_update = False
        if not user.is_admin:
            user.is_admin = True
            user.role = "admin"
            needs_update = True
        if user.subscription_plan != "enterprise":
            user.subscription_plan = "enterprise"
            needs_update = True
        if user.subscription_status != "active":
            user.subscription_status = "active"
            needs_update = True
            
        if needs_update:
            db.commit()
            db.refresh(user)
