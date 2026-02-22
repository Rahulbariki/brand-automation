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
    
    is_admin = current_user.is_admin or user_email in master_admins
    
    # Debug log
    print(f"[AUTH] Admin check for {user_email}: Database={current_user.is_admin}, Failsafe={user_email in master_admins} -> Result={is_admin}")
    
    if is_admin:
        return current_user
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required"
    )
