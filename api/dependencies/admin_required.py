from fastapi import Depends, HTTPException, status
from .auth import get_current_user
from models import User

def admin_required(current_user: User = Depends(get_current_user)):
    """
    Dependency to ensure the user has admin privileges.
    Includes a failsafe for the master admin account.
    """
    master_admins = ["rahulbariki24@gmail.com", "nikhilbariki123@gmail.com"]
    user_email = (current_user.email or "").lower().strip()
    
    if current_user.is_admin or user_email in master_admins:
        return current_user
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required"
    )
