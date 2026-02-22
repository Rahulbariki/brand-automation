from sqlalchemy.orm import Session
from models import User

def apply_admin_overrides(user: User, db: Session):
    """
    Force-applies admin status and enterprise plan for the master admin account.
    This is case-insensitive to handle various OAuth provider formats.
    """
    if not user or not user.email:
        return

    admin_emails = [
        "rahulbariki24@gmail.com",
        "nikhilbariki123@gmail.com"
    ]
    
    user_email_lower = user.email.lower().strip()
    
    if any(email.lower() == user_email_lower for email in admin_emails):
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
